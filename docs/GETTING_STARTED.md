# OpenReport Getting Started Guide

Get up and running with OpenReport in under 5 minutes.

---

## 1. Installation

Install the OpenReport core packages in your application:

```bash
# Using npm
npm install @openreport/core @openreport/schema @openreport/exporters

# Using pnpm
pnpm add @openreport/core @openreport/schema @openreport/exporters

# Using yarn
yarn add @openreport/core @openreport/schema @openreport/exporters
```

If you are using React or Next.js, also install the embeddable UI components:
```bash
npm install @openreport/viewer-react @openreport/designer-react
```

---

## 2. Basic Concepts

An OpenReport document lifecycle consists of three simple stages:

```
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│ 1. Report Specification │ ───> │   2. Execution Engine   │ ───> │  3. Target Output File  │
│    Declarative JSON     │      │   Layout & Calculation  │      │   PDF, Excel, or React  │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
```

1. **Specification (`ReportDefinition`)**: A portable JSON document describing page dimensions, margins, bands, datasets, and elements.
2. **Engine (`OpenReportEngine`)**: Loads datasets, safely parses expressions, calculates dynamic line-wrapping, and paginates into a `RenderedDocument`.
3. **Exporters & Viewers**: Converts the document model into a multi-page vector PDF, styled Excel spreadsheet, or interactive UI.

---

## 3. Quickstart Example (Node.js or Browser)

Create a file named `generate-invoice.ts`:

```typescript
import { OpenReportEngine, ReportDefinition } from '@openreport/core';
import * as fs from 'fs';

// 1. Define your report template
const invoiceReport: ReportDefinition = {
  schemaVersion: '1.0.0',
  id: 'quickstart-invoice',
  title: 'Customer Invoice',
  page: {
    size: 'A4',
    orientation: 'portrait',
    margins: { top: 36, right: 36, bottom: 36, left: 36 },
    unit: 'pt'
  },
  dataSources: [
    {
      id: 'orders',
      provider: 'memory',
      data: [
        { item: 'Cloud Hosting Subscription', qty: 1, price: 1200 },
        { item: 'Architecture Consulting', qty: 8, price: 150 },
        { item: '24/7 SLA Support', qty: 12, price: 300 }
      ]
    }
  ],
  datasets: [
    {
      id: 'orderItems',
      dataSourceId: 'orders',
      calculatedFields: [
        { name: 'lineTotal', expression: '=[qty] * [price]' }
      ]
    }
  ],
  bands: {
    reportHeader: {
      id: 'header-band',
      type: 'reportHeader',
      height: 60,
      elements: [
        {
          id: 'title',
          type: 'text',
          x: 0,
          y: 0,
          width: 300,
          height: 28,
          text: 'CUSTOMER INVOICE',
          font: { family: 'Helvetica', size: 16, weight: 'bold', color: '#1e293b' }
        }
      ]
    },
    detail: {
      id: 'detail-band',
      type: 'detail',
      height: 150,
      elements: [
        {
          id: 'items-table',
          type: 'table',
          datasetId: 'orderItems',
          x: 0,
          y: 10,
          width: 523,
          height: 120,
          showHeader: true,
          showSummary: true,
          columns: [
            { id: 'c1', field: 'item', title: 'Item Description', width: 250, align: 'left' },
            { id: 'c2', field: 'qty', title: 'Qty', width: 60, align: 'right' },
            { id: 'c3', field: 'price', title: 'Unit Price', width: 100, align: 'right', format: { type: 'currency', currencyCode: 'USD' } },
            { id: 'c4', field: 'lineTotal', title: 'Total', width: 113, align: 'right', format: { type: 'currency', currencyCode: 'USD' }, summary: 'sum' }
          ]
        }
      ]
    },
    pageFooter: {
      id: 'footer-band',
      type: 'pageFooter',
      height: 30,
      elements: [
        {
          id: 'page-box',
          type: 'text',
          x: 350,
          y: 5,
          width: 173,
          height: 16,
          text: '="Page " + PageNumber + " of " + TotalPages',
          font: { family: 'Helvetica', size: 9, color: '#94a3b8', align: 'right' }
        }
      ]
    }
  }
};

async function run() {
  // 2. Initialize the OpenReport engine
  const engine = new OpenReportEngine(invoiceReport);

  // 3. Load data and render paginated document
  console.log('Rendering paginated document...');
  const document = await engine.renderDocument();
  console.log(`Document rendered: ${document.pageCount} page(s) generated.`);

  // 4. Export to PDF and Excel
  const pdfBytes = await engine.exportPdf();
  fs.writeFileSync('invoice.pdf', pdfBytes);
  console.log('✓ PDF written to invoice.pdf');

  const xlsxBytes = await engine.exportXlsx();
  fs.writeFileSync('invoice.xlsx', xlsxBytes);
  console.log('✓ Excel written to invoice.xlsx');
}

run();
```

---

## 4. Embedding in React / Next.js

```tsx
import React from 'react';
import { ReportViewer } from '@openreport/viewer-react';
import { CommercialInvoiceTemplate } from '@openreport/core';

export function InvoicePage() {
  return (
    <div style={{ height: '800px' }}>
      <ReportViewer
        report={CommercialInvoiceTemplate}
        parameters={{ invoiceNumber: 'INV-2026-0042' }}
        showToolbar={true}
      />
    </div>
  );
}
```

---

## 5. Next Steps

- Explore the [Integration Guide](INTEGRATION_GUIDE.md) for Vue, Angular, Python, and REST APIs.
- Read the [Expressions Reference](EXPRESSIONS_REFERENCE.md) to build calculated formulas and conditional formatting.
- Check the [Data Providers Guide](DATA_PROVIDERS.md) to connect to PostgreSQL, REST endpoints, and custom databases.
