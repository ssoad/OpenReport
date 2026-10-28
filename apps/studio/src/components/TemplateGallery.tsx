import React from 'react';
import { ReportDefinition } from '@openreport/schema';
import {
  CommercialInvoiceTemplate,
  ExecutiveSalesReportTemplate,
  InventoryStatusTemplate
} from '@openreport/core';
import {
  FileText,
  BarChart3,
  Boxes,
  Check,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface TemplateGalleryProps {
  currentReportId: string;
  onSelectReport: (report: ReportDefinition) => void;
  onOpenDashboard: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  currentReportId,
  onSelectReport,
  onOpenDashboard
}) => {
  const templates = [
    {
      id: CommercialInvoiceTemplate.id,
      title: CommercialInvoiceTemplate.title,
      category: 'Finance & Billing',
      description: 'Enterprise commercial tax invoice with bill-to customer records, itemized line totals, subtotal summaries, taxes, and payment terms.',
      icon: FileText,
      iconColor: 'text-blue-600 bg-blue-50 border-blue-200',
      data: CommercialInvoiceTemplate,
      features: ['Multi-column items table', 'Dynamic subtotal summaries', 'Page-dependent variables', 'Print-ready A4 portrait']
    },
    {
      id: ExecutiveSalesReportTemplate.id,
      title: ExecutiveSalesReportTemplate.title,
      category: 'Executive Business Intelligence',
      description: 'Executive quarterly revenue summary with high-level KPI cards, vector column chart breakdown by territory, and category performance matrix.',
      icon: BarChart3,
      iconColor: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      data: ExecutiveSalesReportTemplate,
      features: ['KPI metric cards', 'Vector territory chart', 'Quota attainment percentage', 'Summary totals']
    },
    {
      id: InventoryStatusTemplate.id,
      title: InventoryStatusTemplate.title,
      category: 'Supply Chain & Operations',
      description: 'Multi-facility warehouse physical inventory audit report with SKU stock levels, reorder threshold alerts, and total inventory valuation.',
      icon: Boxes,
      iconColor: 'text-purple-600 bg-purple-50 border-purple-200',
      data: InventoryStatusTemplate,
      features: ['Calculated reorder alert logic', 'Dynamic valuation calculation', 'Multi-facility stock audit', 'Sorting by value']
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Template & Solution Gallery
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose from battle-tested, production-ready enterprise templates or launch the interactive BI dashboard.
          </p>
        </div>

        {/* Featured BI Dashboard Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary-500/20 text-primary-300 border border-primary-500/40 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Business Intelligence Suite
            </span>
            <h2 className="text-base font-bold text-white">
              Executive Sales & Analytics Interactive BI Dashboard
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore 12-column responsive layout, multi-dimensional cross-filtering, territory charts, and instant metrics recalculation.
            </p>
          </div>
          <button
            onClick={onOpenDashboard}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold shadow transition whitespace-nowrap self-start md:self-auto"
          >
            <span>Launch BI Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Paginated Report Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {templates.map((tpl) => {
            const Icon = tpl.icon;
            const isCurrent = currentReportId === tpl.id;

            return (
              <div
                key={tpl.id}
                className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all ${
                  isCurrent
                    ? 'border-primary-500 ring-2 ring-primary-100 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${tpl.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {tpl.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{tpl.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">{tpl.description}</p>

                  <div className="space-y-1 mb-6">
                    {tpl.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onSelectReport(tpl.data)}
                  disabled={isCurrent}
                  className={`w-full py-2 text-xs font-semibold rounded-lg transition ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                  }`}
                >
                  {isCurrent ? 'Currently Loaded' : 'Load Template'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
