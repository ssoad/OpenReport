import React, { useState } from 'react';
import { ReportDefinition } from '@openreport/schema';
import {
  OpenReportEngine,
  CommercialInvoiceTemplate,
  ExecutiveSalesReportTemplate,
  InventoryStatusTemplate
} from '@openreport/core';
import { Header, StudioMode } from './components/Header';
import { ReportDesigner } from './components/ReportDesigner';
import { ReportViewer } from './components/ReportViewer';
import { DashboardViewer } from './components/DashboardViewer';
import { TemplateGallery } from './components/TemplateGallery';
import { DataSourceManager } from './components/DataSourceManager';
import { DocsViewer } from './components/DocsViewer';

export function App() {
  const [currentReport, setCurrentReport] = useState<ReportDefinition>(CommercialInvoiceTemplate);
  const [mode, setMode] = useState<StudioMode>('designer');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const handleReportChange = (updatedReport: ReportDefinition) => {
    setCurrentReport(updatedReport);
    setIsDirty(true);
  };

  const handleExport = async (format: 'pdf' | 'xlsx' | 'csv' | 'html') => {
    try {
      const engine = new OpenReportEngine(currentReport);
      await engine.loadData();
      await engine.renderDocument();

      const baseName = currentReport.id || 'report';

      if (format === 'pdf') {
        const buffer = await engine.exportPdf();
        downloadBlob(new Blob([buffer as any], { type: 'application/pdf' }), `${baseName}.pdf`);
      } else if (format === 'xlsx') {
        const buffer = await engine.exportXlsx();
        downloadBlob(
          new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
          `${baseName}.xlsx`
        );
      } else if (format === 'csv') {
        const csv = await engine.exportCsv();
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${baseName}.csv`);
      } else if (format === 'html') {
        const html = await engine.exportHtml();
        downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8;' }), `${baseName}.html`);
      }
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveJson = () => {
    const jsonStr = JSON.stringify(currentReport, null, 2);
    downloadBlob(new Blob([jsonStr], { type: 'application/json' }), `${currentReport.id || 'report'}.json`);
    setIsDirty(false);
  };

  const handleLoadJson = (json: any) => {
    try {
      const engine = new OpenReportEngine(json);
      setCurrentReport(engine.getReportDefinition());
      setIsDirty(false);
      alert(`Report "${json.title || json.id}" loaded successfully.`);
    } catch (err: any) {
      alert(`Validation error on load: ${err.message}`);
    }
  };

  const handleReset = () => {
    if (confirm('Reset to standard Commercial Invoice template?')) {
      setCurrentReport(CommercialInvoiceTemplate);
      setIsDirty(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        currentMode={mode}
        onModeChange={setMode}
        reportTitle={currentReport.title}
        onExport={handleExport}
        onSaveJson={handleSaveJson}
        onLoadJson={handleLoadJson}
        onReset={handleReset}
        isDirty={isDirty}
      />

      <div className="flex-1 flex overflow-hidden">
        {mode === 'designer' && (
          <ReportDesigner
            report={currentReport}
            onChange={handleReportChange}
          />
        )}

        {mode === 'preview' && (
          <ReportViewer
            report={currentReport}
            onExport={handleExport}
          />
        )}

        {mode === 'dashboard' && (
          <DashboardViewer />
        )}

        {mode === 'templates' && (
          <TemplateGallery
            currentReportId={currentReport.id}
            onSelectReport={(tpl) => {
              setCurrentReport(tpl);
              setMode('designer');
              setIsDirty(false);
            }}
            onOpenDashboard={() => setMode('dashboard')}
          />
        )}

        {mode === 'datasources' && (
          <DataSourceManager
            report={currentReport}
            onChange={handleReportChange}
          />
        )}

        {mode === 'docs' && (
          <DocsViewer
            currentReport={currentReport}
          />
        )}
      </div>
    </div>
  );
}

export default App;
