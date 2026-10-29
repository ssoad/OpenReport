# OpenReport Product Vision

## 1. Executive Summary
**OpenReport** is an enterprise-grade, developer-first, open-source reporting and business intelligence platform. Designed as a modern alternative to legacy enterprise reporting solutions like DevExpress Reporting, Telerik Reporting, and SAP Crystal Reports, OpenReport unites pixel-perfect paginated document authoring, interactive web viewing, advanced data visualization, and dashboard analytics into a single, cohesive, framework-agnostic ecosystem.

---

### Figure 0.1: Universal Reporting Platform Ecosystem & Multi-Product Pillars

```mermaid
flowchart TD
    subgraph Products ["OpenReport Multi-Product Offerings"]
        PROD_A["Product A: Embeddable Library<br/>(React Components, Pure JS SDK, Custom Exporters)"]
        PROD_B["Product B: Reporting Runtime<br/>(Headless Node.js, CLI, Serverless Edge Engine)"]
        PROD_C["Product C: Standalone Studio<br/>(Web Visual Designer, Viewer, Data Explorer)"]
    end

    subgraph CoreEngine ["Unified OpenReport Core Engine"]
        SPEC["Universal JSON Report Specification (v1.0.0)"]
        EXPR["Sandboxed AST Expressions & Math Runtime (Zero eval)"]
        DATA["Federated Data Engine (REST, CSV, In-Memory, SQL)"]
        LAYOUT["Two-Pass Banded Layout & Pagination Engine"]
        EXPORTERS["Multi-Target Exporters (Vector PDF, OpenXML Excel, CSV)"]
    end

    subgraph Targets ["Consuming Environments & Frameworks"]
        TARGET_WEB["Next.js / React / Vue / Angular Apps"]
        TARGET_SRV["Node.js / Bun / Express / Nest Services"]
        TARGET_EDGE["Cloudflare Workers / AWS Lambda / Vercel Edge"]
        TARGET_BI["Enterprise Dashboards & Automated Email Dispatch"]
    end

    SPEC --> EXPR
    SPEC --> DATA
    DATA --> LAYOUT
    EXPR --> LAYOUT
    LAYOUT --> EXPORTERS

    PROD_A -.-> SPEC
    PROD_B -.-> SPEC
    PROD_C -.-> SPEC

    EXPORTERS --> TARGET_WEB
    EXPORTERS --> TARGET_SRV
    EXPORTERS --> TARGET_EDGE
    EXPORTERS --> TARGET_BI
```

---

## 2. Core Pillars

### 2.1 Universal, Portable Specification
A report in OpenReport is defined by a declarative, versioned JSON specification. This specification is decoupled from any UI framework, rendering target, or server platform. It can be authored in a browser, modified programmatically via Node.js, Python, or .NET APIs, and rendered headlessly or client-side.

### 2.2 Dual Engine: Paginated Documents & Interactive Dashboards

---

### Figure 0.2: Dual Engine Architecture: Paginated Documents vs BI Dashboards

```mermaid
flowchart LR
    subgraph InputData ["Input Virtualization"]
        DATA_SRC["Federated Data Sources"]
        USER_PARAMS["Runtime Parameters"]
    end

    subgraph SharedCore ["Shared Foundations"]
        TRANSFORM["Sort, Filter, Group & Aggregate Engine"]
        AST_CALC["Safe AST Expression Evaluator"]
    end

    subgraph PaginatedBranch ["Engine Route 1: Banded Document Engine"]
        BAND_LAYOUT["Banded Canvas Model<br/>(Header, Groups, Detail, Footer)"]
        PAGE_SPLIT["Two-Pass Pagination<br/>(Page N of M, Page Breaks)"]
        DOC_OUT["Pixel-Accurate Output<br/>(PDF, OpenXML XLSX, CSV, Print)"]
    end

    subgraph DashboardBranch ["Engine Route 2: Business Intelligence Engine"]
        DASH_GRID["Responsive Multi-Column CSS Grid"]
        KPI_WIDGETS["Interactive KPI Cards & Trend Sparklines"]
        CROSS_FILTER["Cross-Filtering Event Bus & Dynamic Slicing"]
    end

    DATA_SRC --> TRANSFORM
    USER_PARAMS --> TRANSFORM
    TRANSFORM --> AST_CALC

    AST_CALC --> BAND_LAYOUT
    BAND_LAYOUT --> PAGE_SPLIT
    PAGE_SPLIT --> DOC_OUT

    AST_CALC --> DASH_GRID
    DASH_GRID --> KPI_WIDGETS
    KPI_WIDGETS --> CROSS_FILTER
```

---

### 2.3 Sandboxed & Secure Expression Language
Untrusted report definitions must never execute arbitrary code. OpenReport features a custom Abstract Syntax Tree (AST) parser and sandboxed evaluator supporting arithmetic, logical comparisons, date/time functions, string operations, statistical aggregations, and conditional formatting without ever invoking `eval()` or `new Function()`.

### 2.4 Developer-First Embeddability & Modularity
- Zero mandatory server dependencies for browser-based authoring and previewing.
- Rich React components for embedding both the visual Designer and Viewer with full theme and hook support.
- Headless execution engine runnable in any Node.js, Bun, or edge serverless environment.
- Modular architecture where exporters, data providers, and custom chart components can be tree-shaken or dynamically registered.

### 2.5 Data Neutrality & Federation
Connect effortlessly to in-memory datasets, REST APIs, JSON/CSV endpoints, and relational databases. OpenReport provides push-down query optimization, client-side filtering/sorting/grouping, and parameterized query execution with built-in security protections.

---

© OpenReport Contributors. Released under Apache-2.0 License.
