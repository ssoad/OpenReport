import { CURRENT_SCHEMA_VERSION, ReportDefinition } from './report';
import { validateReportDefinition, ValidationResult } from './validator';

export interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  migrate: (input: any) => any;
}

export const MIGRATION_PIPELINE: MigrationStep[] = [
  {
    fromVersion: '0.9.0',
    toVersion: '1.0.0',
    migrate: (raw: any) => {
      const cloned = JSON.parse(JSON.stringify(raw));
      cloned.schemaVersion = '1.0.0';
      if (!cloned.bands) {
        cloned.bands = {
          detail: {
            id: 'detail-band',
            type: 'detail',
            height: 100,
            elements: cloned.components || []
          }
        };
        delete cloned.components;
      }
      return cloned;
    }
  }
];

export function migrateReportDefinition(raw: any, targetVersion: string = CURRENT_SCHEMA_VERSION): ValidationResult {
  let current = JSON.parse(JSON.stringify(raw));
  let currentVersion = current.schemaVersion || '0.9.0';

  while (currentVersion !== targetVersion) {
    const step = MIGRATION_PIPELINE.find((s) => s.fromVersion === currentVersion);
    if (!step) {
      break;
    }
    current = step.migrate(current);
    currentVersion = step.toVersion;
  }

  current.schemaVersion = targetVersion;
  return validateReportDefinition(current);
}
