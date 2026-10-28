import { describe, it, expect } from 'vitest';
import { TextMeasurer, LayoutEngine } from '../index';
import { ReportDefinition } from '@openreport/schema';
import { ProcessedDataset } from '@openreport/data-engine';

describe('OpenReport Layout & Pagination Engine', () => {
  it('measures text and wraps long strings correctly', () => {
    const longText = 'OpenReport is a next-generation open-source reporting and analytics platform designed for modern developers.';
    const font = {
      family: 'Helvetica',
      size: 12,
      weight: 'normal' as const,
      italic: false,
      color: '#000',
      align: 'left' as const,
      verticalAlign: 'top' as const,
      lineHeight: 1.2
    };

    const measurement = TextMeasurer.measureText(longText, font, 200, true);
    expect(measurement.lines.length).toBeGreaterThan(1);
    expect(measurement.height).toBe(measurement.lines.length * 12 * 1.2);
    expect(measurement.width).toBeLessThanOrEqual(200);
  });

  it('paginates large tables cleanly across multiple pages with repeated headers and two-pass page numbers', () => {
    // Generate 60 orders so that table height exceeds single page printable height (approx 750 pt)
    const rows = Array.from({ length: 60 }, (_, i) => ({
      orderId: 1000 + i,
      customer: `Customer ${i + 1}`,
      amount: (i + 1) * 25.5
    }));

    const mockDataset: ProcessedDataset = {
      id: 'ordersData',
      rows,
      fields: [
        { name: 'orderId', type: 'number', nullable: false },
        { name: 'customer', type: 'string', nullable: false },
        { name: 'amount', type: 'number', nullable: false }
      ],
      totalRows: 60
    };

    const datasets = new Map<string, ProcessedDataset>([
      ['ordersData', mockDataset]
    ]);

    const report: ReportDefinition = {
      schemaVersion: '1.0.0',
      id: 'orders-report',
      title: 'Customer Orders Listing',
      page: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 36, right: 36, bottom: 36, left: 36 },
        unit: 'pt'
      },
      parameters: [],
      dataSources: [],
      datasets: [],
      metadata: { version: '1.0.0', tags: [] },
      bands: {
        pageHeader: {
          id: 'ph',
          type: 'pageHeader',
          height: 30,
          canGrow: false,
          canShrink: false,
          keepTogether: true,
          elements: [
            {
              id: 'hdr-title',
              type: 'text',
              x: 0,
              y: 5,
              width: 300,
              height: 20,
              text: 'Customer Orders Report',
              locked: false,
              wrapText: true,
              canGrow: false,
              canShrink: false,
              font: { family: 'Helvetica', size: 12, weight: 'bold', italic: false, color: '#000', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              padding: { top: 0, right: 0, bottom: 0, left: 0 }
            }
          ]
        },
        pageFooter: {
          id: 'pf',
          type: 'pageFooter',
          height: 25,
          canGrow: false,
          canShrink: false,
          keepTogether: true,
          elements: [
            {
              id: 'page-counter',
              type: 'text',
              x: 350,
              y: 5,
              width: 150,
              height: 15,
              text: '="Page " + PageNumber + " of " + TotalPages',
              locked: false,
              wrapText: false,
              canGrow: false,
              canShrink: false,
              font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#64748b', align: 'right', verticalAlign: 'top', lineHeight: 1.2 },
              padding: { top: 0, right: 0, bottom: 0, left: 0 }
            }
          ]
        },
        groupHeaders: [],
        groupFooters: [],
        detail: {
          id: 'det',
          type: 'detail',
          height: 200,
          canGrow: true,
          canShrink: false,
          keepTogether: false,
          elements: [
            {
              id: 'tbl-orders',
              type: 'table',
              datasetId: 'ordersData',
              x: 0,
              y: 0,
              width: 500,
              height: 100,
              showHeader: true,
              showSummary: true,
              alternatingRowColors: true,
              headerHeight: 24,
              rowHeight: 20,
              summaryHeight: 24,
              headerFont: { family: 'Helvetica', size: 10, weight: 'bold', italic: false, color: '#334155', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              rowFont: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              summaryFont: { family: 'Helvetica', size: 9, weight: 'bold', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              headerBackgroundColor: '#f1f5f9',
              alternatingBackgroundColor: '#f8fafc',
              summaryBackgroundColor: '#e2e8f0',
              cellPadding: { top: 3, right: 6, bottom: 3, left: 6 },
              locked: false,
              columns: [
                { id: 'c1', field: 'orderId', title: 'Order #', width: 100, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
                { id: 'c2', field: 'customer', title: 'Customer Name', width: 250, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
                { id: 'c3', field: 'amount', title: 'Amount', width: 150, align: 'right', headerAlign: 'right', visible: true, summary: 'sum' }
              ]
            }
          ]
        }
      }
    };

    const doc = LayoutEngine.layout(report, datasets);

    // 60 rows * 20 pt = 1200 pt. Flow height is ~710 pt.
    // It should span across at least 2 pages.
    expect(doc.pageCount).toBeGreaterThanOrEqual(2);
    expect(doc.pages.length).toBe(doc.pageCount);

    // Verify Page 1 has page counter "Page 1 of 2" (or "Page 1 of 3")
    const page1FooterBox = doc.pages[0]?.boxes.find((b) => b.id === 'page-counter');
    expect(page1FooterBox).toBeDefined();
    expect(page1FooterBox?.text).toBe(`Page 1 of ${doc.pageCount}`);

    // Verify Page 2 has page counter "Page 2 of N"
    const page2FooterBox = doc.pages[1]?.boxes.find((b) => b.id === 'page-counter');
    expect(page2FooterBox).toBeDefined();
    expect(page2FooterBox?.text).toBe(`Page 2 of ${doc.pageCount}`);

    // Verify Page 2 also has repeated table header
    const page2HeaderRow = doc.pages[1]?.boxes.find((b) => b.id === 'tbl-orders_hdr_c1');
    expect(page2HeaderRow).toBeDefined();
    expect(page2HeaderRow?.text).toBe('Order #');

    // Verify final page contains the table summary row
    const finalPage = doc.pages[doc.pageCount - 1]!;
    const summaryBox = finalPage.boxes.find((b) => b.id === 'tbl-orders_summary_c3');
    expect(summaryBox).toBeDefined();
    expect(Number(summaryBox?.text)).toBeGreaterThan(0);
  });
});
