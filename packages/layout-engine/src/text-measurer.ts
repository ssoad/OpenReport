import { FontStyle } from '@openreport/schema';

// Approximate character width factors relative to font size (1em)
// 0.55 is standard for proportional sans-serif like Helvetica/Arial
const DEFAULT_CHAR_WIDTH_RATIO = 0.55;

export interface TextMeasurement {
  width: number;
  height: number;
  lines: string[];
}

export class TextMeasurer {
  public static measureText(
    text: string,
    font: FontStyle = {
      family: 'Helvetica',
      size: 10,
      weight: 'normal',
      italic: false,
      color: '#000000',
      align: 'left',
      verticalAlign: 'top',
      lineHeight: 1.2
    },
    maxWidth?: number,
    wrapText: boolean = true
  ): TextMeasurement {
    if (!text) {
      return { width: 0, height: font.size * font.lineHeight, lines: [''] };
    }

    const fontSize = font.size;
    const lineHeight = font.lineHeight || 1.2;
    const charWidth = fontSize * (font.weight === 'bold' ? 0.60 : DEFAULT_CHAR_WIDTH_RATIO);

    // If no wrapping is needed or no maxWidth constraint
    if (!wrapText || !maxWidth || maxWidth <= 0) {
      const rawLines = text.split('\n');
      let maxLineWidth = 0;
      for (const line of rawLines) {
        const w = line.length * charWidth;
        if (w > maxLineWidth) maxLineWidth = w;
      }
      return {
        width: maxLineWidth,
        height: Math.max(1, rawLines.length) * fontSize * lineHeight,
        lines: rawLines
      };
    }

    // Word wrap
    const resultLines: string[] = [];
    const paragraphs = text.split('\n');

    for (const paragraph of paragraphs) {
      if (!paragraph) {
        resultLines.push('');
        continue;
      }

      const words = paragraph.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine.length === 0 ? word : `${currentLine} ${word}`;
        const testWidth = testLine.length * charWidth;

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine.length > 0) {
            resultLines.push(currentLine);
            currentLine = word;
          } else {
            // Word itself is longer than maxWidth, break word
            resultLines.push(word);
            currentLine = '';
          }
        }
      }

      if (currentLine.length > 0) {
        resultLines.push(currentLine);
      }
    }

    const calculatedHeight = Math.max(1, resultLines.length) * fontSize * lineHeight;
    let maxCalculatedWidth = 0;
    for (const l of resultLines) {
      const w = l.length * charWidth;
      if (w > maxCalculatedWidth) maxCalculatedWidth = w;
    }

    return {
      width: Math.min(maxWidth, maxCalculatedWidth),
      height: calculatedHeight,
      lines: resultLines
    };
  }
}
