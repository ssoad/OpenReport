export type FilterListener = (activeFilters: Record<string, any>) => void;

export class CrossFilterEngine {
  private activeFilters: Map<string, any> = new Map();
  private listeners: Set<FilterListener> = new Set();

  public getFilters(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [k, v] of this.activeFilters.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  public setFilter(field: string, value: any): void {
    if (value === null || value === undefined || value === '') {
      this.activeFilters.delete(field);
    } else {
      this.activeFilters.set(field, value);
    }
    this.notify();
  }

  public toggleFilter(field: string, value: any): void {
    if (this.activeFilters.get(field) === value) {
      this.activeFilters.delete(field);
    } else {
      this.activeFilters.set(field, value);
    }
    this.notify();
  }

  public clearFilters(): void {
    this.activeFilters.clear();
    this.notify();
  }

  public filterRows(rows: Record<string, any>[]): Record<string, any>[] {
    if (this.activeFilters.size === 0) return rows;

    return rows.filter((row) => {
      for (const [field, filterVal] of this.activeFilters.entries()) {
        const rowVal = row[field];
        if (rowVal !== filterVal) {
          return false;
        }
      }
      return true;
    });
  }

  public subscribe(listener: FilterListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const filters = this.getFilters();
    for (const l of this.listeners) {
      l(filters);
    }
  }
}
