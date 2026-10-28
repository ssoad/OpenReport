import React, { useState } from 'react';
import {
  FileText,
  Eye,
  LayoutDashboard,
  Grid,
  Database,
  BookOpen,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Printer
} from 'lucide-react';

export type StudioMode =
  | 'designer'
  | 'preview'
  | 'dashboard'
  | 'templates'
  | 'datasources'
  | 'docs';

interface HeaderProps {
  currentMode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  reportTitle: string;
  onExport: (format: 'pdf' | 'xlsx' | 'csv' | 'html') => void;
  onSaveJson: () => void;
  onLoadJson: (json: any) => void;
  onReset: () => void;
  isDirty?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  reportTitle,
  onExport,
  onSaveJson,
  onLoadJson,
  onReset,
  isDirty
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          onLoadJson(parsed);
        } catch (err: any) {
          alert(`Failed to parse report JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 select-none border-b border-slate-800 z-50">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center font-bold text-white shadow-sm">
            OR
          </div>
          <span className="font-semibold text-base tracking-tight text-white flex items-center gap-1.5">
            OpenReport
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30">
              Studio
            </span>
          </span>
        </div>

        <div className="h-5 w-[1px] bg-slate-700" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-200 truncate max-w-xs" title={reportTitle}>
            {reportTitle}
          </span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />
          )}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <nav className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
        <button
          onClick={() => onModeChange('designer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentMode === 'designer'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Report Designer
        </button>

        <button
          onClick={() => onModeChange('preview')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentMode === 'preview'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Report Preview
        </button>

        <button
          onClick={() => onModeChange('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentMode === 'dashboard'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          BI Dashboard
        </button>

        <button
          onClick={() => onModeChange('templates')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentMode === 'templates'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          Templates
        </button>

        <button
          onClick={() => onModeChange('datasources')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentMode === 'datasources'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Data Sources
        </button>

        <button
          onClick={() => onModeChange('docs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            currentMode === 'docs'
              ? 'bg-primary-600 text-white shadow'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          Integration & Docs
        </button>
      </nav>

      {/* Global Actions */}
      <div className="flex items-center space-x-2">
        {/* Load JSON */}
        <label className="cursor-pointer flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded border border-slate-700 transition">
          <Upload className="w-3.5 h-3.5" />
          <span>Load</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>

        {/* Save JSON */}
        <button
          onClick={onSaveJson}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded border border-slate-700 transition"
          title="Download report JSON definition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save JSON</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white rounded shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <div
              className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-md shadow-xl py-1 z-50 text-xs"
              onMouseLeave={() => setShowExportMenu(false)}
            >
              <button
                onClick={() => { onExport('pdf'); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Adobe PDF (.pdf)</span>
                <span className="text-[10px] text-primary-400 font-mono">Vector</span>
              </button>
              <button
                onClick={() => { onExport('xlsx'); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Microsoft Excel (.xlsx)</span>
                <span className="text-[10px] text-emerald-400 font-mono">OpenXML</span>
              </button>
              <button
                onClick={() => { onExport('csv'); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Delimited Data (.csv)</span>
                <span className="text-[10px] text-amber-400 font-mono">RFC-4180</span>
              </button>
              <button
                onClick={() => { onExport('html'); setShowExportMenu(false); }}
                className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center justify-between"
              >
                <span>Web Document (.html)</span>
                <span className="text-[10px] text-indigo-400 font-mono">Standalone</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
