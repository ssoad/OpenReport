import { describe, it, expect } from 'vitest';
import { parseCsv, MemoryDataProvider, CsvDataProvider, QueryEngine, DataManager } from '../index';
import { ReportDefinition } from '@openreport/schema';

describe('OpenReport Data Engine & Providers', () => {
  it('correctly parses RFC-4180 compliant CSV strings with quotes and commas', () => {
    const csvContent = `id,name,description,price,inStock
1,"Widget, Premium","High quality, durable",49.99,true
2,"Standard Gadget","Basic model, 100% ""guaranteed""",19.50,false
3,"Simple Item",Regular,5.00,true`;

    const { rows, fields } = parseCsv(csvContent);

    expect(rows.length).toBe(3);
    expect(rows[0]!['name']).toBe('Widget, Premium');
    expect(rows[0]!['price']).toBe(49.99);
    expect(rows[0]!['inStock']).toBe(true);

    expect(rows[1]!['description']).toBe('Basic model, 100% "guaranteed"');
    expect(rows[1]!['inStock']).toBe(false);

    expect(fields.find((f) => f.name === 'price')?.type).toBe('number');
  });

  it('transforms datasets with calculated fields, filters, and multi-column sorting', () => {
    const rawData = [
      { orderId: 101, customer: 'Alpha Corp', price: 100, qty: 2, status: 'PAID' },
      { orderId: 102, customer: 'Beta LLC', price: 50, qty: 3, status: 'PENDING' },
      { orderId: 103, customer: 'Gamma Inc', price: 200, qty: 5, status: 'PAID' },
      { orderId: 104, customer: 'Delta Co', price: 80, qty: 1, status: 'PAID' }
    ];

    const datasetDef = {
      id: 'paidOrders',
      dataSourceId: 'ordersSource',
      filter: '[status] == "PAID" AND [total] >= 100',
      calculatedFields: [
        { name: 'total', expression: '=[price] * [qty]' }
      ],
      sortBy: [
        { field: 'total', direction: 'desc' as const, nullsFirst: false }
      ]
    };

    const processed = QueryEngine.processDataset(datasetDef, rawData);

    expect(processed.rows.length).toBe(2); // 103 (total: 1000) and 101 (total: 200). 104 has total 80 < 100, 102 is PENDING.
    expect(processed.rows[0]!['orderId']).toBe(103);
    expect(processed.rows[0]!['total']).toBe(1000);
    expect(processed.rows[1]!['orderId']).toBe(101);
    expect(processed.rows[1]!['total']).toBe(200);
  });

  it('groups dataset rows hierarchically and computes group summaries', () => {
    const rawSales = [
      { region: 'North', category: 'Hardware', revenue: 1200 },
      { region: 'North', category: 'Software', revenue: 800 },
      { region: 'South', category: 'Hardware', revenue: 1500 },
      { region: 'South', category: 'Hardware', revenue: 500 }
    ];

    const datasetDef = {
      id: 'salesByRegion',
      dataSourceId: 'salesSource',
      groupBy: ['region']
    };

    const processed = QueryEngine.processDataset(datasetDef, rawSales);

    expect(processed.groups).toBeDefined();
    expect(processed.groups?.length).toBe(2); // North and South

    const north = processed.groups?.find((g) => g.key === 'North');
    expect(north).toBeDefined();
    expect(north?.rows.length).toBe(2);
    expect(north?.summaries?.['revenue_sum']).toBe(2000);

    const south = processed.groups?.find((g) => g.key === 'South');
    expect(south?.summaries?.['revenue_sum']).toBe(2000);
  });

  it('coordinates dataset loading via DataManager', async () => {
    const dataManager = new DataManager();

    const sampleReport: ReportDefinition = {
      schemaVersion: '1.0.0',
      id: 'test-rep',
      title: 'Test Report',
      page: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 36, right: 36, bottom: 36, left: 36 },
        unit: 'pt'
      },
      parameters: [],
      metadata: { version: '1.0.0', tags: [] },
      dataSources: [
        {
          id: 'mem1',
          provider: 'memory',
          data: [
            { item: 'Pen', price: 1.5, qty: 10 },
            { item: 'Notebook', price: 4.0, qty: 5 }
          ]
        }
      ],
      datasets: [
        {
          id: 'ds1',
          dataSourceId: 'mem1',
          calculatedFields: [
            { name: 'lineTotal', expression: '=[price] * [qty]' }
          ]
        }
      ],
      bands: {
        groupHeaders: [],
        groupFooters: [],
        detail: {
          id: 'det',
          type: 'detail',
          height: 50,
          canGrow: true,
          canShrink: false,
          keepTogether: false,
          elements: []
        }
      }
    };

    const datasets = await dataManager.loadDatasets(sampleReport);
    expect(datasets.has('ds1')).toBe(true);

    const ds1 = datasets.get('ds1')!;
    expect(ds1.rows.length).toBe(2);
    expect(ds1.rows[0]!['lineTotal']).toBe(15);
    expect(ds1.rows[1]!['lineTotal']).toBe(20);
  });
});
