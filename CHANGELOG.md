# Changelog

All notable changes to OpenReport are documented in this file.

## [0.1.0] - 2026-10-28
### Added
- **Universal Report Specification (`@openreport/schema`)**:
  - Declarative JSON Schema (v1.0.0) with TypeScript types and validation.
  - Page geometries (A4, Letter, Legal, Custom) and standard unit conversions (pt, mm, in, px).
  - Banded document model: ReportHeader, PageHeader, GroupHeader, Detail, GroupFooter, PageFooter, ReportFooter.
- **Sandboxed Expression Engine (`@openreport/expressions`)**:
  - Custom AST Lexer, Parser, and Evaluator with zero `eval()` security guarantee.
  - Full mathematical, string, date/time, logical, and aggregation (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`) standard libraries.
  - Conditional formatting rules and number/currency/date formatters.
- **Data Engine & Providers (`@openreport/data-engine`)**:
  - In-Memory, JSON, and RFC-4180 CSV Data Providers.
  - Query pipeline: filtering, multi-column sorting, hierarchical grouping, and calculated fields.
- **Layout & Pagination Engine (`@openreport/layout-engine`)**:
  - Multi-pass layout engine with dynamic content measurement, line-wrapping, and keep-together constraints.
  - Two-pass pagination resolving total page counts (`PageNumber` of `TotalPages`).
- **Multi-Target Exporters (`@openreport/exporters`)**:
  - PDF Exporter (pure JavaScript via `pdf-lib`).
  - Excel Exporter (styled OpenXML `.xlsx` via `exceljs`).
  - CSV Exporter with RFC-4180 compliance and CSV formula-injection mitigations.
  - Semantic HTML and SVG renderers.
- **Visual Designer & Interactive Viewer (`@openreport/designer-react`, `@openreport/viewer-react`)**:
  - Desktop-grade web designer with drag-and-drop canvas, snapping rulers, property inspector, and undo/redo.
  - Interactive multi-page and continuous viewer with zoom (25%-500%), parameter panel, and direct exports.
- **Business Intelligence & Dashboards (`@openreport/dashboard`)**:
  - Responsive multi-column grid dashboard engine with KPI cards, bar charts, line charts, area charts, and donut charts.
  - Interactive cross-filtering between analytical widgets.
- **CLI & Standalone Studio (`@openreport/cli`, `apps/studio`)**:
  - Command-line tool `openreport` (`validate`, `inspect`, `export`, `init`).
  - Production-ready OpenReport Studio web application with built-in template gallery and real sample datasets.
