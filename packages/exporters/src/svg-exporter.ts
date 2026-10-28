import { RenderedPage, RenderedBox } from '@openreport/layout-engine';

export class SvgExporter {
  public static exportPageToSvg(page: RenderedPage): string {
    const elementsSvg = page.boxes.map((box) => SvgExporter.renderBoxSvg(box)).join('\n  ');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${page.width} ${page.height}" width="${page.width}pt" height="${page.height}pt">
  <rect width="${page.width}" height="${page.height}" fill="#ffffff" />
  ${elementsSvg}
</svg>`;
  }

  private static renderBoxSvg(box: RenderedBox): string {
    const parts: string[] = [];

    // Background rect
    if (box.backgroundColor || box.type === 'rect') {
      const rx = box.borderRadius ? `rx="${box.borderRadius}" ry="${box.borderRadius}"` : '';
      const stroke = box.strokeColor && box.strokeWidth ? `stroke="${box.strokeColor}" stroke-width="${box.strokeWidth}"` : '';
      parts.push(
        `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${box.backgroundColor || 'none'}" ${stroke} ${rx} />`
      );
    }

    // Line
    if (box.type === 'line') {
      parts.push(
        `<line x1="${box.x}" y1="${box.y + box.height / 2}" x2="${box.x + box.width}" y2="${box.y + box.height / 2}" stroke="${box.strokeColor || '#94a3b8'}" stroke-width="${box.strokeWidth || 1}" />`
      );
    }

    // Text
    if (box.text) {
      const fontSize = box.font?.size || 10;
      const fill = box.font?.color || '#0f172a';
      const weight = box.font?.weight === 'bold' ? 'font-weight="bold"' : '';
      let textAnchor = 'start';
      let textX = box.x + (box.padding?.left || 0);

      if (box.font?.align === 'center') {
        textAnchor = 'middle';
        textX = box.x + box.width / 2;
      } else if (box.font?.align === 'right') {
        textAnchor = 'end';
        textX = box.x + box.width - (box.padding?.right || 0);
      }

      const textY = box.y + (box.padding?.top || 0) + fontSize * 0.9;
      const escaped = box.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      parts.push(
        `<text x="${textX}" y="${textY}" font-family="${box.font?.family || 'Helvetica, Arial, sans-serif'}" font-size="${fontSize}" fill="${fill}" text-anchor="${textAnchor}" ${weight}>${escaped}</text>`
      );
    }

    return parts.join('\n  ');
  }
}
