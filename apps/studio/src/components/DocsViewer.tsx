import React, { useState } from 'react';
import {
  Code,
  BookOpen,
  Terminal,
  Copy,
  Check,
  Layers,
  Cpu,
  Shield,
  FileCode,
  Zap,
  Globe,
  Server,
  Database
} from 'lucide-react';
import { ReportDefinition } from '@openreport/schema';

interface DocsViewerProps {
  currentReport: ReportDefinition;
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ currentReport }) => {
  const [activeSection, setActiveSection] = useState<'quickstart' | 'react' | 'node' | 'python' | 'vanilla' | 'cli' | 'architecture' | 'schema'>('quickstart');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const codeSnippets = {
    install: `npm install @openreport/core @openreport/schema @openreport/exporters @openreport/data-engine`,
    reactViewer: `import React from 'react';
import { ReportViewer } from '@openreport/viewer-react';
import myInvoiceTemplate from './invoice-report.json';

export function InvoicePage({ invoiceId }: { invoiceId: string }) {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <ReportViewer
        report={myInvoiceTemplate}
        parameters={{ invoiceId }}
        showToolbar={true}
        onExport={(format, data) => {
          console.log(\`Report exported in \${format} format\`);
        }}
      />
    </div>
  );
}`,
    reactDesigner: `import React, { useState } from 'react';
import { ReportDesigner } from '@openreport/designer-react';
import { ReportDefinition } from '@openreport/schema';
import baseTemplate from './templates/standard.json';

export function ReportBuilder() {
  const [report, setReport] = useState<ReportDefinition>(baseTemplate);

  const handleSave = async (updated: ReportDefinition) => {
    setReport(updated);
    await fetch('/api/reports/' + updated.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
  };

  return (
    <div style={{ height: '100vh' }}>
      <ReportDesigner
        initialReport={report}
        onChange={handleSave}
      />
    </div>
  );
}`,
    nodeServer: `import express from 'express';
import { OpenReportEngine } from '@openreport/core';
import invoiceTemplate from './templates/invoice.json' assert { type: 'json' };

const app = express();
app.use(express.json());

// Server-side PDF generation endpoint
app.post('/api/reports/invoice/pdf', async (req, res) => {
  try {
    const { invoiceId, tenantId } = req.body;

    const engine = new OpenReportEngine(invoiceTemplate);
    await engine.loadData({ invoiceId, tenantId });
    await engine.renderDocument();

    const pdfBuffer = await engine.exportPdf();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', \`attachment; filename="invoice-\${invoiceId}.pdf"\`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server-side Excel generation endpoint
app.post('/api/reports/sales/xlsx', async (req, res) => {
  try {
    const engine = new OpenReportEngine(salesTemplate);
    await engine.loadData(req.body);
    await engine.renderDocument();

    const xlsxBuffer = await engine.exportXlsx();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-summary.xlsx"');
    res.send(Buffer.from(xlsxBuffer));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('OpenReport Server running on :3000'));`,
    nextjsRoute: `// app/api/reports/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { OpenReportEngine } from '@openreport/core';
import template from '@/reports/quarterly-sales.json';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const engine = new OpenReportEngine(template);
  await engine.loadData(body);
  await engine.renderDocument();

  const pdfBytes = await engine.exportPdf();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="report.pdf"'
    }
  });
}`,
    pythonClient: `import requests

# OpenReport REST API Client
def generate_pdf_report(report_id: str, params: dict, output_path: str):
    url = f"http://localhost:3000/api/reports/{report_id}/pdf"
    response = requests.post(url, json=params)
    
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            f.write(response.content)
        print(f"Report generated successfully: {output_path}")
    else:
        raise Exception(f"Failed to generate report: {response.text}")

if __name__ == "__main__":
    generate_pdf_report("commercial_invoice", {"orderId": "INV-908234"}, "invoice.pdf")`,
    vanillaJs: `<!DOCTYPE html>
<html>
<head>
  <title>OpenReport Client Integration</title>
</head>
<body>
  <button id="downloadPdf">Download Invoice PDF</button>

  <script type="module">
    import { OpenReportEngine } from './node_modules/@openreport/core/dist/index.js';

    document.getElementById('downloadPdf').addEventListener('click', async () => {
      const template = await fetch('/templates/invoice.json').then(r => r.json());
      const engine = new OpenReportEngine(template);
      
      await engine.loadData();
      await engine.renderDocument();
      
      const pdfBytes = await engine.exportPdf();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoice.pdf';
      a.click();
    });
  </script>
</body>
</html>`,
    cliUsage: `# 1. Validate a report definition against the schema
openreport validate ./my-report.json

# 2. Inspect structure, bands, data bindings, and elements
openreport inspect ./my-report.json

# 3. Export to PDF, XLSX, or CSV directly from terminal
openreport export ./my-report.json --format pdf --out ./output.pdf
openreport export ./my-report.json --format xlsx --out ./output.xlsx
openreport export ./my-report.json --format csv --out ./output.csv

# 4. Initialize a new template in the current project
openreport init invoice --name "Q4 Client Invoice"`
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Mobile Horizontal Section Tabs */}
      <div className="flex md:hidden overflow-x-auto p-2 gap-1.5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 select-none">
        {[
          { id: 'quickstart', label: 'Quickstart', icon: Zap, accent: 'text-amber-500' },
          { id: 'react', label: 'React', icon: Code, accent: 'text-cyan-500' },
          { id: 'node', label: 'Node.js', icon: Server, accent: 'text-emerald-500' },
          { id: 'python', label: 'Python', icon: Globe, accent: 'text-blue-500' },
          { id: 'vanilla', label: 'Vanilla JS', icon: FileCode, accent: 'text-yellow-500' },
          { id: 'cli', label: 'CLI', icon: Terminal, accent: 'text-purple-500' },
          { id: 'architecture', label: 'Architecture', icon: Layers, accent: 'text-indigo-500' },
          { id: 'schema', label: 'JSON Spec', icon: Database, accent: 'text-pink-500' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition ${
                isActive
                  ? 'bg-primary-600 text-white font-semibold shadow'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.accent || ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:flex w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 p-4 flex-col space-y-6 select-none shrink-0">
        <div>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-2">
            Developer Guides
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveSection('quickstart')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition ${
                activeSection === 'quickstart'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Quickstart & Installation</span>
            </button>
            <button
              onClick={() => setActiveSection('react')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition ${
                activeSection === 'react'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Code className="w-4 h-4 text-cyan-500" />
              <span>React & Next.js Integration</span>
            </button>
            <button
              onClick={() => setActiveSection('node')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition ${
                activeSection === 'node'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Server className="w-4 h-4 text-emerald-500" />
              <span>Node.js & Backend API</span>
            </button>
            <button
              onClick={() => setActiveSection('python')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition ${
                activeSection === 'python'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Python & Microservices</span>
            </button>
            <button
              onClick={() => setActiveSection('vanilla')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition ${
                activeSection === 'vanilla'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-4 h-4 text-yellow-500" />
              <span>Vanilla JS & Browser</span>
            </button>
            <button
              onClick={() => setActiveSection('cli')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition ${
                activeSection === 'cli'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-4 h-4 text-purple-500" />
              <span>OpenReport CLI Binary</span>
            </button>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 mb-2">
            Architecture & Spec
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setActiveSection('architecture')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition ${
                activeSection === 'architecture'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>How OpenReport Works</span>
            </button>
            <button
              onClick={() => setActiveSection('schema')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition ${
                activeSection === 'schema'
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4 text-pink-500" />
              <span>Active Report JSON Spec</span>
            </button>
          </div>
        </div>

        <div className="mt-auto p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cleanroom Open Source</span>
          </div>
          <p>Apache-2.0 License. Zero proprietary code. Compatible with Node, Bun, Deno, and standard Web Browsers.</p>
        </div>
      </div>

      {/* Main Documentation Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6 sm:space-y-8 w-full">
        {/* Section: Quickstart */}
        {activeSection === 'quickstart' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Zap className="w-6 h-6 text-amber-500" />
                OpenReport Developer Quickstart
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                OpenReport is a modular, TypeScript-first reporting engine that runs anywhere JavaScript executes: in modern web browsers, Node.js microservices, Next.js / Remix / Vite apps, and serverless edge functions.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 font-semibold">1. Install core packages</span>
                <button
                  onClick={() => copyToClipboard(codeSnippets.install, 'install')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedKey === 'install' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'install' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-primary-300 overflow-x-auto p-2 bg-slate-900/80 rounded">
                {codeSnippets.install}
              </pre>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Why developers choose OpenReport over legacy tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
                  <div className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Zero-Eval AST Expressions
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Math, aggregates (`SUM`, `AVG`), and currency formatting execute inside an AST evaluator with zero arbitrary code execution risk.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
                  <div className="font-semibold text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Multi-Target Native Exporters
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Vector PDFs via pure JavaScript (`pdf-lib`), real styled multi-sheet Excel files (`exceljs`), RFC-4180 CSVs with formula injection prevention, and responsive HTML.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
                  <div className="font-semibold text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Built-in Vector Barcodes & QR
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Generates Code 128 barcodes and 2D QR Code matrices natively in vector coordinates without calling external web APIs.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-sm">
                  <div className="font-semibold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> True Monorepo Modularity
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Embed just the viewer in your client app, run just the exporter in Node, or run the whole studio standalone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: React */}
        {activeSection === 'react' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Code className="w-6 h-6 text-cyan-500" />
                React & Next.js Integration
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Embed interactive report viewers or visual report designers directly into your React, Next.js, Remix, or Vite applications.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">1. Embeddable Report Viewer Component</h3>
                <button
                  onClick={() => copyToClipboard(codeSnippets.reactViewer, 'reactViewer')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedKey === 'reactViewer' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'reactViewer' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-slate-200 p-4 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                {codeSnippets.reactViewer}
              </pre>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">2. Next.js App Router API Route (Server-side PDF Generation)</h3>
                <button
                  onClick={() => copyToClipboard(codeSnippets.nextjsRoute, 'nextjsRoute')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedKey === 'nextjsRoute' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'nextjsRoute' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-slate-200 p-4 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                {codeSnippets.nextjsRoute}
              </pre>
            </div>
          </div>
        )}

        {/* Section: Node */}
        {activeSection === 'node' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Server className="w-6 h-6 text-emerald-500" />
                Node.js & Express REST Microservice
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Run OpenReport as a headless backend reporting service. Generate thousands of PDFs or Excel spreadsheets concurrently without headless browsers like Puppeteer.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Express.js Production REST Server</h3>
                <button
                  onClick={() => copyToClipboard(codeSnippets.nodeServer, 'nodeServer')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedKey === 'nodeServer' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'nodeServer' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-slate-200 p-4 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                {codeSnippets.nodeServer}
              </pre>
            </div>
          </div>
        )}

        {/* Section: Python */}
        {activeSection === 'python' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-500" />
                Python & Polyglot Integration
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Integrate OpenReport into Django, Flask, FastAPI, or Celery backends via our HTTP microservice or CLI wrapper.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Python HTTP Client Example</h3>
                <button
                  onClick={() => copyToClipboard(codeSnippets.pythonClient, 'pythonClient')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedKey === 'pythonClient' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'pythonClient' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-slate-200 p-4 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                {codeSnippets.pythonClient}
              </pre>
            </div>
          </div>
        )}

        {/* Section: Vanilla JS */}
        {activeSection === 'vanilla' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <FileCode className="w-6 h-6 text-yellow-500" />
                Vanilla JavaScript & Single-Page Apps
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                No React or Angular required. The core OpenReport engine runs cleanly in standard HTML5 pages using native ES modules.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Single Page Client-Side PDF Generation</h3>
                <button
                  onClick={() => copyToClipboard(codeSnippets.vanillaJs, 'vanillaJs')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedKey === 'vanillaJs' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'vanillaJs' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-slate-200 p-4 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                {codeSnippets.vanillaJs}
              </pre>
            </div>
          </div>
        )}

        {/* Section: CLI */}
        {activeSection === 'cli' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Terminal className="w-6 h-6 text-purple-500" />
                OpenReport Command Line Interface (CLI)
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Automate report generation in CI/CD pipelines, cron jobs, GitHub Actions, and containerized workflows.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">CLI Commands</h3>
                <button
                  onClick={() => copyToClipboard(codeSnippets.cliUsage, 'cliUsage')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedKey === 'cliUsage' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cliUsage' ? 'Copied!' : 'Copy Commands'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-purple-300 p-4 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                {codeSnippets.cliUsage}
              </pre>
            </div>
          </div>
        )}

        {/* Section: Architecture */}
        {activeSection === 'architecture' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Layers className="w-6 h-6 text-indigo-500" />
                How OpenReport Works Under the Hood
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                A high-performance 4-stage pipeline that guarantees deterministic execution across any environment.
              </p>
            </div>

            {/* Visual Figure 1: Pipeline Execution Flow */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Figure 1: Architectural Pipeline & Data Flow
              </span>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/60 dark:bg-indigo-950/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Stage 1</span>
                    <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Schema Contract</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Versioned JSON definition parsed and validated with zero runtime dependencies.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Stage 2</span>
                    <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Data Virtualization</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Federated providers fetch, filter, sort, and group datasets deterministically.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Stage 3</span>
                    <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">2-Pass Layout</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Pass 1 calculates geometry & page count; Pass 2 resolves page-number expressions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/30 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">Stage 4</span>
                    <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Multi Exporters</h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Direct streaming to vector PDF, Excel OpenXML XLSX, sanitized CSV, and SVG.
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Figure 2: Band Anatomy & Printing Order */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Figure 2: The OpenReport Band Model Lifecycle
              </span>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 font-mono text-xs shadow-sm">
                <div className="p-2.5 rounded bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-indigo-900 dark:text-indigo-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="font-bold">Report Header</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 dark:text-indigo-300">Prints ONCE at the start of page 1</span>
                </div>

                <div className="p-2.5 rounded bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 flex items-center justify-between text-sky-900 dark:text-sky-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span className="font-bold">Page Header</span>
                  </div>
                  <span className="text-[10px] text-sky-700 dark:text-sky-300">Repeats at top of EVERY page</span>
                </div>

                <div className="p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-bold">Group Header</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300">Prints on category change; repeats on page breaks</span>
                </div>

                <div className="p-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 space-y-1 text-slate-800 dark:text-slate-200">
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Detail Band (Dynamic Table Rows)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Repeats for each data record</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    <div>Row 1: [Invoice Item #1]</div>
                    <div>Row 2: [Invoice Item #2]</div>
                    <div>Row N: [Auto-paginates]</div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-bold">Group Footer</span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300">Category subtotal expressions: =SUM([Total])</span>
                </div>

                <div className="p-2.5 rounded bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-purple-900 dark:text-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="font-bold">Report Footer</span>
                  </div>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300">Grand totals & legal signatures on final page</span>
                </div>

                <div className="p-2.5 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-between text-rose-900 dark:text-rose-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-bold">Page Footer</span>
                  </div>
                  <span className="text-[10px] text-rose-700 dark:text-rose-300">="Page " + PageNumber + " of " + TotalPages</span>
                </div>
              </div>
            </div>

            {/* Visual Figure 3: Coordinate System & Box Model */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Figure 3: Coordinate System & Measurement Conversions
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block">1 Point (pt)</span>
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">1 / 72 inch</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Base engine unit</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block">1 Millimeter</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">2.83465 pt</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">ISO metric standard</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block">1 Inch (in)</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">72.0 pt</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Imperial standard</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase block">1 Pixel (px)</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">0.75 pt</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">96 DPI baseline</span>
                </div>
              </div>
            </div>

            {/* Detailed Stage Cards */}
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">1</span>
                  <span>Specification & Diagnostic Validation</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-8">
                  The JSON report specification is validated against the versioned JSON Schema contract (`@openreport/schema`). Old format templates are automatically migrated forward with zero breaking changes.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">2</span>
                  <span>Data Engine & Query Virtualization</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-8">
                  Datasets are fetched through federated `IDataProvider` adapters (Memory, REST API, JSON, CSV, or custom SQL). Filter, sort, and parameter values are applied deterministically.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">3</span>
                  <span>Two-Pass Layout Engine & Pagination</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-8">
                  <strong>Pass 1:</strong> Content is laid out across bands. Dynamic tables evaluate word wrapping, splitting rows across page boundaries while repeating headers.<br />
                  <strong>Pass 2:</strong> Expressions with `PageNumber` and `TotalPages` are resolved once final page counts are known.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs">4</span>
                  <span>Native Multi-Target Exporters</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 pl-8">
                  The computed document boxes are streamed directly to destination formats: vector PDF (`pdf-lib`), multi-sheet OpenXML (`exceljs`), sanitized CSV, or standalone responsive HTML.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section: Schema Explorer */}
        {activeSection === 'schema' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Database className="w-6 h-6 text-pink-500" />
                Active Report JSON Definition
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Below is the live, serialized JSON specification of the currently selected template in the studio ({currentReport.title}).
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                  ID: <span className="text-primary-600 dark:text-primary-400 font-bold">{currentReport.id}</span> | Version: {currentReport.schemaVersion}
                </span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(currentReport, null, 2), 'schema')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
                >
                  {copiedKey === 'schema' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'schema' ? 'Copied JSON!' : 'Copy Raw JSON'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-slate-300 p-4 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto max-h-[500px]">
                {JSON.stringify(currentReport, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
