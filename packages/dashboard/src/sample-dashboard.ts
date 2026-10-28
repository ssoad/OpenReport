import { DashboardDefinition } from './types';

export const SalesAnalyticsDashboardDefinition: DashboardDefinition = {
  id: 'sales-bi-dashboard',
  title: 'Executive Sales & Revenue Performance Dashboard',
  description: 'Interactive business intelligence dashboard with real-time cross-filtering across regions and categories.',
  dataSources: [
    {
      id: 'salesBiSource',
      provider: 'memory',
      data: [
        { id: 1, region: 'North America', category: 'Enterprise SaaS', rep: 'Alice Chen', month: '2026-01', revenue: 145000, margin: 0.82 },
        { id: 2, region: 'North America', category: 'Cloud Infrastructure', rep: 'Bob Martin', month: '2026-01', revenue: 98000, margin: 0.74 },
        { id: 3, region: 'EMEA', category: 'Enterprise SaaS', rep: 'Claire Dubois', month: '2026-01', revenue: 120000, margin: 0.85 },
        { id: 4, region: 'EMEA', category: 'Partner Licensing', rep: 'David Mueller', month: '2026-02', revenue: 65000, margin: 0.90 },
        { id: 5, region: 'APAC', category: 'Enterprise SaaS', rep: 'Emily Zhang', month: '2026-02', revenue: 110000, margin: 0.80 },
        { id: 6, region: 'APAC', category: 'Cloud Infrastructure', rep: 'Frank Tanaka', month: '2026-02', revenue: 85000, margin: 0.76 },
        { id: 7, region: 'Latin America', category: 'Enterprise SaaS', rep: 'Gabriel Silva', month: '2026-03', revenue: 55000, margin: 0.81 },
        { id: 8, region: 'North America', category: 'Partner Licensing', rep: 'Alice Chen', month: '2026-03', revenue: 92000, margin: 0.88 },
        { id: 9, region: 'EMEA', category: 'Cloud Infrastructure', rep: 'Claire Dubois', month: '2026-03', revenue: 135000, margin: 0.78 }
      ]
    }
  ],
  datasets: [
    {
      id: 'biSalesDataset',
      dataSourceId: 'salesBiSource'
    }
  ],
  widgets: [
    // Row 1: KPI Cards
    {
      id: 'kpi-total-revenue',
      type: 'kpi',
      title: 'Total Revenue',
      subtitle: 'All active territories',
      datasetId: 'biSalesDataset',
      grid: { col: 1, row: 1, colSpan: 4, rowSpan: 1 },
      config: {
        valueField: 'revenue',
        aggregation: 'sum',
        format: 'currency',
        currencyCode: 'USD',
        change: '+18.2% vs target',
        trend: 'up',
        accentColor: '#2563eb'
      }
    },
    {
      id: 'kpi-deal-count',
      type: 'kpi',
      title: 'Total Transactions',
      subtitle: 'Volume closed',
      datasetId: 'biSalesDataset',
      grid: { col: 5, row: 1, colSpan: 4, rowSpan: 1 },
      config: {
        valueField: 'id',
        aggregation: 'count',
        format: 'number',
        change: '9 Major Accounts',
        trend: 'neutral',
        accentColor: '#10b981'
      }
    },
    {
      id: 'kpi-avg-deal',
      type: 'kpi',
      title: 'Average Deal Size',
      subtitle: 'Contract value',
      datasetId: 'biSalesDataset',
      grid: { col: 9, row: 1, colSpan: 4, rowSpan: 1 },
      config: {
        valueField: 'revenue',
        aggregation: 'avg',
        format: 'currency',
        currencyCode: 'USD',
        change: '+5.4% expansion',
        trend: 'up',
        accentColor: '#8b5cf6'
      }
    },
    // Row 2: Charts
    {
      id: 'chart-region',
      type: 'barChart',
      title: 'Revenue by Region (Click bar to cross-filter)',
      datasetId: 'biSalesDataset',
      grid: { col: 1, row: 2, colSpan: 6, rowSpan: 2 },
      config: {
        categoryField: 'region',
        valueField: 'revenue',
        aggregation: 'sum',
        colors: ['#2563eb', '#10b981', '#f59e0b', '#ec4899']
      }
    },
    {
      id: 'chart-category',
      type: 'donutChart',
      title: 'Revenue Share by Solution Category',
      datasetId: 'biSalesDataset',
      grid: { col: 7, row: 2, colSpan: 6, rowSpan: 2 },
      config: {
        categoryField: 'category',
        valueField: 'revenue',
        aggregation: 'sum',
        colors: ['#3b82f6', '#10b981', '#f97316']
      }
    },
    // Row 3: Tabular Breakdown
    {
      id: 'table-details',
      type: 'table',
      title: 'Detailed Transactions',
      datasetId: 'biSalesDataset',
      grid: { col: 1, row: 4, colSpan: 12, rowSpan: 2 },
      config: {
        columns: [
          { field: 'id', title: 'Deal #', align: 'left' },
          { field: 'region', title: 'Territory', align: 'left' },
          { field: 'category', title: 'Category', align: 'left' },
          { field: 'rep', title: 'Account Exec', align: 'left' },
          { field: 'revenue', title: 'Contract Value ($)', align: 'right', format: 'currency' }
        ],
        pageSize: 10
      }
    }
  ]
};
