import { ASTNode } from './ast';
import { Parser } from './parser';
import { formatDate, formatCurrency, formatNumber, formatPercent } from './formatter';

export interface EvaluationContext {
  fields?: Record<string, any>;
  parameters?: Record<string, any>;
  context?: Record<string, any>; // e.g. { pageNumber: 1, totalPages: 5, rowNumber: 10 }
  rows?: Record<string, any>[]; // current dataset rows for aggregate functions
}

export class Evaluator {
  private static MAX_STEPS = 50_000;

  public static evaluate(ast: ASTNode, context: EvaluationContext = {}): any {
    let steps = 0;

    const checkLimit = () => {
      steps++;
      if (steps > Evaluator.MAX_STEPS) {
        throw new Error('Expression evaluation exceeded step execution limit (potential denial-of-service prevention).');
      }
    };

    const evalNode = (node: ASTNode): any => {
      checkLimit();

      switch (node.type) {
        case 'Literal':
          return node.value;

        case 'FieldRef': {
          const val = context.fields ? context.fields[node.name] : undefined;
          return val !== undefined ? val : null;
        }

        case 'ParamRef': {
          const val = context.parameters ? context.parameters[node.name] : undefined;
          return val !== undefined ? val : null;
        }

        case 'Identifier': {
          const lower = node.name.toLowerCase();
          // Built-in contextual variables
          if (lower === 'pagenumber') return context.context?.pageNumber ?? 1;
          if (lower === 'totalpages') return context.context?.totalPages ?? 1;
          if (lower === 'rownumber') return context.context?.rowNumber ?? 1;

          // Check fields first if user omitted square brackets e.g. status == 'PAID'
          if (context.fields && node.name in context.fields) {
            return context.fields[node.name];
          }
          if (context.parameters && node.name in context.parameters) {
            return context.parameters[node.name];
          }
          if (context.context && node.name in context.context) {
            return context.context[node.name];
          }
          return null;
        }

        case 'UnaryOp': {
          const operand = evalNode(node.operand);
          if (node.operator === '-') return -Number(operand);
          if (node.operator === '!' || node.operator.toUpperCase() === 'NOT') return !operand;
          throw new Error(`Unknown unary operator "${node.operator}"`);
        }

        case 'BinaryOp': {
          const op = node.operator.toUpperCase();

          // Short-circuit logical operations
          if (op === 'AND' || op === '&&') {
            const leftVal = evalNode(node.left);
            if (!leftVal) return false;
            return Boolean(evalNode(node.right));
          }

          if (op === 'OR' || op === '||') {
            const leftVal = evalNode(node.left);
            if (leftVal) return true;
            return Boolean(evalNode(node.right));
          }

          const left = evalNode(node.left);
          const right = evalNode(node.right);

          // Arithmetic
          if (op === '+') {
            if (typeof left === 'string' || typeof right === 'string') {
              return String(left ?? '') + String(right ?? '');
            }
            return Number(left ?? 0) + Number(right ?? 0);
          }
          if (op === '-') return Number(left ?? 0) - Number(right ?? 0);
          if (op === '*') return Number(left ?? 0) * Number(right ?? 0);
          if (op === '/') {
            const r = Number(right);
            if (r === 0) return 0; // safe divide by zero
            return Number(left ?? 0) / r;
          }
          if (op === '%') return Number(left ?? 0) % Number(right ?? 1);
          if (op === '^') return Math.pow(Number(left ?? 0), Number(right ?? 0));

          // Comparisons
          if (op === '==' || op === '=') return left === right;
          if (op === '!=' || op === '<>') return left !== right;
          if (op === '<') return Number(left) < Number(right);
          if (op === '<=') return Number(left) <= Number(right);
          if (op === '>') return Number(left) > Number(right);
          if (op === '>=') return Number(left) >= Number(right);

          throw new Error(`Unknown binary operator "${node.operator}"`);
        }

        case 'FunctionCall': {
          return Evaluator.executeFunction(node.name, node.args, evalNode, context);
        }

        case 'Conditional': {
          const condition = evalNode(node.condition);
          return condition ? evalNode(node.consequent) : evalNode(node.alternate);
        }

        default:
          throw new Error(`Unsupported AST node type in evaluator: ${(node as any).type}`);
      }
    };

    return evalNode(ast);
  }

  public static evaluateExpression(expression: string, context: EvaluationContext = {}): any {
    if (!expression || typeof expression !== 'string') return expression;

    const trimmed = expression.trim();

    // If starts with '=' it is definitely an expression
    if (trimmed.startsWith('=')) {
      const ast = Parser.parse(trimmed);
      return Evaluator.evaluate(ast, context);
    }

    // If it contains field reference '[Field]' or parameter reference '?Param'
    if (trimmed.includes('[') || trimmed.includes('?')) {
      try {
        const ast = Parser.parse(trimmed);
        return Evaluator.evaluate(ast, context);
      } catch {
        // Fallback to literal text if not valid expression syntax
        return expression;
      }
    }

    return expression;
  }

  private static executeFunction(
    name: string,
    args: ASTNode[],
    evalNode: (node: ASTNode) => any,
    context: EvaluationContext
  ): any {
    const fnName = name.toUpperCase();

    // --- Aggregations ---
    if (['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'FIRST', 'LAST'].includes(fnName)) {
      const firstArg = args[0];
      if (!firstArg) return 0;

      // Case A: Argument is a field reference and rows exist
      if (firstArg.type === 'FieldRef' && context.rows && context.rows.length > 0) {
        const fieldName = firstArg.name;
        const values = context.rows.map((r) => r[fieldName]).filter((v) => v !== null && v !== undefined);

        if (fnName === 'COUNT') return values.length;
        if (values.length === 0) return 0;

        const nums = values.map(Number).filter((n) => !isNaN(n));
        if (nums.length === 0) return 0;

        if (fnName === 'SUM') return nums.reduce((acc, curr) => acc + curr, 0);
        if (fnName === 'AVG') return nums.reduce((acc, curr) => acc + curr, 0) / nums.length;
        if (fnName === 'MIN') return Math.min(...nums);
        if (fnName === 'MAX') return Math.max(...nums);
        if (fnName === 'FIRST') return values[0];
        if (fnName === 'LAST') return values[values.length - 1];
      }

      // Case B: Evaluated argument is already an array
      const evaluated = evalNode(firstArg);
      if (Array.isArray(evaluated)) {
        if (fnName === 'COUNT') return evaluated.length;
        if (evaluated.length === 0) return 0;
        const nums = evaluated.map(Number).filter((n) => !isNaN(n));
        if (fnName === 'SUM') return nums.reduce((acc, curr) => acc + curr, 0);
        if (fnName === 'AVG') return nums.reduce((acc, curr) => acc + curr, 0) / nums.length;
        if (fnName === 'MIN') return Math.min(...nums);
        if (fnName === 'MAX') return Math.max(...nums);
        if (fnName === 'FIRST') return evaluated[0];
        if (fnName === 'LAST') return evaluated[evaluated.length - 1];
      }

      // Case C: Single scalar value fallback
      if (fnName === 'COUNT') return evaluated !== null && evaluated !== undefined ? 1 : 0;
      return evaluated ?? 0;
    }

    // --- Conditionals & Logic ---
    if (fnName === 'IF') {
      if (args.length < 3) throw new Error('IF requires 3 arguments: IF(condition, trueValue, falseValue)');
      const cond = evalNode(args[0]!);
      return cond ? evalNode(args[1]!) : evalNode(args[2]!);
    }

    if (fnName === 'COALESCE') {
      for (const arg of args) {
        const val = evalNode(arg);
        if (val !== null && val !== undefined && val !== '') return val;
      }
      return null;
    }

    if (fnName === 'SWITCH') {
      // SWITCH(val, case1, res1, case2, res2, ..., defaultRes)
      if (args.length < 3) throw new Error('SWITCH requires at least 3 arguments');
      const target = evalNode(args[0]!);
      for (let i = 1; i < args.length - 1; i += 2) {
        const caseVal = evalNode(args[i]!);
        if (target === caseVal) {
          return evalNode(args[i + 1]!);
        }
      }
      // If odd number of args, last is default
      if (args.length % 2 === 0) {
        return evalNode(args[args.length - 1]!);
      }
      return null;
    }

    if (fnName === 'ISNULL') {
      const val = evalNode(args[0]!);
      return val === null || val === undefined;
    }

    if (fnName === 'ISBLANK') {
      const val = evalNode(args[0]!);
      return val === null || val === undefined || val === '';
    }

    // --- Math ---
    if (fnName === 'ROUND') {
      const num = Number(evalNode(args[0]!));
      const decimals = args[1] ? Number(evalNode(args[1]!)) : 0;
      const factor = Math.pow(10, decimals);
      return Math.round(num * factor) / factor;
    }

    if (fnName === 'FLOOR') return Math.floor(Number(evalNode(args[0]!)));
    if (fnName === 'CEIL') return Math.ceil(Number(evalNode(args[0]!)));
    if (fnName === 'ABS') return Math.abs(Number(evalNode(args[0]!)));
    if (fnName === 'CLAMP') {
      const val = Number(evalNode(args[0]!));
      const min = Number(evalNode(args[1]!));
      const max = Number(evalNode(args[2]!));
      return Math.min(Math.max(val, min), max);
    }
    if (fnName === 'PERCENT') {
      const val = Number(evalNode(args[0]!));
      const total = Number(evalNode(args[1]!));
      return total === 0 ? 0 : val / total;
    }

    // --- String ---
    if (fnName === 'UPPER') return String(evalNode(args[0]!) ?? '').toUpperCase();
    if (fnName === 'LOWER') return String(evalNode(args[0]!) ?? '').toLowerCase();
    if (fnName === 'TRIM') return String(evalNode(args[0]!) ?? '').trim();
    if (fnName === 'LEN') return String(evalNode(args[0]!) ?? '').length;
    if (fnName === 'CONCAT') {
      return args.map((a) => String(evalNode(a) ?? '')).join('');
    }
    if (fnName === 'SUBSTRING') {
      const str = String(evalNode(args[0]!) ?? '');
      const start = Number(evalNode(args[1]!));
      const len = args[2] ? Number(evalNode(args[2]!)) : undefined;
      return len !== undefined ? str.substring(start, start + len) : str.substring(start);
    }
    if (fnName === 'REPLACE') {
      const str = String(evalNode(args[0]!) ?? '');
      const search = String(evalNode(args[1]!) ?? '');
      const repl = String(evalNode(args[2]!) ?? '');
      return str.split(search).join(repl);
    }
    if (fnName === 'LEFT') {
      const str = String(evalNode(args[0]!) ?? '');
      const count = Number(evalNode(args[1]!));
      return str.substring(0, count);
    }
    if (fnName === 'RIGHT') {
      const str = String(evalNode(args[0]!) ?? '');
      const count = Number(evalNode(args[1]!));
      return str.substring(Math.max(0, str.length - count));
    }

    // --- Date / Time ---
    if (fnName === 'NOW') return new Date().toISOString();
    if (fnName === 'TODAY') return new Date().toISOString().split('T')[0]!;
    if (fnName === 'YEAR') {
      const d = new Date(evalNode(args[0]!));
      return d.getFullYear();
    }
    if (fnName === 'MONTH') {
      const d = new Date(evalNode(args[0]!));
      return d.getMonth() + 1;
    }
    if (fnName === 'DAY') {
      const d = new Date(evalNode(args[0]!));
      return d.getDate();
    }
    if (fnName === 'DATEADD') {
      const d = new Date(evalNode(args[0]!));
      const amount = Number(evalNode(args[1]!));
      const unit = String(evalNode(args[2]!) ?? 'day').toLowerCase();
      if (unit === 'day' || unit === 'days') d.setDate(d.getDate() + amount);
      else if (unit === 'month' || unit === 'months') d.setMonth(d.getMonth() + amount);
      else if (unit === 'year' || unit === 'years') d.setFullYear(d.getFullYear() + amount);
      return d.toISOString();
    }

    // --- Formatting ---
    if (fnName === 'FORMAT') {
      const val = Number(evalNode(args[0]!));
      const pattern = args[1] ? String(evalNode(args[1]!)) : undefined;
      const dec = args[2] ? Number(evalNode(args[2]!)) : 2;
      return formatNumber(val, pattern, dec);
    }
    if (fnName === 'FORMAT_CURRENCY') {
      const val = Number(evalNode(args[0]!));
      const curr = args[1] ? String(evalNode(args[1]!)) : 'USD';
      const dec = args[2] ? Number(evalNode(args[2]!)) : 2;
      return formatCurrency(val, curr, dec);
    }
    if (fnName === 'FORMAT_PERCENT') {
      const val = Number(evalNode(args[0]!));
      const dec = args[1] ? Number(evalNode(args[1]!)) : 1;
      return formatPercent(val, dec);
    }
    if (fnName === 'FORMAT_DATE' || fnName === 'FORMATDATE') {
      const dateVal = evalNode(args[0]!);
      const pattern = args[1] ? String(evalNode(args[1]!)) : 'YYYY-MM-DD';
      return formatDate(dateVal, pattern);
    }

    throw new Error(`Unknown function "${name}" called in report expression`);
  }
}
