import React from 'react';
import { Plus, Save, Sparkles, X, AlertTriangle } from 'lucide-react';

interface NewDashboardConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndCreateNew: () => void;
  onCreateNewWithoutSaving: () => void;
  currentDashboardName: string;
}

export const NewDashboardConfirmModal: React.FC<NewDashboardConfirmModalProps> = ({
  isOpen,
  onClose,
  onSaveAndCreateNew,
  onCreateNewWithoutSaving,
  currentDashboardName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">สร้างแดชบอร์ดใหม่</h3>
              <p className="text-xs text-slate-500">จัดการข้อมูลก่อนเริ่มแดชบอร์ดใหม่</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold">ต้องการบันทึกแดชบอร์ดปัจจุบันก่อนหรือไม่?</div>
              <div className="text-amber-800 leading-relaxed">
                คุณกำลังเปิดใช้งานแดชบอร์ด <span className="font-semibold underline">"{currentDashboardName || 'แดชบอร์ดปัจจุบัน'}"</span> หากสร้างใหม่โดยไม่บันทึก การเปลี่ยนแปลงล่าสุดอาจไม่ถูกเก็บไว้
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            กรุณาเลือกตัวเลือกที่ต้องการด้านล่างเพื่อดำเนินการต่อ:
          </p>

          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={onSaveAndCreateNew}
              className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all group"
            >
              <Save className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
              <span>บันทึกแดชบอร์ดเดิม และสร้างแดชบอร์ดใหม่</span>
            </button>

            <button
              type="button"
              onClick={onCreateNewWithoutSaving}
              className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>สร้างใหม่ทันที (ไม่บันทึกของเดิม)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 text-slate-500 hover:text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
