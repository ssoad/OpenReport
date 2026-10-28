import { FieldMetadata, FieldType } from './types';

export interface CsvParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  inferTypes?: boolean;
}

export function parseCsv(
  csvText: string,
  options: CsvParseOptions = {}
): { rows: Record<string, any>[]; fields: FieldMetadata[] } {
  const delimiter = options.delimiter || ',';
  const hasHeader = options.hasHeader !== false;
  const inferTypes = options.inferTypes !== false;

  const records: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  const len = csvText.length;

  while (i < len) {
    const char = csvText[i]!;

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && csvText[i + 1] === '"') {
          // Escaped quote: ""
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (char === delimiter) {
      currentRow.push(currentField);
      currentField = '';
      i++;
      continue;
    }

    if (char === '\r') {
      if (i + 1 < len && csvText[i + 1] === '\n') {
        i++; // skip \r, next will handle \n
      }
      currentRow.push(currentField);
      records.push(currentRow);
      currentRow = [];
      currentField = '';
      i++;
      continue;
    }

    if (char === '\n') {
      currentRow.push(currentField);
      records.push(currentRow);
      currentRow = [];
      currentField = '';
      i++;
      continue;
    }

    currentField += char;
    i++;
  }

  // Push last remaining field and row
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    records.push(currentRow);
  }

  if (records.length === 0) {
    return { rows: [], fields: [] };
  }

  const rawHeaders = hasHeader ? records[0]! : records[0]!.map((_, idx) => `field_${idx + 1}`);
  const headerKeys = rawHeaders.map((h, idx) => (h.trim() || `column_${idx + 1}`));
  const dataRows = hasHeader ? records.slice(1) : records;

  const rows: Record<string, any>[] = [];

  for (const rowVals of dataRows) {
    // Skip empty lines
    if (rowVals.length === 1 && rowVals[0] === '') continue;

    const rowObj: Record<string, any> = {};
    for (let c = 0; c < headerKeys.length; c++) {
      const key = headerKeys[c]!;
      const rawVal = rowVals[c] !== undefined ? rowVals[c]!.trim() : '';

      if (!inferTypes) {
        rowObj[key] = rawVal;
      } else {
        rowObj[key] = inferValue(rawVal);
      }
    }
    rows.push(rowObj);
  }

  // Infer field metadata
  const fields: FieldMetadata[] = headerKeys.map((name) => {
    let type: FieldType = 'string';
    let nullable = false;
    let sample: any = undefined;

    for (const r of rows) {
      const val = r[name];
      if (val === null || val === undefined) {
        nullable = true;
      } else if (sample === undefined) {
        sample = val;
        if (typeof val === 'number') type = 'number';
        else if (typeof val === 'boolean') type = 'boolean';
        else if (val instanceof Date) type = 'date';
        else type = 'string';
      }
    }

    return { name, type, nullable, sample };
  });

  return { rows, fields };
}

function inferValue(val: string): any {
  if (val === '' || val === 'null' || val === 'NULL') return null;
  if (val.toLowerCase() === 'true') return true;
  if (val.toLowerCase() === 'false') return false;

  // Check numeric
  if (!isNaN(Number(val)) && !/^\s*$/.test(val)) {
    return Number(val);
  }

  // Check ISO Date format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(val)) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
  }

  return val;
}
