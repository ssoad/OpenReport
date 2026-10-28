import { describe, it, expect } from 'vitest';
import {
  OpenReportEngine,
  PluginRegistry,
  CommercialInvoiceTemplate,
  ExecutiveSalesReportTemplate,
  InventoryStatusTemplate
} from '../index';

describe('OpenReport Core Unified Engine Facade', () => {
  it('instantiates engine and renders Commercial Invoice with parameter bindings', async () => {
    const engine = new OpenReportEngine(CommercialInvoiceTemplate, {
      parameters: {
        invoiceNumber: 'INV-TEST-4421'
      }
    });

    const doc = await engine.renderDocument();

    expect(doc).toBeDefined();
    expect(doc.pageCount).toBe(1);

    // Verify parameter was resolved in header
    const invNumberBox = doc.pages[0]?.boxes.find((b) => b.id === 'inv-number');
    expect(invNumberBox).toBeDefined();
    expect(invNumberBox?.text).toBe('Invoice #: INV-TEST-4421');

    // Verify table items were rendered
    const itemBox = doc.pages[0]?.boxes.find((b) => b.id === 'items-table_r0_cc1');
    expect(itemBox).toBeDefined();
    expect(itemBox?.text).toBe('SRV-01');
  });

  it('exports documents directly across all formats via unified facade', async () => {
    const engine = new OpenReportEngine(ExecutiveSalesReportTemplate);

    await engine.loadData();
    const doc = await engine.renderDocument();
    expect(doc.pageCount).toBeGreaterThan(0);

    // PDF
    const pdf = await engine.exportPdf();
    expect(pdf.length).toBeGreaterThan(500);

    // CSV
    const csv = await engine.exportCsv();
    expect(csv).toContain('Territory');
    expect(csv).toContain('North America');

    // XLSX
    const xlsx = await engine.exportXlsx();
    expect(xlsx.length).toBeGreaterThan(1000);

    // HTML
    const html = await engine.exportHtml();
    expect(html).toContain('Executive Sales &amp; Revenue Report');

    // SVG
    const svg = await engine.exportSvg(0);
    expect(svg).toContain('<svg');
  });

  it('supports runtime data overrides without modifying template', async () => {
    const engine = new OpenReportEngine(InventoryStatusTemplate);

    const overrideRows = [
      { sku: 'TEST-SKU-99', product: 'Overridden Product Item', warehouse: 'Test Site', inStock: 50, reorderLevel: 20, unitCost: 10.00 }
    ];

    const doc = await engine.renderDocument({
      inventorySource: overrideRows
    });

    const skuBox = doc.pages[0]?.boxes.find((b) => b.id === 'stock-table_r0_cc1');
    expect(skuBox).toBeDefined();
    expect(skuBox?.text).toBe('TEST-SKU-99');
  });

  it('registers and retrieves plugins via PluginRegistry', () => {
    const registry = PluginRegistry.getInstance();

    registry.registerPlugin({
      id: 'test-plugin',
      name: 'Custom Visualizer Plugin',
      version: '1.0.0',
      components: [
        {
          type: 'custom.radar',
          displayName: 'Radar Chart',
          category: 'Visualization',
          defaultProps: { radius: 100 }
        }
      ]
    });

    const comp = registry.getComponent('custom.radar');
    expect(comp).toBeDefined();
    expect(comp?.displayName).toBe('Radar Chart');
    expect(comp?.category).toBe('Visualization');
  });
});
