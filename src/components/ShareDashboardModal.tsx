import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Eye,
  Shield,
  Lock,
  Unlock,
  ExternalLink,
  Users,
  Settings,
  X,
  Sparkles,
  Link as LinkIcon,
  Laptop,
  Sliders,
} from 'lucide-react';

interface ShareDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardTitle: string;
  isPasswordProtected?: boolean;
  viewerPassword?: string;
  userRole?: 'admin' | 'user';
  onUpdateSecurity?: (isProtected: boolean, password?: string) => void;
  onSwitchToViewerMode: () => void;
}

export const ShareDashboardModal: React.FC<ShareDashboardModalProps> = ({
  isOpen,
  onClose,
  dashboardTitle,
  isPasswordProtected = false,
  viewerPassword = '',
  userRole = 'admin',
  onUpdateSecurity,
  onSwitchToViewerMode,
}) => {
  const [copiedViewer, setCopiedViewer] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [enablePassword, setEnablePassword] = useState(isPasswordProtected);
  const [passwordInput, setPasswordInput] = useState(viewerPassword);
  const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('viewer');

  if (!isOpen) return null;

  const origin = window.location.origin;
  const path = window.location.pathname;

  // 1. User Dashboard App Link: User can build/edit dashboards, connect Google Sheets, but backend admin is completely hidden
  const userAppUrl = `${origin}${path}?role=user`;
  // 2. Interactive Viewer Link: Only view & filter interactive dashboard, presentation & export
  const viewerUrl = `${origin}${path}?mode=viewer`;
  // 3. Admin Studio Link: Full access including Notification Center, Backup & Restore, White Label SaaS
  const adminUrl = `${origin}${path}?mode=admin&role=admin`;

  const handleCopyUser = () => {
    navigator.clipboard.writeText(userAppUrl);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 2500);
  };

  const handleCopyViewer = () => {
    navigator.clipboard.writeText(viewerUrl);
    setCopiedViewer(true);
    setTimeout(() => setCopiedViewer(false), 2500);
  };

  const handleCopyAdmin = () => {
    navigator.clipboard.writeText(adminUrl);
    setCopiedAdmin(true);
    setTimeout(() => setCopiedAdmin(false), 2500);
  };

  const handleSaveSecurity = () => {
    if (onUpdateSecurity) {
      onUpdateSecurity(enablePassword, enablePassword ? passwordInput.trim() : '');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-2xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                แชร์ลิงก์แดชบอร์ด (Share Dashboard)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  หน้าบ้าน ⇋ หลังบ้าน
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                ส่งลิงก์ให้ผู้บริหารหรือผู้อื่นเข้าใช้งาน โดยซ่อนระบบหลังบ้านและปุ่มแก้ไขทั้งหมด
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

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Card 1: User Dashboard App Link (ให้ผู้อื่นสร้างแดชบอร์ดเอง เชื่อมชีทเอง แต่ไม่เห็นระบบหลังบ้าน) */}
          <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  ลิงก์สำหรับผู้ใช้งาน (User App - สร้างแดชบอร์ด & เชื่อมข้อมูลเอง)
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
                สำหรับส่งให้ทีม / ผู้ใช้งาน
              </span>
            </div>

            <p className="text-xs text-slate-600">
              ผู้ใช้ที่ได้รับลิงก์นี้สามารถ<strong>สร้างแดชบอร์ดใหม่ เชื่อมต่อชีท ดึงข้อมูลมาแสดงผล และแก้ไขกราฟได้ครบทุกฟังก์ชัน</strong> โดยระบบจะ<strong>แยกขาดและปิดกั้นระบบหลังบ้านทั้งหมด</strong> (ไม่เห็นการจัดการผู้ใช้, ศูนย์แจ้งเตือน, สำรองข้อมูล, หรือ White Label)
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate shadow-2xs">
                {userAppUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                {copiedUser ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกลิงก์</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Card 2: Public Viewer Link (หน้าบ้านสำหรับดูอย่างเดียว) */}
          <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  ลิงก์สำหรับผู้ชม / ลูกค้า (Viewer Link - หน้าบ้านสำหรับดูอย่างเดียว)
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold">
                สำหรับผู้บริหาร / ลูกค้า
              </span>
            </div>

            <p className="text-xs text-slate-600">
              ผู้ใช้ที่เปิดลิงก์นี้จะเห็นแดชบอร์ดแบบโต้ตอบได้ (Interactive) กรองข้อมูล เจาะลึก และ Export PDF/Excel ได้เต็มรูปแบบ แต่จะ<strong>ไม่เห็นแถบเครื่องมือแก้ไขหรือระบบหลังบ้าน</strong>
            </p>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 truncate shadow-2xs">
                {viewerUrl}
              </div>
              <button
                type="button"
                onClick={handleCopyViewer}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                {copiedViewer ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอกลิงก์</span>
                  </>
                )}
              </button>
            </div>

            {/* Test View Button */}
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchToViewerMode();
                }}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>ทดลองเปิดดูมุมมองผู้ชม (Test Viewer View)</span>
              </button>
            </div>
          </div>

          {/* Card 2: Password Protection Option */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-800">
                  ระบบความปลอดภัยและรหัสผ่าน (Password Protection)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => {
                    setEnablePassword(e.target.checked);
                    if (!e.target.checked && onUpdateSecurity) {
                      onUpdateSecurity(false, '');
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {enablePassword && (
              <div className="pt-2 border-t border-slate-200 space-y-2 animate-in fade-in duration-150">
                <label className="block text-xs font-semibold text-slate-700">
                  ตั้งรหัสผ่านสำหรับการเข้าชม (PIN / Password):
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="เช่น 1234 หรือ secure2026"
                      className="w-full pl-9 pr-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveSecurity}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                  >
                    บันทึกรหัส
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  * เมื่อตั้งรหัสผ่าน ผู้ใช้ที่เปิดลิงก์หน้าบ้านจะต้องใส่รหัสผ่านนี้ก่อนเข้าถึงข้อมูล
                </p>
              </div>
            )}
          </div>

          {/* Card 3: Back-Office Studio Link (หลังบ้าน - เฉพาะแอดมิน) */}
          {userRole === 'admin' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                  ลิงก์ระบบหลังบ้าน (Studio Admin Link - สิทธิ์แก้ไข)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                  สำหรับผู้ดูแล
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-600 truncate">
                  {adminUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyAdmin}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  {copiedAdmin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAdmin ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            * สลับไปมาระหว่างหน้าบ้านและหลังบ้านได้ตลอดเวลาจากแถบเมนูด้านบน
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-xl transition-all shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
