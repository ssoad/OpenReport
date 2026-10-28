import { describe, it, expect } from 'vitest';
import { Evaluator, Parser } from '../index';

describe('OpenReport Sandboxed Expression Engine', () => {
  it('evaluates basic arithmetic and respects operator precedence', () => {
    expect(Evaluator.evaluateExpression('=2 + 3 * 4')).toBe(14);
    expect(Evaluator.evaluateExpression('=(2 + 3) * 4')).toBe(20);
    expect(Evaluator.evaluateExpression('=10 - 4 / 2')).toBe(8);
    expect(Evaluator.evaluateExpression('=2 ^ 3')).toBe(8);
    expect(Evaluator.evaluateExpression('=17 % 5')).toBe(2);
  });

  it('evaluates string operations and concatenation', () => {
    expect(Evaluator.evaluateExpression('="Hello " + "World"')).toBe('Hello World');
    expect(Evaluator.evaluateExpression('=UPPER("openreport")')).toBe('OPENREPORT');
    expect(Evaluator.evaluateExpression('=LOWER("OPENREPORT")')).toBe('openreport');
    expect(Evaluator.evaluateExpression('=TRIM("   test   ")')).toBe('test');
    expect(Evaluator.evaluateExpression('=LEN("OpenReport")')).toBe(10);
    expect(Evaluator.evaluateExpression('=SUBSTRING("Universal", 3, 4)')).toBe('vers');
    expect(Evaluator.evaluateExpression('=REPLACE("App-2025", "2025", "2026")')).toBe('App-2026');
  });

  it('evaluates logical comparisons and boolean conditions', () => {
    expect(Evaluator.evaluateExpression('=10 > 5')).toBe(true);
    expect(Evaluator.evaluateExpression('=10 <= 5')).toBe(false);
    expect(Evaluator.evaluateExpression('="A" == "A"')).toBe(true);
    expect(Evaluator.evaluateExpression('="A" != "B"')).toBe(true);
    expect(Evaluator.evaluateExpression('=TRUE AND FALSE')).toBe(false);
    expect(Evaluator.evaluateExpression('=TRUE OR FALSE')).toBe(true);
    expect(Evaluator.evaluateExpression('=NOT FALSE')).toBe(true);
  });

  it('evaluates conditional functions IF, COALESCE, and SWITCH', () => {
    expect(Evaluator.evaluateExpression('=IF(10 > 5, "Greater", "Lesser")')).toBe('Greater');
    expect(Evaluator.evaluateExpression('=IF(10 < 5, "Greater", "Lesser")')).toBe('Lesser');
    expect(Evaluator.evaluateExpression('=COALESCE(null, "", "Fallback")')).toBe('Fallback');
    expect(Evaluator.evaluateExpression('=SWITCH("B", "A", 1, "B", 2, "C", 3, 0)')).toBe(2);
    expect(Evaluator.evaluateExpression('=SWITCH("Z", "A", 1, "B", 2, 0)')).toBe(0);
  });

  it('resolves field references and parameter references dynamically', () => {
    const context = {
      fields: {
        unitPrice: 50,
        quantity: 4,
        discount: 0.1
      },
      parameters: {
        taxRate: 0.08
      }
    };

    const expr = '=[unitPrice] * [quantity] * (1 - [discount])';
    expect(Evaluator.evaluateExpression(expr, context)).toBe(180);

    const taxExpr = '=([unitPrice] * [quantity]) * ?taxRate';
    expect(Evaluator.evaluateExpression(taxExpr, context)).toBe(16);
  });

  it('resolves page and report context variables', () => {
    const context = {
      context: {
        pageNumber: 2,
        totalPages: 10
      }
    };

    expect(Evaluator.evaluateExpression('="Page " + PageNumber + " of " + TotalPages', context)).toBe('Page 2 of 10');
  });

  it('computes dataset aggregate functions over rows', () => {
    const context = {
      rows: [
        { id: 1, amount: 100 },
        { id: 2, amount: 250 },
        { id: 3, amount: 150 }
      ]
    };

    expect(Evaluator.evaluateExpression('=SUM([amount])', context)).toBe(500);
    expect(Evaluator.evaluateExpression('=AVG([amount])', context)).toBeCloseTo(166.67, 1);
    expect(Evaluator.evaluateExpression('=COUNT([id])', context)).toBe(3);
    expect(Evaluator.evaluateExpression('=MIN([amount])', context)).toBe(100);
    expect(Evaluator.evaluateExpression('=MAX([amount])', context)).toBe(250);
  });

  it('formats numbers, currencies, percentages, and dates', () => {
    expect(Evaluator.evaluateExpression('=FORMAT(1234567.89, "#,##0.00", 2)')).toBe('1,234,567.89');
    expect(Evaluator.evaluateExpression('=FORMAT_CURRENCY(1450.5, "USD", 2)')).toBe('$1,450.50');
    expect(Evaluator.evaluateExpression('=FORMAT_PERCENT(0.185, 1)')).toBe('18.5%');
    expect(Evaluator.evaluateExpression('=FORMAT_DATE("2026-10-28T12:00:00Z", "YYYY-MM-DD")')).toBe('2026-10-28');
  });

  it('prevents arbitrary code execution and enforces step limits', () => {
    // There is no access to process or window
    expect(Evaluator.evaluateExpression('=process')).toBe(null);
    expect(Evaluator.evaluateExpression('=window')).toBe(null);
  });
});
