# OpenReport Security Model

## 1. Threat Model & Philosophy
OpenReport is designed from the ground up under the principle of **Zero-Trust Execution**. Report templates, parameter inputs, and dataset contents are treated as untrusted data.

---

### Figure 8.1: Zero-Trust Security & Sandboxing Architecture

```mermaid
flowchart TD
    subgraph UntrustedZone ["Untrusted Inputs"]
        JSON_IN["Report Template JSON"]
        DATA_IN["External Dataset Rows"]
        PARAM_IN["User Runtime Parameters"]
    end

    subgraph DefenseLayer1 ["Layer 1: Schema & Type Verification"]
        SCHEMA_VAL["Zod Schema Validator<br/>(Validates structure & bounds)"]
        PARAM_CLEAN["Parameter Coercion & Bounds Check"]
    end

    subgraph DefenseLayer2 ["Layer 2: Sandboxed Expression Engine"]
        LEXER["Formal Lexer Tokenizer"]
        AST_BUILD["Recursive-Descent AST Builder"]
        EVAL_BOX["Safe Visitor Evaluator<br/>(Zero eval, Zero Function, Step Limit: 10,000)"]
        SCOPE_GUARD["Strict Scope Guard<br/>(No window, document, process, or require)"]
    end

    subgraph DefenseLayer3 ["Layer 3: Output Neutralization & Exporters"]
        CSV_DEF["CSV / Excel Formula Shield<br/>(Neutralizes =, +, -, @ triggers)"]
        PDF_VEC["Vector PDF Renderer<br/>(No JavaScript embedding)"]
        DOM_ESC["Semantic HTML Escaping<br/>(XSS Mitigation)"]
    end

    subgraph TrustedOutputs ["Trusted Document Outputs"]
        CLEAN_PDF["Safe Vector PDF Document"]
        CLEAN_XLSX["Safe Native Excel Spreadsheet"]
        CLEAN_CSV["Safe RFC-4180 CSV File"]
    end

    JSON_IN --> SCHEMA_VAL
    PARAM_IN --> PARAM_CLEAN
    DATA_IN --> PARAM_CLEAN

    SCHEMA_VAL --> LEXER
    PARAM_CLEAN --> LEXER
    LEXER --> AST_BUILD
    AST_BUILD --> EVAL_BOX
    SCOPE_GUARD -.-> EVAL_BOX

    EVAL_BOX --> CSV_DEF
    EVAL_BOX --> PDF_VEC
    EVAL_BOX --> DOM_ESC

    CSV_DEF --> CLEAN_CSV
    CSV_DEF --> CLEAN_XLSX
    PDF_VEC --> CLEAN_PDF
```

---

## 2. Key Security Safeguards

### 2.1 Sandboxed Expression Evaluation (Zero `eval`)
Many traditional reporting tools (and legacy JavaScript engines) evaluate user expressions using `eval()`, `new Function()`, or script engines that expose host object scopes (`process`, `window`, prototype pollution, etc.).

**OpenReport strictly forbids code execution:**
- Custom Tokenizer and AST (Abstract Syntax Tree) Parser.
- Strict Visitor-based Evaluator with a finite, allowlisted mathematical and string function table.
- No access to global objects (`window`, `document`, `global`, `process`, `require`, `import`).
- Execution step counter and loop limits to prevent Infinite Loop / Denial of Service (ReDoS / algorithmic complexity attacks).

### 2.2 CSV & Spreadsheet Formula Injection Protection
When exporting user-supplied strings into CSV or Excel files, malicious strings beginning with `=`, `+`, `-`, `@`, `\t`, or `\r` can trigger external command execution or DDE attacks when opened in Microsoft Excel or Google Sheets.

**Mitigation:**
OpenReport's CSV and Excel exporters automatically sanitize and quote formulas. Leading formula trigger characters are prepended with an apostrophe (`'`) or safely escaped, rendering them as inert text strings.

### 2.3 Parameterized Queries & Data Isolation
- Data providers enforce parameterized queries to prevent SQL and NoSQL injection.
- Credentials (such as database passwords and API tokens) are strictly isolated on server execution contexts and never serialized into client-side report definitions.

### 2.4 Multi-Tenancy & Authorization Boundaries
- Dataset requests accept an ambient `SecurityContext` containing user tenant ID, roles, and permissions.
- Row-level security (RLS) filters are applied to queries before execution.

## 3. Vulnerability Reporting
To report a security vulnerability, please email `security@openreport.org` or open a confidential security advisory on GitHub.
