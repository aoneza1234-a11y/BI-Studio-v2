import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Clock,
  Activity,
  Power,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  FileSpreadsheet,
  LayoutDashboard,
  UserCheck,
  Globe,
} from 'lucide-react';
import {
  getSystemUsers,
  getSystemAuditLogs,
  getSiteStatus,
  setSiteStatus,
  AuditLogEntry,
} from '../services/storage';
import { SiteStatusConfig, UserActivityRecord, UserRole } from '../types';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail: string;
  currentUserRole: UserRole;
  onToggleUserRole: (role: UserRole) => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  currentUserEmail,
  currentUserRole,
  onToggleUserRole,
}) => {
  const [users, setUsers] = useState<UserActivityRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [siteStatus, setSiteStatusState] = useState<SiteStatusConfig>({
    isOnline: true,
    maintenanceMessage: '',
    updatedAt: '',
    updatedBy: '',
  });
  const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'maintenance'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [maintenanceMsgInput, setMaintenanceMsgInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUsers(getSystemUsers());
      setAuditLogs(getSystemAuditLogs());
      const status = getSiteStatus();
      setSiteStatusState(status);
      setMaintenanceMsgInput(status.maintenanceMessage || 'ระบบปิดปรับปรุงชั่วคราวโดยผู้ดูแลระบบเพื่ออัปเดตข้อมูล');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSiteOnline = () => {
    const nextStatus: SiteStatusConfig = {
      isOnline: !siteStatus.isOnline,
      maintenanceMessage: maintenanceMsgInput.trim() || 'ระบบปิดปรับปรุงชั่วคราว',
      updatedAt: new Date().toISOString(),
      updatedBy: currentUserEmail || 'admin',
    };
    setSiteStatus(nextStatus);
    setSiteStatusState(nextStatus);
    setAuditLogs(getSystemAuditLogs());
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  ระบบผู้ดูแล (Admin Console) & บันทึกผู้ใช้งาน
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  สิทธิ์: {currentUserRole === 'admin' ? '👑 แอดมิน/ผู้พัฒนา' : '👤 ผู้ใช้งานทั่วไป'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                ตรวจสอบรายชื่อผู้เข้าใช้งาน ระบบสิทธิ์ และสถานะเปิด/ปิดเว็บไซต์
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>รายชื่อผู้ใช้งาน ({users.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>ประวัติการทำงาน (Audit Logs)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('maintenance')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'maintenance'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>เปิด/ปิดเว็บไซต์ (Maintenance)</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  siteStatus.isOnline ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
            </button>
          </div>

          {/* Role Switcher Button */}
          <div className="flex items-center gap-1.5 py-2">
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">จำลองมุมมอง:</span>
            <button
              type="button"
              onClick={() => onToggleUserRole(currentUserRole === 'admin' ? 'user' : 'admin')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>
                สลับเป็น: {currentUserRole === 'admin' ? 'โหมดผู้ใช้งาน (User)' : 'โหมดแอดมิน (Admin)'}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อหรืออีเมล..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  พบทั้งหมด <span className="font-bold text-slate-800">{filteredUsers.length}</span> บัญชี
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">ผู้ใช้งาน</th>
                      <th className="py-2.5 px-3">ระดับสิทธิ์</th>
                      <th className="py-2.5 px-3">เข้าใช้ล่าสุด</th>
                      <th className="py-2.5 px-3 text-center">จำนวนครั้ง</th>
                      <th className="py-2.5 px-3">กิจกรรมล่าสุด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          ไม่พบข้อมูลผู้ใช้งาน
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{u.displayName}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {u.role === 'admin' ? '👑 ผู้พัฒนา / Admin' : '👤 ผู้ใช้งาน (User)'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {new Date(u.lastSeenAt).toLocaleString('th-TH', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                            {u.visitCount || 1}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {u.lastAction || 'เข้าชมแดชบอร์ด'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-500">
                ประวัติกิจกรรมล่าสุดในระบบ (Audit Trail)
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    ยังไม่มีบันทึกกิจกรรม
                  </div>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-slate-50/60 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{log.action}</div>
                        <div className="text-[11px] text-slate-500">
                          โดย: <span className="font-medium text-slate-700">{log.name}</span> ({log.email})
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(log.timestamp).toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-5">
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                siteStatus.isOnline
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-200 text-rose-950'
              }`}>
                <div className={`p-2 rounded-xl text-white shrink-0 ${
                  siteStatus.isOnline ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  <Power className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>สถานะปัจจุบัน: {siteStatus.isOnline ? 'เปิดให้บริการ (Online)' : 'ปิดปรับปรุงระบบ (Maintenance Mode)'}</span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {siteStatus.isOnline
                      ? 'ระบบเปิดใช้งานตามปกติ ผู้ใช้งานทั่วไปสามารถเปิดดูและใช้งานแดชบอร์ดได้'
                      : 'ระบบถูกปิดปรับปรุงชั่วคราว ผู้ใช้งานทั่วไปจะเห็นหน้าจอแจ้งปิดปรับปรุง มีเฉพาะแอดมินที่ยังสามารถเข้าถึงได้'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">ข้อความแจ้งเตือนเมื่อปิดปรับปรุง:</label>
                <textarea
                  rows={3}
                  value={maintenanceMsgInput}
                  onChange={(e) => setMaintenanceMsgInput(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="พิมพ์ข้อความที่ต้องการแจ้งเตือนผู้ใช้งานเมื่อปิดเว็บ..."
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleToggleSiteOnline}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 text-white transition-all ${
                    siteStatus.isOnline
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>
                    {siteStatus.isOnline ? 'กดเพื่อ "ปิดเว็บไซต์" (เข้าสู่โหมดปรับปรุง)' : 'กดเพื่อ "เปิดเว็บไซต์" (ให้ใช้งานตามปกติ)'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
