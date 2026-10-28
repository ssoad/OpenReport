import { ReportDefinition } from '@openreport/schema';

export const InventoryStatusTemplate: ReportDefinition = {
  schemaVersion: '1.0.0',
  id: 'template-inventory-status',
  title: 'Warehouse Inventory & Stock Status',
  description: 'Physical inventory audit report with stock quantities, unit valuation, and reorder alerts.',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 36, right: 36, bottom: 36, left: 36 },
    unit: 'pt'
  },
  parameters: [],
  dataSources: [
    {
      id: 'inventorySource',
      provider: 'memory',
      data: [
        { sku: 'WID-001', product: 'Precision Sensor Module v2', warehouse: 'Austin Hub (WH-A)', inStock: 450, reorderLevel: 200, unitCost: 45.00 },
        { sku: 'WID-002', product: 'Optical Transceiver 100G', warehouse: 'Seattle Main (WH-S)', inStock: 85, reorderLevel: 100, unitCost: 120.00 },
        { sku: 'WID-003', product: 'Solid State Drive 4TB NVMe', warehouse: 'Austin Hub (WH-A)', inStock: 320, reorderLevel: 150, unitCost: 280.00 },
        { sku: 'WID-004', product: 'High Efficiency Heat Sink', warehouse: 'Frankfurt Hub (WH-F)', inStock: 1200, reorderLevel: 500, unitCost: 14.50 },
        { sku: 'WID-005', product: 'Microcontroller Dev Board', warehouse: 'Tokyo Facility (WH-T)', inStock: 45, reorderLevel: 80, unitCost: 65.00 },
        { sku: 'WID-006', product: 'Industrial Power Supply 850W', warehouse: 'Seattle Main (WH-S)', inStock: 180, reorderLevel: 120, unitCost: 95.00 }
      ]
    }
  ],
  datasets: [
    {
      id: 'inventoryItems',
      dataSourceId: 'inventorySource',
      calculatedFields: [
        { name: 'totalValuation', expression: '=[inStock] * [unitCost]' },
        { name: 'needsReorder', expression: 'IF([inStock] < [reorderLevel], "REORDER ALERT", "NORMAL")' }
      ],
      sortBy: [{ field: 'totalValuation', direction: 'desc', nullsFirst: false }]
    }
  ],
  bands: {
    reportHeader: {
      id: 'inv-rep-header',
      type: 'reportHeader',
      height: 60,
      canGrow: false,
      canShrink: false,
      keepTogether: true,
      elements: [
        {
          id: 'title-text',
          type: 'text',
          x: 0,
          y: 0,
          width: 350,
          height: 26,
          text: 'Warehouse Inventory & Stock Valuation',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 16, weight: 'bold', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        {
          id: 'sub-text',
          type: 'text',
          x: 0,
          y: 28,
          width: 350,
          height: 18,
          text: 'Multi-facility real-time physical inventory audit',
          locked: false,
          wrapText: false,
          canGrow: false,
          canShrink: false,
          font: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#64748b', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      ]
    },
    pageFooter: {
      id: 'inv-rep-footer',
      type: 'pageFooter',
      height: 30,
      canGrow: false,
      canShrink: false,
      keepTogether: true,
      elements: [
        {
          id: 'page-box',
          type: 'text',
          x: 350,
          y: 8,
          width: 173,
          height: 16,
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
      height: 300,
      canGrow: true,
      canShrink: false,
      keepTogether: false,
      elements: [
        {
          id: 'stock-table',
          type: 'table',
          datasetId: 'inventoryItems',
          x: 0,
          y: 10,
          width: 523,
          height: 200,
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
            { id: 'c1', field: 'sku', title: 'SKU', width: 70, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
            { id: 'c2', field: 'product', title: 'Product Name', width: 163, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
            { id: 'c3', field: 'warehouse', title: 'Warehouse', width: 110, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
            { id: 'c4', field: 'inStock', title: 'Stock', width: 50, align: 'right', headerAlign: 'right', visible: true, summary: 'sum' },
            { id: 'c5', field: 'unitCost', title: 'Unit ($)', width: 60, align: 'right', headerAlign: 'right', visible: true, format: { type: 'currency', currencyCode: 'USD', decimals: 2 }, summary: 'none' },
            { id: 'c6', field: 'totalValuation', title: 'Valuation ($)', width: 70, align: 'right', headerAlign: 'right', visible: true, format: { type: 'currency', currencyCode: 'USD', decimals: 0 }, summary: 'sum' }
          ]
        }
      ]
    }
  },
  metadata: {
    author: 'OpenReport Studio',
    createdAt: '2026-10-28T00:00:00Z',
    tags: ['inventory', 'warehouse', 'stock'],
    version: '1.0.0'
  }
};
