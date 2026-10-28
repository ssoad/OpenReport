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
  ChevronDown,
  Menu,
  X,
  FileSpreadsheet
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          onLoadJson(parsed);
          setMobileMenuOpen(false);
        } catch (err: any) {
          alert(`Failed to parse report JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  const navItems = [
    { mode: 'designer' as StudioMode, label: 'Designer', fullLabel: 'Report Designer', icon: FileText },
    { mode: 'preview' as StudioMode, label: 'Preview', fullLabel: 'Report Preview', icon: Eye },
    { mode: 'dashboard' as StudioMode, label: 'Dashboard', fullLabel: 'BI Dashboard', icon: LayoutDashboard },
    { mode: 'templates' as StudioMode, label: 'Templates', fullLabel: 'Templates', icon: Grid },
    { mode: 'datasources' as StudioMode, label: 'Data', fullLabel: 'Data Sources', icon: Database },
    { mode: 'docs' as StudioMode, label: 'Docs', fullLabel: 'Integration & Docs', icon: BookOpen, accent: 'text-amber-400' }
  ];

  return (
    <>
      <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-3 sm:px-4 select-none border-b border-slate-800 z-50 relative shrink-0">
        {/* Brand & Title */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 rounded bg-primary-600 flex items-center justify-center font-bold text-white shadow-sm text-sm">
              OR
            </div>
            <span className="font-semibold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
              OpenReport
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-300 border border-primary-500/30 hidden xs:inline-block">
                Studio
              </span>
            </span>
          </div>

          <div className="h-5 w-[1px] bg-slate-700 hidden sm:block shrink-0" />

          <div className="hidden sm:flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-sm font-medium text-slate-300 truncate max-w-[120px] md:max-w-xs" title={reportTitle}>
              {reportTitle}
            </span>
            {isDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
            )}
          </div>
        </div>

        {/* Desktop / Tablet Mode Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 overflow-x-auto max-w-[55vw]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentMode === item.mode;
            return (
              <button
                key={item.mode}
                onClick={() => onModeChange(item.mode)}
                className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-primary-600 text-white shadow'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.accent || ''}`} />
                <span className="inline lg:hidden">{item.label}</span>
                <span className="hidden lg:inline">{item.fullLabel}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions Bar */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Load JSON (Desktop) */}
          <label className="hidden sm:flex cursor-pointer items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded border border-slate-700 transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Load</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>

          {/* Save JSON (Desktop) */}
          <button
            onClick={onSaveJson}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded border border-slate-700 transition"
            title="Download report JSON definition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white rounded shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-1 w-48 bg-slate-800 border border-slate-700 rounded-md shadow-2xl py-1 z-50 text-xs"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => { onExport('pdf'); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                >
                  <span className="font-medium">Adobe PDF (.pdf)</span>
                  <span className="text-[10px] text-primary-400 font-mono">Vector</span>
                </button>
                <button
                  onClick={() => { onExport('xlsx'); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                >
                  <span className="font-medium">Microsoft Excel (.xlsx)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">OpenXML</span>
                </button>
                <button
                  onClick={() => { onExport('csv'); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                >
                  <span className="font-medium">Delimited Data (.csv)</span>
                  <span className="text-[10px] text-amber-400 font-mono">RFC-4180</span>
                </button>
                <button
                  onClick={() => { onExport('html'); setShowExportMenu(false); }}
                  className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700 flex items-center justify-between"
                >
                  <span className="font-medium">Web Document (.html)</span>
                  <span className="text-[10px] text-indigo-400 font-mono">Standalone</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 bottom-0 bg-slate-950/90 backdrop-blur-sm z-40 flex flex-col p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Workspace Views
              </span>
              <span className="text-xs font-medium text-primary-400 truncate max-w-[180px]">
                {reportTitle}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    onClick={() => {
                      onModeChange(item.mode);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 text-xs font-medium rounded-lg text-left transition ${
                      isActive
                        ? 'bg-primary-600 text-white font-semibold shadow'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${item.accent || ''}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition">
                <Upload className="w-3.5 h-3.5" />
                <span>Load JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  onSaveJson();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
