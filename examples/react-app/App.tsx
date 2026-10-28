import React, { useState } from 'react';
import { ReportViewer } from '@openreport/viewer-react';
import { ReportDesigner } from '@openreport/designer-react';
import { CommercialInvoiceTemplate } from '@openreport/core';
import { ReportDefinition } from '@openreport/schema';

export function ReactIntegrationExample() {
  const [report, setReport] = useState<ReportDefinition>(CommercialInvoiceTemplate);
  const [viewMode, setViewMode] = useState<'preview' | 'designer'>('preview');

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '1.5rem', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Embedded OpenReport Demo</h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
            Seamlessly embedded inside a standard React / Next.js application.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setViewMode('preview')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'preview' ? '#2563eb' : '#e2e8f0',
              color: viewMode === 'preview' ? '#ffffff' : '#475569',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Report Viewer
          </button>
          <button
            onClick={() => setViewMode('designer')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: viewMode === 'designer' ? '#2563eb' : '#e2e8f0',
              color: viewMode === 'designer' ? '#ffffff' : '#475569',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Report Designer
          </button>
        </div>
      </header>

      <main style={{ height: 'calc(100vh - 120px)' }}>
        {viewMode === 'preview' ? (
          <ReportViewer
            report={report}
            parameters={{ invoiceNumber: 'INV-EMBED-2026' }}
            showToolbar={true}
          />
        ) : (
          <ReportDesigner
            report={report}
            onChange={(updated) => setReport(updated)}
          />
        )}
      </main>
    </div>
  );
}

export default ReactIntegrationExample;
