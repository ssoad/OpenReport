import {
  getPageDimensionsPt,
  getPrintableAreaPt,
  ReportDefinition,
  ReportElement,
  TableElement,
  ChartElement,
  KpiElement,
  TextElement,
  StandardBand
} from '@openreport/schema';
import { Evaluator, formatCurrency, formatNumber, formatPercent, formatDate } from '@openreport/expressions';
import { ProcessedDataset } from '@openreport/data-engine';
import {
  RenderedBox,
  RenderedDocument,
  RenderedPage,
  ChartDataPayload,
  KpiDataPayload
} from './types';
import { TextMeasurer } from './text-measurer';

export interface LayoutOptions {
  parameters?: Record<string, any>;
}

export class LayoutEngine {
  public static layout(
    report: ReportDefinition,
    datasets: Map<string, ProcessedDataset>,
    options: LayoutOptions = {}
  ): RenderedDocument {
    const parameters = options.parameters || {};
    const pageDims = getPageDimensionsPt(report.page);
    const printableArea = getPrintableAreaPt(report.page);

    const pages: RenderedPage[] = [];

    const pageHeaderHeight = report.bands.pageHeader?.height || 0;
    const pageFooterHeight = report.bands.pageFooter?.height || 0;

    const flowStartY = printableArea.top + pageHeaderHeight;
    const flowEndY = pageDims.height - report.page.margins.bottom - pageFooterHeight;
    const flowHeight = flowEndY - flowStartY;

    let currentPageNumber = 1;
    let currentBoxes: RenderedBox[] = [];
    let currentY = flowStartY;

    const addBox = (box: RenderedBox) => {
      currentBoxes.push(box);
    };

    const createNewPage = () => {
      pages.push({
        pageNumber: currentPageNumber,
        width: pageDims.width,
        height: pageDims.height,
        printableWidth: printableArea.width,
        printableHeight: printableArea.height,
        margins: report.page.margins,
        boxes: currentBoxes
      });

      currentPageNumber++;
      currentBoxes = [];
      currentY = flowStartY;
    };

    // 1. Report Header (Page 1)
    if (report.bands.reportHeader && report.bands.reportHeader.elements.length > 0) {
      const rh = report.bands.reportHeader;
      LayoutEngine.layoutBandElements(
        rh.elements,
        addBox,
        printableArea.left,
        currentY,
        datasets,
        parameters
      );
      currentY += rh.height;
    }

    // 2. Detail Band & Content Elements
    const detailBand = report.bands.detail;
    if (detailBand && detailBand.elements.length > 0) {
      for (const element of detailBand.elements) {
        if (element.type === 'table') {
          currentY = LayoutEngine.layoutTableElement(
            element as TableElement,
            addBox,
            printableArea.left,
            currentY,
            flowStartY,
            flowEndY,
            datasets,
            parameters,
            createNewPage
          );
        } else if (element.type === 'chart') {
          // Check if chart fits on current page
          if (currentY + element.height > flowEndY) {
            createNewPage();
          }
          LayoutEngine.layoutChartElement(
            element as ChartElement,
            addBox,
            printableArea.left,
            currentY,
            datasets
          );
          currentY += element.height + 10;
        } else if (element.type === 'kpi') {
          if (currentY + element.height > flowEndY) {
            createNewPage();
          }
          LayoutEngine.layoutKpiElement(
            element as KpiElement,
            addBox,
            printableArea.left,
            currentY,
            datasets,
            parameters
          );
          currentY += element.height + 10;
        } else {
          // Standard element (text, rect, line, image)
          if (currentY + element.height > flowEndY) {
            createNewPage();
          }
          LayoutEngine.layoutSingleElement(
            element,
            addBox,
            printableArea.left,
            currentY,
            datasets,
            parameters
          );
        }
      }
    }

    // 3. Report Footer
    if (report.bands.reportFooter && report.bands.reportFooter.elements.length > 0) {
      const rf = report.bands.reportFooter;
      if (currentY + rf.height > flowEndY) {
        createNewPage();
      }
      LayoutEngine.layoutBandElements(
        rf.elements,
        addBox,
        printableArea.left,
        currentY,
        datasets,
        parameters
      );
      currentY += rf.height;
    }

    // Push the final page
    pages.push({
      pageNumber: currentPageNumber,
      width: pageDims.width,
      height: pageDims.height,
      printableWidth: printableArea.width,
      printableHeight: printableArea.height,
      margins: report.page.margins,
      boxes: currentBoxes
    });

    const totalPages = pages.length;

    // 4. Render Page Header and Page Footer across all generated pages
    for (const page of pages) {
      // Page Header at top margin
      if (report.bands.pageHeader && report.bands.pageHeader.elements.length > 0) {
        const headerBoxes: RenderedBox[] = [];
        LayoutEngine.layoutBandElements(
          report.bands.pageHeader.elements,
          (box) => headerBoxes.push(box),
          printableArea.left,
          printableArea.top,
          datasets,
          parameters,
          { pageNumber: page.pageNumber, totalPages }
        );
        page.boxes.unshift(...headerBoxes);
      }

      // Page Footer at bottom
      if (report.bands.pageFooter && report.bands.pageFooter.elements.length > 0) {
        const footerBoxes: RenderedBox[] = [];
        const footerY = pageDims.height - report.page.margins.bottom - pageFooterHeight;
        LayoutEngine.layoutBandElements(
          report.bands.pageFooter.elements,
          (box) => footerBoxes.push(box),
          printableArea.left,
          footerY,
          datasets,
          parameters,
          { pageNumber: page.pageNumber, totalPages }
        );
        page.boxes.push(...footerBoxes);
      }
    }

    // 5. Pass 2: Re-evaluate page-dependent variables (PageNumber, TotalPages)
    for (const page of pages) {
      for (const box of page.boxes) {
        if (box.originalExpression && (box.originalExpression.includes('PageNumber') || box.originalExpression.includes('TotalPages'))) {
          try {
            box.text = String(
              Evaluator.evaluateExpression(box.originalExpression, {
                fields: box.evalContext?.fields,
                parameters: box.evalContext?.parameters || parameters,
                context: { pageNumber: page.pageNumber, totalPages }
              })
            );
          } catch {
            // Keep existing text
          }
        }
      }
    }

    return {
      id: report.id,
      title: report.title,
      pageCount: totalPages,
      pageSize: report.page.size,
      orientation: report.page.orientation,
      pages,
      generatedAt: new Date().toISOString()
    };
  }

  private static layoutBandElements(
    elements: ReportElement[],
    addBox: (box: RenderedBox) => void,
    originX: number,
    originY: number,
    datasets: Map<string, ProcessedDataset>,
    parameters: Record<string, any>,
    pageContext?: { pageNumber: number; totalPages: number }
  ): void {
    for (const el of elements) {
      LayoutEngine.layoutSingleElement(
        el,
        addBox,
        originX,
        originY,
        datasets,
        parameters,
        pageContext
      );
    }
  }

  private static layoutSingleElement(
    el: ReportElement,
    addBox: (box: RenderedBox) => void,
    originX: number,
    originY: number,
    datasets: Map<string, ProcessedDataset>,
    parameters: Record<string, any>,
    pageContext?: { pageNumber: number; totalPages: number }
  ): void {
    const x = originX + el.x;
    const y = originY + el.y;

    if (el.type === 'text') {
      const textEl = el as TextElement;
      let evaluatedText = textEl.text;
      let isExpr = false;

      if (textEl.text.startsWith('=') || textEl.text.includes('[') || textEl.text.includes('?')) {
        isExpr = true;
        try {
          const res = Evaluator.evaluateExpression(textEl.text, {
            parameters,
            context: pageContext
          });
          evaluatedText = res !== null && res !== undefined ? String(res) : '';
        } catch {
          evaluatedText = textEl.text;
        }
      }

      // Apply formatting if present
      if (textEl.format) {
        evaluatedText = LayoutEngine.applyFormatting(evaluatedText, textEl.format);
      }

      addBox({
        id: el.id,
        type: 'text',
        x,
        y,
        width: el.width,
        height: el.height,
        text: evaluatedText,
        font: textEl.font,
        backgroundColor: textEl.backgroundColor,
        borders: textEl.borders,
        padding: textEl.padding,
        originalExpression: isExpr ? textEl.text : undefined,
        evalContext: { parameters }
      });
    } else if (el.type === 'rect') {
      addBox({
        id: el.id,
        type: 'rect',
        x,
        y,
        width: el.width,
        height: el.height,
        backgroundColor: el.fillColor,
        strokeColor: el.strokeColor,
        strokeWidth: el.strokeWidth,
        borderRadius: el.borderRadius
      });
    } else if (el.type === 'line') {
      addBox({
        id: el.id,
        type: 'line',
        x,
        y,
        width: el.width,
        height: el.height,
        strokeColor: el.strokeColor,
        strokeWidth: el.strokeWidth
      });
    } else if (el.type === 'image') {
      addBox({
        id: el.id,
        type: 'image',
        x,
        y,
        width: el.width,
        height: el.height,
        url: el.url
      });
    } else if (el.type === 'barcode') {
      let barcodeVal = el.valueExpression;
      try {
        const val = Evaluator.evaluateExpression(el.valueExpression, { parameters, context: pageContext });
        barcodeVal = val !== null && val !== undefined ? String(val) : el.valueExpression;
      } catch {
        // fallback
      }
      addBox({
        id: el.id,
        type: 'barcode',
        x,
        y,
        width: el.width,
        height: el.height,
        text: barcodeVal,
        backgroundColor: el.backgroundColor,
        strokeColor: el.color
      });
    }
  }

  private static layoutTableElement(
    table: TableElement,
    addBox: (box: RenderedBox) => void,
    originX: number,
    currentY: number,
    flowStartY: number,
    flowEndY: number,
    datasets: Map<string, ProcessedDataset>,
    parameters: Record<string, any>,
    createNewPage: () => void
  ): number {
    const dataset = datasets.get(table.datasetId);
    const rows = dataset ? dataset.rows : [];

    const tableX = originX + table.x;
    let y = currentY + table.y;

    // Helper to render table header row
    const renderTableHeader = (headerY: number) => {
      let colX = tableX;
      for (const col of table.columns) {
        if (!col.visible) continue;
        addBox({
          id: `${table.id}_hdr_${col.id}`,
          type: 'text',
          x: colX,
          y: headerY,
          width: col.width,
          height: table.headerHeight,
          text: col.title || col.field,
          font: table.headerFont,
          backgroundColor: table.headerBackgroundColor,
          borders: {
            bottom: { width: 1.5, color: '#94a3b8', style: 'solid' },
            all: { width: 0.5, color: '#e2e8f0', style: 'solid' }
          },
          padding: table.cellPadding
        });
        colX += col.width;
      }
    };

    // 1. Initial Table Header
    if (table.showHeader) {
      if (y + table.headerHeight > flowEndY) {
        createNewPage();
        y = flowStartY;
      }
      renderTableHeader(y);
      y += table.headerHeight;
    }

    // 2. Data Rows
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx]!;

      // Check for page break before row
      if (y + table.rowHeight > flowEndY) {
        createNewPage();
        y = flowStartY;
        // Repeat header on new page
        if (table.showHeader) {
          renderTableHeader(y);
          y += table.headerHeight;
        }
      }

      const isAlternate = table.alternatingRowColors && rIdx % 2 === 1;
      const rowBg = isAlternate ? table.alternatingBackgroundColor : undefined;

      let colX = tableX;
      for (const col of table.columns) {
        if (!col.visible) continue;

        let cellValue = row[col.field];
        if (cellValue === undefined && (col.field.startsWith('=') || col.field.includes('['))) {
          try {
            cellValue = Evaluator.evaluateExpression(col.field, { fields: row, parameters });
          } catch {
            cellValue = '';
          }
        }

        let formattedText = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
        if (col.format) {
          formattedText = LayoutEngine.applyFormatting(formattedText, col.format);
        }

        const font = {
          ...table.rowFont,
          align: col.align || table.rowFont.align
        };

        addBox({
          id: `${table.id}_r${rIdx}_c${col.id}`,
          type: 'text',
          x: colX,
          y,
          width: col.width,
          height: table.rowHeight,
          text: formattedText,
          font,
          backgroundColor: rowBg,
          borders: {
            bottom: { width: 0.5, color: '#f1f5f9', style: 'solid' }
          },
          padding: table.cellPadding
        });

        colX += col.width;
      }

      y += table.rowHeight;
    }

    // 3. Summary Row
    if (table.showSummary && rows.length > 0) {
      if (y + table.summaryHeight > flowEndY) {
        createNewPage();
        y = flowStartY;
      }

      let colX = tableX;
      for (const col of table.columns) {
        if (!col.visible) continue;

        let summaryText = '';
        if (col.summary && col.summary !== 'none') {
          const values = rows.map((r) => Number(r[col.field])).filter((n) => !isNaN(n));
          let sumVal = 0;
          if (col.summary === 'sum') sumVal = values.reduce((a, b) => a + b, 0);
          else if (col.summary === 'avg') sumVal = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          else if (col.summary === 'count') sumVal = rows.length;
          else if (col.summary === 'min') sumVal = Math.min(...values);
          else if (col.summary === 'max') sumVal = Math.max(...values);

          summaryText = String(sumVal);
          if (col.format) {
            summaryText = LayoutEngine.applyFormatting(summaryText, col.format);
          }
        }

        addBox({
          id: `${table.id}_summary_${col.id}`,
          type: 'text',
          x: colX,
          y,
          width: col.width,
          height: table.summaryHeight,
          text: summaryText,
          font: { ...table.summaryFont, align: col.align || 'left' },
          backgroundColor: table.summaryBackgroundColor,
          borders: {
            top: { width: 1.5, color: '#94a3b8', style: 'solid' },
            bottom: { width: 1.5, color: '#94a3b8', style: 'solid' }
          },
          padding: table.cellPadding
        });

        colX += col.width;
      }

      y += table.summaryHeight;
    }

    return y;
  }

  private static layoutChartElement(
    chartEl: ChartElement,
    addBox: (box: RenderedBox) => void,
    originX: number,
    currentY: number,
    datasets: Map<string, ProcessedDataset>
  ): void {
    const dataset = datasets.get(chartEl.datasetId);
    const rows = dataset ? dataset.rows : [];

    const categories = rows.map((r) => String(r[chartEl.categoryField] ?? ''));
    const values = rows.map((r) => Number(r[chartEl.valueField]) || 0);

    const chartData: ChartDataPayload = {
      chartType: chartEl.chartType,
      title: chartEl.title,
      categories,
      series: [
        {
          name: chartEl.valueField,
          data: values
        }
      ],
      colors: chartEl.colors,
      showLegend: chartEl.showLegend
    };

    addBox({
      id: chartEl.id,
      type: 'chart',
      x: originX + chartEl.x,
      y: currentY + chartEl.y,
      width: chartEl.width,
      height: chartEl.height,
      chartData
    });
  }

  private static layoutKpiElement(
    kpiEl: KpiElement,
    addBox: (box: RenderedBox) => void,
    originX: number,
    currentY: number,
    datasets: Map<string, ProcessedDataset>,
    parameters: Record<string, any>
  ): void {
    let evaluatedVal = kpiEl.valueExpression;
    try {
      const firstDataset = Array.from(datasets.values())[0];
      const res = Evaluator.evaluateExpression(kpiEl.valueExpression, {
        parameters,
        rows: firstDataset ? firstDataset.rows : []
      });
      evaluatedVal = res !== null && res !== undefined ? String(res) : '';
    } catch {
      // keep
    }

    if (kpiEl.format) {
      evaluatedVal = LayoutEngine.applyFormatting(evaluatedVal, kpiEl.format);
    }

    let changeVal = kpiEl.changeExpression;
    if (kpiEl.changeExpression) {
      try {
        const cRes = Evaluator.evaluateExpression(kpiEl.changeExpression, { parameters });
        changeVal = cRes !== null ? String(cRes) : kpiEl.changeExpression;
      } catch {
        // keep
      }
    }

    const kpiData: KpiDataPayload = {
      title: kpiEl.title,
      value: evaluatedVal,
      subtitle: kpiEl.subtitle,
      change: changeVal,
      trend: kpiEl.trend,
      accentColor: kpiEl.accentColor
    };

    addBox({
      id: kpiEl.id,
      type: 'kpi',
      x: originX + kpiEl.x,
      y: currentY + kpiEl.y,
      width: kpiEl.width,
      height: kpiEl.height,
      kpiData,
      backgroundColor: '#ffffff',
      borders: {
        all: { width: 1, color: '#e2e8f0', style: 'solid' }
      },
      borderRadius: 6
    });
  }

  private static applyFormatting(valStr: string, format: any): string {
    const num = Number(valStr);
    if (!isNaN(num) && format.type) {
      if (format.type === 'currency') {
        return formatCurrency(num, format.currencyCode || 'USD', format.decimals ?? 2);
      }
      if (format.type === 'percent') {
        return formatPercent(num, format.decimals ?? 1);
      }
      if (format.type === 'number') {
        return formatNumber(num, format.pattern, format.decimals ?? 2);
      }
    }

    if (format.type === 'date') {
      return formatDate(valStr, format.pattern || 'YYYY-MM-DD');
    }

    return valStr;
  }
}
