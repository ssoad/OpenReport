import React, { useState, useRef, useEffect } from 'react';
import {
  ReportDefinition,
  ReportElement,
  getPageDimensionsPt,
  getPrintableAreaPt,
  TextElement,
  TableElement,
  ChartElement,
  KpiElement
} from '@openreport/schema';
import {
  Type,
  Table as TableIcon,
  BarChart2,
  Image as ImageIcon,
  Square,
  Minus,
  QrCode,
  Activity,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Layers,
  Database,
  Palette,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface ReportDesignerProps {
  report: ReportDefinition;
  onChange: (updatedReport: ReportDefinition) => void;
}

export const ReportDesigner: React.FC<ReportDesignerProps> = ({ report, onChange }) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'palette' | 'data' | 'layers'>('palette');
  const [zoom, setZoom] = useState<number>(0.9);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'palette' | 'inspector'>('canvas');
  const [history, setHistory] = useState<ReportDefinition[]>([report]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Dragging & Resizing state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'nw', 'ne', 'se', 'sw', etc.
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, elX: 0, elY: 0, elW: 0, elH: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);
  const pageDims = getPageDimensionsPt(report.page);
  const printable = getPrintableAreaPt(report.page);

  // Auto-fit to canvas width
  const handleFitWidth = () => {
    if (canvasRef.current) {
      const containerW = canvasRef.current.clientWidth;
      const padding = containerW < 640 ? 16 : 48;
      const availableW = Math.max(200, containerW - padding);
      const newZoom = Math.max(0.3, Math.min(1.8, availableW / pageDims.width));
      setZoom(newZoom);
    }
  };

  useEffect(() => {
    // If screen is smaller than 1024px, close sidebars by default to give canvas room
    if (window.innerWidth < 1024) {
      setIsLeftPanelOpen(false);
      setIsRightPanelOpen(false);
    }
    handleFitWidth();
  }, []);

  // Push to undo/redo history
  const updateReport = (newReport: ReportDefinition) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newReport);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
    onChange(newReport);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onChange(history[historyIndex - 1]!);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onChange(history[historyIndex + 1]!);
    }
  };

  // Find selected element
  const getSelectedElement = (): { element: ReportElement; bandName: string } | null => {
    if (!selectedElementId) return null;

    if (report.bands.reportHeader?.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.reportHeader.elements.find((e) => e.id === selectedElementId)!, bandName: 'reportHeader' };
    }
    if (report.bands.pageHeader?.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.pageHeader.elements.find((e) => e.id === selectedElementId)!, bandName: 'pageHeader' };
    }
    if (report.bands.detail.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.detail.elements.find((e) => e.id === selectedElementId)!, bandName: 'detail' };
    }
    if (report.bands.pageFooter?.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.pageFooter.elements.find((e) => e.id === selectedElementId)!, bandName: 'pageFooter' };
    }
    if (report.bands.reportFooter?.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.reportFooter.elements.find((e) => e.id === selectedElementId)!, bandName: 'reportFooter' };
    }

    return null;
  };

  const selected = getSelectedElement();

  // Add new element to detail band
  const addElement = (type: string, extraProps: Record<string, any> = {}) => {
    const id = `${type}_${Date.now().toString().slice(-4)}`;
    let newElement: ReportElement;

    if (type === 'text') {
      newElement = {
        id,
        type: 'text',
        x: 20,
        y: 20,
        width: 180,
        height: 24,
        text: 'New Label',
        locked: false,
        wrapText: true,
        canGrow: true,
        canShrink: false,
        font: { family: 'Helvetica', size: 10, weight: 'normal', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
        padding: { top: 2, right: 4, bottom: 2, left: 4 },
        ...extraProps
      };
    } else if (type === 'table') {
      const firstDataset = report.datasets[0];
      newElement = {
        id,
        type: 'table',
        datasetId: firstDataset?.id || 'dataset1',
        x: 20,
        y: 20,
        width: 480,
        height: 100,
        showHeader: true,
        showSummary: true,
        alternatingRowColors: true,
        headerHeight: 24,
        rowHeight: 20,
        summaryHeight: 24,
        headerFont: { family: 'Helvetica', size: 9, weight: 'bold', italic: false, color: '#334155', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
        rowFont: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
        summaryFont: { family: 'Helvetica', size: 9, weight: 'bold', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
        headerBackgroundColor: '#f1f5f9',
        alternatingBackgroundColor: '#f8fafc',
        summaryBackgroundColor: '#e2e8f0',
        cellPadding: { top: 3, right: 6, bottom: 3, left: 6 },
        locked: false,
        columns: [
          { id: 'c1', field: 'id', title: 'ID', width: 80, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
          { id: 'c2', field: 'name', title: 'Description', width: 250, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
          { id: 'c3', field: 'amount', title: 'Amount', width: 150, align: 'right', headerAlign: 'right', visible: true, format: { type: 'currency', currencyCode: 'USD', decimals: 2 }, summary: 'sum' }
        ],
        ...extraProps
      };
    } else if (type === 'chart') {
      const firstDataset = report.datasets[0];
      newElement = {
        id,
        type: 'chart',
        datasetId: firstDataset?.id || 'dataset1',
        x: 20,
        y: 20,
        width: 320,
        height: 180,
        chartType: 'column',
        categoryField: 'category',
        valueField: 'revenue',
        title: 'Quarterly Metric Chart',
        colors: ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'],
        showLegend: true,
        showLabels: false,
        locked: false,
        ...extraProps
      };
    } else if (type === 'kpi') {
      newElement = {
        id,
        type: 'kpi',
        title: 'Total Metric',
        valueExpression: '=$45,000',
        subtitle: 'Monthly performance',
        changeExpression: '+12% vs last month',
        trend: 'up',
        accentColor: '#2563eb',
        x: 20,
        y: 20,
        width: 150,
        height: 65,
        locked: false,
        ...extraProps
      };
    } else if (type === 'rect') {
      newElement = {
        id,
        type: 'rect',
        x: 20,
        y: 20,
        width: 100,
        height: 60,
        fillColor: '#f8fafc',
        strokeColor: '#cbd5e1',
        strokeWidth: 1,
        borderRadius: 4,
        style: 'solid',
        locked: false,
        ...extraProps
      };
    } else if (type === 'line') {
      newElement = {
        id,
        type: 'line',
        x: 20,
        y: 20,
        width: 200,
        height: 1,
        strokeColor: '#94a3b8',
        strokeWidth: 1,
        style: 'solid',
        orientation: 'horizontal',
        locked: false,
        ...extraProps
      };
    } else {
      newElement = {
        id,
        type: 'text',
        x: 20,
        y: 20,
        width: 100,
        height: 24,
        text: type,
        locked: false,
        wrapText: true,
        canGrow: false,
        canShrink: false,
        font: { family: 'Helvetica', size: 10, weight: 'normal', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
        padding: { top: 2, right: 4, bottom: 2, left: 4 },
        ...extraProps
      };
    }

    const cloned = JSON.parse(JSON.stringify(report)) as ReportDefinition;
    cloned.bands.detail.elements.push(newElement);
    updateReport(cloned);
    setSelectedElementId(id);
    setMobileTab('canvas');
  };

  // Delete selected element
  const deleteSelectedElement = () => {
    if (!selected) return;
    const cloned = JSON.parse(JSON.stringify(report)) as ReportDefinition;
    const band = (cloned.bands as any)[selected.bandName];
    if (band) {
      band.elements = band.elements.filter((e: ReportElement) => e.id !== selected.element.id);
      updateReport(cloned);
      setSelectedElementId(null);
    }
  };

  // Update properties of selected element
  const updateSelectedElementProps = (updates: Partial<ReportElement> | Record<string, any>) => {
    if (!selected) return;
    const cloned = JSON.parse(JSON.stringify(report)) as ReportDefinition;
    const band = (cloned.bands as any)[selected.bandName];
    if (band) {
      const idx = band.elements.findIndex((e: ReportElement) => e.id === selected.element.id);
      if (idx !== -1) {
        band.elements[idx] = { ...band.elements[idx], ...updates };
        updateReport(cloned);
      }
    }
  };

  // Keyboard Delete support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        // Do not delete if editing an input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
          return;
        }
        deleteSelectedElement();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, selected]);

  // Mouse drag & resize handlers
  const handleMouseDown = (e: React.MouseEvent, el: ReportElement, resizeHandle?: string) => {
    e.stopPropagation();
    setSelectedElementId(el.id);

    if (resizeHandle) {
      setIsResizing(resizeHandle);
    } else {
      setIsDragging(true);
    }

    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      elX: el.x,
      elY: el.y,
      elW: el.width,
      elH: el.height
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!selected) return;

    const dx = (e.clientX - dragStart.mouseX) / zoom;
    const dy = (e.clientY - dragStart.mouseY) / zoom;

    if (isDragging) {
      // Snapping to 4pt grid
      const newX = Math.max(0, Math.round((dragStart.elX + dx) / 4) * 4);
      const newY = Math.max(0, Math.round((dragStart.elY + dy) / 4) * 4);
      updateSelectedElementProps({ x: newX, y: newY });
    } else if (isResizing) {
      let newW = dragStart.elW;
      let newH = dragStart.elH;
      let newX = dragStart.elX;
      let newY = dragStart.elY;

      if (isResizing.includes('e')) newW = Math.max(20, Math.round((dragStart.elW + dx) / 4) * 4);
      if (isResizing.includes('s')) newH = Math.max(10, Math.round((dragStart.elH + dy) / 4) * 4);
      if (isResizing.includes('w')) {
        const potentialW = Math.max(20, dragStart.elW - dx);
        newX = dragStart.elX + (dragStart.elW - potentialW);
        newW = potentialW;
      }
      if (isResizing.includes('n')) {
        const potentialH = Math.max(10, dragStart.elH - dy);
        newY = dragStart.elY + (dragStart.elH - potentialH);
        newH = potentialH;
      }

      updateSelectedElementProps({ x: newX, y: newY, width: newW, height: newH });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
  };

  // Render elements for a band
  const renderBandElements = (elements: ReportElement[], bandName: string) => {
    return elements.map((el) => {
      const isSelected = selectedElementId === el.id;

      return (
        <div
          key={el.id}
          onMouseDown={(e) => handleMouseDown(e, el)}
          style={{
            position: 'absolute',
            left: `${el.x}pt`,
            top: `${el.y}pt`,
            width: `${el.width}pt`,
            height: `${el.height}pt`,
            backgroundColor: (el as any).backgroundColor || ((el as any).fillColor) || 'transparent',
            borderRadius: (el as any).borderRadius ? `${(el as any).borderRadius}pt` : undefined
          }}
          className={`cursor-move select-none group transition-shadow ${
            isSelected
              ? 'ring-2 ring-primary-500 ring-offset-1 z-30 shadow-md'
              : 'hover:outline hover:outline-1 hover:outline-primary-400/60 z-10'
          }`}
        >
          {/* Element Content Preview */}
          <div className="w-full h-full overflow-hidden pointer-events-none p-1">
            {el.type === 'text' && (
              <span
                style={{
                  fontSize: `${(el as TextElement).font?.size || 10}pt`,
                  fontFamily: (el as TextElement).font?.family || 'sans-serif',
                  fontWeight: (el as TextElement).font?.weight || 'normal',
                  color: (el as TextElement).font?.color || '#000000',
                  textAlign: (el as TextElement).font?.align || 'left',
                  display: 'block'
                }}
              >
                {(el as TextElement).text}
              </span>
            )}

            {el.type === 'table' && (
              <div className="w-full h-full flex flex-col border border-slate-300 text-[9px] bg-white">
                <div className="flex bg-slate-100 font-bold border-b border-slate-300">
                  {(el as TableElement).columns.map((col) => (
                    <div key={col.id} style={{ width: `${col.width}pt` }} className="p-1 truncate">
                      {col.title || col.field}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-2 text-slate-400 italic text-[8px] flex items-center justify-center">
                  Table bound to [{(el as TableElement).datasetId}]
                </div>
              </div>
            )}

            {el.type === 'chart' && (
              <div className="w-full h-full bg-slate-50 border border-slate-200 rounded p-2 flex flex-col justify-between">
                <div className="text-[10px] font-bold text-slate-700">{(el as ChartElement).title || 'Chart'}</div>
                <div className="flex items-end justify-around h-24 pt-2">
                  <div className="w-6 bg-primary-500 h-16 rounded-t" />
                  <div className="w-6 bg-emerald-500 h-20 rounded-t" />
                  <div className="w-6 bg-amber-500 h-12 rounded-t" />
                  <div className="w-6 bg-purple-500 h-22 rounded-t" />
                </div>
              </div>
            )}

            {el.type === 'kpi' && (
              <div className="w-full h-full bg-white border border-slate-200 rounded p-2 flex flex-col justify-between">
                <span className="text-[9px] text-slate-500 font-medium truncate">{(el as KpiElement).title}</span>
                <span className="text-base font-bold text-slate-900 truncate">{(el as KpiElement).valueExpression}</span>
                <span className="text-[9px] text-emerald-600 font-semibold truncate">{(el as KpiElement).changeExpression}</span>
              </div>
            )}

            {el.type === 'line' && (
              <div className="w-full h-full flex items-center">
                <div className="w-full border-t border-slate-400" />
              </div>
            )}

            {el.type === 'rect' && (
              <div className="w-full h-full border border-slate-300 rounded" />
            )}
          </div>

          {/* Resize Handles (8 handles when selected) */}
          {isSelected && (
            <>
              {['nw', 'ne', 'se', 'sw', 'n', 's', 'e', 'w'].map((handle) => (
                <div
                  key={handle}
                  onMouseDown={(e) => handleMouseDown(e, el, handle)}
                  className={`absolute w-2 h-2 bg-white border border-primary-600 z-40 ${
                    handle === 'nw' ? '-top-1 -left-1 cursor-nwse-resize' :
                    handle === 'ne' ? '-top-1 -right-1 cursor-nesw-resize' :
                    handle === 'se' ? '-bottom-1 -right-1 cursor-nwse-resize' :
                    handle === 'sw' ? '-bottom-1 -left-1 cursor-nesw-resize' :
                    handle === 'n' ? '-top-1 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                    handle === 's' ? '-bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                    handle === 'e' ? 'top-1/2 -translate-y-1/2 -right-1 cursor-ew-resize' :
                    'top-1/2 -translate-y-1/2 -left-1 cursor-ew-resize'
                  }`}
                />
              ))}
            </>
          )}
        </div>
      );
    });
  };

  return (
    <div
      className="flex-1 flex overflow-hidden bg-slate-100"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* LEFT TOOL PANEL (Component Palette & Data Explorer) */}
      <aside className={`bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm select-none ${
        mobileTab === 'palette'
          ? 'fixed inset-0 top-14 bottom-12 z-30 flex w-full'
          : isLeftPanelOpen
          ? 'hidden md:flex w-64 shrink-0'
          : 'hidden'
      }`}>
        {/* Mobile Close Bar */}
        {mobileTab === 'palette' && (
          <div className="md:hidden flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50 shrink-0">
            <span className="text-xs font-bold text-slate-800">Add Components & Data Fields</span>
            <button
              onClick={() => setMobileTab('canvas')}
              className="p-1 text-slate-500 hover:text-slate-800 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Left Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => setLeftTab('palette')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              leftTab === 'palette'
                ? 'border-primary-600 text-primary-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Palette
          </button>
          <button
            onClick={() => setLeftTab('data')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              leftTab === 'data'
                ? 'border-primary-600 text-primary-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Fields
          </button>
          <button
            onClick={() => setLeftTab('layers')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              leftTab === 'layers'
                ? 'border-primary-600 text-primary-600 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Layers
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {leftTab === 'palette' && (
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Basic Components
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addElement('text')}
                    className="p-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50/50 rounded flex flex-col items-center justify-center text-slate-700 transition"
                  >
                    <Type className="w-4 h-4 mb-1 text-primary-600" />
                    <span className="text-xs font-medium">Text</span>
                  </button>
                  <button
                    onClick={() => addElement('rect')}
                    className="p-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50/50 rounded flex flex-col items-center justify-center text-slate-700 transition"
                  >
                    <Square className="w-4 h-4 mb-1 text-slate-600" />
                    <span className="text-xs font-medium">Rectangle</span>
                  </button>
                  <button
                    onClick={() => addElement('line')}
                    className="p-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50/50 rounded flex flex-col items-center justify-center text-slate-700 transition"
                  >
                    <Minus className="w-4 h-4 mb-1 text-slate-600" />
                    <span className="text-xs font-medium">Line</span>
                  </button>
                  <button
                    onClick={() => addElement('barcode')}
                    className="p-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50/50 rounded flex flex-col items-center justify-center text-slate-700 transition"
                  >
                    <QrCode className="w-4 h-4 mb-1 text-slate-600" />
                    <span className="text-xs font-medium">Barcode</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Data & Analytics
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addElement('table')}
                    className="p-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50/50 rounded flex flex-col items-center justify-center text-slate-700 transition"
                  >
                    <TableIcon className="w-4 h-4 mb-1 text-emerald-600" />
                    <span className="text-xs font-medium">Table</span>
                  </button>
                  <button
                    onClick={() => addElement('chart')}
                    className="p-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50/50 rounded flex flex-col items-center justify-center text-slate-700 transition"
                  >
                    <BarChart2 className="w-4 h-4 mb-1 text-indigo-600" />
                    <span className="text-xs font-medium">Chart</span>
                  </button>
                  <button
                    onClick={() => addElement('kpi')}
                    className="p-2 border border-slate-200 hover:border-primary-500 hover:bg-primary-50/50 rounded flex flex-col items-center justify-center text-slate-700 transition"
                  >
                    <Activity className="w-4 h-4 mb-1 text-amber-600" />
                    <span className="text-xs font-medium">KPI Card</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {leftTab === 'data' && (
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Available Datasets
              </span>
              {report.datasets.map((dataset) => {
                const source = report.dataSources.find((s) => s.id === dataset.dataSourceId);
                const sampleRow = source?.data?.[0] || {};
                const fields = Object.keys(sampleRow);

                return (
                  <div key={dataset.id} className="border border-slate-200 rounded p-2.5 bg-slate-50">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between mb-2">
                      <span>{dataset.id}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                        {fields.length} fields
                      </span>
                    </div>

                    <div className="space-y-1">
                      {fields.map((f) => (
                        <button
                          key={f}
                          onClick={() => addElement('text', { text: `=[${f}]` })}
                          className="w-full text-left text-xs px-2 py-1 bg-white hover:bg-primary-50 hover:text-primary-600 rounded border border-slate-200 flex items-center justify-between text-slate-600 transition"
                        >
                          <span className="truncate">{f}</span>
                          <span className="text-[10px] text-slate-400">Insert</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {leftTab === 'layers' && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Document Elements
              </span>
              {report.bands.detail.elements.map((el) => (
                <div
                  key={el.id}
                  onClick={() => setSelectedElementId(el.id)}
                  className={`px-2 py-1.5 rounded text-xs flex items-center justify-between cursor-pointer ${
                    selectedElementId === el.id
                      ? 'bg-primary-100 text-primary-800 font-medium'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="truncate">{el.id} ({el.type})</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); deleteSelectedElement(); }}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* CENTRAL DESIGNER CANVAS */}
      <main className={`flex-1 flex flex-col overflow-hidden relative ${
        mobileTab !== 'canvas' ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Responsive Canvas Toolbar */}
        <div className="h-10 bg-white border-b border-slate-200 flex items-center justify-between px-2 sm:px-4 z-10 shrink-0 gap-1 overflow-x-auto">
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Left Panel Toggle (Desktop) */}
            <button
              onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
              className={`hidden md:flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition ${
                isLeftPanelOpen ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Toggle Components & Data"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px]">Palette</span>
            </button>

            <div className="hidden md:block h-4 w-[1px] bg-slate-200" />

            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-[1px] bg-slate-200" />
            <button
              onClick={deleteSelectedElement}
              disabled={!selected}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-30"
              title="Delete element"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            <button
              onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitWidth}
              className="px-1.5 py-0.5 text-[10px] sm:text-xs font-mono text-slate-700 hover:bg-slate-100 rounded text-center"
              title="Fit Canvas Width"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFitWidth}
              className="p-1 text-slate-600 hover:bg-slate-100 rounded"
              title="Fit Page Width"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <div className="hidden md:block h-4 w-[1px] bg-slate-200" />

            {/* Right Panel Toggle (Desktop) */}
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className={`hidden md:flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition ${
                isRightPanelOpen ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Toggle Properties Inspector"
            >
              <span className="hidden lg:inline text-[11px]">Inspector</span>
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Canvas Container */}
        <div
          ref={canvasRef}
          onClick={() => setSelectedElementId(null)}
          className="flex-1 overflow-auto p-2 sm:p-6 md:p-12 flex justify-center items-start"
        >
          {/* Outer Reserver Box for Scroll Container */}
          <div
            style={{
              width: `${pageDims.width * zoom}pt`,
              height: `${pageDims.height * zoom}pt`,
              position: 'relative'
            }}
          >
            {/* Physical Page Box with Transform Scale */}
            <div
              style={{
                width: `${pageDims.width}pt`,
                height: `${pageDims.height}pt`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              className="bg-white shadow-2xl relative border border-slate-300"
            >
            {/* Margins Guide Lines */}
            <div
              style={{
                position: 'absolute',
                top: `${printable.top}pt`,
                left: `${printable.left}pt`,
                width: `${printable.width}pt`,
                height: `${printable.height}pt`
              }}
              className="border border-dashed border-sky-300/60 pointer-events-none z-20"
            />

            {/* Render Bands */}
            {/* Report Header */}
            {report.bands.reportHeader && (
              <div
                style={{
                  position: 'absolute',
                  top: `${printable.top}pt`,
                  left: `${printable.left}pt`,
                  width: `${printable.width}pt`,
                  height: `${report.bands.reportHeader.height}pt`
                }}
                className="border-b border-indigo-200/60"
              >
                <span className="absolute -top-3 left-1 text-[8px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-50 px-1 rounded">
                  Report Header
                </span>
                {renderBandElements(report.bands.reportHeader.elements, 'reportHeader')}
              </div>
            )}

            {/* Detail Band */}
            <div
              style={{
                position: 'absolute',
                top: `${printable.top + (report.bands.reportHeader?.height || 0)}pt`,
                left: `${printable.left}pt`,
                width: `${printable.width}pt`,
                height: `${report.bands.detail.height || 400}pt`
              }}
              className="relative"
            >
              <span className="absolute -top-3 left-1 text-[8px] uppercase tracking-wider font-bold text-emerald-500 bg-emerald-50 px-1 rounded">
                Detail Band
              </span>
              {renderBandElements(report.bands.detail.elements, 'detail')}
            </div>

            {/* Page Footer */}
            {report.bands.pageFooter && (
              <div
                style={{
                  position: 'absolute',
                  bottom: `${report.page.margins.bottom}pt`,
                  left: `${printable.left}pt`,
                  width: `${printable.width}pt`,
                  height: `${report.bands.pageFooter.height}pt`
                }}
                className="border-t border-slate-200"
              >
                <span className="absolute -bottom-3 left-1 text-[8px] uppercase tracking-wider font-bold text-slate-400 bg-slate-50 px-1 rounded">
                  Page Footer
                </span>
                {renderBandElements(report.bands.pageFooter.elements, 'pageFooter')}
              </div>
            )}
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT PROPERTIES INSPECTOR */}
      <aside className={`bg-white border-l border-slate-200 flex flex-col z-20 shadow-sm select-none ${
        mobileTab === 'inspector'
          ? 'fixed inset-0 top-14 bottom-12 z-30 flex w-full'
          : isRightPanelOpen
          ? 'hidden md:flex w-72 shrink-0'
          : 'hidden'
      }`}>
        <div className="h-10 border-b border-slate-200 px-3 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-xs font-bold text-slate-700">Properties Inspector</span>
          <div className="flex items-center gap-2">
            {selected && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 border border-primary-200">
                {selected.element.type}
              </span>
            )}
            {mobileTab === 'inspector' && (
              <button
                onClick={() => setMobileTab('canvas')}
                className="md:hidden p-1 text-slate-500 hover:text-slate-800 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {selected ? (
            <>
              {/* Geometry Controls */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Position & Size (pt)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 block">X Position</label>
                    <input
                      type="number"
                      value={selected.element.x}
                      onChange={(e) => updateSelectedElementProps({ x: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Y Position</label>
                    <input
                      type="number"
                      value={selected.element.y}
                      onChange={(e) => updateSelectedElementProps({ y: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Width</label>
                    <input
                      type="number"
                      value={selected.element.width}
                      onChange={(e) => updateSelectedElementProps({ width: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Height</label>
                    <input
                      type="number"
                      value={selected.element.height}
                      onChange={(e) => updateSelectedElementProps({ height: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Text Element Properties */}
              {selected.element.type === 'text' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Content & Typography
                  </span>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Text or Expression</label>
                    <textarea
                      value={(selected.element as TextElement).text}
                      onChange={(e) => updateSelectedElementProps({ text: e.target.value })}
                      rows={2}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-800"
                      placeholder="e.g. Sales Report or =[Revenue] * 1.1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Font Size</label>
                      <input
                        type="number"
                        value={(selected.element as TextElement).font?.size || 10}
                        onChange={(e) => updateSelectedElementProps({
                          font: { ...(selected.element as TextElement).font, size: Number(e.target.value) }
                        })}
                        className="w-full border border-slate-300 rounded px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Font Weight</label>
                      <select
                        value={(selected.element as TextElement).font?.weight || 'normal'}
                        onChange={(e) => updateSelectedElementProps({
                          font: { ...(selected.element as TextElement).font, weight: e.target.value as any }
                        })}
                        className="w-full border border-slate-300 rounded px-2 py-1 bg-white"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Text Alignment</label>
                    <select
                      value={(selected.element as TextElement).font?.align || 'left'}
                      onChange={(e) => updateSelectedElementProps({
                        font: { ...(selected.element as TextElement).font, align: e.target.value as any }
                      })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(selected.element as TextElement).font?.color || '#0f172a'}
                        onChange={(e) => updateSelectedElementProps({
                          font: { ...(selected.element as TextElement).font, color: e.target.value }
                        })}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(selected.element as TextElement).font?.color || '#0f172a'}
                        onChange={(e) => updateSelectedElementProps({
                          font: { ...(selected.element as TextElement).font, color: e.target.value }
                        })}
                        className="flex-1 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Table Properties */}
              {selected.element.type === 'table' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Table Columns
                  </span>

                  <div className="space-y-2">
                    {(selected.element as TableElement).columns.map((col, idx) => (
                      <div key={col.id} className="p-2 border border-slate-200 rounded bg-slate-50 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold">
                          <span>Column {idx + 1}</span>
                          <button
                            onClick={() => {
                              const newCols = (selected.element as TableElement).columns.filter((_, i) => i !== idx);
                              updateSelectedElementProps({ columns: newCols });
                            }}
                            className="text-red-500 hover:text-red-700 text-[10px]"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          value={col.title}
                          onChange={(e) => {
                            const newCols = [...(selected.element as TableElement).columns];
                            newCols[idx] = { ...col, title: e.target.value };
                            updateSelectedElementProps({ columns: newCols });
                          }}
                          placeholder="Column Title"
                          className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-xs"
                        />
                        <input
                          type="text"
                          value={col.field}
                          onChange={(e) => {
                            const newCols = [...(selected.element as TableElement).columns];
                            newCols[idx] = { ...col, field: e.target.value };
                            updateSelectedElementProps({ columns: newCols });
                          }}
                          placeholder="Field name"
                          className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono"
                        />
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const newCols = [
                          ...(selected.element as TableElement).columns,
                          {
                            id: `col_${Date.now().toString().slice(-4)}`,
                            field: 'field',
                            title: 'New Column',
                            width: 100,
                            align: 'left' as const,
                            headerAlign: 'left' as const,
                            visible: true,
                            summary: 'none' as const
                          }
                        ];
                        updateSelectedElementProps({ columns: newCols });
                      }}
                      className="w-full py-1 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded border border-primary-200"
                    >
                      + Add Column
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 p-4">
              <Layers className="w-8 h-8 mb-2 stroke-1 text-slate-300" />
              <p className="text-xs">Select any element on the canvas to configure its properties.</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Designer Bottom Navigation Switcher */}
      <div className="md:hidden fixed bottom-0 inset-x-0 h-12 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-30 select-none shadow-lg">
        <button
          onClick={() => setMobileTab('palette')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium py-1 px-3 rounded-lg transition ${
            mobileTab === 'palette' ? 'text-primary-600 bg-primary-50 font-bold' : 'text-slate-500'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Add Elements</span>
        </button>
        <button
          onClick={() => setMobileTab('canvas')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium py-1 px-3 rounded-lg transition ${
            mobileTab === 'canvas' ? 'text-primary-600 bg-primary-50 font-bold' : 'text-slate-500'
          }`}
        >
          <Square className="w-4 h-4" />
          <span>Canvas</span>
        </button>
        <button
          onClick={() => setMobileTab('inspector')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-medium py-1 px-3 rounded-lg transition ${
            mobileTab === 'inspector' ? 'text-primary-600 bg-primary-50 font-bold' : 'text-slate-500'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Properties</span>
        </button>
      </div>
    </div>
  );
};
