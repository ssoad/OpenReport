import { describe, it, expect } from 'vitest';
import { PdfExporter, CsvExporter, XlsxExporter, HtmlExporter, SvgExporter } from '../index';
import { RenderedDocument } from '@openreport/layout-engine';

describe('OpenReport Multi-Target Exporters', () => {
  const sampleDocument: RenderedDocument = {
    id: 'test-invoice',
    title: 'Commercial Invoice #1001',
    pageCount: 1,
    pageSize: 'A4',
    orientation: 'portrait',
    generatedAt: '2026-10-28T00:00:00Z',
    pages: [
      {
        pageNumber: 1,
        width: 595.28,
        height: 841.89,
        printableWidth: 523.28,
        printableHeight: 769.89,
        margins: { top: 36, right: 36, bottom: 36, left: 36 },
        boxes: [
          {
            id: 'title',
            type: 'text',
            x: 36,
            y: 36,
            width: 300,
            height: 30,
            text: 'COMMERCIAL INVOICE',
            font: { family: 'Helvetica', size: 16, weight: 'bold', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 }
          },
          {
            id: 'h1',
            type: 'text',
            x: 36,
            y: 80,
            width: 150,
            height: 20,
            text: 'Item Description',
            backgroundColor: '#f1f5f9',
            font: { family: 'Helvetica', size: 10, weight: 'bold', italic: false, color: '#334155', align: 'left', verticalAlign: 'top', lineHeight: 1.2 }
          },
          {
            id: 'h2',
            type: 'text',
            x: 186,
            y: 80,
            width: 100,
            height: 20,
            text: 'Amount',
            backgroundColor: '#f1f5f9',
            font: { family: 'Helvetica', size: 10, weight: 'bold', italic: false, color: '#334155', align: 'right', verticalAlign: 'top', lineHeight: 1.2 }
          },
          {
            id: 'r1_c1',
            type: 'text',
            x: 36,
            y: 100,
            width: 150,
            height: 20,
            text: 'Cloud Subscription',
            font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 }
          },
          {
            id: 'r1_c2',
            type: 'text',
            x: 186,
            y: 100,
            width: 100,
            height: 20,
            text: '$1,250.00',
            font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#0f172a', align: 'right', verticalAlign: 'top', lineHeight: 1.2 }
          },
          {
            id: 'r2_c1',
            type: 'text',
            x: 36,
            y: 120,
            width: 150,
            height: 20,
            // Potentially malicious CSV string to test formula-injection defense
            text: '=SUM(1+1)',
            font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 }
          },
          {
            id: 'r2_c2',
            type: 'text',
            x: 186,
            y: 120,
            width: 100,
            height: 20,
            text: '$2.00',
            font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#0f172a', align: 'right', verticalAlign: 'top', lineHeight: 1.2 }
          }
        ]
      }
    ]
  };

  it('exports to high-fidelity PDF buffer with valid PDF header', async () => {
    const pdfBytes = await PdfExporter.exportToBuffer(sampleDocument);

    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(500);

    // Verify PDF header magic bytes %PDF-
    const headerStr = String.fromCharCode(...pdfBytes.subarray(0, 5));
    expect(headerStr).toBe('%PDF-');
  });

  it('exports to CSV string with RFC-4180 formatting and formula injection defense', () => {
    const csv = CsvExporter.exportToString(sampleDocument);

    expect(csv).toContain('Item Description,Amount');
    expect(csv).toContain('Cloud Subscription,"$1,250.00"');

    // Crucial security verification: formula injection mitigation must prefix '=' with '\''
    expect(csv).toContain("'=SUM(1+1)");
  });

  it('exports to Excel XLSX buffer with valid OpenXML ZIP header', async () => {
    const xlsxBytes = await XlsxExporter.exportToBuffer(sampleDocument);

    expect(xlsxBytes).toBeDefined();
    expect(xlsxBytes.length).toBeGreaterThan(1000);

    // ZIP magic bytes PK\x03\x04
    expect(xlsxBytes[0]).toBe(0x50); // 'P'
    expect(xlsxBytes[1]).toBe(0x4b); // 'K'
    expect(xlsxBytes[2]).toBe(0x03);
    expect(xlsxBytes[3]).toBe(0x04);
  });

  it('exports to semantic HTML markup', () => {
    const html = HtmlExporter.exportToString(sampleDocument);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Commercial Invoice #1001');
    expect(html).toContain('COMMERCIAL INVOICE');
    expect(html).toContain('Cloud Subscription');
    expect(html).toContain('@media print');
  });

  it('exports page to vector SVG markup', () => {
    const svg = SvgExporter.exportPageToSvg(sampleDocument.pages[0]!);

    expect(svg).toContain('<svg');
    expect(svg).toContain('COMMERCIAL INVOICE');
    expect(svg).toContain('Cloud Subscription');
    expect(svg).toContain('</svg>');
  });
});
