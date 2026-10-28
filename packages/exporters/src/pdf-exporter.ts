import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { RenderedDocument, RenderedBox } from '@openreport/layout-engine';
import { hexToRgb } from './color-utils';

export class PdfExporter {
  public static async exportToBuffer(document: RenderedDocument): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    // Embed Standard Fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);

    for (const page of document.pages) {
      const pdfPage = pdfDoc.addPage([page.width, page.height]);
      const pageHeight = page.height;

      for (const box of page.boxes) {
        // 1. Draw Background / Rectangles
        if (box.type === 'rect' || box.backgroundColor) {
          const pdfY = pageHeight - (box.y + box.height);
          const fillColor = hexToRgb(box.backgroundColor || '#ffffff');

          const options: any = {
            x: box.x,
            y: pdfY,
            width: box.width,
            height: box.height,
            color: fillColor
          };

          if (box.strokeWidth && box.strokeWidth > 0 && box.strokeColor) {
            options.borderColor = hexToRgb(box.strokeColor);
            options.borderWidth = box.strokeWidth;
          }

          pdfPage.drawRectangle(options);
        }

        // 2. Draw Borders if specified
        if (box.borders) {
          const pdfY = pageHeight - (box.y + box.height);

          if (box.borders.bottom) {
            pdfPage.drawLine({
              start: { x: box.x, y: pdfY },
              end: { x: box.x + box.width, y: pdfY },
              thickness: box.borders.bottom.width,
              color: hexToRgb(box.borders.bottom.color)
            });
          }

          if (box.borders.top) {
            pdfPage.drawLine({
              start: { x: box.x, y: pdfY + box.height },
              end: { x: box.x + box.width, y: pdfY + box.height },
              thickness: box.borders.top.width,
              color: hexToRgb(box.borders.top.color)
            });
          }
        }

        // 3. Draw Lines
        if (box.type === 'line') {
          const pdfY = pageHeight - (box.y + box.height);
          pdfPage.drawLine({
            start: { x: box.x, y: pdfY + box.height / 2 },
            end: { x: box.x + box.width, y: pdfY + box.height / 2 },
            thickness: box.strokeWidth || 1,
            color: hexToRgb(box.strokeColor || '#94a3b8')
          });
        }

        // 4. Draw Text
        if (box.text && box.type !== 'barcode') {
          const isBold = box.font?.weight === 'bold' || box.font?.weight === '700';
          const font = isBold ? helveticaBold : helvetica;
          const fontSize = Math.max(6, Math.min(48, box.font?.size || 10));
          const textColor = hexToRgb(box.font?.color || '#0f172a');

          const padLeft = box.padding?.left || 0;
          const padTop = box.padding?.top || 0;

          // Compute text X according to alignment
          let textX = box.x + padLeft;
          const cleanText = box.text.replace(/[\r\n]+/g, ' ');

          try {
            const textWidth = font.widthOfTextAtSize(cleanText, fontSize);
            if (box.font?.align === 'center') {
              textX = box.x + (box.width - textWidth) / 2;
            } else if (box.font?.align === 'right') {
              textX = box.x + box.width - textWidth - (box.padding?.right || 0);
            }

            const textY = pageHeight - box.y - padTop - fontSize * 0.85;

            pdfPage.drawText(cleanText, {
              x: Math.max(box.x, textX),
              y: textY,
              size: fontSize,
              font,
              color: textColor
            });
          } catch {
            // Fallback for character encoding issues
            pdfPage.drawText(String(box.text), {
              x: box.x + padLeft,
              y: pageHeight - box.y - padTop - fontSize,
              size: fontSize,
              font: courier,
              color: textColor
            });
          }
        }

        // 5. Draw KPI Card
        if (box.type === 'kpi' && box.kpiData) {
          const pdfY = pageHeight - (box.y + box.height);
          // Card border
          pdfPage.drawRectangle({
            x: box.x,
            y: pdfY,
            width: box.width,
            height: box.height,
            color: hexToRgb('#ffffff'),
            borderColor: hexToRgb('#e2e8f0'),
            borderWidth: 1
          });

          // Title
          pdfPage.drawText(box.kpiData.title, {
            x: box.x + 12,
            y: pdfY + box.height - 20,
            size: 9,
            font: helvetica,
            color: hexToRgb('#64748b')
          });

          // Metric Value
          pdfPage.drawText(box.kpiData.value, {
            x: box.x + 12,
            y: pdfY + box.height - 45,
            size: 18,
            font: helveticaBold,
            color: hexToRgb(box.kpiData.accentColor || '#0f172a')
          });

          // Subtitle / Change
          if (box.kpiData.change) {
            pdfPage.drawText(box.kpiData.change, {
              x: box.x + 12,
              y: pdfY + 12,
              size: 9,
              font: helveticaBold,
              color: box.kpiData.trend === 'up' ? hexToRgb('#16a34a') : hexToRgb('#dc2626')
            });
          }
        }

        // 6. Draw Vector Charts (Bar / Column)
        if (box.type === 'chart' && box.chartData) {
          PdfExporter.renderVectorChart(pdfPage, pageHeight, box, helvetica, helveticaBold);
        }
      }
    }

    return await pdfDoc.save();
  }

  private static renderVectorChart(
    pdfPage: any,
    pageHeight: number,
    box: RenderedBox,
    fontRegular: any,
    fontBold: any
  ): void {
    const chart = box.chartData!;
    const pdfY = pageHeight - (box.y + box.height);

    // Chart frame
    pdfPage.drawRectangle({
      x: box.x,
      y: pdfY,
      width: box.width,
      height: box.height,
      color: hexToRgb('#ffffff'),
      borderColor: hexToRgb('#e2e8f0'),
      borderWidth: 1
    });

    // Chart Title
    if (chart.title) {
      pdfPage.drawText(chart.title, {
        x: box.x + 12,
        y: pdfY + box.height - 20,
        size: 11,
        font: fontBold,
        color: hexToRgb('#1e293b')
      });
    }

    const categories = chart.categories || [];
    const values = chart.series[0]?.data || [];
    if (categories.length === 0 || values.length === 0) return;

    const plotTop = pdfY + box.height - 35;
    const plotBottom = pdfY + 30;
    const plotHeight = Math.max(20, plotTop - plotBottom);
    const plotLeft = box.x + 40;
    const plotWidth = Math.max(40, box.width - 55);

    const maxVal = Math.max(1, ...values);

    // Baseline axis
    pdfPage.drawLine({
      start: { x: plotLeft, y: plotBottom },
      end: { x: plotLeft + plotWidth, y: plotBottom },
      thickness: 1,
      color: hexToRgb('#cbd5e1')
    });

    const barSlotWidth = plotWidth / categories.length;
    const barWidth = Math.max(6, Math.min(30, barSlotWidth * 0.6));

    for (let i = 0; i < categories.length; i++) {
      const val = values[i] || 0;
      const barH = (val / maxVal) * plotHeight;
      const barX = plotLeft + i * barSlotWidth + (barSlotWidth - barWidth) / 2;
      const barY = plotBottom;

      const barColor = hexToRgb(chart.colors[i % chart.colors.length] || '#2563eb');

      // Bar
      pdfPage.drawRectangle({
        x: barX,
        y: barY,
        width: barWidth,
        height: barH,
        color: barColor
      });

      // Category label below
      const catName = categories[i]?.substring(0, 8) || '';
      pdfPage.drawText(catName, {
        x: barX - 4,
        y: plotBottom - 14,
        size: 8,
        font: fontRegular,
        color: hexToRgb('#64748b')
      });
    }
  }
}
