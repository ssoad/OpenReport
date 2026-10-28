#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { validateReportDefinition, ReportDefinition } from '@openreport/schema';
import { OpenReportEngine, CommercialInvoiceTemplate } from '@openreport/core';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (command === 'validate') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Error: Missing file path to validate. Usage: openreport validate <file.json>');
      process.exit(1);
    }
    await handleValidate(filePath);
  } else if (command === 'inspect') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Error: Missing file path to inspect. Usage: openreport inspect <file.json>');
      process.exit(1);
    }
    await handleInspect(filePath);
  } else if (command === 'export') {
    const filePath = args[1];
    if (!filePath) {
      console.error('Error: Missing file path to export. Usage: openreport export <file.json> [--format pdf|csv|xlsx|html|svg] [--output <path>]');
      process.exit(1);
    }
    await handleExport(filePath, args.slice(2));
  } else if (command === 'init') {
    const reportName = args[1] || 'new-report';
    await handleInit(reportName);
  } else {
    console.error(`Unknown command: "${command}". Run "openreport --help" for available commands.`);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
OpenReport CLI - Developer-First Reporting & Analytics Engine

Usage:
  openreport <command> [options]

Commands:
  validate <file.json>                         Validate a report definition against schema
  inspect <file.json>                          Inspect report structure, datasets, and bands
  export <file.json> [options]                 Render and export report
    --format <pdf|csv|xlsx|html|svg>           Target export format (default: pdf)
    --output <path>                            Target output destination file
  init <name>                                  Create a starter report definition JSON file
  `);
}

async function handleValidate(filePath: string) {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found at "${resolved}"`);
    process.exit(1);
  }

  try {
    const rawContent = fs.readFileSync(resolved, 'utf-8');
    const parsed = JSON.parse(rawContent);
    const result = validateReportDefinition(parsed);

    if (result.valid) {
      console.log(`✓ Report "${parsed.title || parsed.id}" is VALID.`);
      if (result.diagnostics.length > 0) {
        console.log('\nWarnings:');
        for (const diag of result.diagnostics) {
          console.log(`  - [${diag.code}] ${diag.path}: ${diag.message}`);
        }
      }
      process.exit(0);
    } else {
      console.error(`✗ Report definition has ${result.diagnostics.length} diagnostic error(s):`);
      for (const diag of result.diagnostics) {
        console.error(`  - [${diag.code}] ${diag.path}: ${diag.message}`);
      }
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`Error parsing JSON: ${err.message}`);
    process.exit(1);
  }
}

async function handleInspect(filePath: string) {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found at "${resolved}"`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(resolved, 'utf-8');
  const report: ReportDefinition = JSON.parse(rawContent);

  console.log(`\n======================================================`);
  console.log(`Report ID:    ${report.id}`);
  console.log(`Title:        ${report.title}`);
  console.log(`Schema:       ${report.schemaVersion}`);
  console.log(`Page:         ${report.page.size} (${report.page.orientation}), margins: ${report.page.margins.top}pt`);
  console.log(`Parameters:   ${report.parameters?.length || 0}`);
  console.log(`DataSources:  ${report.dataSources?.length || 0}`);
  console.log(`Datasets:     ${report.datasets?.length || 0}`);
  console.log(`------------------------------------------------------`);
  console.log(`Bands:`);
  console.log(`  - Report Header: ${report.bands.reportHeader ? `${report.bands.reportHeader.elements.length} element(s)` : 'None'}`);
  console.log(`  - Page Header:   ${report.bands.pageHeader ? `${report.bands.pageHeader.elements.length} element(s)` : 'None'}`);
  console.log(`  - Detail:        ${report.bands.detail ? `${report.bands.detail.elements.length} element(s)` : 'None'}`);
  console.log(`  - Page Footer:   ${report.bands.pageFooter ? `${report.bands.pageFooter.elements.length} element(s)` : 'None'}`);
  console.log(`  - Report Footer: ${report.bands.reportFooter ? `${report.bands.reportFooter.elements.length} element(s)` : 'None'}`);
  console.log(`======================================================\n`);
}

async function handleExport(filePath: string, options: string[]) {
  const resolved = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: File not found at "${resolved}"`);
    process.exit(1);
  }

  let format = 'pdf';
  let outputPath = '';

  for (let i = 0; i < options.length; i++) {
    if (options[i] === '--format' && options[i + 1]) {
      format = options[i + 1]!.toLowerCase();
      i++;
    } else if (options[i] === '--output' && options[i + 1]) {
      outputPath = options[i + 1]!;
      i++;
    }
  }

  const rawContent = fs.readFileSync(resolved, 'utf-8');
  const reportDef: ReportDefinition = JSON.parse(rawContent);

  const engine = new OpenReportEngine(reportDef);
  await engine.loadData();
  const doc = await engine.renderDocument();

  if (!outputPath) {
    const baseName = path.basename(filePath, path.extname(filePath));
    outputPath = path.resolve(process.cwd(), `${baseName}.${format === 'xlsx' ? 'xlsx' : format}`);
  } else {
    outputPath = path.resolve(process.cwd(), outputPath);
  }

  console.log(`Rendering report "${reportDef.title}" (${doc.pageCount} page(s))...`);

  if (format === 'pdf') {
    const buffer = await engine.exportPdf();
    fs.writeFileSync(outputPath, buffer);
  } else if (format === 'csv') {
    const csv = await engine.exportCsv();
    fs.writeFileSync(outputPath, csv, 'utf-8');
  } else if (format === 'xlsx') {
    const buffer = await engine.exportXlsx();
    fs.writeFileSync(outputPath, buffer);
  } else if (format === 'html') {
    const html = await engine.exportHtml();
    fs.writeFileSync(outputPath, html, 'utf-8');
  } else if (format === 'svg') {
    const svg = await engine.exportSvg(0);
    fs.writeFileSync(outputPath, svg, 'utf-8');
  } else {
    console.error(`Unsupported format: "${format}". Choose from: pdf, csv, xlsx, html, svg.`);
    process.exit(1);
  }

  console.log(`✓ Exported successfully to "${outputPath}"`);
}

async function handleInit(name: string) {
  const targetFile = path.resolve(process.cwd(), `${name}.json`);
  if (fs.existsSync(targetFile)) {
    console.error(`Error: File "${targetFile}" already exists.`);
    process.exit(1);
  }

  const starterTemplate = JSON.parse(JSON.stringify(CommercialInvoiceTemplate));
  starterTemplate.id = name;
  starterTemplate.title = name.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  fs.writeFileSync(targetFile, JSON.stringify(starterTemplate, null, 2), 'utf-8');
  console.log(`✓ Initialized starter report definition at "${targetFile}".`);
}

main().catch((err) => {
  console.error(`CLI execution failed: ${err.message}`);
  process.exit(1);
});
