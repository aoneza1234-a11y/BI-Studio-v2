import React, { useState, useRef } from 'react';
import { DASHBOARD_TEMPLATES, DashboardTemplate } from '../templates/dashboardTemplates';
import { WidgetConfig } from '../types';
import {
  X,
  Check,
  TrendingUp,
  CheckSquare,
  Activity,
  PlusSquare,
  Download,
  Upload,
  Bookmark,
  Trash2,
  FileJson,
  Sparkles,
} from 'lucide-react';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplateId: string;
  onSelectTemplate: (template: DashboardTemplate) => void;
  currentWidgets?: WidgetConfig[];
  onImportWidgets?: (importedWidgets: WidgetConfig[], templateName?: string) => void;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedTemplateId,
  onSelectTemplate,
  currentWidgets = [],
  onImportWidgets,
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom' | 'file'>('preset');
  const [customTemplates, setCustomTemplates] = useState<{ id: string; name: string; date: string; widgets: WidgetConfig[] }[]>(() => {
    try {
      const saved = localStorage.getItem('bi_custom_dashboard_templates');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const iconMap: Record<string, React.ReactNode> = {
    TrendingUp: <TrendingUp className="w-5 h-5 text-emerald-600" />,
    CheckSquare: <CheckSquare className="w-5 h-5 text-blue-600" />,
    Activity: <Activity className="w-5 h-5 text-violet-600" />,
    PlusSquare: <PlusSquare className="w-5 h-5 text-slate-600" />,
  };

  // Export current dashboard as JSON file
  const handleExportJson = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      templateName: 'Custom Dashboard Template',
      widgetCount: currentWidgets.length,
      widgets: currentWidgets,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `dashboard-template-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);

        const widgetsToImport: WidgetConfig[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.widgets)
          ? parsed.widgets
          : null;

        if (widgetsToImport && widgetsToImport.length > 0 && onImportWidgets) {
          onImportWidgets(widgetsToImport, parsed.templateName || file.name.replace('.json', ''));
          onClose();
        } else {
          alert('รูปแบบไฟล์ JSON ไม่ถูกต้องหรือไม่พบรายการวิดเจ็ต');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  // Save current dashboard as custom template to localStorage
  const handleSaveCurrentAsCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateNameInput.trim()) return;

    const newTemplate = {
      id: 'custom-' + Date.now(),
      name: templateNameInput.trim(),
      date: new Date().toLocaleDateString('th-TH'),
      widgets: currentWidgets,
    };

    const updated = [newTemplate, ...customTemplates];
    setCustomTemplates(updated);
    try {
      localStorage.setItem('bi_custom_dashboard_templates', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setTemplateNameInput('');
    setSaveSuccessMsg('บันทึกเทมเพลตเรียบร้อยแล้ว!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Delete custom template
  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    try {
      localStorage.setItem('bi_custom_dashboard_templates', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              จัดการและเลือกเทมเพลต (Template Management)
            </h2>
            <p className="text-xs text-slate-500">
              เลือกเทมเพลตสำเร็จรูป บันทึกเทมเพลตส่วนตัว หรือแชร์ผ่านไฟล์ JSON
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 gap-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'preset'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>เทมเพลตสำเร็จรูป ({DASHBOARD_TEMPLATES.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>เทมเพลตที่บันทึกไว้ ({customTemplates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            <span>นำเข้า / ส่งออกไฟล์ (.json)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: PRESET TEMPLATES */}
          {activeTab === 'preset' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DASHBOARD_TEMPLATES.map((tmpl) => {
                const isCurrent = selectedTemplateId === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => {
                      onSelectTemplate(tmpl);
                      onClose();
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                          {iconMap[tmpl.icon] || <TrendingUp className="w-5 h-5 text-blue-600" />}
                        </div>
                        {isCurrent && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> ใช้งานอยู่
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 mb-1">{tmpl.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{tmpl.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs text-blue-600 font-medium">
                      <span>เลือกใช้เทมเพลตนี้</span>
                      <span>&rarr;</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: CUSTOM SAVED TEMPLATES */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              {/* Save current dashboard as custom template */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2.5">
                <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-blue-600" />
                  <span>บันทึกการจัดวางหน้าตาปัจจุบัน ({currentWidgets.length} วิดเจ็ต)</span>
                </h4>
                <form onSubmit={handleSaveCurrentAsCustom} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="ตั้งชื่อเทมเพลต เช่น แดชบอร์ดผู้บริหารประจำเดือน..."
                    value={templateNameInput}
                    onChange={(e) => setTemplateNameInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs shrink-0"
                  >
                    บันทึก
                  </button>
                </form>
                {saveSuccessMsg && (
                  <p className="text-xs text-emerald-600 font-medium">{saveSuccessMsg}</p>
                )}
              </div>

              {/* Saved templates list */}
              {customTemplates.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  ยังไม่มีเทมเพลตที่คุณบันทึกไว้ สามารถบันทึกแดชบอร์ดปัจจุบันด้านบนได้เลย
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customTemplates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        if (onImportWidgets) {
                          onImportWidgets(t.widgets, t.name);
                          onClose();
                        }
                      }}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 truncate" title={t.name}>
                            {t.name}
                          </span>
                          <button
                            type="button"
                            title="ลบเทมเพลตนี้"
                            onClick={(e) => handleDeleteCustom(t.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {t.widgets?.length || 0} วิดเจ็ต • บันทึกเมื่อ {t.date}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-semibold">
                        <span>โหลดเทมเพลตนี้</span>
                        <span>&rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: IMPORT / EXPORT JSON */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">
                      ส่งออกไฟล์เทมเพลต (.json)
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      ดาวน์โหลดโครงสร้างวิดเจ็ตทั้งหมด {currentWidgets.length} ตัว พร้อมการจัดตำแหน่งและการปรับแต่งสี ไปเก็บไว้ในเครื่อง
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>ดาวน์โหลดไฟล์ JSON</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">
                      นำเข้าไฟล์เทมเพลต (.json)
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      เลือกไฟล์ .json ที่เคยส่งออกไว้ เพื่อนำการจัดวางและวิดเจ็ตกลับมาแสดงผลทันที
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-4 h-4" />
                    <span>เลือกไฟล์เพื่อนำเข้า</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
