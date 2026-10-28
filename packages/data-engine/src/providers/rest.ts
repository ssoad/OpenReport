import { DataSourceDefinition } from '@openreport/schema';
import { IDataProvider, FieldMetadata, FieldType, ExecutionContext } from '../types';

export class RestApiDataProvider implements IDataProvider {
  readonly type = 'rest';

  async fetch(source: DataSourceDefinition, context?: ExecutionContext): Promise<Record<string, any>[]> {
    if (!source.url) {
      throw new Error(`RestApiDataProvider requires a valid 'url' on data source "${source.id}".`);
    }

    // Interpolate parameter placeholders in URL if present, e.g. /api/orders?start={startDate}
    let url = source.url;
    if (context?.parameters) {
      for (const [key, val] of Object.entries(context.parameters)) {
        url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), encodeURIComponent(String(val)));
      }
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(source.headers || {})
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), context?.timeoutMs || 30_000);

    try {
      const response = await fetch(url, {
        method: source.method || 'GET',
        headers,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`REST API request to "${url}" failed with HTTP ${response.status}: ${response.statusText}`);
      }

      const body = await response.json();
      if (Array.isArray(body)) return body;

      // Extract nested data path if configured, e.g. options.dataPath = 'data.items'
      if (source.options?.dataPath && typeof source.options.dataPath === 'string') {
        const parts = source.options.dataPath.split('.');
        let curr: any = body;
        for (const p of parts) {
          if (curr && typeof curr === 'object') curr = curr[p];
        }
        if (Array.isArray(curr)) return curr;
      }

      if (body && typeof body === 'object') {
        for (const key of ['items', 'data', 'results', 'records']) {
          if (Array.isArray((body as any)[key])) return (body as any)[key];
        }
      }

      return [body];
    } finally {
      clearTimeout(timeout);
    }
  }

  async getSchema(source: DataSourceDefinition, context?: ExecutionContext): Promise<FieldMetadata[]> {
    const rows = await this.fetch(source, context);
    if (rows.length === 0) return [];

    const first = rows[0]!;
    return Object.keys(first).map((key) => {
      const val = first[key];
      let type: FieldType = 'string';
      if (typeof val === 'number') type = 'number';
      else if (typeof val === 'boolean') type = 'boolean';
      else if (val instanceof Date) type = 'date';
      else if (typeof val === 'object') type = Array.isArray(val) ? 'array' : 'object';

      return {
        name: key,
        type,
        nullable: true,
        sample: val
      };
    });
  }
}
