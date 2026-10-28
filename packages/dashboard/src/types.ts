import { DataSourceDefinition, DatasetDefinition } from '@openreport/schema';

export type WidgetType =
  | 'kpi'
  | 'barChart'
  | 'lineChart'
  | 'areaChart'
  | 'donutChart'
  | 'table'
  | 'filter';

export interface GridPosition {
  col: number;      // 1 to 12
  row: number;      // 1-based row
  colSpan: number;  // 1 to 12
  rowSpan: number;  // rows high
}

export interface BaseWidgetConfig {
  [key: string]: any;
}

export interface KpiWidgetConfig extends BaseWidgetConfig {
  valueField?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  expression?: string;
  format?: 'currency' | 'percent' | 'number';
  currencyCode?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string;
}

export interface ChartWidgetConfig extends BaseWidgetConfig {
  categoryField: string;
  valueField: string;
  aggregation?: 'sum' | 'avg' | 'count';
  colors?: string[];
  showLegend?: boolean;
}

export interface TableWidgetConfig extends BaseWidgetConfig {
  columns: {
    field: string;
    title: string;
    format?: string;
    align?: 'left' | 'center' | 'right';
  }[];
  pageSize?: number;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  grid: GridPosition;
  datasetId: string;
  config: KpiWidgetConfig | ChartWidgetConfig | TableWidgetConfig | BaseWidgetConfig;
}

export interface DashboardDefinition {
  id: string;
  title: string;
  description?: string;
  dataSources: DataSourceDefinition[];
  datasets: DatasetDefinition[];
  widgets: DashboardWidget[];
  globalFilters?: Record<string, any>;
}

export interface WidgetRenderState {
  widgetId: string;
  title: string;
  type: WidgetType;
  grid: GridPosition;
  data: any;
  loading: boolean;
  error?: string;
}
