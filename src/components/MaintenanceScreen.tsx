import React from 'react';
import { AlertTriangle, Shield, LogIn, RefreshCw } from 'lucide-react';

interface MaintenanceScreenProps {
  message?: string;
  onAdminBypass: () => void;
  onRefresh: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  message,
  onAdminBypass,
  onRefresh,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-800/80 border border-slate-700/80 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            ระบบปิดปรับปรุงชั่วคราว
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {message || 'ขออภัยในความไม่สะดวก ขณะนี้ผู้ดูแลระบบกำลังดำเนินการปรับปรุงและอัปเดตข้อมูลแดชบอร์ด กรุณากลับมาใหม่อีกครั้งในภายหลัง'}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-700/60 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ลองใหม่อีกครั้ง (Refresh)</span>
          </button>

          <button
            type="button"
            onClick={onAdminBypass}
            className="w-full py-2 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-600/60"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>เข้าสู่ระบบในฐานะผู้พัฒนา / แอดมิน (Admin Login)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
