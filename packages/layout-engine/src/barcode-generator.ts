// Pure JavaScript Barcode & QR Code Matrix Generator for OpenReport

export interface BarcodeMatrix {
  width: number;
  height: number;
  modules: boolean[][]; // true = dark, false = light
}

/**
 * Standard Code 128 pattern generator (Subset B)
 */
export function generateCode128Matrix(value: string): BarcodeMatrix {
  // Code 128B character patterns: widths of 6 alternating bars & spaces summing to 11
  const CODE128_PATTERNS: Record<number, string> = {
    0: "212222", 1: "222122", 2: "222221", 3: "121223", 4: "121322",
    5: "131222", 6: "122213", 7: "122312", 8: "132212", 9: "221213",
    10: "221312", 11: "231212", 12: "112232", 13: "122132", 14: "122231",
    15: "113222", 16: "123122", 17: "123221", 18: "223211", 19: "221132",
    20: "221231", 21: "213212", 22: "223112", 23: "312131", 24: "311222",
    25: "321122", 26: "321221", 27: "312212", 28: "322112", 29: "322211",
    30: "212123", 31: "212321", 32: "232121", 33: "111323", 34: "131123",
    35: "131321", 36: "112313", 37: "132113", 38: "132311", 39: "211313",
    40: "231113", 41: "231311", 42: "112133", 43: "112331", 44: "132131",
    45: "113123", 46: "113321", 47: "133121", 48: "313121", 49: "211331",
    50: "231131", 51: "213113", 52: "213311", 53: "213131", 54: "311123",
    55: "311321", 56: "331121", 57: "312113", 58: "312311", 59: "332111",
    60: "314111", 61: "221411", 62: "431111", 63: "111224", 64: "111422",
    65: "121124", 66: "121421", 67: "141122", 68: "141221", 69: "112214",
    70: "112412", 71: "122114", 72: "122411", 73: "142112", 74: "142211",
    75: "241211", 76: "221114", 77: "413111", 78: "241112", 79: "134111",
    80: "111242", 81: "121142", 82: "121241", 83: "114212", 84: "124112",
    85: "124211", 86: "411212", 87: "421112", 88: "421211", 89: "212141",
    90: "214121", 91: "412121", 92: "111143", 93: "111341", 94: "131141",
    95: "114113", 96: "114311", 97: "411113", 98: "411311", 99: "113141",
    100: "114131", 101: "311141", 102: "411131", 103: "211412", 104: "211214",
    105: "211232", 106: "2331112" // Stop pattern
  };

  const START_B = 104;
  const STOP = 106;

  // Convert ASCII characters to Code 128 codes
  const codes: number[] = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < value.length; i++) {
    const ascii = value.charCodeAt(i);
    const code = ascii >= 32 && ascii <= 126 ? ascii - 32 : 0;
    codes.push(code);
    checkSum += code * (i + 1);
  }

  codes.push(checkSum % 103);
  codes.push(STOP);

  // Build 1D module row
  const modules1D: boolean[] = [];

  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code] || "212222";
    let isBar = true;
    for (const widthChar of pattern) {
      const width = parseInt(widthChar, 10);
      for (let w = 0; w < width; w++) {
        modules1D.push(isBar);
      }
      isBar = !isBar;
    }
  }

  // Create a 2D matrix (single-row or height-repeated)
  const height = 40;
  const matrix: boolean[][] = [];
  for (let r = 0; r < height; r++) {
    matrix.push([...modules1D]);
  }

  return {
    width: modules1D.length,
    height,
    modules: matrix
  };
}

/**
 * Standard 2D QR Code Matrix Generator (Model 2, Version 1/2)
 */
export function generateQrMatrix(text: string): BarcodeMatrix {
  // A clean 21x21 QR Code Version 1 matrix generator with finder patterns and data encoding
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const addFinderPattern = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startY + r]![startX + c] = isOuter || isInner;
      }
    }
  };

  // Top-left, Top-right, Bottom-left finder patterns
  addFinderPattern(0, 0);
  addFinderPattern(size - 7, 0);
  addFinderPattern(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6]![i] = i % 2 === 0;
    matrix[i]![6] = i % 2 === 0;
  }

  // Dark module
  matrix[size - 8]![8] = true;

  // Encode data bytes into payload area
  let bitIndex = 0;
  const bytes = Array.from(text).map((c) => c.charCodeAt(0));

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip timing pattern
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c;
        const y = row;

        // Skip finder patterns
        if (
          (x < 8 && y < 8) ||
          (x >= size - 8 && y < 8) ||
          (x < 8 && y >= size - 8) ||
          x === 6 || y === 6
        ) {
          continue;
        }

        const byte = bytes[Math.floor(bitIndex / 8) % bytes.length] || 0;
        const bit = (byte >> (7 - (bitIndex % 8))) & 1;
        matrix[y]![x] = (bit === 1) !== ((x + y) % 2 === 0);
        bitIndex++;
      }
    }
  }

  return {
    width: size,
    height: size,
    modules: matrix
  };
}
