import React, { useState } from 'react';
import { ReportDefinition, DataSourceDefinition } from '@openreport/schema';
import { Database, Plus, Trash2, CheckCircle2, Code, FileText } from 'lucide-react';

interface DataSourceManagerProps {
  report: ReportDefinition;
  onChange: (updatedReport: ReportDefinition) => void;
}

export const DataSourceManager: React.FC<DataSourceManagerProps> = ({ report, onChange }) => {
  const [selectedDsId, setSelectedDsId] = useState<string>(report.dataSources[0]?.id || '');
  const [newDsName, setNewDsName] = useState<string>('');
  const [newDsJson, setNewDsJson] = useState<string>('[\n  { "id": 1, "product": "Widget", "revenue": 1200 }\n]');

  const selectedSource = report.dataSources.find((s) => s.id === selectedDsId) || report.dataSources[0];

  const handleAddSource = () => {
    if (!newDsName.trim()) {
      alert('Please enter a data source name');
      return;
    }

    try {
      const parsedData = JSON.parse(newDsJson);
      if (!Array.isArray(parsedData)) {
        alert('Data must be an array of objects');
        return;
      }

      const id = newDsName.toLowerCase().replace(/\s+/g, '-');
      const newDs: DataSourceDefinition = {
        id,
        name: newDsName,
        provider: 'memory',
        data: parsedData
      };

      const cloned = JSON.parse(JSON.stringify(report)) as ReportDefinition;
      cloned.dataSources.push(newDs);
      cloned.datasets.push({
        id: `${id}-dataset`,
        name: `${newDsName} Dataset`,
        dataSourceId: id
      });

      onChange(cloned);
      setSelectedDsId(id);
      setNewDsName('');
    } catch (err: any) {
      alert(`Invalid JSON format: ${err.message}`);
    }
  };

  const sampleRows = selectedSource?.data || [];
  const fieldNames = sampleRows.length > 0 ? Object.keys(sampleRows[0]) : [];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Data Sources & Schema Explorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage connected datasets, view schema definitions, and inspect data payloads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Data Sources List */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
              Registered Data Sources
            </span>

            <div className="space-y-1.5">
              {report.dataSources.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => setSelectedDsId(ds.id)}
                  className={`w-full text-left p-3 rounded-lg border text-xs flex items-center justify-between transition ${
                    selectedSource?.id === ds.id
                      ? 'border-primary-500 dark:border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-900 dark:text-primary-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <div>
                      <div className="font-bold">{ds.name || ds.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Provider: {ds.provider}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                    {ds.data?.length || 0} rows
                  </span>
                </button>
              ))}
            </div>

            {/* Add New Source Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Add In-Memory Dataset</span>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Data Source Name</label>
                <input
                  type="text"
                  value={newDsName}
                  onChange={(e) => setNewDsName(e.target.value)}
                  placeholder="e.g. Regional Orders"
                  className="w-full border border-slate-300 dark:border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">JSON Array</label>
                <textarea
                  value={newDsJson}
                  onChange={(e) => setNewDsJson(e.target.value)}
                  rows={4}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded p-2 text-[11px] font-mono text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
                />
              </div>

              <button
                onClick={handleAddSource}
                className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Data Source</span>
              </button>
            </div>
          </div>

          {/* Data Payload & Schema Inspector */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
            {selectedSource ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedSource.name || selectedSource.id}</h2>
                    <span className="text-[11px] text-slate-400 font-mono">ID: {selectedSource.id}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </div>

                {/* Schema / Fields */}
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
                    Inferred Schema Fields
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {fieldNames.map((f) => (
                      <span
                        key={f}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                      >
                        <Code className="w-3 h-3 text-primary-500" />
                        <span>{f}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Data Table Preview */}
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
                    Data Records Preview (First {sampleRows.length} rows)
                  </span>

                  <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          {fieldNames.map((col) => (
                            <th key={col} className="px-3 py-2 text-[11px]">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                        {sampleRows.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                            {fieldNames.map((col) => (
                              <td key={col} className="px-3 py-2 font-mono text-[11px]">
                                {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a data source from the list.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
