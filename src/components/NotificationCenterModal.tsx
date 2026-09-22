import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  AlertTriangle,
  Mail,
  Send,
  RefreshCw,
  Clock,
  ShieldCheck,
  MessageSquare,
  Radio,
  Sliders,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import {
  NotificationEventType,
  NotificationChannelType,
  NotificationChannelConfig,
  NotificationRuleMap,
  NotificationLog,
} from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerNotification?: (event: NotificationEventType, message: string) => void;
}

const DEFAULT_CHANNELS: NotificationChannelConfig = {
  email: {
    enabled: true,
    recipientEmail: 'admin@company.com',
  },
  line: {
    enabled: true,
    token: '',
  },
  teams: {
    enabled: false,
    webhookUrl: '',
  },
  slack: {
    enabled: false,
    webhookUrl: '',
    channelName: '#bi-alerts',
  },
};

const DEFAULT_RULES: NotificationRuleMap = {
  sync_failed: { email: true, line: true, teams: true, slack: true },
  datasource_expired: { email: true, line: true, teams: false, slack: true },
  dashboard_error: { email: false, line: true, teams: true, slack: true },
  user_login: { email: false, line: false, teams: false, slack: false },
};

const EVENT_LABELS: Record<NotificationEventType, { title: string; desc: string; icon: string }> = {
  sync_failed: {
    title: '1. Sync Failed',
    desc: 'แจ้งเตือนเมื่อการซิงค์ข้อมูล Google Sheets ล้มเหลวหรือเกิด Network Timeout',
    icon: '🔄',
  },
  datasource_expired: {
    title: '2. Datasource Expired',
    desc: 'แจ้งเตือนเมื่อ URL ชีทหมดอายุ หรือสิทธิ์การเข้าถึงไฟล์ถูกยกเลิก',
    icon: '⏳',
  },
  dashboard_error: {
    title: '3. Dashboard Error',
    desc: 'แจ้งเตือนเมื่อพบข้อผิดพลาดในการเรนเดอร์กราฟหรือการประมวลผลสูตรคำนวณ',
    icon: '⚠️',
  },
  user_login: {
    title: '4. User Login',
    desc: 'แจ้งเตือนความปลอดภัยเมื่อมีผู้ใช้หรือแอดมินล็อกอินเข้าสู่ระบบ',
    icon: '👤',
  },
};

const CHANNEL_INFO: Record<
  NotificationChannelType,
  { name: string; color: string; bg: string; border: string; icon: any }
> = {
  email: {
    name: '1. Email',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Mail,
  },
  line: {
    name: '2. LINE',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: MessageSquare,
  },
  teams: {
    name: '3. Teams',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: Radio,
  },
  slack: {
    name: '4. Slack',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Bell,
  },
};

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'channels' | 'logs'>('matrix');

  // Config States
  const [channels, setChannels] = useState<NotificationChannelConfig>(() => {
    try {
      const saved = localStorage.getItem('gs_notification_channels');
      return saved ? JSON.parse(saved) : DEFAULT_CHANNELS;
    } catch {
      return DEFAULT_CHANNELS;
    }
  });

  const [rules, setRules] = useState<NotificationRuleMap>(() => {
    try {
      const saved = localStorage.getItem('gs_notification_rules');
      return saved ? JSON.parse(saved) : DEFAULT_RULES;
    } catch {
      return DEFAULT_RULES;
    }
  });

  const [logs, setLogs] = useState<NotificationLog[]>(() => {
    try {
      const saved = localStorage.getItem('gs_notification_logs');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'log_init_1',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              event: 'sync_failed',
              eventTitle: 'Sync Failed',
              channel: 'line',
              status: 'sent',
              message: '[Auto-Check] ซิงค์ชีทรายได้ประจำวันสำเร็จเรียบร้อย',
            },
            {
              id: 'log_init_2',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
              event: 'user_login',
              eventTitle: 'User Login',
              channel: 'email',
              status: 'sent',
              message: 'ผู้ดูแลระบบเข้าสู่ระบบจาก IP 182.52.xx.xx',
            },
          ];
    } catch {
      return [];
    }
  });

  // Test form state
  const [testEvent, setTestEvent] = useState<NotificationEventType>('sync_failed');
  const [testChannel, setTestChannel] = useState<NotificationChannelType>('line');
  const [testMessage, setTestMessage] = useState('ทดสอบส่งข้อความแจ้งเตือนจาก Notification Center');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; text: string } | null>(null);

  // Save to localStorage
  const handleSaveConfig = () => {
    try {
      localStorage.setItem('gs_notification_channels', JSON.stringify(channels));
      localStorage.setItem('gs_notification_rules', JSON.stringify(rules));
      setTestResult({ success: true, text: 'บันทึกการตั้งค่า Notification Center เรียบร้อย' });
      setTimeout(() => setTestResult(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRule = (event: NotificationEventType, channel: NotificationChannelType) => {
    setRules((prev) => ({
      ...prev,
      [event]: {
        ...prev[event],
        [channel]: !prev[event][channel],
      },
    }));
  };

  const handleSendTest = () => {
    setIsSendingTest(true);
    setTestResult(null);

    setTimeout(() => {
      const newLog: NotificationLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: testEvent,
        eventTitle: EVENT_LABELS[testEvent].title,
        channel: testChannel,
        status: 'sent',
        message: testMessage,
      };

      const updatedLogs = [newLog, ...logs].slice(0, 50);
      setLogs(updatedLogs);
      localStorage.setItem('gs_notification_logs', JSON.stringify(updatedLogs));

      setIsSendingTest(false);
      setTestResult({
        success: true,
        text: `ส่งข้อความทดสอบไปยัง ${CHANNEL_INFO[testChannel].name} สำเร็จ!`,
      });
      setTimeout(() => setTestResult(null), 4000);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  13. Notification Center (ศูนย์การแจ้งเตือน)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-900 rounded-md">
                  Active
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                เชื่อมต่อการแจ้งเตือนอัตโนมัติ: Sync Failed, Datasource Expired, Dashboard Error, User Login ไปยัง Email, LINE, Teams, Slack
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
            onClick={() => setActiveTab('matrix')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>กำหนดเงื่อนไขแจ้งเตือน (Events & Channels)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'channels'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>ตั้งค่าช่องทางส่ง (API & Webhooks)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`py-2.5 px-4 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-700 bg-white shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>ทดสอบส่ง & ประวัติการแจ้งเตือน ({logs.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-5">
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">กำหนดตารางการแจ้งเตือนตามเหตุการณ์ (Notification Routing)</div>
                  <p className="mt-1 text-slate-600 leading-relaxed">
                    เลือกช่องทางที่ต้องการให้ระบบส่งแจ้งเตือนโดยอัตโนมัติเมื่อเกิดเหตุการณ์แต่ละประเภท (เปิด/ปิดอิสระ)
                  </p>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="grid grid-cols-12 bg-slate-100 text-slate-700 text-xs font-bold p-3 border-b border-slate-200">
                  <div className="col-span-4 sm:col-span-5">เหตุการณ์แจ้งเตือน (Events)</div>
                  <div className="col-span-2 text-center text-blue-700">Email</div>
                  <div className="col-span-2 text-center text-emerald-700">LINE</div>
                  <div className="col-span-2 text-center text-indigo-700">Teams</div>
                  <div className="col-span-2 sm:col-span-1 text-center text-amber-700">Slack</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {(Object.keys(EVENT_LABELS) as NotificationEventType[]).map((evKey) => {
                    const ev = EVENT_LABELS[evKey];
                    return (
                      <div
                        key={evKey}
                        className="grid grid-cols-12 items-center p-3.5 hover:bg-slate-50 transition-colors"
                      >
                        <div className="col-span-4 sm:col-span-5 pr-2">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{ev.icon}</span>
                            <span>{ev.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 hidden sm:block">
                            {ev.desc}
                          </div>
                        </div>

                        {/* Email */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleRule(evKey, 'email')}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              rules[evKey]?.email
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>

                        {/* LINE */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleRule(evKey, 'line')}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              rules[evKey]?.line
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Teams */}
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleRule(evKey, 'teams')}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              rules[evKey]?.teams
                                ? 'bg-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Slack */}
                        <div className="col-span-2 sm:col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleRule(evKey, 'slack')}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                              rules[evKey]?.slack
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHANNELS CONFIG */}
          {activeTab === 'channels' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Email */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-blue-900">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>1. Email Notification</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.email.enabled}
                      onChange={(e) =>
                        setChannels({
                          ...channels,
                          email: { ...channels.email, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    อีเมลผู้รับแจ้งเตือน (Recipient Email)
                  </label>
                  <input
                    type="email"
                    value={channels.email.recipientEmail}
                    onChange={(e) =>
                      setChannels({
                        ...channels,
                        email: { ...channels.email, recipientEmail: e.target.value },
                      })
                    }
                    placeholder="e.g. alert@yourcompany.com"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  ส่งผ่านระบบ SMTP / Cloud Mailer แจ้งรายงานสรุปและข้อผิดพลาดทันที
                </div>
              </div>

              {/* 2. LINE */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>2. LINE Notify / Messaging API</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.line.enabled}
                      onChange={(e) =>
                        setChannels({
                          ...channels,
                          line: { ...channels.line, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    LINE Access Token
                  </label>
                  <input
                    type="password"
                    value={channels.line.token}
                    onChange={(e) =>
                      setChannels({
                        ...channels,
                        line: { ...channels.line, token: e.target.value },
                      })
                    }
                    placeholder="ใส่ LINE Notify Token หรือ Channel Secret..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  แจ้งเตือนเข้ากลุ่ม LINE งานและผู้บริหารแบบเรียลไทม์
                </div>
              </div>

              {/* 3. Teams */}
              <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
                    <Radio className="w-4 h-4 text-indigo-600" />
                    <span>3. Microsoft Teams Webhook</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.teams.enabled}
                      onChange={(e) =>
                        setChannels({
                          ...channels,
                          teams: { ...channels.teams, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Teams Incoming Webhook URL
                  </label>
                  <input
                    type="text"
                    value={channels.teams.webhookUrl}
                    onChange={(e) =>
                      setChannels({
                        ...channels,
                        teams: { ...channels.teams, webhookUrl: e.target.value },
                      })
                    }
                    placeholder="https://outlook.office.com/webhook/..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  ส่งข้อความการ์ด Adaptive Card เข้าแชแนลทีมงาน Microsoft Teams
                </div>
              </div>

              {/* 4. Slack */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                    <Bell className="w-4 h-4 text-amber-600" />
                    <span>4. Slack Incoming Webhook</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={channels.slack.enabled}
                      onChange={(e) =>
                        setChannels({
                          ...channels,
                          slack: { ...channels.slack, enabled: e.target.checked },
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Slack Webhook URL
                    </label>
                    <input
                      type="text"
                      value={channels.slack.webhookUrl}
                      onChange={(e) =>
                        setChannels({
                          ...channels,
                          slack: { ...channels.slack, webhookUrl: e.target.value },
                        })
                      }
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Channel Name
                    </label>
                    <input
                      type="text"
                      value={channels.slack.channelName}
                      onChange={(e) =>
                        setChannels({
                          ...channels,
                          slack: { ...channels.slack, channelName: e.target.value },
                        })
                      }
                      placeholder="#bi-alerts"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGS & TEST SENDER */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* Test Sender Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-blue-600" />
                    <span>ทดสอบส่งข้อความแจ้งเตือน (Send Test Notification)</span>
                  </div>
                  <span className="text-[10px] text-slate-400">จำลองการเกิดเหตุการณ์</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                      เลือกเหตุการณ์ (Event)
                    </label>
                    <select
                      value={testEvent}
                      onChange={(e) => setTestEvent(e.target.value as NotificationEventType)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="sync_failed">1. Sync Failed</option>
                      <option value="datasource_expired">2. Datasource Expired</option>
                      <option value="dashboard_error">3. Dashboard Error</option>
                      <option value="user_login">4. User Login</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                      เลือกช่องทาง (Channel)
                    </label>
                    <select
                      value={testChannel}
                      onChange={(e) => setTestChannel(e.target.value as NotificationChannelType)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="line">2. LINE</option>
                      <option value="email">1. Email</option>
                      <option value="teams">3. Teams</option>
                      <option value="slack">4. Slack</option>
                    </select>
                  </div>

                  <div className="sm:self-end">
                    <button
                      type="button"
                      onClick={handleSendTest}
                      disabled={isSendingTest}
                      className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSendingTest ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>กำลังส่ง...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>กดส่งทดสอบทันที</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 font-semibold block mb-1">
                    ข้อความทดสอบ
                  </label>
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{testResult.text}</span>
                  </div>
                )}
              </div>

              {/* Logs Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>ประวัติการส่งแจ้งเตือนล่าสุด (Notification History Logs)</span>
                  <span className="text-[10px] text-slate-400">เก็บ 50 รายการล่าสุด</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white max-h-64 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      ยังไม่มีประวัติการส่งแจ้งเตือน
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {logs.map((log) => {
                        const ch = CHANNEL_INFO[log.channel] || CHANNEL_INFO.email;
                        const ChIcon = ch.icon;
                        return (
                          <div key={log.id} className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-slate-50">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                {EVENT_LABELS[log.event]?.title || log.event}
                              </span>
                              <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${ch.bg} ${ch.color} ${ch.border} border`}>
                                <ChIcon className="w-3 h-3" />
                                <span>{ch.name}</span>
                              </div>
                              <span className="text-slate-700 truncate max-w-xs">{log.message}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-400">
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>สำเร็จ</span>
                              </span>
                              <span>•</span>
                              <span>{new Date(log.timestamp).toLocaleTimeString('th-TH')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            ระบบทำงานแบบอัตโนมัติ 24/7 ควบคู่กับการประมวลผลแดชบอร์ด
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
