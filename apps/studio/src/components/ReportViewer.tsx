import React, { useState, useEffect, useRef } from 'react';
import { ReportDefinition } from '@openreport/schema';
import { OpenReportEngine } from '@openreport/core';
import { RenderedDocument, RenderedPage, RenderedBox } from '@openreport/layout-engine';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  Filter,
  RefreshCw,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface ReportViewerProps {
  report: ReportDefinition;
  onExport: (format: 'pdf' | 'xlsx' | 'csv' | 'html') => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onExport }) => {
  const [engine, setEngine] = useState<OpenReportEngine | null>(null);
  const [document, setDocument] = useState<RenderedDocument | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<'fitWidth' | 'custom'>('fitWidth');
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [showParameters, setShowParameters] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize engine and initial parameters
  useEffect(() => {
    try {
      const initialParams: Record<string, any> = {};
      if (report.parameters) {
        for (const p of report.parameters) {
          if (p.defaultValue !== undefined) {
            initialParams[p.name] = p.defaultValue;
          }
        }
      }
      setParameters(initialParams);

      const eng = new OpenReportEngine(report, { parameters: initialParams });
      setEngine(eng);

      renderReport(eng);
    } catch (err: any) {
      console.error('Error initializing report engine:', err);
      setLoading(false);
    }
  }, [report]);

  // Handle responsive fit-to-width
  useEffect(() => {
    const handleResize = () => {
      if (fitMode === 'fitWidth' && containerRef.current && document) {
        const page = document.pages[currentPageIndex] || document.pages[0];
        if (page) {
          const containerWidth = containerRef.current.clientWidth;
          const padding = containerWidth < 640 ? 16 : containerWidth < 1024 ? 32 : 64;
          const availableWidth = Math.max(200, containerWidth - padding);
          // 1 point = 1.333333 CSS px
          const pageWidthPx = page.width * 1.333333;
          const calculatedZoom = Math.max(0.25, Math.min(1.8, availableWidth / pageWidthPx));
          setZoom(calculatedZoom);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitMode, document, currentPageIndex]);

  const renderReport = async (eng: OpenReportEngine) => {
    setLoading(true);
    try {
      await eng.loadData();
      const doc = await eng.renderDocument();
      setDocument(doc);
    } catch (err: any) {
      alert(`Report render error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleParameterChange = (paramName: string, value: any) => {
    const updated = { ...parameters, [paramName]: value };
    setParameters(updated);
    if (engine) {
      engine.setParameter(paramName, value);
      renderReport(engine);
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setFitMode('custom');
    setZoom(Math.max(0.3, Math.min(2.5, newZoom)));
  };

  const handleSetFitWidth = () => {
    setFitMode('fitWidth');
    if (containerRef.current && document) {
      const page = document.pages[currentPageIndex] || document.pages[0];
      if (page) {
        const containerWidth = containerRef.current.clientWidth;
        const padding = containerWidth < 640 ? 16 : containerWidth < 1024 ? 32 : 64;
        const availableWidth = Math.max(200, containerWidth - padding);
        const pageWidthPx = page.width * 1.333333;
        setZoom(Math.max(0.25, Math.min(1.8, availableWidth / pageWidthPx)));
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-100">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-primary-600" />
          <span>Generating paginated report...</span>
        </div>
      </div>
    );
  }

  const currentPage = document.pages[currentPageIndex] || document.pages[0]!;
  // Physical points to CSS pixels scaling
  const scaledWidthPx = currentPage.width * 1.333333 * zoom;
  const scaledHeightPx = currentPage.height * 1.333333 * zoom;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-200 dark:bg-slate-950 transition-colors">
      {/* Responsive Top Viewer Toolbar */}
      <div className="h-12 bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 flex items-center justify-between px-2 sm:px-4 z-20 shadow-sm select-none shrink-0 gap-1 sm:gap-3 overflow-x-auto">
        {/* Left: Parameters Toggle & Page Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {report.parameters && report.parameters.length > 0 && (
            <button
              onClick={() => setShowParameters(!showParameters)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 text-xs font-medium rounded border transition ${
                showParameters
                  ? 'bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 border-primary-300 dark:border-primary-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
              title="Toggle Parameters"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span className="hidden sm:inline">Params</span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">
                {report.parameters.length}
              </span>
            </button>
          )}

          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700 hidden xs:block" />

          {/* Page Controls */}
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <button
              onClick={() => setCurrentPageIndex(0)}
              disabled={currentPageIndex === 0}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-25"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-25"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 px-1 sm:px-2 whitespace-nowrap">
              {currentPageIndex + 1} / {document.pageCount}
            </span>

            <button
              onClick={() => setCurrentPageIndex(Math.min(document.pageCount - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === document.pageCount - 1}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-25"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPageIndex(document.pageCount - 1)}
              disabled={currentPageIndex === document.pageCount - 1}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-25"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Search (Collapsible / Responsive) */}
        <div className="hidden sm:flex items-center relative w-36 sm:w-48 md:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Zoom */}
          <div className="flex items-center space-x-0.5 sm:space-x-1 border-r border-slate-300 dark:border-slate-700 pr-1.5 sm:pr-2">
            <button
              onClick={() => handleZoomChange(zoom - 0.15)}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSetFitWidth}
              className={`px-1.5 py-0.5 text-[10px] sm:text-xs font-mono rounded transition ${
                fitMode === 'fitWidth'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Fit to Width"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => handleZoomChange(zoom + 0.15)}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSetFitWidth}
              className="hidden xs:block p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              title="Fit Page Width"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Exports */}
          <button
            onClick={() => onExport('pdf')}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded shadow-sm transition"
            title="Download PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            <span className="hidden md:inline">PDF</span>
          </button>
          <button
            onClick={() => onExport('xlsx')}
            className="hidden xs:flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded shadow-sm transition"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"
            title="Print"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body: Parameters Sidepanel + Document Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Parameters Sidepanel (Persistent on Desktop, Slide-over on Mobile) */}
        {showParameters && report.parameters && report.parameters.length > 0 && (
          <>
            {/* Backdrop on mobile */}
            <div
              className="lg:hidden fixed inset-0 bg-slate-900/60 z-30 backdrop-blur-xs"
              onClick={() => setShowParameters(false)}
            />

            <aside className="fixed lg:static inset-y-0 left-0 w-72 sm:w-80 bg-white dark:bg-slate-900 border-r border-slate-300 dark:border-slate-800 flex flex-col p-4 shadow-xl lg:shadow-sm z-40 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                    Parameters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => engine && renderReport(engine)}
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Apply
                  </button>
                  <button
                    onClick={() => setShowParameters(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                {report.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                      {param.label || param.name}
                    </label>
                    {param.type === 'select' && param.options ? (
                      <select
                        value={parameters[param.name] ?? ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      >
                        {param.options.map((opt) => (
                          <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : param.type === 'date' ? (
                      <input
                        type="date"
                        value={parameters[param.name] ?? ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                      />
                    ) : param.type === 'number' ? (
                      <input
                        type="number"
                        value={parameters[param.name] ?? ''}
                        onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                      />
                    ) : (
                      <input
                        type="text"
                        value={parameters[param.name] ?? ''}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                      />
                    )}
                  </div>
                ))}
              </div>
            </aside>
          </>
        )}

        {/* Responsive Paginated Document Display Area */}
        <main
          ref={containerRef}
          className="flex-1 overflow-auto p-2 sm:p-4 md:p-8 flex justify-center items-start"
        >
          {/* Outer Zoom Space Reserver */}
          <div
            style={{
              width: `${scaledWidthPx}px`,
              height: `${scaledHeightPx}px`,
              position: 'relative'
            }}
            className="transition-all duration-75"
          >
            {/* Inner Scaled Document Page (True 1:1 pt coordinates) */}
            <div
              style={{
                width: `${currentPage.width * 1.333333}px`,
                height: `${currentPage.height * 1.333333}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              className="bg-white shadow-2xl relative border border-slate-300 origin-top-left"
            >
              {/* Render all page boxes */}
              {currentPage.boxes.map((box) => {
                const isSearchMatch =
                  searchQuery.trim().length > 1 &&
                  box.text &&
                  box.text.toLowerCase().includes(searchQuery.toLowerCase());

                const boxLeftPx = box.x * 1.333333;
                const boxTopPx = box.y * 1.333333;
                const boxWidthPx = box.width * 1.333333;
                const boxHeightPx = box.height * 1.333333;

                return (
                  <div
                    key={box.id}
                    style={{
                      position: 'absolute',
                      left: `${boxLeftPx}px`,
                      top: `${boxTopPx}px`,
                      width: `${boxWidthPx}px`,
                      height: `${boxHeightPx}px`,
                      backgroundColor: box.backgroundColor || 'transparent',
                      borderRadius: box.borderRadius ? `${box.borderRadius * 1.333333}px` : undefined
                    }}
                    className={`overflow-hidden box-border ${isSearchMatch ? 'ring-2 ring-amber-400 bg-amber-100/50' : ''}`}
                  >
                    {/* Line element */}
                    {box.type === 'line' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderTop: `${(box.strokeWidth || 1) * 1.333333}px solid ${box.strokeColor || '#94a3b8'}`
                        }}
                      />
                    )}

                    {/* Rectangle */}
                    {box.type === 'rect' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          border: `${(box.strokeWidth || 1) * 1.333333}px solid ${box.strokeColor || '#cbd5e1'}`
                        }}
                      />
                    )}

                    {/* Text / Table Cell */}
                    {box.text && box.type !== 'barcode' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          fontSize: `${(box.font?.size || 10) * 1.333333}px`,
                          fontFamily: box.font?.family || 'sans-serif',
                          fontWeight: box.font?.weight || 'normal',
                          color: box.font?.color || '#0f172a',
                          textAlign: box.font?.align || 'left',
                          padding: box.padding
                            ? `${box.padding.top * 1.333333}px ${box.padding.right * 1.333333}px ${box.padding.bottom * 1.333333}px ${box.padding.left * 1.333333}px`
                            : undefined,
                          lineHeight: box.font?.lineHeight || 1.2,
                          borderBottom: box.borders?.bottom
                            ? `${box.borders.bottom.width * 1.333333}px ${box.borders.bottom.style} ${box.borders.bottom.color}`
                            : undefined,
                          borderTop: box.borders?.top
                            ? `${box.borders.top.width * 1.333333}px ${box.borders.top.style} ${box.borders.top.color}`
                            : undefined,
                          border: box.borders?.all
                            ? `${box.borders.all.width * 1.333333}px ${box.borders.all.style} ${box.borders.all.color}`
                            : undefined
                        }}
                      >
                        {box.text}
                      </div>
                    )}

                    {/* KPI Card */}
                    {box.type === 'kpi' && box.kpiData && (
                      <div className="w-full h-full p-2.5 flex flex-col justify-between">
                        <span className="text-[11px] text-slate-500 font-medium truncate">
                          {box.kpiData.title}
                        </span>
                        <span
                          style={{ color: box.kpiData.accentColor || '#0f172a' }}
                          className="text-xl font-bold truncate"
                        >
                          {box.kpiData.value}
                        </span>
                        {box.kpiData.change && (
                          <span
                            className={`text-[10px] font-semibold truncate ${
                              box.kpiData.trend === 'up' ? 'text-emerald-600' : 'text-red-500'
                            }`}
                          >
                            {box.kpiData.change}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Chart Rendering */}
                    {box.type === 'chart' && box.chartData && (
                      <div className="w-full h-full p-3 flex flex-col justify-between bg-white">
                        {box.chartData.title && (
                          <span className="text-[12px] font-bold text-slate-800">
                            {box.chartData.title}
                          </span>
                        )}
                        <div className="flex-1 flex items-end justify-around pt-3 border-b border-slate-300">
                          {box.chartData.categories.map((cat, idx) => {
                            const val = box.chartData!.series[0]?.data[idx] || 0;
                            const max = Math.max(1, ...(box.chartData!.series[0]?.data || [1]));
                            const heightPct = Math.round((val / max) * 85);
                            const color = box.chartData!.colors[idx % box.chartData!.colors.length];

                            return (
                              <div key={cat} className="flex flex-col items-center flex-1 h-full justify-end px-1">
                                <div
                                  style={{ height: `${heightPct}%`, backgroundColor: color }}
                                  className="w-full max-w-[36px] rounded-t transition-all"
                                  title={`${cat}: ${val}`}
                                />
                                <span className="text-[10px] text-slate-500 truncate mt-1 w-full text-center">
                                  {cat}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
