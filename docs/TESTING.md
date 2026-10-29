# OpenReport Quality Assurance & Testing Guide

---

### Figure 13.1: Quality Assurance & Multi-Tier Verification Pyramid

```mermaid
flowchart TD
    subgraph E2E ["Tier 3: Deterministic Fixtures & E2E Validation"]
        FIX["Deterministic Enterprise Fixtures<br/>(Sales Invoice, Warehouse Inventory, Balance Sheet)"]
        ACC["Mathematical Baselines<br/>(Verifies exact subtotals, grand totals, and page counts)"]
        FIX --> ACC
    end

    subgraph Integration ["Tier 2: Subsystem Integration & CLI Tests"]
        PIPE["Full Pipeline Integration<br/>(Spec -> Data -> Safe AST -> Layout -> Exporters)"]
        CLI_TEST["CLI Commands Suite<br/>(validate, inspect, export)"]
        PIPE --> CLI_TEST
    end

    subgraph Unit ["Tier 1: Unit & Security Boundary Tests"]
        U_EXPR["Expressions Lexer & AST Grammars"]
        U_SCHEMA["Schema Validation & Version Migrations"]
        U_DATA["Data Querying, Grouping & Sorting"]
        U_LAYOUT["Banded Pagination & Typography Wrapping"]
        U_EXP["PDF, Excel & CSV Formula Sanitization"]
    end

    subgraph CI ["Continuous Integration Pipeline"]
        GHA["GitHub Actions CI Workflow<br/>(TypeScript strict typecheck, Vitest 35 tests, zero warnings)"]
    end

    Unit --> Integration
    Integration --> E2E
    E2E --> GHA
```

---

## 1. Testing Strategy
OpenReport implements a comprehensive, multi-layer testing pyramid:

1. **Unit Tests**:
   - `packages/expressions`: Lexer tokenization, AST parser grammar, operator precedence, null-handling semantics, mathematical functions, string operations, date calculations, and sandboxing security boundaries.
   - `packages/schema`: Schema validation, defaults application, error path reporting, and version migrations.
   - `packages/data-engine`: In-memory querying, CSV parsing, data transformations, multi-level grouping, and sorting.
   - `packages/layout-engine`: Geometry calculations, text measurement, page-break decisions, band sequencing, and two-pass variable resolution.
   - `packages/exporters`: PDF generation validity, Excel workbook structure, CSV output quoting, and formula-injection defenses.

2. **Integration Tests**:
   - End-to-end report rendering: definition -> data binding -> layout engine -> PDF/Excel/CSV document output.
   - CLI execution tests: validation, inspection, and export commands.

3. **Deterministic Fixture Tests**:
   - Fixed sample datasets (e.g., Northwind-style sales orders, regional inventory, financial balance sheets).
   - Expected page counts and summary calculations verified against known mathematical baselines.

## 2. Running Tests
```bash
# Run all tests across the monorepo
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode during development
pnpm test:watch
```
