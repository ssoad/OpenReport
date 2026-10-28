import React, { useState, useEffect } from 'react';
import { ReportDefinition } from '@openreport/schema';
import { OpenReportEngine } from '@openreport/core';
import { RenderedDocument } from '@openreport/layout-engine';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

export interface ReportViewerProps {
  report: ReportDefinition;
  parameters?: Record<string, any>;
  data?: Record<string, any[]>;
  onExport?: (format: 'pdf' | 'xlsx' | 'csv' | 'html', blob: Blob) => void;
  className?: string;
  showToolbar?: boolean;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  report,
  parameters: initialParams,
  data: overrideData,
  onExport,
  className = '',
  showToolbar = true
}) => {
  const [engine, setEngine] = useState<OpenReportEngine | null>(null);
  const [document, setDocument] = useState<RenderedDocument | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [showParameters, setShowParameters] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const mergedParams: Record<string, any> = {};
      if (report.parameters) {
        for (const p of report.parameters) {
          if (p.defaultValue !== undefined) {
            mergedParams[p.name] = p.defaultValue;
          }
        }
      }
      if (initialParams) {
        Object.assign(mergedParams, initialParams);
      }
      setParameters(mergedParams);

      const eng = new OpenReportEngine(report, { parameters: mergedParams });
      setEngine(eng);

      eng.renderDocument(overrideData).then((doc) => {
        setDocument(doc);
        setLoading(false);
      });
    } catch (err: any) {
      console.error('OpenReport Viewer error:', err);
      setLoading(false);
    }
  }, [report, initialParams, overrideData]);

  const handleExport = async (format: 'pdf' | 'xlsx' | 'csv' | 'html') => {
    if (!engine) return;
    try {
      let blob: Blob;
      const baseName = report.id || 'report';

      if (format === 'pdf') {
        const buffer = await engine.exportPdf();
        blob = new Blob([buffer as any], { type: 'application/pdf' });
      } else if (format === 'xlsx') {
        const buffer = await engine.exportXlsx();
        blob = new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      } else if (format === 'csv') {
        const csv = await engine.exportCsv();
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      } else {
        const html = await engine.exportHtml();
        blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      }

      if (onExport) {
        onExport(format, blob);
      } else {
        // Default download behavior
        const url = URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `${baseName}.${format === 'xlsx' ? 'xlsx' : format}`;
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  if (loading || !document) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 p-12 ${className}`}>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Rendering report document...</span>
        </div>
      </div>
    );
  }

  const currentPage = document.pages[currentPageIndex] || document.pages[0]!;

  return (
    <div className={`flex flex-col bg-slate-200 border border-slate-300 rounded-lg overflow-hidden ${className}`}>
      {showToolbar && (
        <div className="h-11 bg-white border-b border-slate-300 flex items-center justify-between px-3 select-none text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex === 0}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {currentPageIndex + 1} of {document.pageCount}
            </span>
            <button
              onClick={() => setCurrentPageIndex(Math.min(document.pageCount - 1, currentPageIndex + 1))}
              disabled={currentPageIndex === document.pageCount - 1}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-1 px-2 py-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded"
            >
              <FileText className="w-3.5 h-3.5 text-red-500" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="flex items-center gap-1 px-2 py-1 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-1 text-slate-700 hover:bg-slate-100 rounded border border-slate-300"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-8 flex justify-center items-start">
        <div
          style={{
            width: `${currentPage.width * 1.333333 * zoom}px`,
            height: `${currentPage.height * 1.333333 * zoom}px`,
            position: 'relative'
          }}
        >
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
            className="bg-white shadow-xl relative border border-slate-300"
          >
            {currentPage.boxes.map((box) => (
              <div
                key={box.id}
                style={{
                  position: 'absolute',
                  left: `${box.x * 1.333333}px`,
                  top: `${box.y * 1.333333}px`,
                  width: `${box.width * 1.333333}px`,
                  height: `${box.height * 1.333333}px`,
                  backgroundColor: box.backgroundColor || 'transparent',
                  borderRadius: box.borderRadius ? `${box.borderRadius * 1.333333}px` : undefined
                }}
                className="overflow-hidden"
              >
                {box.text && (
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
