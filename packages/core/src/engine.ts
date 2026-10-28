import {
  ReportDefinition,
  validateReportDefinition,
  migrateReportDefinition,
  CURRENT_SCHEMA_VERSION
} from '@openreport/schema';
import { DataManager, ProcessedDataset } from '@openreport/data-engine';
import { LayoutEngine, RenderedDocument } from '@openreport/layout-engine';
import {
  PdfExporter,
  CsvExporter,
  CsvExportOptions,
  XlsxExporter,
  HtmlExporter,
  SvgExporter
} from '@openreport/exporters';

export interface EngineOptions {
  parameters?: Record<string, any>;
  dataManager?: DataManager;
}

export class OpenReportEngine {
  private report: ReportDefinition;
  private dataManager: DataManager;
  private parameters: Record<string, any>;
  private datasets: Map<string, ProcessedDataset> = new Map();
  private lastRenderedDocument?: RenderedDocument;

  constructor(definitionInput: unknown, options: EngineOptions = {}) {
    // 1. Validate & migrate schema
    const migration = migrateReportDefinition(definitionInput, CURRENT_SCHEMA_VERSION);
    if (!migration.valid || !migration.data) {
      const errorMsg = migration.diagnostics.map((d) => `[${d.code}] ${d.path}: ${d.message}`).join('\n');
      throw new Error(`Invalid report definition:\n${errorMsg}`);
    }

    this.report = migration.data;
    this.dataManager = options.dataManager || new DataManager();
    this.parameters = { ...options.parameters };

    // Apply default parameter values if not supplied
    if (this.report.parameters) {
      for (const param of this.report.parameters) {
        if (this.parameters[param.name] === undefined && param.defaultValue !== undefined) {
          this.parameters[param.name] = param.defaultValue;
        }
      }
    }
  }

  public getReportDefinition(): ReportDefinition {
    return JSON.parse(JSON.stringify(this.report));
  }

  public setParameter(name: string, value: any): void {
    this.parameters[name] = value;
  }

  public setParameters(params: Record<string, any>): void {
    this.parameters = { ...this.parameters, ...params };
  }

  public getParameters(): Record<string, any> {
    return { ...this.parameters };
  }

  public async loadData(overrideDataSources?: Record<string, any[]>): Promise<Map<string, ProcessedDataset>> {
    this.datasets = await this.dataManager.loadDatasets(
      this.report,
      { parameters: this.parameters },
      overrideDataSources
    );
    return this.datasets;
  }

  public async renderDocument(overrideDataSources?: Record<string, any[]>): Promise<RenderedDocument> {
    if (this.datasets.size === 0 || overrideDataSources) {
      await this.loadData(overrideDataSources);
    }

    this.lastRenderedDocument = LayoutEngine.layout(this.report, this.datasets, {
      parameters: this.parameters
    });

    return this.lastRenderedDocument;
  }

  public async exportPdf(): Promise<Uint8Array> {
    const doc = this.lastRenderedDocument || (await this.renderDocument());
    return PdfExporter.exportToBuffer(doc);
  }

  public async exportCsv(options?: CsvExportOptions): Promise<string> {
    const doc = this.lastRenderedDocument || (await this.renderDocument());
    return CsvExporter.exportToString(doc, options);
  }

  public async exportXlsx(): Promise<Uint8Array> {
    const doc = this.lastRenderedDocument || (await this.renderDocument());
    return XlsxExporter.exportToBuffer(doc);
  }

  public async exportHtml(): Promise<string> {
    const doc = this.lastRenderedDocument || (await this.renderDocument());
    return HtmlExporter.exportToString(doc);
  }

  public async exportSvg(pageIndex: number = 0): Promise<string> {
    const doc = this.lastRenderedDocument || (await this.renderDocument());
    const page = doc.pages[pageIndex];
    if (!page) {
      throw new Error(`Page index ${pageIndex} does not exist in rendered document (total pages: ${doc.pageCount}).`);
    }
    return SvgExporter.exportPageToSvg(page);
  }
}
