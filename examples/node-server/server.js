/**
 * OpenReport Node.js / Express Integration Example
 * Demonstrates generating PDFs, Excel spreadsheets, and CSVs on the server.
 */

const http = require('http');
const { OpenReportEngine, CommercialInvoiceTemplate, ExecutiveSalesReportTemplate } = require('@openreport/core');

const PORT = process.env.PORT || 4000;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers for embedding
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // 1. Healthcheck
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', engine: 'OpenReport', version: '0.1.0' }));
      return;
    }

    // 2. Export Commercial Invoice as PDF: GET /api/invoice/pdf
    if (url.pathname === '/api/invoice/pdf') {
      const invoiceNumber = url.searchParams.get('invoiceNumber') || 'INV-2026-SERVER';
      const engine = new OpenReportEngine(CommercialInvoiceTemplate, {
        parameters: { invoiceNumber }
      });

      const pdfBuffer = await engine.exportPdf();
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length
      });
      res.end(Buffer.from(pdfBuffer));
      return;
    }

    // 3. Export Sales Report as Excel XLSX: GET /api/sales/xlsx
    if (url.pathname === '/api/sales/xlsx') {
      const engine = new OpenReportEngine(ExecutiveSalesReportTemplate);
      const xlsxBuffer = await engine.exportXlsx();

      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="sales-performance.xlsx"',
        'Content-Length': xlsxBuffer.length
      });
      res.end(Buffer.from(xlsxBuffer));
      return;
    }

    // 4. Custom Report Render via POST /api/render
    if (url.pathname === '/api/render' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          const reportDef = payload.report || CommercialInvoiceTemplate;
          const engine = new OpenReportEngine(reportDef, {
            parameters: payload.parameters
          });

          const doc = await engine.renderDocument(payload.data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(doc));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    // Default 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found', availableEndpoints: ['/api/invoice/pdf', '/api/sales/xlsx', '/api/render'] }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`OpenReport Server running at http://localhost:${PORT}`);
    console.log(`- Try: http://localhost:${PORT}/api/invoice/pdf?invoiceNumber=INV-9001`);
    console.log(`- Try: http://localhost:${PORT}/api/sales/xlsx`);
  });
}

module.exports = server;
