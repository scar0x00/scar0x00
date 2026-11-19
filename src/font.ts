import { readFileSync } from "node:fs";
import { join } from "node:path";

export type FontWeight = 400 | 500 | 600 | 700;
export type TextAnchor = "start" | "middle" | "end";

interface TableRecord {
  offset: number;
  length: number;
}

interface GlyphPoint {
  x: number;
  y: number;
  onCurve: boolean;
}

type GlyphContour = GlyphPoint[];

interface GposPairFormat1Subtable {
  format: 1;
  pairs: Map<number, Map<number, number>>;
}

interface GposPairFormat2Subtable {
  format: 2;
  coverage: Set<number>;
  classDef1: Map<number, number>;
  classDef2: Map<number, number>;
  class2Count: number;
  values: Int16Array;
}

type GposPairSubtable = GposPairFormat1Subtable | GposPairFormat2Subtable;

interface GposKernLookup {
  subtables: GposPairSubtable[];
}

function popcount8(mask: number): number {
  let v = mask & 0xff;
  let c = 0;
  while (v) {
    c += v & 1;
    v >>>= 1;
  }
  return c;
}

function readTag(dv: DataView, offset: number): string {
  return String.fromCharCode(
    dv.getUint8(offset),
    dv.getUint8(offset + 1),
    dv.getUint8(offset + 2),
    dv.getUint8(offset + 3),
  );
}

function parseCoverage(dv: DataView, offset: number): number[] {
  const format = dv.getUint16(offset);
  const glyphs: number[] = [];
  if (format === 1) {
    const count = dv.getUint16(offset + 2);
    for (let i = 0; i < count; i++) {
      glyphs.push(dv.getUint16(offset + 4 + i * 2));
    }
  } else if (format === 2) {
    const rangeCount = dv.getUint16(offset + 2);
    for (let i = 0; i < rangeCount; i++) {
      const ro = offset + 4 + i * 6;
      const startGid = dv.getUint16(ro);
      const endGid = dv.getUint16(ro + 2);
      const startCoverageIndex = dv.getUint16(ro + 4);
      for (let gid = startGid; gid <= endGid; gid++) {
        glyphs[startCoverageIndex + (gid - startGid)] = gid;
      }
    }
  }
  return glyphs;
}

function parseClassDef(dv: DataView, offset: number): Map<number, number> {
  const map = new Map<number, number>();
  const format = dv.getUint16(offset);
  if (format === 1) {
    const startGid = dv.getUint16(offset + 2);
    const glyphCount = dv.getUint16(offset + 4);
    for (let i = 0; i < glyphCount; i++) {
      const cls = dv.getUint16(offset + 6 + i * 2);
      if (cls !== 0) map.set(startGid + i, cls);
    }
  } else if (format === 2) {
    const rangeCount = dv.getUint16(offset + 2);
    for (let i = 0; i < rangeCount; i++) {
      const ro = offset + 4 + i * 6;
      const startGid = dv.getUint16(ro);
      const endGid = dv.getUint16(ro + 2);
      const cls = dv.getUint16(ro + 4);
      if (cls !== 0) {
        for (let gid = startGid; gid <= endGid; gid++) {
          map.set(gid, cls);
        }
      }
    }
  }
  return map;
}

function readXAdvance(
  dv: DataView,
  recordOffset: number,
  valueFormat: number,
): number {
  if ((valueFormat & 0x0004) === 0) return 0;
  let rel = 0;
  if (valueFormat & 0x0001) rel += 2;
  if (valueFormat & 0x0002) rel += 2;
  return dv.getInt16(recordOffset + rel);
}

function formatNum(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (rounded === 0) return "0";
  return Number(rounded.toFixed(2)).toString();
}

export class TrueTypeFont {
  readonly unitsPerEm: number;
  readonly ascender: number;
  readonly descender: number;
  readonly capHeight: number;
  readonly numGlyphs: number;

  private readonly dv: DataView;
  private readonly glyfOffset: number;
  private readonly locaOffsets: Uint32Array;
  private readonly advanceWidths: Uint16Array;
  private readonly cmap: Map<number, number>;
  private readonly gposKernLookups: GposKernLookup[];
  private readonly legacyKernPairs: Map<number, number>;
  private readonly contourCache = new Map<number, GlyphContour[]>();

  constructor(buffer: ArrayBuffer) {
    this.dv = new DataView(buffer);
    const tables = this.parseTables();

    const head = this.requireTable(tables, "head");
    const hhea = this.requireTable(tables, "hhea");
    const maxp = this.requireTable(tables, "maxp");
    const hmtx = this.requireTable(tables, "hmtx");
    const cmapTable = this.requireTable(tables, "cmap");
    const loca = this.requireTable(tables, "loca");
    const glyf = this.requireTable(tables, "glyf");

    this.unitsPerEm = this.dv.getUint16(head.offset + 18);
    const indexToLocFormat = this.dv.getInt16(head.offset + 50);

    this.ascender = this.dv.getInt16(hhea.offset + 4);
    this.descender = this.dv.getInt16(hhea.offset + 6);
    const numOfLongHorMetrics = this.dv.getUint16(hhea.offset + 34);

    this.numGlyphs = this.dv.getUint16(maxp.offset + 4);
    this.glyfOffset = glyf.offset;

    const os2 = tables.get("OS/2");
    let capHeight = Math.round(this.unitsPerEm * 0.7);
    if (os2 && os2.length >= 90) {
      const os2Version = this.dv.getUint16(os2.offset);
      if (os2Version >= 2) {
        const sCapHeight = this.dv.getInt16(os2.offset + 88);
        if (sCapHeight > 0) capHeight = sCapHeight;
      }
    }
    this.capHeight = capHeight;

    this.advanceWidths = this.parseHmtx(hmtx.offset, numOfLongHorMetrics);
    this.locaOffsets = this.parseLoca(loca.offset, indexToLocFormat);
    this.cmap = this.parseCmap(cmapTable.offset);

    const gpos = tables.get("GPOS");
    this.gposKernLookups = gpos ? this.parseGposKern(gpos.offset) : [];

    const kern = tables.get("kern");
    this.legacyKernPairs =
      this.gposKernLookups.length === 0 && kern
        ? this.parseLegacyKern(kern.offset)
        : new Map();
  }

  private parseTables(): Map<string, TableRecord> {
    const numTables = this.dv.getUint16(4);
    const map = new Map<string, TableRecord>();
    for (let i = 0; i < numTables; i++) {
      const off = 12 + i * 16;
      const tag = readTag(this.dv, off);
      map.set(tag, {
        offset: this.dv.getUint32(off + 8),
        length: this.dv.getUint32(off + 12),
      });
    }
    return map;
  }

  private requireTable(
    tables: Map<string, TableRecord>,
    tag: string,
  ): TableRecord {
    const rec = tables.get(tag);
    if (!rec) {
      throw new Error(`Missing required TrueType table: ${tag}`);
    }
    return rec;
  }

  private parseHmtx(offset: number, numLongMetrics: number): Uint16Array {
    const widths = new Uint16Array(this.numGlyphs);
    let lastAdvance = 0;
    for (let gid = 0; gid < this.numGlyphs; gid++) {
      if (gid < numLongMetrics) {
        lastAdvance = this.dv.getUint16(offset + gid * 4);
      }
      widths[gid] = lastAdvance;
    }
    return widths;
  }

  private parseLoca(offset: number, indexToLocFormat: number): Uint32Array {
    const offsets = new Uint32Array(this.numGlyphs + 1);
    if (indexToLocFormat === 0) {
      for (let i = 0; i <= this.numGlyphs; i++) {
        offsets[i] = this.dv.getUint16(offset + i * 2) * 2;
      }
    } else {
      for (let i = 0; i <= this.numGlyphs; i++) {
        offsets[i] = this.dv.getUint32(offset + i * 4);
      }
    }
    return offsets;
  }

  private parseCmap(offset: number): Map<number, number> {
    const numTables = this.dv.getUint16(offset + 2);
    let format12Offset = -1;
    let format4Offset = -1;

    for (let i = 0; i < numTables; i++) {
      const recOff = offset + 4 + i * 8;
      const platformId = this.dv.getUint16(recOff);
      const encodingId = this.dv.getUint16(recOff + 2);
      const subOffset = offset + this.dv.getUint32(recOff + 4);
      const format = this.dv.getUint16(subOffset);

      if (
        format === 12 &&
        ((platformId === 3 && encodingId === 10) ||
          (platformId === 0 && encodingId === 4))
      ) {
        format12Offset = subOffset;
      } else if (
        format === 4 &&
        ((platformId === 3 && encodingId === 1) ||
          (platformId === 0 && encodingId === 3))
      ) {
        format4Offset = subOffset;
      }
    }

    const map = new Map<number, number>();
    if (format12Offset >= 0) {
      const numGroups = this.dv.getUint32(format12Offset + 12);
      for (let i = 0; i < numGroups; i++) {
        const go = format12Offset + 16 + i * 12;
        const startCode = this.dv.getUint32(go);
        const endCode = this.dv.getUint32(go + 4);
        const startGlyphId = this.dv.getUint32(go + 8);
        for (let cp = startCode; cp <= endCode; cp++) {
          map.set(cp, startGlyphId + (cp - startCode));
        }
      }
      return map;
    }

    if (format4Offset >= 0) {
      const segCount = this.dv.getUint16(format4Offset + 6) / 2;
      const endCodeBase = format4Offset + 14;
      const startCodeBase = endCodeBase + segCount * 2 + 2;
      const idDeltaBase = startCodeBase + segCount * 2;
      const idRangeOffsetBase = idDeltaBase + segCount * 2;

      for (let seg = 0; seg < segCount; seg++) {
        const endCode = this.dv.getUint16(endCodeBase + seg * 2);
        const startCode = this.dv.getUint16(startCodeBase + seg * 2);
        if (startCode === 0xffff && endCode === 0xffff) break;

        const idDelta = this.dv.getInt16(idDeltaBase + seg * 2);
        const rangeOffsetPos = idRangeOffsetBase + seg * 2;
        const idRangeOffset = this.dv.getUint16(rangeOffsetPos);

        for (let cp = startCode; cp <= endCode; cp++) {
          let gid = 0;
          if (idRangeOffset === 0) {
            gid = (cp + idDelta) & 0xffff;
          } else {
            const glyphAddr =
              rangeOffsetPos + idRangeOffset + (cp - startCode) * 2;
            const rawGid = this.dv.getUint16(glyphAddr);
            gid = rawGid === 0 ? 0 : (rawGid + idDelta) & 0xffff;
          }
          if (gid !== 0) map.set(cp, gid);
        }
      }
    }

    return map;
  }

  private parseGposKern(gposOffset: number): GposKernLookup[] {
    const featureListOffset = gposOffset + this.dv.getUint16(gposOffset + 6);
    const lookupListOffset = gposOffset + this.dv.getUint16(gposOffset + 8);

    const kernLookupIndices = new Set<number>();
    const featureCount = this.dv.getUint16(featureListOffset);
    for (let i = 0; i < featureCount; i++) {
      const recOff = featureListOffset + 2 + i * 6;
      const tag = readTag(this.dv, recOff);
      if (tag !== "kern") continue;
      const featOff = featureListOffset + this.dv.getUint16(recOff + 4);
      const lookupIdxCount = this.dv.getUint16(featOff + 2);
      for (let j = 0; j < lookupIdxCount; j++) {
        kernLookupIndices.add(this.dv.getUint16(featOff + 4 + j * 2));
      }
    }

    const sortedIndices = Array.from(kernLookupIndices).sort((a, b) => a - b);
    const lookupCount = this.dv.getUint16(lookupListOffset);
    const lookups: GposKernLookup[] = [];

    for (const idx of sortedIndices) {
      if (idx >= lookupCount) continue;
      const lookupOff =
        lookupListOffset + this.dv.getUint16(lookupListOffset + 2 + idx * 2);
      const lookupType = this.dv.getUint16(lookupOff);
      const subtableCount = this.dv.getUint16(lookupOff + 4);
      const subtables: GposPairSubtable[] = [];

      for (let s = 0; s < subtableCount; s++) {
        let subOff = lookupOff + this.dv.getUint16(lookupOff + 6 + s * 2);
        let effType = lookupType;
        if (effType === 9) {
          effType = this.dv.getUint16(subOff + 2);
          subOff = subOff + this.dv.getUint32(subOff + 4);
        }
        if (effType !== 2) continue;

        const parsed = this.parseGposPairSubtable(subOff);
        if (parsed) subtables.push(parsed);
      }

      if (subtables.length > 0) {
        lookups.push({ subtables });
      }
    }

    return lookups;
  }

  private parseGposPairSubtable(subOff: number): GposPairSubtable | null {
    const posFormat = this.dv.getUint16(subOff);
    const covOffset = subOff + this.dv.getUint16(subOff + 2);
    const valueFormat1 = this.dv.getUint16(subOff + 4);
    const valueFormat2 = this.dv.getUint16(subOff + 6);
    const v1Size = popcount8(valueFormat1) * 2;
    const v2Size = popcount8(valueFormat2) * 2;
    const coverageGlyphs = parseCoverage(this.dv, covOffset);

    if (posFormat === 1) {
      const pairSetCount = this.dv.getUint16(subOff + 8);
      const pairs = new Map<number, Map<number, number>>();
      const recordSize = 2 + v1Size + v2Size;

      for (let i = 0; i < pairSetCount; i++) {
        const firstGid = coverageGlyphs[i];
        if (firstGid === undefined) continue;
        const pairSetOff = subOff + this.dv.getUint16(subOff + 10 + i * 2);
        const pairValueCount = this.dv.getUint16(pairSetOff);
        const secondMap = new Map<number, number>();

        for (let j = 0; j < pairValueCount; j++) {
          const recOff = pairSetOff + 2 + j * recordSize;
          const secondGid = this.dv.getUint16(recOff);
          const xAdv1 = readXAdvance(this.dv, recOff + 2, valueFormat1);
          const xAdv2 = readXAdvance(
            this.dv,
            recOff + 2 + v1Size,
            valueFormat2,
          );
          secondMap.set(secondGid, xAdv1 + xAdv2);
        }

        pairs.set(firstGid, secondMap);
      }

      return { format: 1, pairs };
    }

    if (posFormat === 2) {
      const classDef1Off = subOff + this.dv.getUint16(subOff + 8);
      const classDef2Off = subOff + this.dv.getUint16(subOff + 10);
      const class1Count = this.dv.getUint16(subOff + 12);
      const class2Count = this.dv.getUint16(subOff + 14);
      const classDef1 = parseClassDef(this.dv, classDef1Off);
      const classDef2 = parseClassDef(this.dv, classDef2Off);
      const values = new Int16Array(class1Count * class2Count);
      const recSize = v1Size + v2Size;

      let cursor = subOff + 16;
      for (let c1 = 0; c1 < class1Count; c1++) {
        for (let c2 = 0; c2 < class2Count; c2++) {
          const xAdv1 = readXAdvance(this.dv, cursor, valueFormat1);
          const xAdv2 = readXAdvance(this.dv, cursor + v1Size, valueFormat2);
          values[c1 * class2Count + c2] = xAdv1 + xAdv2;
          cursor += recSize;
        }
      }

      return {
        format: 2,
        coverage: new Set(coverageGlyphs),
        classDef1,
        classDef2,
        class2Count,
        values,
      };
    }

    return null;
  }

  private parseLegacyKern(kernOffset: number): Map<number, number> {
    const pairs = new Map<number, number>();
    const version = this.dv.getUint16(kernOffset);
    if (version !== 0) return pairs;
    const nTables = this.dv.getUint16(kernOffset + 2);
    let cursor = kernOffset + 4;
    for (let t = 0; t < nTables; t++) {
      const length = this.dv.getUint16(cursor + 2);
      const coverage = this.dv.getUint16(cursor + 4);
      const format = coverage >>> 8;
      if (format === 0 && (coverage & 0x01) !== 0) {
        const nPairs = this.dv.getUint16(cursor + 6);
        let p = cursor + 14;
        for (let i = 0; i < nPairs; i++) {
          const left = this.dv.getUint16(p);
          const right = this.dv.getUint16(p + 2);
          const value = this.dv.getInt16(p + 4);
          pairs.set((left << 16) | right, value);
          p += 6;
        }
      }
      cursor += length;
    }
    return pairs;
  }

  getGlyphId(codePoint: number): number {
    return this.cmap.get(codePoint) ?? 0;
  }

  getAdvanceWidth(gid: number): number {
    return this.advanceWidths[gid] ?? 0;
  }

  getKerning(gid1: number, gid2: number): number {
    if (this.gposKernLookups.length > 0) {
      let total = 0;
      for (const lookup of this.gposKernLookups) {
        for (const sub of lookup.subtables) {
          if (sub.format === 1) {
            const val = sub.pairs.get(gid1)?.get(gid2);
            if (val !== undefined) {
              total += val;
              break;
            }
          } else if (sub.coverage.has(gid1)) {
            const c1 = sub.classDef1.get(gid1) ?? 0;
            const c2 = sub.classDef2.get(gid2) ?? 0;
            total += sub.values[c1 * sub.class2Count + c2] ?? 0;
            break;
          }
        }
      }
      return total;
    }

    return this.legacyKernPairs.get((gid1 << 16) | gid2) ?? 0;
  }

  getGlyphContours(gid: number, depth = 0): GlyphContour[] {
    const cached = this.contourCache.get(gid);
    if (cached) return cached;
    if (depth > 8 || gid >= this.numGlyphs) return [];

    const start = this.locaOffsets[gid] ?? 0;
    const end = this.locaOffsets[gid + 1] ?? 0;
    if (start === end) {
      this.contourCache.set(gid, []);
      return [];
    }

    const glyphPos = this.glyfOffset + start;
    const numberOfContours = this.dv.getInt16(glyphPos);
    const contours =
      numberOfContours >= 0
        ? this.parseSimpleGlyph(glyphPos, numberOfContours)
        : this.parseCompositeGlyph(glyphPos, depth);

    this.contourCache.set(gid, contours);
    return contours;
  }

  private parseSimpleGlyph(
    glyphPos: number,
    numberOfContours: number,
  ): GlyphContour[] {
    if (numberOfContours === 0) return [];
    let cursor = glyphPos + 10;

    const endPts: number[] = [];
    for (let i = 0; i < numberOfContours; i++) {
      endPts.push(this.dv.getUint16(cursor));
      cursor += 2;
    }

    const totalPoints = (endPts[numberOfContours - 1] ?? -1) + 1;
    if (totalPoints <= 0) return [];

    const instructionLength = this.dv.getUint16(cursor);
    cursor += 2 + instructionLength;

    const flags = new Uint8Array(totalPoints);
    for (let i = 0; i < totalPoints; i++) {
      const flag = this.dv.getUint8(cursor++);
      flags[i] = flag;
      if (flag & 0x08) {
        const repeatCount = this.dv.getUint8(cursor++);
        for (let r = 0; r < repeatCount && i + 1 < totalPoints; r++) {
          flags[++i] = flag;
        }
      }
    }

    const xs = new Int32Array(totalPoints);
    let x = 0;
    for (let i = 0; i < totalPoints; i++) {
      const f = flags[i] ?? 0;
      if (f & 0x02) {
        const dx = this.dv.getUint8(cursor++);
        x += f & 0x10 ? dx : -dx;
      } else if ((f & 0x10) === 0) {
        x += this.dv.getInt16(cursor);
        cursor += 2;
      }
      xs[i] = x;
    }

    const ys = new Int32Array(totalPoints);
    let y = 0;
    for (let i = 0; i < totalPoints; i++) {
      const f = flags[i] ?? 0;
      if (f & 0x04) {
        const dy = this.dv.getUint8(cursor++);
        y += f & 0x20 ? dy : -dy;
      } else if ((f & 0x20) === 0) {
        y += this.dv.getInt16(cursor);
        cursor += 2;
      }
      ys[i] = y;
    }

    const contours: GlyphContour[] = [];
    let startIdx = 0;
    for (const endIdx of endPts) {
      const contour: GlyphContour = [];
      for (let i = startIdx; i <= endIdx; i++) {
        contour.push({
          x: xs[i] ?? 0,
          y: ys[i] ?? 0,
          onCurve: ((flags[i] ?? 0) & 0x01) !== 0,
        });
      }
      if (contour.length > 0) contours.push(contour);
      startIdx = endIdx + 1;
    }

    return contours;
  }

  private parseCompositeGlyph(glyphPos: number, depth: number): GlyphContour[] {
    let cursor = glyphPos + 10;
    const contours: GlyphContour[] = [];
    const flatPoints: GlyphPoint[] = [];

    while (true) {
      const flags = this.dv.getUint16(cursor);
      const componentGid = this.dv.getUint16(cursor + 2);
      cursor += 4;

      const argsAreWords = (flags & 0x0001) !== 0;
      const argsAreXyValues = (flags & 0x0002) !== 0;

      let arg1: number;
      let arg2: number;
      if (argsAreWords) {
        arg1 = argsAreXyValues
          ? this.dv.getInt16(cursor)
          : this.dv.getUint16(cursor);
        arg2 = argsAreXyValues
          ? this.dv.getInt16(cursor + 2)
          : this.dv.getUint16(cursor + 2);
        cursor += 4;
      } else {
        arg1 = argsAreXyValues
          ? this.dv.getInt8(cursor)
          : this.dv.getUint8(cursor);
        arg2 = argsAreXyValues
          ? this.dv.getInt8(cursor + 1)
          : this.dv.getUint8(cursor + 1);
        cursor += 2;
      }

      let a = 1;
      let b = 0;
      let c = 0;
      let d = 1;
      if (flags & 0x0008) {
        a = this.dv.getInt16(cursor) / 16384;
        d = a;
        cursor += 2;
      } else if (flags & 0x0040) {
        a = this.dv.getInt16(cursor) / 16384;
        d = this.dv.getInt16(cursor + 2) / 16384;
        cursor += 4;
      } else if (flags & 0x0080) {
        a = this.dv.getInt16(cursor) / 16384;
        b = this.dv.getInt16(cursor + 2) / 16384;
        c = this.dv.getInt16(cursor + 4) / 16384;
        d = this.dv.getInt16(cursor + 6) / 16384;
        cursor += 8;
      }

      const childContours = this.getGlyphContours(componentGid, depth + 1);

      let dx = 0;
      let dy = 0;
      if (argsAreXyValues) {
        if (flags & 0x0800) {
          dx = a * arg1 + c * arg2;
          dy = b * arg1 + d * arg2;
        } else {
          dx = arg1;
          dy = arg2;
        }
      } else {
        const childFlat = childContours.flat();
        const parentPt = flatPoints[arg1];
        const childPt = childFlat[arg2];
        if (parentPt && childPt) {
          const tx = a * childPt.x + c * childPt.y;
          const ty = b * childPt.x + d * childPt.y;
          dx = parentPt.x - tx;
          dy = parentPt.y - ty;
        }
      }

      for (const contour of childContours) {
        const transformed: GlyphContour = contour.map((pt) => ({
          x: a * pt.x + c * pt.y + dx,
          y: b * pt.x + d * pt.y + dy,
          onCurve: pt.onCurve,
        }));
        contours.push(transformed);
        for (const pt of transformed) flatPoints.push(pt);
      }

      if ((flags & 0x0020) === 0) break;
    }

    return contours;
  }

  measureText(text: string, fontSize: number, letterSpacing = 0): number {
    const chars = Array.from(text);
    if (chars.length === 0) return 0;

    const scale = fontSize / this.unitsPerEm;
    let width = 0;

    for (let i = 0; i < chars.length; i++) {
      const cp = chars[i]?.codePointAt(0) ?? 0;
      const gid = this.getGlyphId(cp);
      width += this.getAdvanceWidth(gid) * scale;
      if (i < chars.length - 1) {
        const nextCp = chars[i + 1]?.codePointAt(0) ?? 0;
        const nextGid = this.getGlyphId(nextCp);
        width += this.getKerning(gid, nextGid) * scale + letterSpacing;
      }
    }

    return width;
  }

  textToPathData(opts: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    letterSpacing?: number;
    anchor?: TextAnchor;
  }): string {
    const chars = Array.from(opts.text);
    if (chars.length === 0) return "";

    const letterSpacing = opts.letterSpacing ?? 0;
    const anchor = opts.anchor ?? "start";
    const scale = opts.fontSize / this.unitsPerEm;

    let penX = opts.x;
    if (anchor !== "start") {
      const totalWidth = this.measureText(opts.text, opts.fontSize, letterSpacing);
      if (anchor === "middle") penX -= totalWidth / 2;
      else if (anchor === "end") penX -= totalWidth;
    }

    const parts: string[] = [];

    for (let i = 0; i < chars.length; i++) {
      const cp = chars[i]?.codePointAt(0) ?? 0;
      const gid = this.getGlyphId(cp);
      const contours = this.getGlyphContours(gid);

      for (const contour of contours) {
        const cmd = contourToSvgPath(contour, penX, opts.y, scale);
        if (cmd) parts.push(cmd);
      }

      penX += this.getAdvanceWidth(gid) * scale;
      if (i < chars.length - 1) {
        const nextCp = chars[i + 1]?.codePointAt(0) ?? 0;
        const nextGid = this.getGlyphId(nextCp);
        penX += this.getKerning(gid, nextGid) * scale + letterSpacing;
      }
    }

    return parts.join("");
  }
}

function contourToSvgPath(
  contour: GlyphContour,
  originX: number,
  baselineY: number,
  scale: number,
): string {
  const n = contour.length;
  if (n === 0) return "";

  const tx = (px: number) => originX + px * scale;
  const ty = (py: number) => baselineY - py * scale;

  const first = contour[0]!;
  const last = contour[n - 1]!;

  let startX: number;
  let startY: number;
  let ordered: GlyphPoint[];

  if (first.onCurve) {
    startX = first.x;
    startY = first.y;
    ordered = contour.slice(1);
  } else if (last.onCurve) {
    startX = last.x;
    startY = last.y;
    ordered = contour.slice(0, n - 1);
  } else {
    startX = (last.x + first.x) / 2;
    startY = (last.y + first.y) / 2;
    ordered = contour;
  }

  let d = `M${formatNum(tx(startX))} ${formatNum(ty(startY))}`;
  let pendingCtrl: GlyphPoint | null = null;

  for (const pt of ordered) {
    if (pt.onCurve) {
      if (pendingCtrl) {
        d += `Q${formatNum(tx(pendingCtrl.x))} ${formatNum(ty(pendingCtrl.y))} ${formatNum(tx(pt.x))} ${formatNum(ty(pt.y))}`;
        pendingCtrl = null;
      } else {
        d += `L${formatNum(tx(pt.x))} ${formatNum(ty(pt.y))}`;
      }
    } else if (pendingCtrl) {
      const midX = (pendingCtrl.x + pt.x) / 2;
      const midY = (pendingCtrl.y + pt.y) / 2;
      d += `Q${formatNum(tx(pendingCtrl.x))} ${formatNum(ty(pendingCtrl.y))} ${formatNum(tx(midX))} ${formatNum(ty(midY))}`;
      pendingCtrl = pt;
    } else {
      pendingCtrl = pt;
    }
  }

  if (pendingCtrl) {
    d += `Q${formatNum(tx(pendingCtrl.x))} ${formatNum(ty(pendingCtrl.y))} ${formatNum(tx(startX))} ${formatNum(ty(startY))}`;
  }

  d += "Z";
  return d;
}

const FONT_FILES: Record<FontWeight, string> = {
  400: "SpaceGrotesk-Regular.ttf",
  500: "SpaceGrotesk-Medium.ttf",
  600: "SpaceGrotesk-SemiBold.ttf",
  700: "SpaceGrotesk-Bold.ttf",
};

const fontCache = new Map<FontWeight, TrueTypeFont>();

export function normalizeWeight(weight = 400): FontWeight {
  if (weight <= 450) return 400;
  if (weight <= 550) return 500;
  if (weight <= 650) return 600;
  return 700;
}

export function getDisplayFont(weight = 400): TrueTypeFont {
  const w = normalizeWeight(weight);
  const existing = fontCache.get(w);
  if (existing) return existing;

  const filePath = join(import.meta.dir, "fonts", FONT_FILES[w]);
  const bytes = readFileSync(filePath);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
  const font = new TrueTypeFont(buffer);
  fontCache.set(w, font);
  return font;
}

export function measureDisplayText(
  text: string,
  fontSize: number,
  fontWeight = 400,
  letterSpacing = 0,
): number {
  return getDisplayFont(fontWeight).measureText(text, fontSize, letterSpacing);
}

export function renderDisplayText(opts: {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  fontWeight?: number;
  letterSpacing?: number;
  anchor?: TextAnchor;
  opacity?: number;
}): string {
  const d = getDisplayFont(opts.fontWeight ?? 400).textToPathData({
    text: opts.text,
    x: opts.x,
    y: opts.y,
    fontSize: opts.fontSize,
    letterSpacing: opts.letterSpacing ?? 0,
    anchor: opts.anchor ?? "start",
  });
  if (!d) return "";
  const opacityAttr =
    opts.opacity !== undefined ? ` opacity="${opts.opacity}"` : "";
  return `<path d="${d}" fill="${opts.fill}"${opacityAttr} />`;
}
