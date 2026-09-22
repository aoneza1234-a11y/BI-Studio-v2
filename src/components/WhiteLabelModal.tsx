import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Check,
  Globe,
  Palette,
  Image,
  Layers,
  Lock,
  Eye,
  Sliders,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { WhiteLabelConfig } from '../types';

interface WhiteLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WhiteLabelConfig;
  onSaveConfig: (newConfig: WhiteLabelConfig) => void;
}

const PRESET_LOGOS = [
  {
    id: 'abc',
    name: 'ABC Analytic (ตัวอย่างโจทย์)',
    icon: '📊',
    color: '#2563eb',
    companyName: 'ABC Analytic',
  },
  {
    id: 'vista',
    name: 'Vista BI Studio (ค่าเริ่มต้น)',
    icon: '💎',
    color: '#4f46e5',
    companyName: 'Vista BI Studio',
  },
  {
    id: 'nexus',
    name: 'Nexus Enterprise Analytics',
    icon: '🌐',
    color: '#059669',
    companyName: 'Nexus Analytics',
  },
  {
    id: 'apex',
    name: 'Apex Data Platform',
    icon: '⚡',
    color: '#7c3aed',
    companyName: 'Apex Data Group',
  },
];

const COLOR_SWATCHES = [
  { name: 'Royal Blue', hex: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Indigo BI', hex: '#4f46e5', bg: 'bg-indigo-600' },
  { name: 'Emerald Growth', hex: '#059669', bg: 'bg-emerald-600' },
  { name: 'Violet Tech', hex: '#7c3aed', bg: 'bg-purple-600' },
  { name: 'Rose Modern', hex: '#e11d48', bg: 'bg-rose-600' },
  { name: 'Amber Gold', hex: '#d97706', bg: 'bg-amber-600' },
  { name: 'Slate Executive', hex: '#1e293b', bg: 'bg-slate-800' },
];

export const WhiteLabelModal: React.FC<WhiteLabelModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<WhiteLabelConfig>(config);
  const [activeTab, setActiveTab] = useState<'brand' | 'theme' | 'domain' | 'preview'>('brand');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: (typeof PRESET_LOGOS)[0]) => {
    setFormData((prev) => ({
      ...prev,
      companyName: preset.companyName,
      primaryColor: preset.color,
      loginWelcomeTitle: `ยินดีต้อนรับสู่ระบบ ${preset.companyName}`,
      footerCredit: `© 2026 ${preset.companyName}. All rights reserved.`,
    }));
  };

  const handleSave = () => {
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  15. White Label System (สำหรับขายต่อเป็น SaaS)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-900 rounded-md">
                  SaaS Edition
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                ปรับแต่งแบรนด์ของคุณเอง: Company Logo, Company Name, Custom Domain, Login Theme, Color System
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-indigo-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Example Callout Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-6 py-2.5 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-bold">เช่น ตัวอย่างโจทย์:</span>
            <span className="line-through text-slate-400">Vista BI Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
              ABC Analytic
            </span>
          </div>
          <div className="text-[11px] text-slate-500 hidden sm:block">
            ระบบจะอัปเดตโลโก้, หัวกระดาษรายงาน, และหน้าแชร์ Viewer ทันที
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('brand')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'brand'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Company Name & Logo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'theme'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>2. Color System & Login Theme</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('domain')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'domain'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>3. Custom Domain (CNAME)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>4. Live Brand Preview</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: BRAND & LOGO */}
          {activeTab === 'brand' && (
            <div className="space-y-6">
              {/* Quick Preset Buttons */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  เลือกพรีเซ็ตแบรนด์แบบด่วน (One-Click Brand Presets):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_LOGOS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.companyName === p.companyName
                          ? 'bg-blue-50 border-blue-500 shadow-2xs ring-1 ring-blue-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-lg">{p.icon}</div>
                      <div className="text-xs font-bold text-slate-800 mt-1 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">คลิกเพื่อใช้งาน</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    2. Company Name (ชื่อบริษัท / แบรนด์ของคุณ)
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="e.g. ABC Analytic"
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    จะแสดงบน Header, Sidebar, Title Bar และรายงานที่ Export
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    1. Company Logo URL (ลิงก์โลโก้บริษัท)
                  </label>
                  <input
                    type="url"
                    value={formData.companyLogoUrl || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, companyLogoUrl: e.target.value })
                    }
                    placeholder="https://yourcompany.com/logo.png"
                    className="w-full px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    หากเว้นว่าง ระบบจะแสดงไอคอนโลโก้ตามชื่อแบรนด์อย่างสวยงาม
                  </p>
                </div>
              </div>

              {/* Footer Credit */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  ข้อความเครดิตท้ายแดชบอร์ด (Footer Copyright)
                </label>
                <input
                  type="text"
                  value={formData.footerCredit || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, footerCredit: e.target.value })
                  }
                  placeholder="© 2026 ABC Analytic. Powered by SaaS Platform."
                  className="w-full px-4 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* TAB 2: COLOR SYSTEM & LOGIN THEME */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              {/* 5. Color System */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  5. Color System (สีประจำแบรนด์องค์กร)
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-2">
                    เลือกสีหลัก (Primary Brand Color):
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, primaryColor: swatch.hex })
                        }
                        className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                          formData.primaryColor === swatch.hex
                            ? 'bg-white border-slate-900 shadow-xs ring-2 ring-slate-900/10'
                            : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-inner"
                          style={{ backgroundColor: swatch.hex }}
                        />
                        <span>{swatch.name}</span>
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 pl-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, primaryColor: e.target.value })
                        }
                        className="w-7 h-7 rounded-lg cursor-pointer border border-slate-300 p-0"
                      />
                      <span className="text-xs font-mono text-slate-600">
                        {formData.primaryColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Login Theme */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  4. Login Theme (รูปแบบหน้าล็อกอิน / ตรวจสอบสิทธิ์ผู้ชม)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'modern_blue', name: 'Modern Minimal', desc: 'ฟ้า-ขาว สว่างสะอาดตา' },
                    { id: 'enterprise_slate', name: 'Enterprise Slate', desc: 'เทาเข้ม เรียบหรู ทางการ' },
                    { id: 'emerald_pro', name: 'Emerald Growth', desc: 'เขียวหยก สบายตา น่าเชื่อถือ' },
                    { id: 'luxury_dark', name: 'Luxury Dark', desc: 'ดำสนิท ระดับพรีเมียม' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          loginTheme: t.id as WhiteLabelConfig['loginTheme'],
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.loginTheme === t.id
                          ? 'bg-white border-indigo-600 shadow-2xs ring-1 ring-indigo-600'
                          : 'bg-white border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-800">{t.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      ข้อความต้อนรับ (Login Welcome Title)
                    </label>
                    <input
                      type="text"
                      value={formData.loginWelcomeTitle || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, loginWelcomeTitle: e.target.value })
                      }
                      placeholder="e.g. ยินดีต้อนรับสู่ระบบแดชบอร์ด ABC Analytic"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      คำอธิบายหน้าล็อกอิน (Subtitle)
                    </label>
                    <input
                      type="text"
                      value={formData.loginWelcomeSubtitle || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, loginWelcomeSubtitle: e.target.value })
                      }
                      placeholder="e.g. กรุณากรอกรหัสผ่านเพื่อเข้าชมรายงานข้อมูล"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM DOMAIN (CNAME) */}
          {activeTab === 'domain' && (
            <div className="space-y-5">
              <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200/80 rounded-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      3. Domain (Custom CNAME & SSL Subdomain)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ผูกโดเมนบริษัทของคุณเองเพื่อให้ลูกค้าเข้าใช้งานผ่านชื่อแบรนด์ของคุณ
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    ชื่อโดเมนที่ต้องการผูก (Custom Domain)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      placeholder="analytics.yourcompany.com"
                      className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-800"
                    />
                    <div className="px-3 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>SSL Active</span>
                    </div>
                  </div>
                </div>

                {/* DNS Instructions */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>วิธีตั้งค่า DNS CNAME บน Registrar ของคุณ:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] p-2 bg-slate-50 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Type</span>
                      <strong className="text-slate-800">CNAME</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Host</span>
                      <strong className="text-slate-800">analytics</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Value</span>
                      <strong className="text-blue-600">cname.sheets-bi-saas.com</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-700">
                ตัวอย่างการแสดงผลจริงของแบรนด์ (Live Mockup):
              </div>

              {/* Simulated Header */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-4 py-1.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <span>แถบ Header เมื่อผู้ใช้เปิดเข้าสู่ระบบ</span>
                  <span className="font-mono text-blue-600">https://{formData.domain}</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      {formData.companyLogoUrl ? (
                        <img
                          src={formData.companyLogoUrl}
                          alt="logo"
                          className="w-7 h-7 object-contain"
                        />
                      ) : (
                        <span>{formData.companyName.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        {formData.companyName}
                      </h4>
                      <p className="text-[11px] text-slate-500">Enterprise BI Dashboard</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white shadow-2xs"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      รายงานประจำเดือน
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulated Viewer Login Card */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6 text-center max-w-sm mx-auto bg-slate-50">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-white font-bold mb-3 shadow-md"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-bold text-slate-900">
                  {formData.loginWelcomeTitle || `ระบบความปลอดภัย ${formData.companyName}`}
                </h5>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.loginWelcomeSubtitle || 'กรุณากรอกรหัสผ่านเพื่อเข้าชมแดชบอร์ด'}
                </p>
                <div className="mt-4">
                  <div className="w-full py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-400 font-mono">
                    ••••••••
                  </div>
                  <button
                    type="button"
                    className="w-full mt-2 py-2 text-white text-xs font-bold rounded-xl shadow-xs"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    เข้าสู่ระบบ
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 mt-4">
                  {formData.footerCredit || `© 2026 ${formData.companyName}`}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {saveSuccess ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกการตั้งค่า White Label สำเร็จ! ระบบกำลังนำไปใช้งาน...</span>
              </span>
            ) : (
              <span>กดบันทึกเพื่ออัปเดตแบรนด์บนหน้าเว็บทั้งหมดทันที</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการตั้งค่า White Label</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
