import { IDataProvider } from '@openreport/data-engine';

export interface ComponentPlugin {
  type: string;
  displayName: string;
  category: 'Basic' | 'Data' | 'Visualization' | 'Advanced';
  defaultProps: Record<string, any>;
  icon?: string;
}

export interface OpenReportPlugin {
  id: string;
  name: string;
  version: string;
  components?: ComponentPlugin[];
  dataProviders?: IDataProvider[];
  customFunctions?: Record<string, (...args: any[]) => any>;
}

export class PluginRegistry {
  private static instance: PluginRegistry;

  private components: Map<string, ComponentPlugin> = new Map();
  private dataProviders: Map<string, IDataProvider> = new Map();
  private plugins: Map<string, OpenReportPlugin> = new Map();

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  public registerPlugin(plugin: OpenReportPlugin): void {
    this.plugins.set(plugin.id, plugin);

    if (plugin.components) {
      for (const comp of plugin.components) {
        this.components.set(comp.type, comp);
      }
    }

    if (plugin.dataProviders) {
      for (const prov of plugin.dataProviders) {
        this.dataProviders.set(prov.type, prov);
      }
    }
  }

  public getComponent(type: string): ComponentPlugin | undefined {
    return this.components.get(type);
  }

  public getAllComponents(): ComponentPlugin[] {
    return Array.from(this.components.values());
  }

  public getDataProvider(type: string): IDataProvider | undefined {
    return this.dataProviders.get(type);
  }
}
