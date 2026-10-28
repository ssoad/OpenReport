import { describe, it, expect } from 'vitest';
import {
  convertToPt,
  convertFromPt,
  getPageDimensionsPt,
  validateReportDefinition,
  migrateReportDefinition,
  ReportDefinition
} from '../index';

describe('OpenReport Schema & Page Geometry', () => {
  it('converts units to and from points accurately', () => {
    // 1 inch = 72 pt
    expect(convertToPt(1, 'in')).toBe(72);
    expect(convertFromPt(72, 'in')).toBe(1);

    // 25.4 mm = 72 pt
    expect(Math.round(convertToPt(25.4, 'mm'))).toBe(72);
    expect(Math.round(convertFromPt(72, 'mm'))).toBe(25);

    // 96 px = 72 pt
    expect(convertToPt(96, 'px')).toBe(72);
    expect(convertFromPt(72, 'px')).toBe(96);
  });

  it('calculates page dimensions for A4 portrait and landscape', () => {
    const a4Portrait = getPageDimensionsPt({
      size: 'A4',
      orientation: 'portrait',
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
      unit: 'pt'
    });
    expect(a4Portrait.width).toBeCloseTo(595.28, 1);
    expect(a4Portrait.height).toBeCloseTo(841.89, 1);

    const a4Landscape = getPageDimensionsPt({
      size: 'A4',
      orientation: 'landscape',
      margins: { top: 36, right: 36, bottom: 36, left: 36 },
      unit: 'pt'
    });
    expect(a4Landscape.width).toBeCloseTo(841.89, 1);
    expect(a4Landscape.height).toBeCloseTo(595.28, 1);
  });

  it('validates a complete valid report definition', () => {
    const validReport: ReportDefinition = {
      schemaVersion: '1.0.0',
      id: 'sales-summary',
      title: 'Sales Summary Report',
      description: 'Quarterly sales',
      page: {
        size: 'A4',
        orientation: 'portrait',
        margins: { top: 36, right: 36, bottom: 36, left: 36 },
        unit: 'pt'
      },
      parameters: [
        {
          name: 'minRevenue',
          type: 'number',
          label: 'Minimum Revenue',
          defaultValue: 500,
          required: false,
          visible: true
        }
      ],
      dataSources: [
        {
          id: 'primarySource',
          provider: 'memory',
          data: [{ id: 1, revenue: 1000 }]
        }
      ],
      datasets: [
        {
          id: 'salesData',
          dataSourceId: 'primarySource',
          filter: '[revenue] >= ?minRevenue'
        }
      ],
      bands: {
        reportHeader: {
          id: 'rh-1',
          type: 'reportHeader',
          height: 50,
          canGrow: false,
          canShrink: false,
          keepTogether: true,
          elements: [
            {
              id: 'title-text',
              type: 'text',
              x: 10,
              y: 10,
              width: 300,
              height: 30,
              text: 'Executive Sales Report',
              locked: false,
              wrapText: true,
              canGrow: true,
              canShrink: false,
              font: {
                family: 'Helvetica',
                size: 18,
                weight: 'bold',
                italic: false,
                color: '#0f172a',
                align: 'left',
                verticalAlign: 'top',
                lineHeight: 1.2
              },
              padding: { top: 0, right: 0, bottom: 0, left: 0 }
            }
          ]
        },
        groupHeaders: [],
        detail: {
          id: 'detail-band',
          type: 'detail',
          height: 120,
          canGrow: true,
          canShrink: false,
          keepTogether: false,
          elements: [
            {
              id: 'sales-table',
              type: 'table',
              datasetId: 'salesData',
              x: 10,
              y: 10,
              width: 500,
              height: 100,
              locked: false,
              showHeader: true,
              showSummary: true,
              alternatingRowColors: true,
              headerHeight: 24,
              rowHeight: 20,
              summaryHeight: 24,
              headerFont: { family: 'Helvetica', size: 10, weight: 'bold', italic: false, color: '#334155', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              rowFont: { family: 'Helvetica', size: 9, weight: 'normal', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              summaryFont: { family: 'Helvetica', size: 9, weight: 'bold', italic: false, color: '#0f172a', align: 'left', verticalAlign: 'top', lineHeight: 1.2 },
              headerBackgroundColor: '#f1f5f9',
              alternatingBackgroundColor: '#f8fafc',
              summaryBackgroundColor: '#e2e8f0',
              cellPadding: { top: 3, right: 6, bottom: 3, left: 6 },
              columns: [
                {
                  id: 'col-1',
                  field: 'id',
                  title: 'Order ID',
                  width: 100,
                  align: 'left',
                  headerAlign: 'left',
                  visible: true,
                  summary: 'none'
                },
                {
                  id: 'col-2',
                  field: 'revenue',
                  title: 'Revenue',
                  width: 150,
                  align: 'right',
                  headerAlign: 'right',
                  visible: true,
                  summary: 'sum'
                }
              ]
            }
          ]
        },
        groupFooters: []
      },
      metadata: {
        author: 'OpenReport Studio',
        createdAt: '2026-10-28T00:00:00Z',
        tags: ['sales'],
        version: '1.0.0'
      }
    };

    const res = validateReportDefinition(validReport);
    expect(res.valid).toBe(true);
    expect(res.diagnostics.length).toBe(0);
    expect(res.data?.title).toBe('Sales Summary Report');
  });

  it('detects missing data sources and unlinked datasets with actionable diagnostics', () => {
    const invalidReport: any = {
      schemaVersion: '1.0.0',
      id: 'broken-report',
      title: 'Broken Report',
      dataSources: [],
      datasets: [
        {
          id: 'orphanDataset',
          dataSourceId: 'nonExistentSource'
        }
      ],
      bands: {
        detail: {
          id: 'detail-band',
          type: 'detail',
          height: 100,
          elements: [
            {
              id: 'bad-table',
              type: 'table',
              datasetId: 'missingDataset',
              x: 0,
              y: 0,
              width: 200,
              height: 50,
              columns: [{ id: 'c1', field: 'f1', title: 'F1', width: 100 }]
            }
          ]
        }
      }
    };

    const res = validateReportDefinition(invalidReport);
    expect(res.valid).toBe(false);
    expect(res.diagnostics.some((d) => d.code === 'MISSING_DATA_SOURCE')).toBe(true);
    expect(res.diagnostics.some((d) => d.code === 'MISSING_DATASET')).toBe(true);
  });

  it('migrates legacy 0.9.0 report to 1.0.0 schema correctly', () => {
    const legacy = {
      schemaVersion: '0.9.0',
      id: 'legacy-rep',
      title: 'Old Report',
      components: [
        {
          id: 'txt-1',
          type: 'text',
          x: 10,
          y: 10,
          width: 100,
          height: 20,
          text: 'Legacy Text'
        }
      ]
    };

    const res = migrateReportDefinition(legacy, '1.0.0');
    expect(res.valid).toBe(true);
    expect(res.data?.schemaVersion).toBe('1.0.0');
    expect(res.data?.bands.detail.elements.length).toBe(1);
    expect(res.data?.bands.detail.elements[0]?.id).toBe('txt-1');
  });
});
