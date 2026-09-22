import React, { useState } from 'react';
import {
  Sparkles,
  X,
  TrendingUp,
  Package,
  DollarSign,
  Truck,
  FileText,
  Users,
  CheckSquare,
  PlusSquare,
  ArrowRight,
  LayoutTemplate,
  Check,
} from 'lucide-react';
import { DASHBOARD_TEMPLATES, DashboardTemplate } from '../templates/dashboardTemplates';
import { ProcessedSheetData, WidgetConfig } from '../types';

interface TemplateMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: ProcessedSheetData;
  onApplyTemplate?: (widgets: WidgetConfig[], templateName: string) => void;
  selectedTemplateId?: string;
  onSelectTemplate?: (template: DashboardTemplate) => void;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  TrendingUp: <TrendingUp className="w-5 h-5 text-emerald-600" />,
  Package: <Package className="w-5 h-5 text-indigo-600" />,
  DollarSign: <DollarSign className="w-5 h-5 text-emerald-600" />,
  Truck: <Truck className="w-5 h-5 text-blue-600" />,
  FileText: <FileText className="w-5 h-5 text-amber-600" />,
  Users: <Users className="w-5 h-5 text-violet-600" />,
  CheckSquare: <CheckSquare className="w-5 h-5 text-teal-600" />,
  PlusSquare: <PlusSquare className="w-5 h-5 text-slate-500" />,
};

export const TemplateMarketplaceModal: React.FC<TemplateMarketplaceModalProps> = ({
  isOpen,
  onClose,
  data,
  onApplyTemplate,
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const initialTemplate =
    (selectedTemplateId && DASHBOARD_TEMPLATES.find((t) => t.id === selectedTemplateId)) ||
    DASHBOARD_TEMPLATES[0];
  const [selectedTemplate, setSelectedTemplate] = useState<DashboardTemplate>(initialTemplate);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'ทั้งหมด (All Templates)' },
    { id: 'Commercial', label: 'Sales & Customs' },
    { id: 'Supply Chain', label: 'Inventory & Logistics' },
    { id: 'Finance', label: 'Finance' },
    { id: 'People', label: 'HR' },
  ];

  const filteredTemplates = DASHBOARD_TEMPLATES.filter((t) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'Supply Chain') return t.category === 'Supply Chain' || t.category === 'Operations';
    return t.category === selectedCategory;
  });

  const handleApply = (tpl: DashboardTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl);
      onClose();
      return;
    }
    const safeData: ProcessedSheetData = data || {
      headers: [],
      rawRows: [],
      records: [],
      numericColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      totalRows: 0,
    };
    if (onApplyTemplate) {
      const widgets = tpl.createWidgets(safeData);
      onApplyTemplate(widgets, tpl.name);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Template Marketplace (คลังเทมเพลตแดชบอร์ดสำเร็จรูป)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  คลิกเดียวพร้อมใช้งาน
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                เลือกเทมเพลตที่เหมาะกับธุรกิจของคุณ ระบบจะจับคอลัมน์จาก Google Sheet อัตโนมัติทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto bg-white">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Template Cards Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => {
            const isSelected = selectedTemplate.id === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/30 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                        {ICONS_MAP[tpl.icon] || <Sparkles className="w-5 h-5 text-blue-500" />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{tpl.name}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">{tpl.nameEn}</p>
                      </div>
                    </div>
                    {tpl.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shrink-0">
                        {tpl.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    สร้าง {tpl.createWidgets(data).length} วิดเจ็ตอัตโนมัติ
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApply(tpl);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                  >
                    <span>สร้างแดชบอร์ดนี้</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            * การใช้เทมเพลตจะแทนที่วิดเจ็ตปัจจุบันด้วยเค้าโครงที่เลือก (ข้อมูลในชีทของคุณจะคงเดิม 100%)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-xl"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
