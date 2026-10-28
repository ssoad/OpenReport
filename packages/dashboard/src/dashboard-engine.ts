import { DashboardDefinition, DashboardWidget, WidgetRenderState, KpiWidgetConfig, ChartWidgetConfig, TableWidgetConfig } from './types';
import { DataManager, ProcessedDataset, QueryEngine } from '@openreport/data-engine';
import { Evaluator, formatCurrency, formatNumber, formatPercent } from '@openreport/expressions';
import { CrossFilterEngine } from './cross-filter';

export class DashboardEngine {
  private definition: DashboardDefinition;
  private dataManager: DataManager;
  private crossFilter: CrossFilterEngine;
  private rawDatasets: Map<string, ProcessedDataset> = new Map();

  constructor(definition: DashboardDefinition, dataManager?: DataManager) {
    this.definition = definition;
    this.dataManager = dataManager || new DataManager();
    this.crossFilter = new CrossFilterEngine();
  }

  public getCrossFilter(): CrossFilterEngine {
    return this.crossFilter;
  }

  public async initialize(): Promise<void> {
    const fakeReport: any = {
      schemaVersion: '1.0.0',
      id: this.definition.id,
      title: this.definition.title,
      dataSources: this.definition.dataSources,
      datasets: this.definition.datasets,
      parameters: [],
      bands: { detail: { id: 'd', type: 'detail', height: 10, elements: [] } }
    };

    this.rawDatasets = await this.dataManager.loadDatasets(fakeReport);
  }

  public computeWidgetStates(): WidgetRenderState[] {
    const states: WidgetRenderState[] = [];

    for (const widget of this.definition.widgets) {
      const dataset = this.rawDatasets.get(widget.datasetId);
      const rows = dataset ? dataset.rows : [];

      // Apply ambient cross-filters
      const filteredRows = this.crossFilter.filterRows(rows);

      let widgetData: any = null;

      try {
        if (widget.type === 'kpi') {
          widgetData = this.computeKpiData(widget, filteredRows);
        } else if (['barChart', 'lineChart', 'areaChart', 'donutChart'].includes(widget.type)) {
          widgetData = this.computeChartData(widget, filteredRows);
        } else if (widget.type === 'table') {
          widgetData = this.computeTableData(widget, filteredRows);
        }
      } catch (err: any) {
        states.push({
          widgetId: widget.id,
          title: widget.title,
          type: widget.type,
          grid: widget.grid,
          data: null,
          loading: false,
          error: err.message
        });
        continue;
      }

      states.push({
        widgetId: widget.id,
        title: widget.title,
        type: widget.type,
        grid: widget.grid,
        data: widgetData,
        loading: false
      });
    }

    return states;
  }

  private computeKpiData(widget: DashboardWidget, rows: Record<string, any>[]): any {
    const cfg = widget.config as KpiWidgetConfig;
    let numericValue = 0;

    if (cfg.expression) {
      try {
        const val = Evaluator.evaluateExpression(cfg.expression, { rows });
        numericValue = Number(val) || 0;
      } catch {
        numericValue = 0;
      }
    } else if (cfg.valueField) {
      const vals = rows.map((r) => Number(r[cfg.valueField!])).filter((n) => !isNaN(n));
      const agg = cfg.aggregation || 'sum';
      if (agg === 'sum') numericValue = vals.reduce((a, b) => a + b, 0);
      else if (agg === 'avg') numericValue = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      else if (agg === 'count') numericValue = rows.length;
      else if (agg === 'min') numericValue = Math.min(...vals);
      else if (agg === 'max') numericValue = Math.max(...vals);
    } else {
      numericValue = rows.length;
    }

    let formattedValue = String(numericValue);
    if (cfg.format === 'currency') {
      formattedValue = formatCurrency(numericValue, cfg.currencyCode || 'USD', 0);
    } else if (cfg.format === 'percent') {
      formattedValue = formatPercent(numericValue, 1);
    } else if (cfg.format === 'number') {
      formattedValue = formatNumber(numericValue, '#,##0', 0);
    }

    return {
      value: formattedValue,
      rawValue: numericValue,
      subtitle: widget.subtitle,
      change: cfg.change,
      trend: cfg.trend || 'neutral',
      accentColor: cfg.accentColor || '#2563eb'
    };
  }

  private computeChartData(widget: DashboardWidget, rows: Record<string, any>[]): any {
    const cfg = widget.config as ChartWidgetConfig;
    const catMap = new Map<string, number>();

    for (const r of rows) {
      const cat = String(r[cfg.categoryField] ?? 'Other');
      const val = Number(r[cfg.valueField]) || 0;
      catMap.set(cat, (catMap.get(cat) || 0) + val);
    }

    const categories = Array.from(catMap.keys());
    const data = Array.from(catMap.values());

    return {
      categories,
      series: [
        {
          name: cfg.valueField,
          data
        }
      ],
      colors: cfg.colors || ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
      showLegend: cfg.showLegend !== false
    };
  }

  private computeTableData(widget: DashboardWidget, rows: Record<string, any>[]): any {
    const cfg = widget.config as TableWidgetConfig;
    const columns = cfg.columns || [];
    return {
      columns,
      rows: rows.slice(0, cfg.pageSize || 50)
    };
  }
}
