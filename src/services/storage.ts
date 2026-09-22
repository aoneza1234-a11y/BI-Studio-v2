import {
  DashboardItem,
  DashboardLayout,
  RecentSheet,
  SheetConfig,
  SiteStatusConfig,
  UserActivityRecord,
  UserProfile,
  UserRole,
} from '../types';

const RECENT_SHEETS_KEY = 'gs_dashboard_recent_sheets_v2';
const CURRENT_CONFIG_KEY = 'gs_dashboard_current_config_v2';
const SAVED_LAYOUTS_KEY = 'gs_dashboard_saved_layouts_v2';
const DASHBOARDS_PREFIX = 'gs_dashboards_user_';
const ACTIVE_DASHBOARD_PREFIX = 'gs_active_dashboard_';
const USERS_LOG_KEY = 'gs_system_users_v1';
const AUDIT_LOG_KEY = 'gs_system_audit_logs_v1';
const SITE_STATUS_KEY = 'gs_site_status_v1';

function getUserKey(userEmail?: string | null): string {
  if (!userEmail) return 'local';
  return userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
}

// ==========================================
// Multi-Dashboard Management (Per-User / Local)
// ==========================================

export function getDashboards(userEmail?: string | null): DashboardItem[] {
  try {
    const key = `${DASHBOARDS_PREFIX}${getUserKey(userEmail)}`;
    let raw = localStorage.getItem(key);
    if (!raw) {
      // Check fallback guest key or legacy keys
      raw = localStorage.getItem(`${DASHBOARDS_PREFIX}guest`);
    }
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load dashboards', e);
    return [];
  }
}

export function saveDashboard(dashboard: DashboardItem, userEmail?: string | null): void {
  try {
    const userKey = getUserKey(userEmail);
    const key = `${DASHBOARDS_PREFIX}${userKey}`;
    const existing = getDashboards(userEmail);
    const index = existing.findIndex((d) => d.id === dashboard.id);
    let updated: DashboardItem[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...dashboard, updatedAt: new Date().toISOString() };
    } else {
      updated = [
        {
          ...dashboard,
          createdAt: dashboard.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdByEmail: userEmail || 'local@offline',
        },
        ...existing,
      ];
    }
    localStorage.setItem(key, JSON.stringify(updated));
    setActiveDashboardId(dashboard.id, userEmail);
    logUserAction(userEmail || 'local', dashboard.creatorName || 'ผู้ใช้ในเครื่อง', `บันทึกแดชบอร์ด "${dashboard.name}"`);
  } catch (e) {
    console.warn('Failed to save dashboard', e);
  }
}

export function deleteDashboard(id: string, userEmail?: string | null): void {
  try {
    const key = `${DASHBOARDS_PREFIX}${getUserKey(userEmail)}`;
    const existing = getDashboards(userEmail);
    const updated = existing.filter((d) => d.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));

    const activeId = getActiveDashboardId(userEmail);
    if (activeId === id) {
      setActiveDashboardId(updated[0]?.id || null, userEmail);
    }
  } catch (e) {
    console.warn('Failed to delete dashboard', e);
  }
}

export function getActiveDashboardId(userEmail?: string | null): string | null {
  try {
    const key = `${ACTIVE_DASHBOARD_PREFIX}${getUserKey(userEmail)}`;
    let val = localStorage.getItem(key);
    if (!val) {
      val = localStorage.getItem(`${ACTIVE_DASHBOARD_PREFIX}guest`);
    }
    return val;
  } catch {
    return null;
  }
}

export function setActiveDashboardId(id: string | null, userEmail?: string | null): void {
  try {
    const key = `${ACTIVE_DASHBOARD_PREFIX}${getUserKey(userEmail)}`;
    if (!id) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, id);
    }
  } catch (e) {
    console.warn('Failed to set active dashboard', e);
  }
}

// ==========================================
// System Users & Activity Log ("ดูได้ว่ามีใครใช้บ้าง")
// ==========================================

export function getSystemUsers(): UserActivityRecord[] {
  try {
    const raw = localStorage.getItem(USERS_LOG_KEY);
    if (!raw) {
      // Seed default admin if empty
      const defaultAdmin: UserActivityRecord = {
        id: 'admin-1',
        email: 'aoneza1234@gmail.com',
        displayName: 'Aoneza (ผู้พัฒนา/แอดมิน)',
        role: 'admin',
        firstSeenAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastSeenAt: new Date().toISOString(),
        visitCount: 14,
        lastAction: 'จัดการระบบแดชบอร์ด',
      };
      return [defaultAdmin];
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function recordUserSession(user: UserProfile, role?: UserRole): void {
  try {
    if (!user.email) return;
    const users = getSystemUsers();
    const existingIndex = users.findIndex(
      (u) => u.email.toLowerCase() === (user.email || '').toLowerCase()
    );

    const now = new Date().toISOString();
    // Check if designated admin
    const isAdmin =
      role === 'admin' ||
      user.email.toLowerCase() === 'aoneza1234@gmail.com' ||
      (existingIndex >= 0 && users[existingIndex].role === 'admin');

    if (existingIndex >= 0) {
      users[existingIndex] = {
        ...users[existingIndex],
        displayName: user.displayName || users[existingIndex].displayName,
        photoURL: user.photoURL || users[existingIndex].photoURL,
        lastSeenAt: now,
        visitCount: (users[existingIndex].visitCount || 1) + 1,
        role: isAdmin ? 'admin' : users[existingIndex].role,
      };
    } else {
      users.unshift({
        id: user.uid || `user-${Date.now()}`,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || undefined,
        role: isAdmin ? 'admin' : 'user',
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: 1,
        lastAction: 'เข้าสู่ระบบ',
      });
    }

    localStorage.setItem(USERS_LOG_KEY, JSON.stringify(users.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to record user session', e);
  }
}

export interface AuditLogEntry {
  id: string;
  email: string;
  name: string;
  action: string;
  timestamp: string;
}

export function getSystemAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function logUserAction(email: string, name: string, action: string): void {
  try {
    const logs = getSystemAuditLogs();
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email,
      name,
      action,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...logs].slice(0, 100);
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to log action', e);
  }
}

// ==========================================
// Site Maintenance / Online-Offline ("มีเปิดปิดเว็ป")
// ==========================================

export function getSiteStatus(): SiteStatusConfig {
  try {
    const raw = localStorage.getItem(SITE_STATUS_KEY);
    if (!raw) {
      return {
        isOnline: true,
        maintenanceMessage: 'ระบบปิดปรับปรุงชั่วคราวโดยผู้ดูแลระบบเพื่ออัปเดตข้อมูล',
        updatedAt: new Date().toISOString(),
        updatedBy: 'aoneza1234@gmail.com',
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      isOnline: true,
      maintenanceMessage: 'ระบบปิดปรับปรุงชั่วคราว',
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
  }
}

export function setSiteStatus(status: SiteStatusConfig): void {
  try {
    localStorage.setItem(SITE_STATUS_KEY, JSON.stringify(status));
    logUserAction(status.updatedBy, 'ผู้ดูแลระบบ', status.isOnline ? 'เปิดระบบเว็บไซต์ให้ใช้งานตามปกติ' : 'ปิดเว็บไซต์เพื่อปรับปรุงระบบ');
  } catch (e) {
    console.warn('Failed to set site status', e);
  }
}

// ==========================================
// Existing Sheet & Layout Storage
// ==========================================

export function getRecentSheets(): RecentSheet[] {
  try {
    const raw = localStorage.getItem(RECENT_SHEETS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load recent sheets from localStorage', e);
    return [];
  }
}

export function saveRecentSheet(sheet: RecentSheet): void {
  try {
    const existing = getRecentSheets();
    const filtered = existing.filter(
      (s) => !(s.id === sheet.id && s.selectedSheet === sheet.selectedSheet)
    );
    const updated = [sheet, ...filtered].slice(0, 12);
    localStorage.setItem(RECENT_SHEETS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save recent sheet', e);
  }
}

export function removeRecentSheet(id: string, sheetTitle?: string): void {
  try {
    const existing = getRecentSheets();
    const updated = existing.filter(
      (s) => !(s.id === id && (!sheetTitle || s.selectedSheet === sheetTitle))
    );
    localStorage.setItem(RECENT_SHEETS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to remove recent sheet', e);
  }
}

export function saveCurrentConfig(config: SheetConfig): void {
  try {
    localStorage.setItem(CURRENT_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save current sheet config', e);
  }
}

export function getCurrentConfig(): SheetConfig | null {
  try {
    const raw = localStorage.getItem(CURRENT_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveDashboardLayout(layout: DashboardLayout): void {
  try {
    const raw = localStorage.getItem(SAVED_LAYOUTS_KEY);
    const existing: Record<string, DashboardLayout> = raw ? JSON.parse(raw) : {};
    existing[layout.id] = layout;
    localStorage.setItem(SAVED_LAYOUTS_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('Failed to save dashboard layout', e);
  }
}

export function getSavedLayout(sheetId: string): DashboardLayout | null {
  try {
    const raw = localStorage.getItem(SAVED_LAYOUTS_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[sheetId] || null;
  } catch (e) {
    return null;
  }
}
