import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldAlert,
  Share2,
  Upload,
  Key,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface LoginHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManualTokenSubmit?: (token: string) => void;
  onTriggerUpload?: () => void;
  onGoogleLogin?: () => void;
}

export const LoginHelpModal: React.FC<LoginHelpModalProps> = ({
  isOpen,
  onClose,
  onManualTokenSubmit,
  onTriggerUpload,
  onGoogleLogin,
}) => {
  const [manualToken, setManualToken] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  if (!isOpen) return null;

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim() && onManualTokenSubmit) {
      onManualTokenSubmit(manualToken.trim());
      setTokenSaved(true);
      setTimeout(() => {
        setTokenSaved(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                วิธีแก้ไขปัญหาการเข้าสู่ระบบ & เชื่อมต่อชีท
              </h2>
              <p className="text-xs text-slate-500">
                เบราว์เซอร์อาจบล็อกป๊อปอัปเมื่อเปิดใช้งานในหน้าต่างพรีวิว (iframe)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Solution 1: Open in new tab */}
          <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full uppercase">
                    วิธีที่ 1 (แนะนำสำหรับการล็อกอิน)
                  </span>
                  <h3 className="font-bold text-blue-900 text-sm">
                    เปิดแอปในแท็บใหม่ (Open in New Tab)
                  </h3>
                </div>
                <p className="text-xs text-blue-700 mt-1.5 leading-relaxed">
                  เนื่องจากระบบพรีวิวของ AI Studio รันอยู่ในกรอบ iframe เบราว์เซอร์จึงบล็อกหน้าต่างเข้าสู่ระบบ Google 
                  การเปิดแอปในแท็บใหม่แบบเต็มหน้าต่างจะช่วยให้ล็อกอิน Google ได้ตามปกติทันที
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                {onGoogleLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onGoogleLogin();
                      onClose();
                    }}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-xs flex items-center gap-2 shadow-2xs border border-slate-300 transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>ล็อกอิน Google</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleOpenNewTab}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-102 cursor-pointer"
                >
                  <span>เปิดแท็บใหม่</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Solution 2: Public Google Sheet (Zero Login!) */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full uppercase">
                วิธีที่ 2 (สะดวกที่สุด ไม่ต้องล็อกอินเลย)
              </span>
              <h3 className="font-bold text-emerald-900 text-sm">
                ตั้งค่าแชร์ชีทเป็น &quot;ทุกคนที่มีลิงก์&quot;
              </h3>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed mb-3">
              คุณสามารถดูและสร้างกราฟจาก Google Sheets ได้ทันทีโดยไม่ต้องเข้าสู่ระบบ เพียงตั้งค่าชีทให้อ่านได้:
            </p>
            <ol className="list-decimal list-inside text-xs text-emerald-800 space-y-1.5 bg-white/80 p-3 rounded-lg border border-emerald-100">
              <li>เปิดเอกสาร Google Sheets ของคุณ</li>
              <li>
                คลิกปุ่มสีน้ำเงิน <strong>&quot;แชร์&quot; (Share)</strong> ที่มุมขวาบนของชีท
              </li>
              <li>
                ในส่วนการเข้าถึงทั่วไป ให้เปลี่ยนเป็น <strong>&quot;ทุกคนที่มีลิงก์&quot; (Anyone with the link can view)</strong>
              </li>
              <li>คัดลอก URL ของชีท แล้วนำมาวางในช่อง &quot;เชื่อมต่อชีท&quot; ในแดชบอร์ดนี้ได้ทันที!</li>
            </ol>
          </div>

          {/* Solution 3: File Upload */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-600 text-white rounded-full uppercase">
                  วิธีที่ 3
                </span>
                <h3 className="font-bold text-slate-800 text-sm">
                  อัปโหลดไฟล์ Excel / CSV จากเครื่องของคุณ
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                หากมีไฟล์อยู่ในเครื่อง (.xlsx, .csv, .tsv) สามารถอัปโหลดและสร้างกราฟสดได้ทันทีโดยไม่ต้องเชื่อมต่ออินเทอร์เน็ต
              </p>
            </div>
            {onTriggerUpload && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onTriggerUpload();
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>เลือกไฟล์</span>
              </button>
            )}
          </div>

          {/* Solution 4: Manual Access Token Input */}
          {onManualTokenSubmit && (
            <div className="pt-2 border-t border-slate-100">
              <details className="group">
                <summary className="text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer flex items-center gap-2 select-none">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span>ตัวเลือกขั้นสูง: ระบุ Google OAuth Access Token ด้วยตนเอง</span>
                </summary>
                <form onSubmit={handleSaveToken} className="mt-3 space-y-2">
                  <p className="text-[11px] text-slate-400">
                    หากคุณมี OAuth Bearer Access Token จาก Google Cloud Console หรือ OAuth Playground
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="ya29.a0AfH6SM..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!manualToken.trim()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {tokenSaved ? 'บันทึกแล้ว!' : 'นำไปใช้'}
                    </button>
                  </div>
                </form>
              </details>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
          >
            เข้าใจแล้ว / ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
