import React, { useState, useEffect } from 'react';
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
  Download,
  Printer,
  Search,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  FileText
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
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [showParameters, setShowParameters] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [continuousScroll, setContinuousScroll] = useState<boolean>(false);

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-200">
      {/* Top Viewer Toolbar */}
      <div className="h-12 bg-white border-b border-slate-300 flex items-center justify-between px-4 z-20 shadow-sm select-none">
        {/* Left: Parameters Toggle & Page Navigation */}
        <div className="flex items-center space-x-3">
          {report.parameters && report.parameters.length > 0 && (
            <button
              onClick={() => setShowParameters(!showParameters)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition ${
                showParameters
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Parameters ({report.parameters.length})</span>
            </button>
          )}

          <div className="h-4 w-[1px] bg-slate-300" />

          {/* Page Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPageIndex(0)}
              disabled={currentPageIndex === 0}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-medium text-slate-700 px-2">
              Page {currentPageIndex + 1} of {document.pageCount}
            </span>

            <button
              onClick={() => setCurrentPageIndex(Math.min(document.pageCount - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === document.pageCount - 1}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPageIndex(document.pageCount - 1)}
              disabled={currentPageIndex === document.pageCount - 1}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex items-center relative w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in document..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 bg-slate-50"
          />
        </div>

        {/* Right: Zoom & Export Controls */}
        <div className="flex items-center space-x-2">
          {/* Zoom */}
          <div className="flex items-center space-x-1 border-r border-slate-300 pr-3 mr-1">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.15))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-700 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(Math.min(2.5, zoom + 0.15))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded"
              title="100% Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Exports */}
          <button
            onClick={() => onExport('pdf')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded shadow-sm transition"
            title="Download PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => onExport('xlsx')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded shadow-sm transition"
            title="Download Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded border border-slate-300"
            title="Print"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body: Parameters Sidepanel + Document Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Parameters Sidepanel */}
        {showParameters && report.parameters && report.parameters.length > 0 && (
          <aside className="w-64 bg-white border-r border-slate-300 flex flex-col p-4 shadow-sm z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Report Parameters
              </span>
              <button
                onClick={() => engine && renderReport(engine)}
                className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Apply
              </button>
            </div>

            <div className="space-y-3">
              {report.parameters.map((param) => (
                <div key={param.name}>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    {param.label || param.name}
                  </label>
                  {param.type === 'select' && param.options ? (
                    <select
                      value={parameters[param.name] ?? ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs bg-white text-slate-800"
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
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 bg-white"
                    />
                  ) : param.type === 'number' ? (
                    <input
                      type="number"
                      value={parameters[param.name] ?? ''}
                      onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 bg-white"
                    />
                  ) : (
                    <input
                      type="text"
                      value={parameters[param.name] ?? ''}
                      onChange={(e) => handleParameterChange(param.name, e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 bg-white"
                    />
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Paginated Document Display Area */}
        <main className="flex-1 overflow-auto p-12 flex justify-center items-start">
          <div
            style={{
              width: `${currentPage.width * zoom}pt`,
              height: `${currentPage.height * zoom}pt`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top center'
            }}
            className="bg-white shadow-2xl relative border border-slate-300"
          >
            {/* Render all page boxes */}
            {currentPage.boxes.map((box) => {
              const isSearchMatch =
                searchQuery.trim().length > 1 &&
                box.text &&
                box.text.toLowerCase().includes(searchQuery.toLowerCase());

              return (
                <div
                  key={box.id}
                  style={{
                    position: 'absolute',
                    left: `${box.x}pt`,
                    top: `${box.y}pt`,
                    width: `${box.width}pt`,
                    height: `${box.height}pt`,
                    backgroundColor: box.backgroundColor || 'transparent',
                    borderRadius: box.borderRadius ? `${box.borderRadius}pt` : undefined
                  }}
                  className={`overflow-hidden box-sizing-border ${isSearchMatch ? 'ring-2 ring-amber-400 bg-amber-100/40' : ''}`}
                >
                  {/* Line element */}
                  {box.type === 'line' && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        borderTop: `${box.strokeWidth || 1}pt solid ${box.strokeColor || '#94a3b8'}`
                      }}
                    />
                  )}

                  {/* Rectangle */}
                  {box.type === 'rect' && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        border: `${box.strokeWidth || 1}pt solid ${box.strokeColor || '#cbd5e1'}`
                      }}
                    />
                  )}

                  {/* Text / Table Cell */}
                  {box.text && box.type !== 'barcode' && (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        fontSize: `${box.font?.size || 10}pt`,
                        fontFamily: box.font?.family || 'sans-serif',
                        fontWeight: box.font?.weight || 'normal',
                        color: box.font?.color || '#0f172a',
                        textAlign: box.font?.align || 'left',
                        padding: box.padding
                          ? `${box.padding.top}pt ${box.padding.right}pt ${box.padding.bottom}pt ${box.padding.left}pt`
                          : undefined,
                        lineHeight: box.font?.lineHeight || 1.2,
                        borderBottom: box.borders?.bottom
                          ? `${box.borders.bottom.width}pt ${box.borders.bottom.style} ${box.borders.bottom.color}`
                          : undefined,
                        borderTop: box.borders?.top
                          ? `${box.borders.top.width}pt ${box.borders.top.style} ${box.borders.top.color}`
                          : undefined,
                        border: box.borders?.all
                          ? `${box.borders.all.width}pt ${box.borders.all.style} ${box.borders.all.color}`
                          : undefined
                      }}
                    >
                      {box.text}
                    </div>
                  )}

                  {/* KPI Card */}
                  {box.type === 'kpi' && box.kpiData && (
                    <div className="w-full h-full p-2.5 flex flex-col justify-between">
                      <span className="text-[9px] text-slate-500 font-medium truncate">
                        {box.kpiData.title}
                      </span>
                      <span
                        style={{ color: box.kpiData.accentColor || '#0f172a' }}
                        className="text-lg font-bold truncate"
                      >
                        {box.kpiData.value}
                      </span>
                      {box.kpiData.change && (
                        <span
                          className={`text-[9px] font-semibold truncate ${
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
                        <span className="text-[11px] font-bold text-slate-800">
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
                              <span className="text-[8px] text-slate-500 truncate mt-1 w-full text-center">
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
        </main>
      </div>
    </div>
  );
};
