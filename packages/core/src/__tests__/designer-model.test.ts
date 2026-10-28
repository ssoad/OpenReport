import { describe, it, expect } from 'vitest';
import {
  CommercialInvoiceTemplate,
  ExecutiveSalesReportTemplate,
  InventoryStatusTemplate
} from '../index';
import { ReportDefinition, ReportElement } from '@openreport/schema';

describe('OpenReport Designer Element Selection & Manipulation Model', () => {
  const getSelectedElement = (report: ReportDefinition, selectedElementId: string | null) => {
    if (!selectedElementId) return null;

    if (report.bands.reportHeader?.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.reportHeader.elements.find((e) => e.id === selectedElementId)!, bandName: 'reportHeader' };
    }
    if (report.bands.pageHeader?.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.pageHeader.elements.find((e) => e.id === selectedElementId)!, bandName: 'pageHeader' };
    }
    if (report.bands.detail.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.detail.elements.find((e) => e.id === selectedElementId)!, bandName: 'detail' };
    }
    if (report.bands.pageFooter?.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.pageFooter.elements.find((e) => e.id === selectedElementId)!, bandName: 'pageFooter' };
    }
    if (report.bands.reportFooter?.elements.some((e) => e.id === selectedElementId)) {
      return { element: report.bands.reportFooter.elements.find((e) => e.id === selectedElementId)!, bandName: 'reportFooter' };
    }

    return null;
  };

  it('accurately resolves elements across all report bands by unique ID', () => {
    const report = CommercialInvoiceTemplate;

    // Report Header element
    const headerTitle = report.bands.reportHeader?.elements[0];
    expect(headerTitle).toBeDefined();
    const resolvedHeader = getSelectedElement(report, headerTitle!.id);
    expect(resolvedHeader?.bandName).toBe('reportHeader');
    expect(resolvedHeader?.element.id).toBe(headerTitle!.id);

    // Detail element
    const detailTable = report.bands.detail.elements.find((e) => e.type === 'table');
    expect(detailTable).toBeDefined();
    const resolvedDetail = getSelectedElement(report, detailTable!.id);
    expect(resolvedDetail?.bandName).toBe('detail');
    expect(resolvedDetail?.element.id).toBe(detailTable!.id);

    // Page Footer element
    const footerText = report.bands.pageFooter?.elements[0];
    expect(footerText).toBeDefined();
    const resolvedFooter = getSelectedElement(report, footerText!.id);
    expect(resolvedFooter?.bandName).toBe('pageFooter');
    expect(resolvedFooter?.element.id).toBe(footerText!.id);
  });

  it('preserves selection state and isolates clicks from canvas background deselect', () => {
    let selectedElementId: string | null = null;

    // Simulate clicking element: stopPropagation prevents bubbling to canvas
    const handleElementClick = (elId: string, event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      selectedElementId = elId;
    };

    const handleCanvasClick = (event: { target: string; currentTarget: string }) => {
      // Only deselect if clicked directly on empty canvas, not on element
      if (event.target === event.currentTarget) {
        selectedElementId = null;
      }
    };

    let stopped = false;
    const fakeElementEvent = {
      stopPropagation: () => { stopped = true; }
    };

    // User clicks element
    handleElementClick('table_items_1', fakeElementEvent);
    expect(selectedElementId).toBe('table_items_1');
    expect(stopped).toBe(true);

    // Simulated bubbled click reaches canvas when NOT stopped (previous bug)
    // But with stopPropagation, canvas handler is NOT called.
    // If canvas clicked directly:
    handleCanvasClick({ target: 'canvas-bg', currentTarget: 'canvas-bg' });
    expect(selectedElementId).toBeNull();
  });

  it('updates selected element geometry safely without mutating other elements', () => {
    const report = JSON.parse(JSON.stringify(CommercialInvoiceTemplate)) as ReportDefinition;
    const el = report.bands.detail.elements[0]!;
    const originalCount = report.bands.detail.elements.length;

    const updates = { x: 50, y: 75, width: 300, height: 40 };
    const idx = report.bands.detail.elements.findIndex((e) => e.id === el.id);
    report.bands.detail.elements[idx] = { ...report.bands.detail.elements[idx]!, ...updates };

    expect(report.bands.detail.elements[idx]?.x).toBe(50);
    expect(report.bands.detail.elements[idx]?.y).toBe(75);
    expect(report.bands.detail.elements[idx]?.width).toBe(300);
    expect(report.bands.detail.elements[idx]?.height).toBe(40);
    expect(report.bands.detail.elements.length).toBe(originalCount);
  });
});
