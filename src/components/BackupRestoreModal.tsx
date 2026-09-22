import React, { useState, useEffect } from 'react';
import {
  Database,
  X,
  Check,
  Download,
  Upload,
  Calendar,
  Clock,
  RotateCcw,
  Trash2,
  HardDrive,
  FileCheck,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  BackupItem,
  BackupScheduleConfig,
  RestoreOptions,
  BackupFrequency,
  WidgetConfig,
  SheetConfig,
  CalculatedField,
  LayoutMode,
  GridGapType,
  ThemeMode,
  DashboardTheme,
} from '../types';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Current app state to backup
  currentDashboard: {
    spreadsheetTitle?: string;
    layoutMode?: LayoutMode;
    gridGap?: GridGapType;
    themeMode?: ThemeMode;
    dashboardTheme?: DashboardTheme;
  };
  currentWidgets: WidgetConfig[];
  currentSheetConfig: SheetConfig;
  currentCalculatedFields?: CalculatedField[];
  // Restore callback
  onRestore: (
    data: BackupItem['data'],
    options: RestoreOptions
  ) => void;
}

const DEFAULT_SCHEDULE: BackupScheduleConfig = {
  isEnabled: true,
  frequency: 'daily',
  backupTime: '02:00',
  lastRunAt: new Date(Date.now() - 86400000).toISOString(),
  nextRunAt: new Date(Date.now() + 86400000).toISOString(),
};

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  currentDashboard,
  currentWidgets,
  currentSheetConfig,
  currentCalculatedFields = [],
  onRestore,
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'schedule' | 'restore'>('backup');

  // Backup list from localStorage
  const [backups, setBackups] = useState<BackupItem[]>(() => {
    try {
      const saved = localStorage.getItem('gs_backup_snapshots');
      if (saved) return JSON.parse(saved);
    } catch {}
    // default seed backup
    return [
      {
        id: 'snapshot_auto_1',
        title: 'Auto-Backup (Daily System Checkpoint)',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        type: 'scheduled',
        sizeBytes: 14200,
        data: {
          dashboard: {
            spreadsheetTitle: currentDashboard.spreadsheetTitle || 'แดชบอร์ดหลัก',
            layoutMode: currentDashboard.layoutMode,
            gridGap: currentDashboard.gridGap,
            themeMode: currentDashboard.themeMode,
            dashboardTheme: currentDashboard.dashboardTheme,
          },
          theme: {
            colorSystem: 'blue',
            canvasBackground: 'light',
          },
          widgets: currentWidgets,
          datasource: {
            sheetConfig: currentSheetConfig,
            calculatedFields: currentCalculatedFields,
          },
        },
      },
    ];
  });

  // Schedule config state
  const [schedule, setSchedule] = useState<BackupScheduleConfig>(() => {
    try {
      const saved = localStorage.getItem('gs_backup_schedule');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SCHEDULE;
  });

  // Manual Backup Form
  const [manualTitle, setManualTitle] = useState('');
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Restore selection
  const [selectedBackupId, setSelectedBackupId] = useState<string>('');
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    dashboard: true,
    theme: true,
    widget: true,
    datasource: true,
  });

  useEffect(() => {
    if (backups.length > 0 && !selectedBackupId) {
      setSelectedBackupId(backups[0].id);
    }
  }, [backups, selectedBackupId]);

  const saveBackupsToStorage = (newBackups: BackupItem[]) => {
    setBackups(newBackups);
    try {
      localStorage.setItem('gs_backup_snapshots', JSON.stringify(newBackups));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateManualBackup = () => {
    const title = manualTitle.trim() || `Manual Backup - ${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}`;
    
    const newBackup: BackupItem = {
      id: `backup_${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      type: 'manual',
      data: {
        dashboard: {
          spreadsheetTitle: currentDashboard.spreadsheetTitle,
          layoutMode: currentDashboard.layoutMode,
          gridGap: currentDashboard.gridGap,
          themeMode: currentDashboard.themeMode,
          dashboardTheme: currentDashboard.dashboardTheme,
        },
        theme: {
          colorSystem: 'primary',
          canvasBackground: 'light',
        },
        widgets: currentWidgets,
        datasource: {
          sheetConfig: currentSheetConfig,
          calculatedFields: currentCalculatedFields,
        },
      },
      sizeBytes: JSON.stringify(currentWidgets).length + JSON.stringify(currentSheetConfig).length,
    };

    const updated = [newBackup, ...backups];
    saveBackupsToStorage(updated);
    setSelectedBackupId(newBackup.id);
    setManualTitle('');
    setBannerMessage({ text: `สร้างจุดสำรองข้อมูล "${title}" สำเร็จ!`, type: 'success' });
    setTimeout(() => setBannerMessage(null), 3500);
  };

  const handleDownloadBackup = (backup: BackupItem) => {
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${backup.title.replace(/\s+/g, '_')}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteBackup = (id: string) => {
    const updated = backups.filter((b) => b.id !== id);
    saveBackupsToStorage(updated);
    if (selectedBackupId === id && updated.length > 0) {
      setSelectedBackupId(updated[0].id);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.data || !parsed.data.widgets) {
          throw new Error('รูปแบบไฟล์สำรองไม่ถูกต้อง');
        }

        const importedBackup: BackupItem = {
          id: `backup_imported_${Date.now()}`,
          title: parsed.title ? `[Imported] ${parsed.title}` : `[Imported] ${file.name}`,
          createdAt: new Date().toISOString(),
          type: 'manual',
          sizeBytes: file.size,
          data: parsed.data,
        };

        const updated = [importedBackup, ...backups];
        saveBackupsToStorage(updated);
        setSelectedBackupId(importedBackup.id);
        setActiveTab('restore');
        setBannerMessage({ text: `นำเข้าไฟล์สำรอง "${importedBackup.title}" สำเร็จ พร้อมให้กู้คืน`, type: 'success' });
        setTimeout(() => setBannerMessage(null), 3500);
      } catch (err: any) {
        setBannerMessage({ text: err.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์', type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveSchedule = () => {
    try {
      localStorage.setItem('gs_backup_schedule', JSON.stringify(schedule));
      setBannerMessage({ text: 'บันทึกการตั้งค่ากำหนดเวลาสำรองข้อมูลอัตโนมัติเรียบร้อย', type: 'success' });
      setTimeout(() => setBannerMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePerformRestore = () => {
    const targetBackup = backups.find((b) => b.id === selectedBackupId);
    if (!targetBackup) return;

    if (!restoreOptions.dashboard && !restoreOptions.theme && !restoreOptions.widget && !restoreOptions.datasource) {
      setBannerMessage({ text: 'กรุณาเลือกองค์ประกอบที่ต้องการกู้คืนอย่างน้อย 1 รายการ', type: 'error' });
      return;
    }

    onRestore(targetBackup.data, restoreOptions);
    setBannerMessage({ text: `กู้คืนข้อมูลจาก "${targetBackup.title}" เรียบร้อยแล้ว!`, type: 'success' });
    setTimeout(() => {
      setBannerMessage(null);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-blue-300 border border-white/20 shadow-inner">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  14. Backup & Restore (ระบบสำรองและกู้คืนข้อมูล)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-md">
                  Pro Engine
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                สำรองข้อมูล Manual / Schedule (Daily, Weekly, Monthly) และเลือกกู้คืน Dashboard, Theme, Widget, Datasource
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-slate-50 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. Manual Backup (สำรองทันที)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>2. Schedule Backup (ตั้งเวลาอัตโนมัติ)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restore')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'restore'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>3. Restore ได้ (กู้คืนข้อมูลแบบแยกส่วน)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {bannerMessage && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
                bannerMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {bannerMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{bannerMessage.text}</span>
            </div>
          )}

          {/* TAB 1: MANUAL BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      สร้างจุดสำรองข้อมูลทันที (Create Manual Snapshot)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      บันทึกสถานะวิดเจ็ตทั้งหมด ({currentWidgets.length} ตัว), แหล่งข้อมูล Google Sheets และการตั้งค่าสี
                    </p>
                  </div>
                  <label className="cursor-pointer py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>นำเข้าไฟล์ JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="ระบุชื่อจุดสำรอง (เช่น ก่อนปรับแต่งธีมใหม่ หรือ เวอร์ชัน Q3)..."
                    className="w-full flex-1 px-4 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleCreateManualBackup}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all whitespace-nowrap"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>สร้าง Snapshot ทันที</span>
                  </button>
                </div>
              </div>

              {/* Existing Snapshot List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>ประวัติจุดสำรองข้อมูล ({backups.length} Snapshots)</span>
                  <span className="text-[10px] text-slate-400">คลิกเพื่อดาวน์โหลดเก็บในคอมพิวเตอร์</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {backups.map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                            b.type === 'scheduled'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {b.type === 'scheduled' ? <Clock className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 truncate">{b.title}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{new Date(b.createdAt).toLocaleString('th-TH')}</span>
                            <span>•</span>
                            <span className="capitalize">{b.type}</span>
                            <span>•</span>
                            <span>{b.data.widgets.length} วิดเจ็ต</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDownloadBackup(b)}
                          title="ดาวน์โหลดไฟล์สำรอง .json"
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg text-xs transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">โหลด JSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBackupId(b.id);
                            setActiveTab('restore');
                          }}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          เลือกกู้คืน
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBackup(b.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="ลบจุดสำรอง"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE BACKUP */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        การสำรองข้อมูลอัตโนมัติตามตาราง (Schedule Backup)
                      </h3>
                      <p className="text-xs text-slate-500">
                        ระบบจะทำการ Snapshot ข้อมูลทั้งหมดและเก็บไว้ในระบบโดยอัตโนมัติ
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule.isEnabled}
                      onChange={(e) =>
                        setSchedule({ ...schedule, isEnabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      ความถี่ในการสำรองข้อมูล (Frequency)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['daily', 'weekly', 'monthly'] as BackupFrequency[]).map((freq) => (
                        <button
                          key={freq}
                          type="button"
                          onClick={() => setSchedule({ ...schedule, frequency: freq })}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                            schedule.frequency === freq
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {freq === 'daily' && 'Daily (รายวัน)'}
                          {freq === 'weekly' && 'Weekly (รายสัปดาห์)'}
                          {freq === 'monthly' && 'Monthly (รายเดือน)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      เวลาที่สำรองข้อมูล (Time)
                    </label>
                    <input
                      type="time"
                      value={schedule.backupTime}
                      onChange={(e) =>
                        setSchedule({ ...schedule, backupTime: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>สถานะ: {schedule.isEnabled ? 'กำลังทำงานอัตโนมัติ' : 'ปิดการใช้งาน'}</span>
                  </div>
                  <div>
                    <span>รอบถัดไป: </span>
                    <strong className="text-slate-800">
                      {schedule.frequency.toUpperCase()} ณ เวลา {schedule.backupTime} น.
                    </strong>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    บันทึกการตั้งค่ากำหนดเวลา
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESTORE CAPABILITIES */}
          {activeTab === 'restore' && (
            <div className="space-y-6">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">กู้คืนข้อมูลแบบแยกส่วน (Granular Restore Options)</div>
                  <p className="mt-1 text-slate-600 leading-relaxed">
                    คุณสามารถเลือกได้เฉพาะส่วนที่ต้องการกู้คืนกลับมา เช่น ต้องการกู้คืนเฉพาะวิดเจ็ต หรือเฉพาะธีมสี โดยไม่กระทบส่วนอื่น
                  </p>
                </div>
              </div>

              {/* Backup Target Selector */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">
                  เลือก Snapshot ที่ต้องการนำมากู้คืน:
                </label>
                <select
                  value={selectedBackupId}
                  onChange={(e) => setSelectedBackupId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium"
                >
                  {backups.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({new Date(b.createdAt).toLocaleString('th-TH')}) - {b.data.widgets.length} วิดเจ็ต
                    </option>
                  ))}
                </select>
              </div>

              {/* Granular Checkboxes: 1. Dashboard, 2. Theme, 3. Widget, 4. Datasource */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  เลือกองค์ประกอบที่ต้องการ Restore ได้:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. Dashboard */}
                  <label
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      restoreOptions.dashboard
                        ? 'bg-blue-50/70 border-blue-500 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={restoreOptions.dashboard}
                        onChange={(e) =>
                          setRestoreOptions({ ...restoreOptions, dashboard: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">1. Dashboard</div>
                        <div className="text-[11px] text-slate-500">
                          โครงสร้างเลย์เอาต์, ชื่อแดชบอร์ด, ระยะห่าง Grid Gap
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* 2. Theme */}
                  <label
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      restoreOptions.theme
                        ? 'bg-blue-50/70 border-blue-500 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={restoreOptions.theme}
                        onChange={(e) =>
                          setRestoreOptions({ ...restoreOptions, theme: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">2. Theme</div>
                        <div className="text-[11px] text-slate-500">
                          ธีมสี (Light, Midnight, Ocean ฯลฯ) และการตกแต่งผืนผ้าใบ
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* 3. Widget */}
                  <label
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      restoreOptions.widget
                        ? 'bg-blue-50/70 border-blue-500 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={restoreOptions.widget}
                        onChange={(e) =>
                          setRestoreOptions({ ...restoreOptions, widget: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">3. Widget</div>
                        <div className="text-[11px] text-slate-500">
                          วิดเจ็ตทั้งหมด, ชนิดกราฟ, การจัดเรียง และเงื่อนไขสี
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* 4. Datasource */}
                  <label
                    className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      restoreOptions.datasource
                        ? 'bg-blue-50/70 border-blue-500 shadow-2xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={restoreOptions.datasource}
                        onChange={(e) =>
                          setRestoreOptions({ ...restoreOptions, datasource: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">4. Datasource</div>
                        <div className="text-[11px] text-slate-500">
                          การเชื่อมต่อ Google Sheets, แท็บชีท และสูตรคำนวณ (Formula)
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePerformRestore}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>ยืนยันการกู้คืนข้อมูล (Restore Now)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            ระบบเก็บข้อมูลการสำรองอย่างปลอดภัยบน Local State และพร้อมสำหรับ Cloud Sync
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
