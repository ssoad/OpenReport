import React, { useState } from 'react';
import { ReportDefinition, ReportElement, getPageDimensionsPt, getPrintableAreaPt } from '@openreport/schema';
import {
  Type,
  Table as TableIcon,
  BarChart2,
  Square,
  Minus,
  QrCode,
  Activity,
  Trash2,
  Undo2,
  Redo2,
  Layers,
  Database,
  Palette
} from 'lucide-react';

export interface ReportDesignerProps {
  report: ReportDefinition;
  onChange: (updatedReport: ReportDefinition) => void;
  className?: string;
}

export const ReportDesigner: React.FC<ReportDesignerProps> = ({
  report,
  onChange,
  className = ''
}) => {
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'palette' | 'data' | 'layers'>('palette');
  const [zoom, setZoom] = useState<number>(1.0);

  const pageDims = getPageDimensionsPt(report.page);
  const printable = getPrintableAreaPt(report.page);

  const addElement = (type: string) => {
    const id = `${type}_${Date.now().toString().slice(-4)}`;
    const cloned = JSON.parse(JSON.stringify(report)) as ReportDefinition;
    cloned.bands.detail.elements.push({
      id,
      type: type as any,
      x: 20,
      y: 20,
      width: type === 'table' ? 400 : 150,
      height: type === 'table' ? 80 : 25,
      text: type === 'text' ? 'New Label' : undefined,
      locked: false,
      columns: type === 'table' ? [
        { id: 'c1', field: 'id', title: 'ID', width: 100, align: 'left', headerAlign: 'left', visible: true, summary: 'none' },
        { id: 'c2', field: 'name', title: 'Name', width: 300, align: 'left', headerAlign: 'left', visible: true, summary: 'none' }
      ] : undefined,
      datasetId: type === 'table' ? (report.datasets[0]?.id || 'dataset1') : undefined
    } as any);

    onChange(cloned);
    setSelectedElementId(id);
  };

  return (
    <div className={`flex bg-slate-100 border border-slate-300 rounded-lg overflow-hidden h-[650px] ${className}`}>
      {/* Palette */}
      <aside className="w-56 bg-white border-r border-slate-200 p-3 select-none flex flex-col gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Component Palette
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => addElement('text')}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded flex flex-col items-center gap-1 text-slate-700"
          >
            <Type className="w-4 h-4 text-blue-600" />
            <span>Text</span>
          </button>
          <button
            onClick={() => addElement('table')}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded flex flex-col items-center gap-1 text-slate-700"
          >
            <TableIcon className="w-4 h-4 text-emerald-600" />
            <span>Table</span>
          </button>
          <button
            onClick={() => addElement('chart')}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded flex flex-col items-center gap-1 text-slate-700"
          >
            <BarChart2 className="w-4 h-4 text-purple-600" />
            <span>Chart</span>
          </button>
          <button
            onClick={() => addElement('kpi')}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded flex flex-col items-center gap-1 text-slate-700"
          >
            <Activity className="w-4 h-4 text-amber-600" />
            <span>KPI</span>
          </button>
        </div>
      </aside>

      {/* Canvas */}
      <main className="flex-1 overflow-auto p-8 flex justify-center items-start bg-slate-200">
        <div
          style={{
            width: `${pageDims.width * zoom}pt`,
            height: `${pageDims.height * zoom}pt`,
            transform: `scale(${zoom})`,
            transformOrigin: 'top center'
          }}
          className="bg-white shadow-xl relative border border-slate-300"
        >
          {report.bands.detail.elements.map((el) => (
            <div
              key={el.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedElementId(el.id);
              }}
              style={{
                position: 'absolute',
                left: `${el.x}pt`,
                top: `${el.y}pt`,
                width: `${el.width}pt`,
                height: `${el.height}pt`
              }}
              className={`border p-1 text-xs cursor-move ${
                selectedElementId === el.id ? 'border-blue-500 ring-2 ring-blue-300' : 'border-slate-300 bg-white/80'
              }`}
            >
              {(el as any).text || el.id}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
