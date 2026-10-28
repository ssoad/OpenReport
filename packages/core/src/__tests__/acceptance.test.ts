import { describe, it, expect } from 'vitest';
import {
  OpenReportEngine,
  validateReportDefinition,
  ReportDefinition,
  PdfExporter,
  CsvExporter,
  XlsxExporter
} from '../index';

describe('OpenReport Master Acceptance Criteria Verification', () => {
  it('executes full end-to-end workflow: authoring, binding, formatting, previewing, and exporting', async () => {
    // 1. Create a new report definition
    const newReport: ReportDefinition = {
      schemaVersion: '1.0.0',
      id: 'customer-statement-01',
      title: 'Customer Statement of Account',
      description: 'End-to-end verified acceptance test document',
      page: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 36, right: 36, bottom: 36, left: 36 },
        unit: 'pt'
      },
      parameters: [
        {
          name: 'currency',
          type: 'string',
          label: 'Display Currency',
          defaultValue: 'USD',
          required: true,
          visible: true
        }
      ],
      // 4. Sample dataset with real fixtures
      dataSources: [
        {
          id: 'transactionsSource',
          provider: 'memory',
          data: [
            { txnId: 'TX-101', date: '2026-10-01', description: 'Opening Balance', amount: 5000.00, status: 'POSTED' },
            { txnId: 'TX-102', date: '2026-10-05', description: 'Enterprise License Renewal', amount: 12500.50, status: 'POSTED' },
            { txnId: 'TX-103', date: '2026-10-12', description: 'Custom Analytics Support Add-on', amount: 1800.00, status: 'POSTED' },
            { txnId: 'TX-104', date: '2026-10-20', description: 'Payment Received - Wire #8839', amount: -7500.00, status: 'CLEARED' }
          ]
        }
      ],
      datasets: [
        {
          id: 'customerTxns',
          dataSourceId: 'transactionsSource',
          calculatedFields: [
            { name: 'isCredit', expression: 'IF([amount] < 0, "Credit", "Debit")' }
          ]
        }
      ],
      bands: {
        reportHeader: {
          id: 'rh-1',
          type: 'reportHeader',
          height: 60,
          canGrow: false,
          canShrink: false,
          keepTogether: true,
          elements: [
            // 5. Text component bound to literal title
            {
              id: 'title-txt',
              type: 'text',
              x: 0,
              y: 0,
              width: 300,
              height: 24,
              text: 'Statement of Account',
              locked: false,
              wrapText: false,
              canGrow: false,
              canShrink: false,
              font: { family: 'Helvetica', size: 16, weight: 'bold', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              padding: { top: 0, right: 0, bottom: 0, left: 0 }
            },
            // 6. Component bound to a parameter and expression
            {
              id: 'curr-txt',
              type: 'text',
              x: 350,
              y: 0,
              width: 173,
              height: 20,
              text: '="Currency: " + ?currency',
              locked: false,
              wrapText: false,
              canGrow: false,
              canShrink: false,
              font: { family: 'Helvetica', size: 10, weight: 'bold', italic: false, color: '#2563eb', align: 'right', verticalAlign: 'top', lineHeight: 1.2 },
              padding: { top: 0, right: 0, bottom: 0, left: 0 }
            }
          ]
        },
        pageFooter: {
          id: 'pf-1',
          type: 'pageFooter',
          height: 30,
          canGrow: false,
          canShrink: false,
          keepTogether: true,
          elements: [
            {
              id: 'page-info',
              type: 'text',
              x: 350,
              y: 5,
              width: 173,
              height: 20,
              text: '="Page " + PageNumber + " of " + TotalPages',
              locked: false,
              wrapText: false,
              canGrow: false,
              canShrink: false,
              font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#94a3b8', align: 'right', verticalAlign: 'top', lineHeight: 1.2 },
              padding: { top: 0, right: 0, bottom: 0, left: 0 }
            }
          ]
        },
        groupHeaders: [],
        groupFooters: [],
        detail: {
          id: 'det-1',
          type: 'detail',
          height: 200,
          canGrow: true,
          canShrink: false,
          keepTogether: false,
          elements: [
            // 7. Table with multiple columns and formatting (8)
            {
              id: 'txn-table',
              type: 'table',
              datasetId: 'customerTxns',
              x: 0,
              y: 10,
              width: 523,
              height: 120,
              showHeader: true,
              showSummary: true,
              alternatingRowColors: true,
              headerHeight: 24,
              rowHeight: 20,
              summaryHeight: 24,
              headerFont: { family: 'Helvetica', size: 9, weight: 'bold', italic: false, color: '#334155', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              rowFont: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              summaryFont: { family: 'Helvetica', size: 9, weight: 'bold', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              headerBackgroundColor: '#f1f5f9',
              alternatingBackgroundColor: '#f8fafc',
              summaryBackgroundColor: '#e2e8f0',
              cellPadding: { top: 3, right: 6, bottom: 3, left: 6 },
              locked: false,
              columns: [
                { id: 'c1', field: 'txnId', title: 'Ref #', width: 70, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
                { id: 'c2', field: 'date', title: 'Date', width: 80, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
                { id: 'c3', field: 'description', title: 'Transaction Description', width: 203, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
                { id: 'c4', field: 'isCredit', title: 'Type', width: 60, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
                { id: 'c5', field: 'amount', title: 'Amount', width: 110, align: 'right', headerAlign: 'right', visible: true, format: { type: 'currency', currencyCode: 'USD', decimals: 2 }, summary: 'sum' }
              ]
            }
          ]
        }
      },
      metadata: {
        author: 'QA Verification Suite',
        createdAt: '2026-10-28T00:00:00Z',
        tags: ['acceptance-test'],
        version: '1.0.0'
      }
    };

    // 9. Preview report with real fixture data
    const engine = new OpenReportEngine(newReport);
    await engine.loadData();
    const doc = await engine.renderDocument();

    expect(doc).toBeDefined();
    expect(doc.pageCount).toBe(1);

    // Verify parameter resolved in title
    const currBox = doc.pages[0]?.boxes.find((b) => b.id === 'curr-txt');
    expect(currBox?.text).toBe('Currency: USD');

    // Verify table records and formatting
    const amountBox = doc.pages[0]?.boxes.find((b) => b.id === 'txn-table_r1_cc5');
    expect(amountBox?.text).toBe('$12,500.50');

    // Verify summary subtotal
    const summaryBox = doc.pages[0]?.boxes.find((b) => b.id === 'txn-table_summary_c5');
    // 5000 + 12500.50 + 1800 - 7500 = 11800.50
    expect(summaryBox?.text).toBe('$11,800.50');

    // 10. Save the report definition (Serialization)
    const serializedJson = JSON.stringify(newReport);

    // 11. Reload the report (Deserialization)
    const reloadedReport = JSON.parse(serializedJson);

    // 12. Confirm design is preserved
    const reloadedEngine = new OpenReportEngine(reloadedReport);
    const reloadedDoc = await reloadedEngine.renderDocument();
    expect(reloadedDoc.pageCount).toBe(1);
    expect(reloadedDoc.title).toBe('Customer Statement of Account');

    // 13. Export a PDF
    const pdfBuffer = await reloadedEngine.exportPdf();
    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(String.fromCharCode(...pdfBuffer.subarray(0, 5))).toBe('%PDF-');

    // 14. Export a CSV
    const csvContent = await reloadedEngine.exportCsv();
    expect(csvContent).toBeDefined();
    expect(csvContent).toContain('Statement of Account');
    expect(csvContent).toContain('Enterprise License Renewal');
    expect(csvContent).toContain('"$12,500.50"');

    // 15. Export an XLSX
    const xlsxBuffer = await reloadedEngine.exportXlsx();
    expect(xlsxBuffer).toBeDefined();
    expect(xlsxBuffer.length).toBeGreaterThan(1000);
    // ZIP magic bytes PK
    expect(xlsxBuffer[0]).toBe(0x50);
    expect(xlsxBuffer[1]).toBe(0x4b);

    // 18. Demonstrate error handling for an invalid field or data source
    const invalidReport = JSON.parse(JSON.stringify(newReport));
    invalidReport.datasets[0].dataSourceId = 'non_existent_source_999';

    const valResult = validateReportDefinition(invalidReport);
    expect(valResult.valid).toBe(false);
    expect(valResult.diagnostics.some((d) => d.code === 'MISSING_DATA_SOURCE')).toBe(true);
    expect(valResult.diagnostics[0]?.message).toContain('non_existent_source_999');
  });
});
