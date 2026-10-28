import React, { useState, useEffect } from 'react';
import {
  DashboardEngine,
  WidgetRenderState,
  SalesAnalyticsDashboardDefinition
} from '@openreport/dashboard';
import {
  Filter,
  X,
  TrendingUp,
  BarChart3,
  RefreshCw
} from 'lucide-react';

export const DashboardViewer: React.FC = () => {
  const [engine, setEngine] = useState<DashboardEngine | null>(null);
  const [widgets, setWidgets] = useState<WidgetRenderState[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const eng = new DashboardEngine(SalesAnalyticsDashboardDefinition);
    eng.initialize().then(() => {
      setEngine(eng);
      setWidgets(eng.computeWidgetStates());
      setLoading(false);

      // Subscribe to cross-filter updates
      eng.getCrossFilter().subscribe((filters) => {
        setActiveFilters(filters);
        setWidgets(eng.computeWidgetStates());
      });
    });
  }, []);

  const handleBarClick = (category: string) => {
    if (!engine) return;
    engine.getCrossFilter().toggleFilter('region', category);
  };

  const handleClearFilter = (field: string) => {
    if (!engine) return;
    engine.getCrossFilter().setFilter(field, null);
  };

  if (loading || !engine) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-primary-600 dark:text-primary-400" />
          <span>Loading BI Dashboard Engine...</span>
        </div>
      </div>
    );
  }

  const activeFilterKeys = Object.keys(activeFilters);

  // Helper to compute responsive Tailwind grid column classes
  const getWidgetGridClass = (widget: WidgetRenderState): string => {
    if (widget.type === 'kpi') {
      return 'col-span-12 sm:col-span-6 lg:col-span-3';
    }
    if (widget.type === 'barChart') {
      return 'col-span-12 lg:col-span-7';
    }
    if (widget.type === 'donutChart') {
      return 'col-span-12 lg:col-span-5';
    }
    if (widget.type === 'table') {
      return 'col-span-12';
    }
    return `col-span-12 lg:col-span-${widget.grid.colSpan}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-3 sm:p-6 transition-colors">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
        {/* Dashboard Title & Active Cross-Filters Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
              <span>{SalesAnalyticsDashboardDefinition.title}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {SalesAnalyticsDashboardDefinition.description}
            </p>
          </div>

          {/* Active Filter Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeFilterKeys.length > 0 ? (
              <>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                  Filtered by:
                </span>
                {activeFilterKeys.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-950/60 text-primary-800 dark:text-primary-300 border border-primary-300 dark:border-primary-800"
                  >
                    <span>{key}: {activeFilters[key]}</span>
                    <button
                      onClick={() => handleClearFilter(key)}
                      className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 text-primary-600 dark:text-primary-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => engine.getCrossFilter().clearFilters()}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline ml-1"
                >
                  Clear all
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                Tip: Click any bar in the territory chart to cross-filter the dashboard.
              </span>
            )}
          </div>
        </div>

        {/* 12-Column Responsive Dashboard Grid */}
        <div className="grid grid-cols-12 gap-3 sm:gap-5">
          {widgets.map((widget) => {
            const gridClass = getWidgetGridClass(widget);

            return (
              <div
                key={widget.widgetId}
                className={`${gridClass} bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col justify-between`}
              >
                {/* KPI Widget */}
                {widget.type === 'kpi' && widget.data && (
                  <div className="flex flex-col justify-between h-full space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{widget.title}</span>
                      <span
                        style={{ backgroundColor: `${widget.data.accentColor}20`, color: widget.data.accentColor }}
                        className="p-1 rounded text-[10px] font-bold"
                      >
                        KPI
                      </span>
                    </div>

                    <div className="my-1">
                      <span
                        style={{ color: widget.data.accentColor }}
                        className="text-xl sm:text-2xl font-black tracking-tight"
                      >
                        {widget.data.value}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate">{widget.data.subtitle}</span>
                      <span
                        className={`font-semibold text-[11px] flex items-center gap-0.5 shrink-0 ${
                          widget.data.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {widget.data.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                        {widget.data.change}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bar / Column Chart Widget */}
                {widget.type === 'barChart' && widget.data && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{widget.title}</span>
                      <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded border border-primary-200 dark:border-primary-800">
                        Interactive Filter
                      </span>
                    </div>

                    <div className="overflow-x-auto pb-1">
                      <div className="flex items-end justify-around gap-2 pt-4 pb-2 border-b border-slate-200 dark:border-slate-800 min-h-[160px] min-w-[280px]">
                        {widget.data.categories.map((cat: string, idx: number) => {
                          const val = widget.data.series[0]?.data[idx] || 0;
                          const max = Math.max(1, ...(widget.data.series[0]?.data || [1]));
                          const heightPct = Math.round((val / max) * 90);
                          const isFiltered = activeFilters['region'] === cat;

                          return (
                            <div
                              key={cat}
                              onClick={() => handleBarClick(cat)}
                              className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                            >
                              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                ${(val / 1000).toFixed(0)}k
                              </span>
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full max-w-[38px] rounded-t transition-all ${
                                  isFiltered
                                    ? 'bg-primary-600 ring-2 ring-primary-400 ring-offset-2 dark:ring-offset-slate-900'
                                    : 'bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500'
                                }`}
                              />
                              <span
                                className={`text-[10px] mt-2 truncate w-full text-center transition ${
                                  isFiltered ? 'font-bold text-primary-700 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'
                                }`}
                              >
                                {cat}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Donut Chart Widget */}
                {widget.type === 'donutChart' && widget.data && (
                  <div className="flex flex-col h-full">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3">{widget.title}</span>
                    <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-3">
                      {/* CSS / SVG Donut representation */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-8 border-primary-500 border-t-emerald-500 border-r-amber-500 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Share</span>
                      </div>
                      <div className="space-y-1.5 text-xs w-full sm:w-auto">
                        {widget.data.categories.map((cat: string, i: number) => (
                          <div key={cat} className="flex items-center justify-between sm:justify-start gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                style={{ backgroundColor: widget.data.colors[i % widget.data.colors.length] }}
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                              />
                              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[120px] sm:max-w-[140px]">{cat}</span>
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 ml-auto text-right">
                              ${((widget.data.series[0]?.data[i] || 0) / 1000).toFixed(0)}k
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabular Details Widget */}
                {widget.type === 'table' && widget.data && (
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{widget.title}</span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {widget.data.rows.length} records
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            {widget.data.columns.map((col: any) => (
                              <th key={col.field} className="px-3 py-2 text-[11px]">
                                {col.title}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {widget.data.rows.map((row: any, rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                              {widget.data.columns.map((col: any) => (
                                <td key={col.field} className="px-3 py-2">
                                  {col.format === 'currency'
                                    ? `$${Number(row[col.field] || 0).toLocaleString()}`
                                    : row[col.field]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
