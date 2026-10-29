# OpenReport System Architecture

## 1. High-Level Architecture Overview

OpenReport is engineered around a clean, decoupled, layered pipeline architecture. The platform separates document specification, data virtualization, calculation runtime, layout pagination, and multi-target exporting into distinct, independently testable packages.

---

### Figure 1.1: System Data Flow & Pipeline Architecture

```mermaid
flowchart LR
    subgraph Inputs ["1. Inputs & Authoring"]
        direction TB
        JSON["📄 Report JSON Specification"]
        PARAMS["⚙️ User Execution Parameters"]
    end

    subgraph CoreEngine ["2. OpenReport Processing Engine"]
        direction TB
        VALID["1. Schema Validation & Migrations"]
        DATA["2. Federated Data Virtualization"]
        EXPR["3. Sandboxed Safe AST Engine"]
        PAGINATE["4. Two-Pass Pagination Engine"]
        VALID --> DATA --> EXPR --> PAGINATE
    end

    subgraph Exporters ["3. Multi-Target Exporters"]
        direction TB
        PDF["📕 High-Fidelity Vector PDF"]
        XLSX["📗 Native OpenXML Excel (.xlsx)"]
        CSV["📊 Sanitized CSV (RFC-4180)"]
        VIEWER["👁️ Interactive React Viewer"]
    end

    JSON --> VALID
    PARAMS --> VALID
    PAGINATE --> PDF
    PAGINATE --> XLSX
    PAGINATE --> CSV
    PAGINATE --> VIEWER
```

---

### Figure 1.2: Two-Pass Pagination Sequence

```mermaid
sequenceDiagram
    autonumber
    participant App as Consuming App / Viewer
    participant Engine as OpenReportEngine
    participant Data as DataEngine
    participant Layout as LayoutEngine
    participant Exporter as Exporters (PDF / XLSX)

    App->>Engine: execute(report, { parameters })
    Engine->>Data: fetchDatasets(report.dataSources)
    Data-->>Engine: validated records [rows]
    Engine->>Layout: paginateReport(report, datasets)
    Note over Layout: Pass 1: Measure bands, split rows, compute total pages
    Note over Layout: Pass 2: Substitute Page N of M variables
    Layout-->>Engine: RenderedDocument (pages, visual boxes)
    App->>Engine: exportToPdf()
    Engine->>Exporter: renderToPdf(renderedDocument)
    Exporter-->>App: Uint8Array (binary PDF stream)
```

---

### Figure 1.3: Monorepo Package Topology & Layered Dependencies

```mermaid
flowchart LR
    subgraph UI ["1. Applications & Embeddable UI"]
        direction TB
        STUDIO["apps/studio<br/>(Standalone Studio)"]
        CLI["@openreport/cli<br/>(Developer CLI)"]
        VIEWER["@openreport/viewer-react<br/>(Viewer Component)"]
        DESIGNER["@openreport/designer-react<br/>(Designer Component)"]
        STUDIO --> VIEWER
        STUDIO --> DESIGNER
    end

    subgraph Core ["2. Core Orchestration & Exporters"]
        direction TB
        FACADE["@openreport/core<br/>(Unified Facade)"]
        LAYOUT["@openreport/layout-engine<br/>(Two-Pass Pagination)"]
        EXPORTERS["@openreport/exporters<br/>(PDF, XLSX, CSV, HTML)"]
        FACADE --> LAYOUT
        FACADE --> EXPORTERS
        LAYOUT --> EXPORTERS
    end

    subgraph Foundation ["3. Compute & Specification Foundation"]
        direction TB
        EXPR["@openreport/expressions<br/>(Safe AST Evaluator)"]
        DATA["@openreport/data-engine<br/>(Query Virtualization)"]
        SCHEMA["@openreport/schema<br/>(Spec v1.0.0 & Zod)"]
        EXPR --> SCHEMA
        DATA --> SCHEMA
    end

    VIEWER --> FACADE
    DESIGNER --> FACADE
    CLI --> FACADE

    LAYOUT --> EXPR
    LAYOUT --> DATA
```

---

## 2. Core Subsystems

### 2.1 Universal Report Specification (`packages/schema`)
- Standardized, declarative JSON structure (`ReportDefinition`).
- Type-safe schema validator with actionable, element-specific diagnostic errors.
- Schema versioning and migration engine (`v1.0.0` to future versions).
- Definition of page geometry, bands (Report Header/Footer, Page Header/Footer, Group Header/Footer, Detail), component hierarchy, datasets, parameters, and style tokens.

### 2.2 Expression & Calculation Engine (`packages/expressions`)
- Safe Lexer and Recursive-Descent AST Parser.
- AST nodes: BinaryOp, UnaryOp, FunctionCall, MemberAccess, FieldRef (`[Field]`), ParamRef (`?Param`), Literal.
- Evaluator with strictly sandboxed environment—NO `eval` or `Function()`.
- Built-in library:
  - Aggregations: `SUM`, `AVG`, `COUNT`, `MIN`, `MAX`, `FIRST`, `LAST`.
  - Math: `ROUND`, `FLOOR`, `CEIL`, `ABS`, `CLAMP`, `PERCENT`.
  - Text: `UPPER`, `LOWER`, `CONCAT`, `SUBSTRING`, `TRIM`, `REPLACE`, `FORMAT`.
  - Date/Time: `NOW`, `TODAY`, `DATEADD`, `DATEDIFF`, `FORMATDATE`, `YEAR`, `MONTH`, `DAY`.
  - Logic: `IF`, `COALESCE`, `SWITCH`, `ISNULL`, `ISBLANK`.
- Formatter: standard locale-aware currency, percentage, decimal, and date string formatting.

### 2.3 Data Engine & Federated Providers (`packages/data-engine`)
- Neutral Provider Interface:
  - `MemoryDataProvider`: in-memory JS array data.
  - `JsonDataProvider`: raw or URL-fetched JSON documents.
  - `CsvDataProvider`: RFC-4180 compliant CSV parser with type inference.
  - `RestApiDataProvider`: secure authenticated HTTP fetching with parameter interpolation.
- Query Transformation Pipeline:
  - Filter evaluation via expressions.
  - Multi-column sorting (Ascending/Descending, nulls first/last).
  - Grouping by expressions with hierarchical grouping support.
  - Group-level and global aggregations.
  - Calculated fields computed dynamically on row iteration.

### 2.4 Layout & Multi-Pass Pagination Engine (`packages/layout-engine`)
- Band Model:
  1. `ReportHeader` (printed once at the start).
  2. `PageHeader` (printed at top of every page).
  3. `GroupHeader` (printed at start of each group break, optionally repeated on every page).
  4. `Detail` (repeated for each data row).
  5. `GroupFooter` (printed at group end, with subtotal summaries).
  6. `ReportFooter` (printed before page footer at end of report).
  7. `PageFooter` (printed at bottom of every page).
- Measurement System:
  - Abstract point unit (pt) base: `1 in = 72 pt`, `1 mm = 2.83465 pt`, `1 px = 0.75 pt` (at 96 DPI).
  - Exact text bounding box calculations and wrapping.
  - Keep-together rules to prevent orphaned headers or split rows.
- Two-Pass Layout:
  - Pass 1: Measure and compute page allocation, calculate `TotalPages`.
  - Pass 2: Resolve page-dependent expressions (e.g. `"Page " + PageNumber + " of " + TotalPages`) and output layout tree (`RenderedDocument`).

### 2.5 Multi-Target Exporters (`packages/exporters`)
- **PDF**: Generates compliant, multi-page PDF documents with vector text, lines, rectangles, background fills, images, and embedded font metrics.
- **Excel (XLSX)**: Produces formatted spreadsheets with typed numbers, dates, currency formats, column widths, and cell borders.
- **CSV**: RFC-4180 compliant delimited output with delimiter configuration, double-quote escaping, and automated CSV formula-injection mitigation (`=`, `+`, `-`, `@` sanitization).
- **HTML / SVG**: Standalone, responsive semantic HTML and scalable vector graphics for embedding and instant printing.

### 2.6 Visual Designer (`packages/designer-react`)
- Visual drag-and-drop workspace with interactive rulers, snapping guidelines, multi-selection, and resize handles.
- Real-time two-way synchronization with the underlying report JSON schema.
- Interactive property inspector with data-binding selector, typography, borders, and conditional format rules.
- Undo/redo history stack, copy/paste, layer reordering, and element grouping.

### 2.7 Interactive Viewer (`packages/viewer-react`)
- Multi-page and continuous view modes with pinch/slider zoom (25% to 500%), fit-to-width, and fit-to-page.
- Live interactive parameter panel allowing users to re-filter and re-query on the fly.
- Document outline, full-text search with highlight, and one-click direct export to PDF, Excel, and CSV.

### 2.8 Business Intelligence & Dashboards (`packages/dashboard`)
- Unified dashboard definition model supporting responsive multi-column grid layouts.
- Interactive widgets: KPI Cards, Bar Charts, Line Charts, Area Charts, Donut/Pie Charts, and Data Grids.
- Cross-filtering bus: clicking a category in one widget dynamically filters all dependent widgets.
