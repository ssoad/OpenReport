import { ReportDefinition, DataSourceDefinition } from '@openreport/schema';
import { IDataProvider, ExecutionContext, ProcessedDataset } from './types';
import { MemoryDataProvider } from './providers/memory';
import { JsonDataProvider } from './providers/json';
import { CsvDataProvider } from './providers/csv';
import { RestApiDataProvider } from './providers/rest';
import { QueryEngine } from './query-engine';

export class DataManager {
  private providers: Map<string, IDataProvider> = new Map();

  constructor() {
    this.registerProvider(new MemoryDataProvider());
    this.registerProvider(new JsonDataProvider());
    this.registerProvider(new CsvDataProvider());
    this.registerProvider(new RestApiDataProvider());
  }

  public registerProvider(provider: IDataProvider): void {
    this.providers.set(provider.type, provider);
  }

  public getProvider(type: string): IDataProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Data provider "${type}" is not registered in DataManager.`);
    }
    return provider;
  }

  public async loadDatasets(
    report: ReportDefinition,
    context: ExecutionContext = {},
    overrideDataSources?: Record<string, any[]>
  ): Promise<Map<string, ProcessedDataset>> {
    const results = new Map<string, ProcessedDataset>();
    const rawDataSourceData = new Map<string, Record<string, any>[]>();

    // 1. Fetch raw data from each DataSource
    for (const source of report.dataSources) {
      if (overrideDataSources && overrideDataSources[source.id]) {
        rawDataSourceData.set(source.id, overrideDataSources[source.id]!);
        continue;
      }

      const provider = this.getProvider(source.provider);
      const rawRows = await provider.fetch(source, context);
      rawDataSourceData.set(source.id, rawRows);
    }

    // 2. Process each Dataset through QueryEngine
    for (const dataset of report.datasets) {
      const rawRows = rawDataSourceData.get(dataset.dataSourceId) || [];
      const processed = QueryEngine.processDataset(dataset, rawRows, context);
      results.set(dataset.id, processed);
    }

    return results;
  }
}
