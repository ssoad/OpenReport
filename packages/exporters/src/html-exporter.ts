import { RenderedDocument, RenderedBox } from '@openreport/layout-engine';

export class HtmlExporter {
  public static exportToString(document: RenderedDocument): string {
    const pagesHtml = document.pages.map((page) => {
      const boxesHtml = page.boxes.map((box) => HtmlExporter.renderBoxHtml(box)).join('\n');

      return `
        <div class="openreport-page" style="
          position: relative;
          width: ${page.width}pt;
          height: ${page.height}pt;
          background: #ffffff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
          margin: 20px auto;
          overflow: hidden;
          box-sizing: border-box;
        ">
          ${boxesHtml}
        </div>
      `;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${HtmlExporter.escapeHtml(document.title)}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        background: none;
      }
      .openreport-page {
        margin: 0 !important;
        box-shadow: none !important;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
  }

  private static renderBoxHtml(box: RenderedBox): string {
    const styleParts: string[] = [
      'position: absolute',
      `left: ${box.x}pt`,
      `top: ${box.y}pt`,
      `width: ${box.width}pt`,
      `height: ${box.height}pt`,
      'box-sizing: border-box'
    ];

    if (box.backgroundColor) styleParts.push(`background-color: ${box.backgroundColor}`);
    if (box.borderRadius) styleParts.push(`border-radius: ${box.borderRadius}pt`);

    if (box.font) {
      if (box.font.family) styleParts.push(`font-family: ${box.font.family}`);
      if (box.font.size) styleParts.push(`font-size: ${box.font.size}pt`);
      if (box.font.weight) styleParts.push(`font-weight: ${box.font.weight}`);
      if (box.font.color) styleParts.push(`color: ${box.font.color}`);
      if (box.font.align) styleParts.push(`text-align: ${box.font.align}`);
      if (box.font.lineHeight) styleParts.push(`line-height: ${box.font.lineHeight}`);
    }

    if (box.padding) {
      styleParts.push(`padding: ${box.padding.top}pt ${box.padding.right}pt ${box.padding.bottom}pt ${box.padding.left}pt`);
    }

    if (box.borders) {
      if (box.borders.bottom) {
        styleParts.push(`border-bottom: ${box.borders.bottom.width}pt ${box.borders.bottom.style} ${box.borders.bottom.color}`);
      }
      if (box.borders.top) {
        styleParts.push(`border-top: ${box.borders.top.width}pt ${box.borders.top.style} ${box.borders.top.color}`);
      }
      if (box.borders.all) {
        styleParts.push(`border: ${box.borders.all.width}pt ${box.borders.all.style} ${box.borders.all.color}`);
      }
    }

    if (box.type === 'line') {
      styleParts.push(`border-top: ${box.strokeWidth || 1}pt solid ${box.strokeColor || '#94a3b8'}`);
    }

    const content = box.text ? HtmlExporter.escapeHtml(box.text) : '';
    return `<div id="${box.id}" style="${styleParts.join('; ')}">${content}</div>`;
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
