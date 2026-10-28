import { ReportDefinition } from '@openreport/schema';

export const CommercialInvoiceTemplate: ReportDefinition = {
  schemaVersion: '1.0.0',
  id: 'template-commercial-invoice',
  title: 'Commercial Tax Invoice',
  description: 'Standard enterprise billing statement with line item breakdown, taxes, and payment terms.',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 36, right: 36, bottom: 36, left: 36 },
    unit: 'pt'
  },
  parameters: [
    {
      name: 'invoiceNumber',
      type: 'string',
      label: 'Invoice #',
      defaultValue: 'INV-2026-0891',
      required: true,
      visible: true
    },
    {
      name: 'invoiceDate',
      type: 'date',
      label: 'Invoice Date',
      defaultValue: '2026-10-28',
      required: true,
      visible: true
    },
    {
      name: 'dueDate',
      type: 'date',
      label: 'Due Date',
      defaultValue: '2026-11-28',
      required: true,
      visible: true
    }
  ],
  dataSources: [
    {
      id: 'invoiceSource',
      provider: 'memory',
      data: [
        { itemCode: 'SRV-01', description: 'Enterprise Cloud Platform Subscription (Annual)', quantity: 1, unitPrice: 12000.00, discount: 0.10 },
        { itemCode: 'CON-04', description: 'Implementation & Custom Data Integration Consulting', quantity: 24, unitPrice: 175.00, discount: 0.00 },
        { itemCode: 'SUP-02', description: '24/7 Dedicated SLA Mission Critical Support Tier', quantity: 12, unitPrice: 450.00, discount: 0.05 },
        { itemCode: 'TRN-01', description: 'Technical Architecture & Team Training Workshop', quantity: 2, unitPrice: 1500.00, discount: 0.00 }
      ]
    }
  ],
  datasets: [
    {
      id: 'invoiceItems',
      dataSourceId: 'invoiceSource',
      calculatedFields: [
        { name: 'lineTotal', expression: '=[quantity] * [unitPrice] * (1 - [discount])' }
      ]
    }
  ],
  bands: {
    reportHeader: {
      id: 'inv-header',
      type: 'reportHeader',
      height: 140,
      canGrow: false,
      canShrink: false,
      keepTogether: true,
      elements: [
        // Company Name / Logo text
        {
          id: 'company-name',
          type: 'text',
          x: 0,
          y: 0,
          width: 250,
          height: 24,
          text: 'ACME TECHNOLOGIES INC.',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 14, weight: 'bold', italic: false, color: '#1e293b', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        {
          id: 'company-address',
          type: 'text',
          x: 0,
          y: 26,
          width: 250,
          height: 45,
          text: '100 Innovation Way, Suite 400\nSan Francisco, CA 94107\nsupport@acme.io',
          locked: false,
          wrapText: true,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#64748b', align: 'left', verticalAlign: 'top', lineHeight: 1.3 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        // Invoice Title & Meta right-aligned
        {
          id: 'invoice-title',
          type: 'text',
          x: 320,
          y: 0,
          width: 200,
          height: 24,
          text: 'INVOICE',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 20, weight: 'bold', italic: false, color: '#2563eb', align: 'right', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        {
          id: 'inv-number',
          type: 'text',
          x: 320,
          y: 28,
          width: 200,
          height: 16,
          text: '="Invoice #: " + ?invoiceNumber',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 10, weight: 'bold', italic: false, color: '#1e293b', align: 'right', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        {
          id: 'inv-date',
          type: 'text',
          x: 320,
          y: 46,
          width: 200,
          height: 16,
          text: '="Date: " + ?invoiceDate',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#64748b', align: 'right', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        {
          id: 'inv-due',
          type: 'text',
          x: 320,
          y: 62,
          width: 200,
          height: 16,
          text: '="Due Date: " + ?dueDate',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#64748b', align: 'right', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        // Bill To Box
        {
          id: 'bill-to-lbl',
          type: 'text',
          x: 0,
          y: 85,
          width: 250,
          height: 16,
          text: 'BILL TO:',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 9, weight: 'bold', italic: false, color: '#94a3b8', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        {
          id: 'bill-to-content',
          type: 'text',
          x: 0,
          y: 101,
          width: 250,
          height: 35,
          text: 'Globex Corporation\nAttn: Accounts Payable\n742 Evergreen Terrace, Springfield',
          locked: false,
          wrapText: true,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#1e293b', align: 'left', verticalAlign: 'top', lineHeight: 1.3 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      ]
    },
    pageFooter: {
      id: 'inv-footer',
      type: 'pageFooter',
      height: 40,
      canGrow: false,
      canShrink: false,
      keepTogether: true,
      elements: [
        {
          id: 'footer-notes',
          type: 'text',
          x: 0,
          y: 10,
          width: 300,
          height: 20,
          text: 'Thank you for your business. Payment due within 30 days.',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 8, weight: 'normal', italic: true, color: '#94a3b8', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        {
          id: 'footer-page',
          type: 'text',
          x: 370,
          y: 10,
          width: 150,
          height: 20,
          text: '="Page " + PageNumber + " of " + TotalPages',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 8, weight: 'normal', italic: false, color: '#94a3b8', align: 'right', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      ]
    },
    groupHeaders: [],
    groupFooters: [],
    detail: {
      id: 'inv-detail',
      type: 'detail',
      height: 200,
      canGrow: true,
      canShrink: false,
      keepTogether: false,
      elements: [
        {
          id: 'items-table',
          type: 'table',
          datasetId: 'invoiceItems',
          x: 0,
          y: 10,
          width: 523,
          height: 120,
          showHeader: true,
          showSummary: true,
          alternatingRowColors: true,
          headerHeight: 24,
          rowHeight: 22,
          summaryHeight: 26,
          headerFont: { family: 'Helvetica', size: 9, weight: 'bold', italic: false, color: '#334155', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
          rowFont: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
          summaryFont: { family: 'Helvetica', size: 9, weight: 'bold', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
          headerBackgroundColor: '#f1f5f9',
          alternatingBackgroundColor: '#f8fafc',
          summaryBackgroundColor: '#e2e8f0',
          cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
          locked: false,
          columns: [
            { id: 'c1', field: 'itemCode', title: 'Code', width: 70, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
            { id: 'c2', field: 'description', title: 'Description', width: 233, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
            { id: 'c3', field: 'quantity', title: 'Qty', width: 45, align: 'right', headerAlign: 'right', visible: true, summary: 'sum' },
            { id: 'c4', field: 'unitPrice', title: 'Unit Price', width: 85, align: 'right', headerAlign: 'right', visible: true, format: { type: 'currency', currencyCode: 'USD', decimals: 2 }, summary: 'none' },
            { id: 'c5', field: 'lineTotal', title: 'Total', width: 90, align: 'right', headerAlign: 'right', visible: true, format: { type: 'currency', currencyCode: 'USD', decimals: 2 }, summary: 'sum' }
          ]
        }
      ]
    }
  },
  metadata: {
    author: 'OpenReport Studio',
    createdAt: '2026-10-28T00:00:00Z',
    tags: ['invoice', 'finance', 'billing'],
    version: '1.0.0'
  }
};
