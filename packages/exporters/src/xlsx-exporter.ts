import ExcelJS from 'exceljs';
import { RenderedDocument, RenderedBox } from '@openreport/layout-engine';

export class XlsxExporter {
  public static async exportToBuffer(document: RenderedDocument): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OpenReport';
    workbook.lastModifiedBy = 'OpenReport Engine';
    workbook.created = new Date();

    const sheetName = (document.title || 'Report').substring(0, 31).replace(/[*?:/\\\[\]]/g, '');
    const worksheet = workbook.addWorksheet(sheetName);

    // 1. Gather and sort text boxes
    const textBoxes: RenderedBox[] = [];
    for (const page of document.pages) {
      for (const box of page.boxes) {
        if (box.text !== undefined && box.text !== null && box.text.trim().length > 0) {
          textBoxes.push(box);
        }
      }
    }

    // 2. Cluster into rows by Y coordinate
    const rows: RenderedBox[][] = [];
    const sortedBoxes = [...textBoxes].sort((a, b) => a.y - b.y || a.x - b.x);

    let currentRow: RenderedBox[] = [];
    let currentRowY = -999;

    for (const box of sortedBoxes) {
      if (Math.abs(box.y - currentRowY) > 4) {
        if (currentRow.length > 0) {
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

    // 3. Write rows to worksheet
    for (const rowBoxes of rows) {
      const cellValues = rowBoxes.map((box) => {
        const text = box.text || '';
        // If numeric
        const num = Number(text.replace(/[$,]/g, ''));
        if (!isNaN(num) && text.trim() !== '' && !text.includes('-') && !text.includes('/')) {
          return num;
        }
        return text;
      });

      const excelRow = worksheet.addRow(cellValues);

      // Apply styling to row cells
      rowBoxes.forEach((box, cIdx) => {
        const cell = excelRow.getCell(cIdx + 1);

        const isBold = box.font?.weight === 'bold' || box.font?.weight === '700';
        cell.font = {
          name: 'Calibri',
          size: Math.max(9, box.font?.size || 10),
          bold: isBold,
          color: { argb: (box.font?.color || '#000000').replace('#', 'FF') }
        };

        if (box.backgroundColor) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: box.backgroundColor.replace('#', 'FF') }
          };
        }

        cell.alignment = {
          horizontal: box.font?.align === 'right' ? 'right' : box.font?.align === 'center' ? 'center' : 'left',
          vertical: 'middle'
        };

        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    }

    // Adjust column widths automatically
    worksheet.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: false }, (c) => {
        const valStr = c.value ? String(c.value) : '';
        if (valStr.length > maxLen) maxLen = Math.min(40, valStr.length);
      });
      col.width = maxLen + 3;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }
}
