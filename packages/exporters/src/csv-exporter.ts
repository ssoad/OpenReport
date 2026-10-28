import { RenderedDocument, RenderedBox } from '@openreport/layout-engine';

export interface CsvExportOptions {
  delimiter?: string;
  sanitizeFormulas?: boolean; // Default true (mitigates CSV formula injection attacks)
  includeHeaders?: boolean;
}

export class CsvExporter {
  public static exportToString(
    document: RenderedDocument,
    options: CsvExportOptions = {}
  ): string {
    const delimiter = options.delimiter || ',';
    const sanitize = options.sanitizeFormulas !== false;

    // 1. Gather all text boxes across all pages
    const textBoxes: RenderedBox[] = [];
    for (const page of document.pages) {
      for (const box of page.boxes) {
        if (box.text !== undefined && box.text !== null && box.text.trim().length > 0) {
          textBoxes.push(box);
        }
      }
    }

    if (textBoxes.length === 0) return '';

    // 2. Cluster boxes by Y-coordinate (within 4pt tolerance) to reconstruct rows
    const rows: RenderedBox[][] = [];
    const sortedBoxes = [...textBoxes].sort((a, b) => a.y - b.y || a.x - b.x);

    let currentRow: RenderedBox[] = [];
    let currentRowY = -999;

    for (const box of sortedBoxes) {
      if (Math.abs(box.y - currentRowY) > 4) {
        if (currentRow.length > 0) {
          // Sort cells left to right
          currentRow.sort((a, b) => a.x - b.x);
          rows.push(currentRow);
        }
        currentRow = [box];
        currentRowY = box.y;
      } else {
        currentRow.push(box);
      }
    }
    if (currentRow.length > 0) {
      currentRow.sort((a, b) => a.x - b.x);
      rows.push(currentRow);
    }

    // 3. Format lines
    const lines: string[] = [];

    for (const row of rows) {
      const lineFields = row.map((cell) => {
        let text = cell.text || '';

        // Formula injection mitigation
        if (sanitize && /^[=+\-@\t\r]/.test(text)) {
          text = `'${text}`;
        }

        // RFC 4180 Quoting
        if (text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r')) {
          return `"${text.replace(/"/g, '""')}"`;
        }

        return text;
      });

      lines.push(lineFields.join(delimiter));
    }

    return lines.join('\r\n');
  }
}
