// =============================================================================
// Proprietary QR Code Generator
// ISO/IEC 18004 compliant implementation
// Supports: Numeric & Byte (UTF-8) modes, Error Correction Level M (15%)
// =============================================================================

// -----------------------------------------------------------------------------
// Galois Field GF(2^8) arithmetic for Reed-Solomon error correction
// -----------------------------------------------------------------------------

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

// Initialize Galois Field lookup tables (primitive polynomial: x^8 + x^4 + x^3 + x^2 + 1 = 0x11d)
(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_EXP[i + 255] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  GF_LOG[0] = 255; // undefined, but we use 255 as sentinel
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

// Generate Reed-Solomon generator polynomial for given number of error correction codewords
function rsGeneratorPoly(nsym: number): Uint8Array {
  const g = new Uint8Array(nsym + 1);
  g[0] = 1;

  for (let i = 0; i < nsym; i++) {
    const alpha = GF_EXP[i];
    for (let j = nsym; j > 0; j--) {
      g[j] = g[j - 1] ^ gfMul(g[j], alpha);
    }
    g[0] = gfMul(g[0], alpha);
  }

  // Reverse: rsEncode expects leading coefficient at index 0
  g.reverse();
  return g;
}

// Compute Reed-Solomon error correction codewords
function rsEncode(data: Uint8Array, nsym: number): Uint8Array {
  const gen = rsGeneratorPoly(nsym);
  const result = new Uint8Array(data.length + nsym);
  result.set(data);

  for (let i = 0; i < data.length; i++) {
    const coef = result[i];
    if (coef !== 0) {
      for (let j = 0; j <= nsym; j++) {
        result[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }

  return result.slice(data.length);
}

// -----------------------------------------------------------------------------
// QR Code capacity and structure tables (Version 1-40, Level M only)
// -----------------------------------------------------------------------------

interface VersionInfo {
  totalCodewords: number;
  ecCodewordsPerBlock: number;
  numBlocksGroup1: number;
  dataCodewordsGroup1: number;
  numBlocksGroup2: number;
  dataCodewordsGroup2: number;
  alignmentPatterns: number[];
}

// Error Correction Level M (15% recovery) parameters per version
const VERSION_INFO: VersionInfo[] = [
  { totalCodewords: 0, ecCodewordsPerBlock: 0, numBlocksGroup1: 0, dataCodewordsGroup1: 0, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [] }, // placeholder for index 0
  { totalCodewords: 26, ecCodewordsPerBlock: 10, numBlocksGroup1: 1, dataCodewordsGroup1: 16, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [] },
  { totalCodewords: 44, ecCodewordsPerBlock: 16, numBlocksGroup1: 1, dataCodewordsGroup1: 28, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 18] },
  { totalCodewords: 70, ecCodewordsPerBlock: 26, numBlocksGroup1: 1, dataCodewordsGroup1: 44, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 22] },
  { totalCodewords: 100, ecCodewordsPerBlock: 18, numBlocksGroup1: 2, dataCodewordsGroup1: 32, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 26] },
  { totalCodewords: 134, ecCodewordsPerBlock: 24, numBlocksGroup1: 2, dataCodewordsGroup1: 43, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 30] },
  { totalCodewords: 172, ecCodewordsPerBlock: 16, numBlocksGroup1: 4, dataCodewordsGroup1: 27, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 34] },
  { totalCodewords: 196, ecCodewordsPerBlock: 18, numBlocksGroup1: 4, dataCodewordsGroup1: 31, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 22, 38] },
  { totalCodewords: 242, ecCodewordsPerBlock: 22, numBlocksGroup1: 2, dataCodewordsGroup1: 38, numBlocksGroup2: 2, dataCodewordsGroup2: 39, alignmentPatterns: [6, 24, 42] },
  { totalCodewords: 292, ecCodewordsPerBlock: 22, numBlocksGroup1: 3, dataCodewordsGroup1: 36, numBlocksGroup2: 2, dataCodewordsGroup2: 37, alignmentPatterns: [6, 26, 46] },
  { totalCodewords: 346, ecCodewordsPerBlock: 26, numBlocksGroup1: 4, dataCodewordsGroup1: 43, numBlocksGroup2: 1, dataCodewordsGroup2: 44, alignmentPatterns: [6, 28, 50] },
  { totalCodewords: 404, ecCodewordsPerBlock: 30, numBlocksGroup1: 1, dataCodewordsGroup1: 50, numBlocksGroup2: 4, dataCodewordsGroup2: 51, alignmentPatterns: [6, 30, 54] },
  { totalCodewords: 466, ecCodewordsPerBlock: 22, numBlocksGroup1: 6, dataCodewordsGroup1: 36, numBlocksGroup2: 2, dataCodewordsGroup2: 37, alignmentPatterns: [6, 32, 58] },
  { totalCodewords: 532, ecCodewordsPerBlock: 22, numBlocksGroup1: 8, dataCodewordsGroup1: 37, numBlocksGroup2: 1, dataCodewordsGroup2: 38, alignmentPatterns: [6, 34, 62] },
  { totalCodewords: 581, ecCodewordsPerBlock: 24, numBlocksGroup1: 4, dataCodewordsGroup1: 40, numBlocksGroup2: 5, dataCodewordsGroup2: 41, alignmentPatterns: [6, 26, 46, 66] },
  { totalCodewords: 655, ecCodewordsPerBlock: 24, numBlocksGroup1: 5, dataCodewordsGroup1: 41, numBlocksGroup2: 5, dataCodewordsGroup2: 42, alignmentPatterns: [6, 26, 48, 70] },
  { totalCodewords: 733, ecCodewordsPerBlock: 28, numBlocksGroup1: 7, dataCodewordsGroup1: 45, numBlocksGroup2: 3, dataCodewordsGroup2: 46, alignmentPatterns: [6, 26, 50, 74] },
  { totalCodewords: 815, ecCodewordsPerBlock: 28, numBlocksGroup1: 10, dataCodewordsGroup1: 46, numBlocksGroup2: 1, dataCodewordsGroup2: 47, alignmentPatterns: [6, 30, 54, 78] },
  { totalCodewords: 901, ecCodewordsPerBlock: 26, numBlocksGroup1: 9, dataCodewordsGroup1: 43, numBlocksGroup2: 4, dataCodewordsGroup2: 44, alignmentPatterns: [6, 30, 56, 82] },
  { totalCodewords: 991, ecCodewordsPerBlock: 26, numBlocksGroup1: 3, dataCodewordsGroup1: 44, numBlocksGroup2: 11, dataCodewordsGroup2: 45, alignmentPatterns: [6, 30, 58, 86] },
  { totalCodewords: 1085, ecCodewordsPerBlock: 26, numBlocksGroup1: 3, dataCodewordsGroup1: 41, numBlocksGroup2: 13, dataCodewordsGroup2: 42, alignmentPatterns: [6, 34, 62, 90] },
  { totalCodewords: 1156, ecCodewordsPerBlock: 26, numBlocksGroup1: 17, dataCodewordsGroup1: 42, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 28, 50, 72, 94] },
  { totalCodewords: 1258, ecCodewordsPerBlock: 28, numBlocksGroup1: 17, dataCodewordsGroup1: 46, numBlocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPatterns: [6, 26, 50, 74, 98] },
  { totalCodewords: 1364, ecCodewordsPerBlock: 28, numBlocksGroup1: 4, dataCodewordsGroup1: 47, numBlocksGroup2: 14, dataCodewordsGroup2: 48, alignmentPatterns: [6, 30, 54, 78, 102] },
  { totalCodewords: 1474, ecCodewordsPerBlock: 28, numBlocksGroup1: 6, dataCodewordsGroup1: 45, numBlocksGroup2: 14, dataCodewordsGroup2: 46, alignmentPatterns: [6, 28, 54, 80, 106] },
  { totalCodewords: 1588, ecCodewordsPerBlock: 28, numBlocksGroup1: 8, dataCodewordsGroup1: 47, numBlocksGroup2: 13, dataCodewordsGroup2: 48, alignmentPatterns: [6, 32, 58, 84, 110] },
  { totalCodewords: 1706, ecCodewordsPerBlock: 28, numBlocksGroup1: 19, dataCodewordsGroup1: 46, numBlocksGroup2: 4, dataCodewordsGroup2: 47, alignmentPatterns: [6, 30, 58, 86, 114] },
  { totalCodewords: 1828, ecCodewordsPerBlock: 28, numBlocksGroup1: 22, dataCodewordsGroup1: 45, numBlocksGroup2: 3, dataCodewordsGroup2: 46, alignmentPatterns: [6, 34, 62, 90, 118] },
  { totalCodewords: 1921, ecCodewordsPerBlock: 28, numBlocksGroup1: 3, dataCodewordsGroup1: 45, numBlocksGroup2: 23, dataCodewordsGroup2: 46, alignmentPatterns: [6, 30, 54, 78, 102, 126] },
  { totalCodewords: 2051, ecCodewordsPerBlock: 28, numBlocksGroup1: 21, dataCodewordsGroup1: 45, numBlocksGroup2: 7, dataCodewordsGroup2: 46, alignmentPatterns: [6, 28, 54, 80, 106, 132] },
  { totalCodewords: 2185, ecCodewordsPerBlock: 28, numBlocksGroup1: 19, dataCodewordsGroup1: 47, numBlocksGroup2: 10, dataCodewordsGroup2: 48, alignmentPatterns: [6, 32, 58, 84, 110, 136] },
  { totalCodewords: 2323, ecCodewordsPerBlock: 28, numBlocksGroup1: 2, dataCodewordsGroup1: 46, numBlocksGroup2: 29, dataCodewordsGroup2: 47, alignmentPatterns: [6, 30, 56, 82, 108, 134] },
  { totalCodewords: 2465, ecCodewordsPerBlock: 28, numBlocksGroup1: 10, dataCodewordsGroup1: 46, numBlocksGroup2: 23, dataCodewordsGroup2: 47, alignmentPatterns: [6, 34, 60, 86, 112, 138] },
  { totalCodewords: 2611, ecCodewordsPerBlock: 28, numBlocksGroup1: 14, dataCodewordsGroup1: 46, numBlocksGroup2: 21, dataCodewordsGroup2: 47, alignmentPatterns: [6, 30, 58, 86, 114, 142] },
  { totalCodewords: 2761, ecCodewordsPerBlock: 28, numBlocksGroup1: 14, dataCodewordsGroup1: 46, numBlocksGroup2: 23, dataCodewordsGroup2: 47, alignmentPatterns: [6, 34, 62, 90, 118, 146] },
  { totalCodewords: 2876, ecCodewordsPerBlock: 28, numBlocksGroup1: 12, dataCodewordsGroup1: 47, numBlocksGroup2: 26, dataCodewordsGroup2: 48, alignmentPatterns: [6, 30, 54, 78, 102, 126, 150] },
  { totalCodewords: 3034, ecCodewordsPerBlock: 28, numBlocksGroup1: 6, dataCodewordsGroup1: 47, numBlocksGroup2: 34, dataCodewordsGroup2: 48, alignmentPatterns: [6, 24, 50, 76, 102, 128, 154] },
  { totalCodewords: 3196, ecCodewordsPerBlock: 28, numBlocksGroup1: 29, dataCodewordsGroup1: 46, numBlocksGroup2: 14, dataCodewordsGroup2: 47, alignmentPatterns: [6, 28, 54, 80, 106, 132, 158] },
  { totalCodewords: 3362, ecCodewordsPerBlock: 28, numBlocksGroup1: 13, dataCodewordsGroup1: 46, numBlocksGroup2: 32, dataCodewordsGroup2: 47, alignmentPatterns: [6, 32, 58, 84, 110, 136, 162] },
  { totalCodewords: 3532, ecCodewordsPerBlock: 28, numBlocksGroup1: 40, dataCodewordsGroup1: 47, numBlocksGroup2: 7, dataCodewordsGroup2: 48, alignmentPatterns: [6, 26, 54, 82, 110, 138, 166] },
];

// Character count indicator bit lengths per version range
const CHAR_COUNT_BITS = {
  numeric: [10, 12, 14], // versions 1-9, 10-26, 27-40
  byte: [8, 16, 16],
};

function getCharCountBits(version: number, mode: 'numeric' | 'byte'): number {
  const idx = version <= 9 ? 0 : version <= 26 ? 1 : 2;
  return CHAR_COUNT_BITS[mode][idx];
}

// -----------------------------------------------------------------------------
// Data encoding
// -----------------------------------------------------------------------------

function stringToUtf8Bytes(str: string): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode >= 0xd800 && charCode < 0xdc00 && i + 1 < str.length) {
      // Surrogate pair
      const low = str.charCodeAt(++i);
      charCode = 0x10000 + ((charCode - 0xd800) << 10) + (low - 0xdc00);
      bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f)
      );
    } else {
      bytes.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
    }
  }
  return bytes;
}

function pushBits(bits: number[], value: number, length: number): void {
  for (let i = length - 1; i >= 0; i--) {
    bits.push((value >> i) & 1);
  }
}

function getDataCapacity(version: number): number {
  const info = VERSION_INFO[version];
  return info.numBlocksGroup1 * info.dataCodewordsGroup1 + info.numBlocksGroup2 * info.dataCodewordsGroup2;
}

function selectVersion(dataBytes: number, charCountBitsMode: 'numeric' | 'byte'): number {
  for (let v = 1; v <= 40; v++) {
    const capacity = getDataCapacity(v);
    const charCountBits = getCharCountBits(v, charCountBitsMode);
    // 4 mode bits + charCount bits + data + 4 terminator (max) -> must fit in capacity * 8
    const bitsNeeded = 4 + charCountBits + dataBytes * 8;
    if (bitsNeeded <= capacity * 8) {
      return v;
    }
  }
  throw new Error('Data too large for QR code');
}

function createDataCodewords(input: string | number): { codewords: Uint8Array; version: number } {
  let dataBytes: number[];
  let mode: 'numeric' | 'byte';
  let charCount: number;

  if (typeof input === 'number') {
    mode = 'numeric';
    const numStr = String(input);
    charCount = numStr.length;
    // Numeric encoding: groups of 3 digits -> 10 bits, 2 digits -> 7 bits, 1 digit -> 4 bits
    const numBits: number[] = [];
    for (let i = 0; i < numStr.length; i += 3) {
      const group = numStr.slice(i, i + 3);
      const val = parseInt(group, 10);
      if (group.length === 3) {
        pushBits(numBits, val, 10);
      } else if (group.length === 2) {
        pushBits(numBits, val, 7);
      } else {
        pushBits(numBits, val, 4);
      }
    }
    // Convert bits to partial byte count for version selection
    dataBytes = [];
    for (let i = 0; i < numBits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8 && i + j < numBits.length; j++) {
        byte = (byte << 1) | numBits[i + j];
      }
      if (i + 8 > numBits.length) {
        byte <<= 8 - (numBits.length - i);
      }
      dataBytes.push(byte);
    }
  } else {
    mode = 'byte';
    dataBytes = stringToUtf8Bytes(input);
    charCount = dataBytes.length;
  }

  const version = selectVersion(dataBytes.length, mode);
  const charCountBits = getCharCountBits(version, mode);
  const capacity = getDataCapacity(version);

  // Build final bit stream
  const bits: number[] = [];

  // Mode indicator
  if (mode === 'numeric') {
    pushBits(bits, 0b0001, 4);
  } else {
    pushBits(bits, 0b0100, 4);
  }

  // Character count
  pushBits(bits, charCount, charCountBits);

  // Data
  if (mode === 'numeric') {
    const numStr = String(input);
    for (let i = 0; i < numStr.length; i += 3) {
      const group = numStr.slice(i, i + 3);
      const val = parseInt(group, 10);
      if (group.length === 3) {
        pushBits(bits, val, 10);
      } else if (group.length === 2) {
        pushBits(bits, val, 7);
      } else {
        pushBits(bits, val, 4);
      }
    }
  } else {
    for (const byte of dataBytes) {
      pushBits(bits, byte, 8);
    }
  }

  // Terminator (up to 4 zeros)
  const terminatorLength = Math.min(4, capacity * 8 - bits.length);
  for (let i = 0; i < terminatorLength; i++) {
    bits.push(0);
  }

  // Pad to byte boundary
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Convert to bytes
  const codewords = new Uint8Array(capacity);
  let byteIndex = 0;
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    codewords[byteIndex++] = byte;
  }

  // Pad with alternating 0xEC and 0x11
  let pad = 0xec;
  while (byteIndex < capacity) {
    codewords[byteIndex++] = pad;
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  return { codewords, version };
}

// -----------------------------------------------------------------------------
// Error correction
// -----------------------------------------------------------------------------

function addErrorCorrection(data: Uint8Array, version: number): Uint8Array {
  const info = VERSION_INFO[version];
  const ecPerBlock = info.ecCodewordsPerBlock;

  const blocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  let offset = 0;

  // Group 1 blocks
  for (let i = 0; i < info.numBlocksGroup1; i++) {
    const block = data.slice(offset, offset + info.dataCodewordsGroup1);
    blocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
    offset += info.dataCodewordsGroup1;
  }

  // Group 2 blocks
  for (let i = 0; i < info.numBlocksGroup2; i++) {
    const block = data.slice(offset, offset + info.dataCodewordsGroup2);
    blocks.push(block);
    ecBlocks.push(rsEncode(block, ecPerBlock));
    offset += info.dataCodewordsGroup2;
  }

  // Interleave data codewords
  const result: number[] = [];
  const maxDataLen = Math.max(info.dataCodewordsGroup1, info.dataCodewordsGroup2);

  for (let i = 0; i < maxDataLen; i++) {
    for (const block of blocks) {
      if (i < block.length) {
        result.push(block[i]);
      }
    }
  }

  // Interleave EC codewords
  for (let i = 0; i < ecPerBlock; i++) {
    for (const ec of ecBlocks) {
      result.push(ec[i]);
    }
  }

  return new Uint8Array(result);
}

// -----------------------------------------------------------------------------
// Matrix construction
// -----------------------------------------------------------------------------

type Module = boolean | null; // null = not yet set

function createMatrix(size: number): Module[][] {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function placeFinderPattern(matrix: Module[][], row: number, col: number): void {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const mr = row + r;
      const mc = col + c;
      if (mr < 0 || mr >= matrix.length || mc < 0 || mc >= matrix.length) continue;

      if (r === -1 || r === 7 || c === -1 || c === 7) {
        // Separator (white)
        matrix[mr][mc] = false;
      } else if (r === 0 || r === 6 || c === 0 || c === 6) {
        // Outer border (black)
        matrix[mr][mc] = true;
      } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
        // Inner square (black)
        matrix[mr][mc] = true;
      } else {
        // Inner white
        matrix[mr][mc] = false;
      }
    }
  }
}

function placeAlignmentPattern(matrix: Module[][], row: number, col: number): void {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const mr = row + r;
      const mc = col + c;
      if (matrix[mr][mc] !== null) continue; // Don't overwrite finder patterns

      if (r === -2 || r === 2 || c === -2 || c === 2) {
        matrix[mr][mc] = true;
      } else if (r === 0 && c === 0) {
        matrix[mr][mc] = true;
      } else {
        matrix[mr][mc] = false;
      }
    }
  }
}

function placeTimingPatterns(matrix: Module[][]): void {
  const size = matrix.length;
  for (let i = 8; i < size - 8; i++) {
    const bit = i % 2 === 0;
    if (matrix[6][i] === null) matrix[6][i] = bit;
    if (matrix[i][6] === null) matrix[i][6] = bit;
  }
}

function placeDarkModule(matrix: Module[][], version: number): void {
  matrix[4 * version + 9][8] = true;
}

function reserveFormatInfo(matrix: Module[][]): void {
  const size = matrix.length;

  // Around top-left finder
  for (let i = 0; i <= 8; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // Around top-right finder
  for (let i = 0; i <= 7; i++) {
    if (matrix[8][size - 1 - i] === null) matrix[8][size - 1 - i] = false;
  }

  // Around bottom-left finder
  for (let i = 0; i <= 7; i++) {
    if (matrix[size - 1 - i][8] === null) matrix[size - 1 - i][8] = false;
  }
}

function reserveVersionInfo(matrix: Module[][], version: number): void {
  if (version < 7) return;

  const size = matrix.length;

  // Bottom-left of top-right finder
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      matrix[i][size - 11 + j] = false;
      matrix[size - 11 + j][i] = false;
    }
  }
}

function placeData(matrix: Module[][], data: Uint8Array): void {
  const size = matrix.length;
  let bitIndex = 0;
  let upward = true;

  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // Skip timing pattern column

    for (let row = 0; row < size; row++) {
      const actualRow = upward ? size - 1 - row : row;

      for (let c = 0; c < 2; c++) {
        const actualCol = col - c;
        if (matrix[actualRow][actualCol] !== null) continue;

        let bit = false;
        if (bitIndex < data.length * 8) {
          const byteIndex = Math.floor(bitIndex / 8);
          const bitOffset = 7 - (bitIndex % 8);
          bit = ((data[byteIndex] >> bitOffset) & 1) === 1;
          bitIndex++;
        }
        matrix[actualRow][actualCol] = bit;
      }
    }

    upward = !upward;
  }
}

// -----------------------------------------------------------------------------
// Masking
// -----------------------------------------------------------------------------

type MaskFunction = (row: number, col: number) => boolean;

const MASK_PATTERNS: MaskFunction[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(matrix: boolean[][], reserved: boolean[][], maskIndex: number): void {
  const size = matrix.length;
  const mask = MASK_PATTERNS[maskIndex];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!reserved[row][col] && mask(row, col)) {
        matrix[row][col] = !matrix[row][col];
      }
    }
  }
}

function computePenalty(matrix: boolean[][]): number {
  const size = matrix.length;
  let penalty = 0;

  // Rule 1: Consecutive modules in row/column
  for (let row = 0; row < size; row++) {
    let count = 1;
    for (let col = 1; col < size; col++) {
      if (matrix[row][col] === matrix[row][col - 1]) {
        count++;
      } else {
        if (count >= 5) penalty += 3 + (count - 5);
        count = 1;
      }
    }
    if (count >= 5) penalty += 3 + (count - 5);
  }

  for (let col = 0; col < size; col++) {
    let count = 1;
    for (let row = 1; row < size; row++) {
      if (matrix[row][col] === matrix[row - 1][col]) {
        count++;
      } else {
        if (count >= 5) penalty += 3 + (count - 5);
        count = 1;
      }
    }
    if (count >= 5) penalty += 3 + (count - 5);
  }

  // Rule 2: 2x2 blocks
  for (let row = 0; row < size - 1; row++) {
    for (let col = 0; col < size - 1; col++) {
      const color = matrix[row][col];
      if (
        color === matrix[row][col + 1] &&
        color === matrix[row + 1][col] &&
        color === matrix[row + 1][col + 1]
      ) {
        penalty += 3;
      }
    }
  }

  // Rule 3: Finder-like patterns
  const pattern1 = [true, false, true, true, true, false, true, false, false, false, false];
  const pattern2 = [false, false, false, false, true, false, true, true, true, false, true];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col <= size - 11; col++) {
      let match1 = true;
      let match2 = true;
      for (let i = 0; i < 11; i++) {
        if (matrix[row][col + i] !== pattern1[i]) match1 = false;
        if (matrix[row][col + i] !== pattern2[i]) match2 = false;
      }
      if (match1 || match2) penalty += 40;
    }
  }

  for (let col = 0; col < size; col++) {
    for (let row = 0; row <= size - 11; row++) {
      let match1 = true;
      let match2 = true;
      for (let i = 0; i < 11; i++) {
        if (matrix[row + i][col] !== pattern1[i]) match1 = false;
        if (matrix[row + i][col] !== pattern2[i]) match2 = false;
      }
      if (match1 || match2) penalty += 40;
    }
  }

  // Rule 4: Dark/light ratio
  let darkCount = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (matrix[row][col]) darkCount++;
    }
  }
  const ratio = (darkCount * 100) / (size * size);
  const deviation = Math.abs(ratio - 50);
  penalty += Math.floor(deviation / 5) * 10;

  return penalty;
}

// -----------------------------------------------------------------------------
// Format and Version Info
// -----------------------------------------------------------------------------

// Format info for EC level M (00) and mask patterns 0-7
// Pre-computed with BCH error correction
const FORMAT_INFO = [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0];

function placeFormatInfo(matrix: boolean[][], maskIndex: number): void {
  const size = matrix.length;
  const info = FORMAT_INFO[maskIndex];

  // Place around top-left finder
  for (let i = 0; i <= 5; i++) {
    matrix[8][i] = ((info >> (14 - i)) & 1) === 1;
  }
  matrix[8][7] = ((info >> 8) & 1) === 1;
  matrix[8][8] = ((info >> 7) & 1) === 1;
  matrix[7][8] = ((info >> 6) & 1) === 1;
  for (let i = 0; i <= 5; i++) {
    matrix[5 - i][8] = ((info >> i) & 1) === 1;
  }

  // Place along top-right
  for (let i = 0; i <= 7; i++) {
    matrix[8][size - 1 - i] = ((info >> i) & 1) === 1;
  }

  // Place along bottom-left
  for (let i = 0; i <= 6; i++) {
    matrix[size - 1 - i][8] = ((info >> (14 - i)) & 1) === 1;
  }
}

// Version info for versions 7-40 (pre-computed with BCH)
const VERSION_INFO_BITS = [
  0x07c94, 0x085bc, 0x09a99, 0x0a4d3, 0x0bbf6, 0x0c762, 0x0d847, 0x0e60d, 0x0f928, 0x10b78, 0x1145d,
  0x12a17, 0x13532, 0x149a6, 0x15683, 0x168c9, 0x177ec, 0x18ec4, 0x191e1, 0x1afab, 0x1b08e, 0x1cc1a,
  0x1d33f, 0x1ed75, 0x1f250, 0x209d5, 0x216f0, 0x228ba, 0x2379f, 0x24b0b, 0x2542e, 0x26a64, 0x27541,
  0x28c69,
];

function placeVersionInfo(matrix: boolean[][], version: number): void {
  if (version < 7) return;

  const size = matrix.length;
  const info = VERSION_INFO_BITS[version - 7];

  for (let i = 0; i < 18; i++) {
    const bit = ((info >> i) & 1) === 1;
    const row = Math.floor(i / 3);
    const col = (i % 3) + size - 11;

    matrix[row][col] = bit;
    matrix[col][row] = bit;
  }
}

// -----------------------------------------------------------------------------
// Main function
// -----------------------------------------------------------------------------

/**
 * Generates a QR code matrix from the given input.
 * Proprietary implementation - no external dependencies.
 *
 * @param input - String or number to encode
 *   - If number: uses Numeric mode
 *   - If string: uses Byte mode (UTF-8)
 * @returns 2D boolean array where `true` = dark module, `false` = light module
 */
export function generateQrCode(input: string | number): boolean[][] {
  // Encode data
  const { codewords, version } = createDataCodewords(input);

  // Add error correction
  const finalData = addErrorCorrection(codewords, version);

  // Create matrix
  const size = version * 4 + 17;
  const matrix = createMatrix(size);

  // Place finder patterns
  placeFinderPattern(matrix, 0, 0);
  placeFinderPattern(matrix, 0, size - 7);
  placeFinderPattern(matrix, size - 7, 0);

  // Place alignment patterns
  const alignments = VERSION_INFO[version].alignmentPatterns;
  for (const row of alignments) {
    for (const col of alignments) {
      // Skip positions overlapping with finder patterns
      if (row <= 8 && col <= 8) continue;
      if (row <= 8 && col >= size - 9) continue;
      if (row >= size - 9 && col <= 8) continue;
      placeAlignmentPattern(matrix, row, col);
    }
  }

  // Place timing patterns
  placeTimingPatterns(matrix);

  // Place dark module
  placeDarkModule(matrix, version);

  // Reserve format info areas
  reserveFormatInfo(matrix);

  // Reserve version info areas
  reserveVersionInfo(matrix, version);

  // Create reserved map (true where function patterns are)
  const reserved: boolean[][] = matrix.map((row) => row.map((cell) => cell !== null));

  // Place data
  placeData(matrix, finalData);

  // Convert to boolean[][] (all nulls should be false by now)
  const boolMatrix: boolean[][] = matrix.map((row) => row.map((cell) => cell === true));

  // Find best mask
  let bestMask = 0;
  let bestPenalty = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const testMatrix = boolMatrix.map((row) => [...row]);
    applyMask(testMatrix, reserved, mask);
    placeFormatInfo(testMatrix, mask);
    placeVersionInfo(testMatrix, version);

    const penalty = computePenalty(testMatrix);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
    }
  }

  // Apply best mask
  applyMask(boolMatrix, reserved, bestMask);
  placeFormatInfo(boolMatrix, bestMask);
  placeVersionInfo(boolMatrix, version);

  return boolMatrix;
}
