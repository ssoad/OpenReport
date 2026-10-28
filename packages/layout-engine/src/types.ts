import {
  Borders,
  FontStyle,
  Margins,
  Padding,
  PageOrientation,
  PageSize
} from '@openreport/schema';

export type BoxType = 'text' | 'rect' | 'line' | 'image' | 'barcode' | 'chart' | 'kpi';

export interface ChartDataPayload {
  chartType: 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut';
  title?: string;
  categories: string[];
  series: {
    name: string;
    data: number[];
  }[];
  colors: string[];
  showLegend: boolean;
}

export interface KpiDataPayload {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  trend: 'up' | 'down' | 'neutral';
  accentColor: string;
}

export interface RenderedBox {
  id: string;
  type: BoxType;
  x: number; // pt, relative to page printable top-left or page bounds
  y: number; // pt
  width: number; // pt
  height: number; // pt
  text?: string;
  font?: FontStyle;
  backgroundColor?: string;
  borders?: Borders;
  padding?: Padding;
  url?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  chartData?: ChartDataPayload;
  kpiData?: KpiDataPayload;
  originalExpression?: string; // stored for two-pass resolution
  evalContext?: {
    fields?: Record<string, any>;
    parameters?: Record<string, any>;
  };
}

export interface RenderedPage {
  pageNumber: number;
  width: number;
  height: number;
  printableWidth: number;
  printableHeight: number;
  margins: Margins;
  boxes: RenderedBox[];
}

export interface RenderedDocument {
  id: string;
  title: string;
  pageCount: number;
  pageSize: PageSize;
  orientation: PageOrientation;
  pages: RenderedPage[];
  generatedAt: string;
}
