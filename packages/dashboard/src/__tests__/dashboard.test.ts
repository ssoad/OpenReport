import { describe, it, expect } from 'vitest';
import {
  DashboardEngine,
  CrossFilterEngine,
  SalesAnalyticsDashboardDefinition
} from '../index';

describe('OpenReport Business Intelligence & Dashboard Engine', () => {
  it('manages cross-filtering and filters row datasets correctly', () => {
    const cf = new CrossFilterEngine();

    const sampleRows = [
      { id: 1, region: 'North America', category: 'SaaS' },
      { id: 2, region: 'EMEA', category: 'SaaS' },
      { id: 3, region: 'North America', category: 'Hardware' }
    ];

    expect(cf.filterRows(sampleRows).length).toBe(3);

    cf.setFilter('region', 'North America');
    const filtered = cf.filterRows(sampleRows);
    expect(filtered.length).toBe(2);
    expect(filtered.every((r) => r.region === 'North America')).toBe(true);

    // Toggle off
    cf.toggleFilter('region', 'North America');
    expect(cf.filterRows(sampleRows).length).toBe(3);
  });

  it('computes initial dashboard widget states and reacts to cross-filtering', async () => {
    const engine = new DashboardEngine(SalesAnalyticsDashboardDefinition);
    await engine.initialize();

    // 1. Initial State
    const initialWidgets = engine.computeWidgetStates();
    expect(initialWidgets.length).toBe(6);

    const revenueWidget = initialWidgets.find((w) => w.widgetId === 'kpi-total-revenue');
    expect(revenueWidget).toBeDefined();
    // Sum of all 9 items: 145 + 98 + 120 + 65 + 110 + 85 + 55 + 92 + 135 = 905,000
    expect(revenueWidget?.data.rawValue).toBe(905000);

    const transactionsWidget = initialWidgets.find((w) => w.widgetId === 'kpi-deal-count');
    expect(transactionsWidget?.data.rawValue).toBe(9);

    // 2. Cross-Filter to North America only (items 1, 2, 8: 145000 + 98000 + 92000 = 335000)
    engine.getCrossFilter().setFilter('region', 'North America');

    const filteredWidgets = engine.computeWidgetStates();
    const filteredRevenue = filteredWidgets.find((w) => w.widgetId === 'kpi-total-revenue');
    expect(filteredRevenue?.data.rawValue).toBe(335000);

    const filteredTx = filteredWidgets.find((w) => w.widgetId === 'kpi-deal-count');
    expect(filteredTx?.data.rawValue).toBe(3);

    const filteredTable = filteredWidgets.find((w) => w.widgetId === 'table-details');
    expect(filteredTable?.data.rows.length).toBe(3);
  });
});
