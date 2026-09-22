import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ProcessedSheetData,
  RecentSheet,
  SheetConfig,
  SheetTabInfo,
  SpreadsheetMetadata,
  UserProfile,
  WidgetConfig,
  WidgetWidth,
  FilterState,
  GridGapType,
  AlignmentGuideline,
  DashboardTheme,
} from './types';
import {
  getAccessToken,
  setManualAccessToken,
  googleSignIn,
  logout,
  initAuth,
} from './services/firebase';
import {
  extractSpreadsheetId,
  extractGidFromUrl,
  fetchSpreadsheetMetadata,
  fetchPublicSpreadsheetMetadata,
  fetchSheetValues,
  fetchPublicSheetCsv,
  parseUploadedFileText,
  parseUploadedFileObject,
  processSheetGrid,
} from './services/sheetsApi';
import {
  getRecentSheets,
  saveRecentSheet,
  getCurrentConfig,
  saveCurrentConfig,
  getSavedLayout,
  saveDashboardLayout,
  getDashboards,
  saveDashboard,
  deleteDashboard,
  getActiveDashboardId,
  setActiveDashboardId,
  recordUserSession,
  getSiteStatus,
} from './services/storage';
import {
  DASHBOARD_TEMPLATES,
  DashboardTemplate,
} from './templates/dashboardTemplates';
import { SAMPLE_DATASETS } from './services/sampleData';
import { filterRecords } from './utils/filterRecords';
import { exportDashboardAsPng } from './utils/exportDashboard';
import { Header } from './components/Header';
import { SheetConnector } from './components/SheetConnector';
import { FilterBar } from './components/FilterBar';
import { WidgetCard } from './components/WidgetCard';
import { WidgetEditorModal } from './components/WidgetEditorModal';
import { SheetPreviewModal } from './components/SheetPreviewModal';
import { TemplateSelectorModal } from './components/TemplateSelectorModal';
import { DataGridEditorModal } from './components/DataGridEditorModal';
import { StudioLeftSidebar } from './components/StudioLeftSidebar';
import { BISidePanel } from './components/BISidePanel';
import { NewDashboardConfirmModal } from './components/NewDashboardConfirmModal';
import { FormulaBuilderModal } from './components/FormulaBuilderModal';
import { ShareDashboardModal } from './components/ShareDashboardModal';
import { TemplateMarketplaceModal } from './components/TemplateMarketplaceModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { LoginHelpModal } from './components/LoginHelpModal';
import { ViewerPortal } from './components/ViewerPortal';
import { applyCalculatedFields } from './utils/formulaEvaluator';
import { DashboardItem, SiteStatusConfig, UserRole, CalculatedField, WhiteLabelConfig } from './types';
import {
  AlertCircle,
  Plus,
  RefreshCw,
  LayoutTemplate,
  Sliders,
  CheckCircle2,
  Image as ImageIcon,
  Printer,
  Edit3,
  Table,
  HelpCircle,
  ExternalLink,
  LogIn,
  Minimize2,
  Sparkles,
  Move,
  Grid,
  Sun,
  Moon,
  Filter,
  Copy,
  Trash2,
  Check,
  X,
  Database,
  Lock,
  Key,
} from 'lucide-react';

export default function App() {
  // Offline User & Session State (ทำงานออฟไลน์ บันทึกในเครื่อง)
  const [user, setUser] = useState<UserProfile | null>(() => ({
    uid: 'offline-local-user',
    email: 'local@device',
    displayName: 'ผู้ใช้งานเครื่องนี้ (ออฟไลน์)',
    photoURL: null,
    role: 'user',
  }));
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Preview & Export & Layout State
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [dashboardSpacing, setDashboardSpacing] = useState<GridGapType>('normal');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'freeform'>('freeform');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [dashboardTheme, setDashboardTheme] = useState<DashboardTheme>('light');
  const [primaryColor, setPrimaryColor] = useState<string>(() => {
    return localStorage.getItem('gs_theme_primary_color') || '#7c3aed';
  });
  const [fontFamily, setFontFamily] = useState<string>(() => {
    return localStorage.getItem('gs_theme_font_family') || 'system';
  });
  const [cardRadius, setCardRadius] = useState<string>(() => {
    return localStorage.getItem('gs_theme_card_radius') || 'standard';
  });
  const [cardShadow, setCardShadow] = useState<string>(() => {
    return localStorage.getItem('gs_theme_card_shadow') || 'soft';
  });

  const handleUpdatePrimaryColor = (color: string) => {
    setPrimaryColor(color);
    localStorage.setItem('gs_theme_primary_color', color);
  };
  const handleUpdateFontFamily = (font: string) => {
    setFontFamily(font);
    localStorage.setItem('gs_theme_font_family', font);
  };
  const handleUpdateCardRadius = (radius: string) => {
    setCardRadius(radius);
    localStorage.setItem('gs_theme_card_radius', radius);
  };
  const handleUpdateCardShadow = (shadow: string) => {
    setCardShadow(shadow);
    localStorage.setItem('gs_theme_card_shadow', shadow);
  };

  const activeFontFamilyStyle = useMemo(() => {
    switch (fontFamily) {
      case 'kanit':
        return { fontFamily: "'Kanit', sans-serif" };
      case 'prompt':
        return { fontFamily: "'Prompt', sans-serif" };
      case 'sarabun':
        return { fontFamily: "'Sarabun', sans-serif" };
      case 'chakra':
        return { fontFamily: "'Chakra Petch', sans-serif" };
      default:
        return undefined;
    }
  }, [fontFamily]);

  const activeGuidelinesState = useState<AlignmentGuideline[] | null>(null);
  const [activeGuidelines, setActiveGuidelines] = activeGuidelinesState;

  // Left Studio Sidebar (Dashboards, Sheet Tabs, 30+ Visuals)
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);

  // Right BI Studio Tools Panel (Styling, live sync, formulas, KPI comparison)
  const [isBIPanelOpen, setIsBIPanelOpen] = useState(false);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null);
  const [liveSyncInterval, setLiveSyncInterval] = useState<number>(0); // 0 = off
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Dashboard Title Inline Editing State
  const [isEditingDashboardTitle, setIsEditingDashboardTitle] = useState(false);
  const [editedDashboardTitle, setEditedDashboardTitle] = useState('');

  // User Role & System Status (Admin / User Separation & Site Online/Offline)
  // Public web link defaults to 'user' (can create/edit dashboard, connect sheets, but cannot access backend admin)
  // Admin access is granted via ?role=admin, ?mode=admin, or previously saved 'admin' in localStorage
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const modeParam = params.get('mode');
    if (roleParam === 'admin' || modeParam === 'admin') {
      localStorage.setItem('gs_user_role', 'admin');
      return 'admin';
    }
    if (roleParam === 'user') {
      localStorage.setItem('gs_user_role', 'user');
      return 'user';
    }
    const saved = localStorage.getItem('gs_user_role');
    return (saved as UserRole) || 'user';
  });
  const [siteStatus, setSiteStatusState] = useState<SiteStatusConfig>(() => getSiteStatus());

  // Multi-Dashboard Management (Per-User / Local)
  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [activeDashboardId, setActiveDashboardIdState] = useState<string | null>(null);
  const [isNewDashboardModalOpen, setIsNewDashboardModalOpen] = useState(false);

  // Sheet State
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const saved = getCurrentConfig();
    return (
      saved || {
        spreadsheetId: 'sample-sales',
        spreadsheetTitle: SAMPLE_DATASETS[0].title,
        sheetUrl: '',
        selectedSheetTitle: SAMPLE_DATASETS[0].sheetName,
        headerRowIndex: 1,
        dataStartRowIndex: 2,
      }
    );
  });

  const [metadata, setMetadata] = useState<SpreadsheetMetadata | null>(null);
  const [rawRows, setRawRows] = useState<(string | number | boolean | null)[][]>([]);
  const [originalRawRows, setOriginalRawRows] = useState<(string | number | boolean | null)[][]>([]);
  const [cachedWorkbookSheets, setCachedWorkbookSheets] = useState<Record<string, (string | number | boolean | null)[][]> | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedSheetData>({
    headers: [],
    rawRows: [],
    records: [],
    numericColumns: [],
    categoricalColumns: [],
    dateColumns: [],
    totalRows: 0,
  });

  // Dashboard & Widgets State
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('sales-overview');
  const [recentSheets, setRecentSheets] = useState<RecentSheet[]>([]);

  // UI Modals & Loading
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [editingWidget, setEditingWidget] = useState<WidgetConfig | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isDataGridModalOpen, setIsDataGridModalOpen] = useState(false);
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isLoginHelpModalOpen, setIsLoginHelpModalOpen] = useState(false);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig>(() => {
    try {
      const saved = localStorage.getItem('gs_whitelabel_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved white label config', e);
    }
    return {
      companyName: 'ABC Analytic',
      domain: 'analytics.abcanalytic.com',
      loginTheme: 'modern_blue',
      loginWelcomeTitle: 'ยินดีต้อนรับสู่ระบบรายงานข้อมูล ABC Analytic',
      loginWelcomeSubtitle: 'เข้าถึงแดชบอร์ดและการวิเคราะห์ธุรกิจของคุณอย่างปลอดภัย',
      primaryColor: '#2563eb',
      accentColor: '#3b82f6',
      canvasTheme: 'light',
      footerCredit: '© 2026 ABC Analytic. Powered by Enterprise BI Platform.',
    };
  });
  const [calculatedFields, setCalculatedFields] = useState<CalculatedField[]>(() => {
    try {
      const saved = localStorage.getItem('gs_calculated_fields');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isPasswordProtected, setIsPasswordProtected] = useState(() => {
    return localStorage.getItem('gs_share_protected') === 'true';
  });
  const [viewerPassword, setViewerPassword] = useState(() => {
    return localStorage.getItem('gs_share_password') || '';
  });
  const [isViewerMode, setIsViewerMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'viewer';
  });
  const [isViewerAuthenticated, setIsViewerAuthenticated] = useState(false);
  const [viewerPinInput, setViewerPinInput] = useState('');
  const [viewerPinError, setViewerPinError] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentNavSection, setCurrentNavSection] = useState<'dashboard' | 'database' | 'templates' | 'sheets' | 'settings'>('dashboard');
  const [studioLeftSidebarTab, setStudioLeftSidebarTab] = useState<'visuals' | 'data' | 'dashboards' | 'admin'>('visuals');

  // Filter Bar State: Initially show ALL records without any default column filter
  const [filters, setFilters] = useState<FilterState>({
    dateColumn: '',
    datePreset: 'all',
    categoryFilters: {},
    activeFilterColumns: [],
    searchQuery: '',
  });

  // Filter Bar Placement: 'right' (fixed vertical sidebar on right) or 'top' (horizontal bar above widgets)
  // Default to 'right' as requested: ("ทำตำแหน่งแนวตั้งลงมาด้านข้างแถวขวานี้จะฟิกไว้เลย")
  const [filterPosition, setFilterPosition] = useState<'right' | 'top'>('right');
  const [isFilterSidebarVisible, setIsFilterSidebarVisible] = useState(true);

  // Real-time active filter count for badges
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery && filters.searchQuery.trim() !== '') count++;
    Object.values(filters.categoryFilters || {}).forEach((v) => {
      if (v && v !== '__all__') count++;
    });
    return count;
  }, [filters]);

  // Automatically detect and set a valid date column on initial load if available
  useEffect(() => {
    if (processedData.headers.length > 0) {
      setFilters((prev) => {
        // If already set to empty string by user choice, keep it empty!
        if (prev.dateColumn === '') {
          return prev;
        }
        const stillValid = prev.dateColumn && processedData.headers.includes(prev.dateColumn);
        if (!stillValid) {
          return { ...prev, dateColumn: '' };
        }
        return prev;
      });
    }
  }, [processedData.headers, processedData.dateColumns]);

  // Compute filtered records in real-time
  const filteredRecords = useMemo(() => {
    return filterRecords(processedData.records, filters);
  }, [processedData.records, filters]);

  const handleUpdateFilters = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateColumn: '',
      datePreset: 'all',
      startDate: undefined,
      endDate: undefined,
      selectedYear: undefined,
      selectedMonth: undefined,
      categoryFilters: {},
      activeFilterColumns: [],
      searchQuery: '',
    });
  };

  // Cross-filtering from chart clicks (e.g. clicking a bar or slice filters the entire dashboard)
  const handleChartCrossFilter = useCallback((column?: string, value?: string) => {
    if (!column || !value) return;

    setFilters((prev) => {
      const currentVal = prev.categoryFilters?.[column];
      const updatedCategories = { ...prev.categoryFilters };

      // Toggle off if already selected, otherwise set to this category
      if (currentVal === value) {
        delete updatedCategories[column];
      } else {
        updatedCategories[column] = value;
      }

      const activeCols = new Set(prev.activeFilterColumns || []);
      if (updatedCategories[column]) {
        activeCols.add(column);
      }

      return {
        ...prev,
        categoryFilters: updatedCategories,
        activeFilterColumns: Array.from(activeCols),
      };
    });
  }, []);

  // Initialize Recent Sheets & Local State
  useEffect(() => {
    setRecentSheets(getRecentSheets());
  }, []);

  // Sync Dashboards and User Activity
  useEffect(() => {
    const list = getDashboards(user?.email);
    setDashboards(list);
    const activeId = getActiveDashboardId(user?.email);
    if (activeId && list.some((d) => d.id === activeId)) {
      setActiveDashboardIdState(activeId);
    } else if (list.length > 0) {
      setActiveDashboardIdState(list[0].id);
    }

    if (user) {
      recordUserSession(user, userRole);
    }
  }, [user?.email, userRole]);

  // Dashboard Management Handlers
  const handleRequestNewDashboard = () => {
    if (widgets.length > 0) {
      setIsNewDashboardModalOpen(true);
    } else {
      handleCreateNewWithoutSaving();
    }
  };

  const handleSaveAndCreateNew = (dashboardName?: string) => {
    const nameToSave =
      dashboardName ||
      sheetConfig.spreadsheetTitle ||
      `แดชบอร์ด (${new Date().toLocaleDateString('th-TH')})`;
    const currentId = activeDashboardId || `dash_${Date.now()}`;
    const savedItem: DashboardItem = {
      id: currentId,
      name: nameToSave,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sheetConfig,
      widgets,
      dashboardSpacing,
      dashboardTheme,
      createdByEmail: user?.email || 'user@bi-studio.com',
      creatorName: user?.displayName || 'ผู้ใช้งาน',
    };
    saveDashboard(savedItem, user?.email);

    // Create fresh new dashboard
    const newId = `dash_${Date.now() + 1}`;
    const newDash: DashboardItem = {
      id: newId,
      name: `แดชบอร์ดใหม่ (${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sheetConfig: { ...sheetConfig },
      widgets: [],
      dashboardSpacing: 'normal',
      dashboardTheme: 'light',
      createdByEmail: user?.email || 'user@bi-studio.com',
      creatorName: user?.displayName || 'ผู้ใช้งาน',
    };
    saveDashboard(newDash, user?.email);
    setActiveDashboardId(newId, user?.email);
    setActiveDashboardIdState(newId);
    setDashboards(getDashboards(user?.email));
    setWidgets([]);
    setIsNewDashboardModalOpen(false);
    setSuccessBanner(`บันทึกแดชบอร์ดเดิมและสร้างแดชบอร์ดใหม่เรียบร้อย`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const handleCreateNewWithoutSaving = () => {
    const newId = `dash_${Date.now()}`;
    const newDash: DashboardItem = {
      id: newId,
      name: `แดชบอร์ดใหม่ (${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sheetConfig: { ...sheetConfig },
      widgets: [],
      dashboardSpacing: 'normal',
      dashboardTheme: 'light',
      createdByEmail: user?.email || 'user@bi-studio.com',
      creatorName: user?.displayName || 'ผู้ใช้งาน',
    };
    saveDashboard(newDash, user?.email);
    setActiveDashboardId(newId, user?.email);
    setActiveDashboardIdState(newId);
    setDashboards(getDashboards(user?.email));
    setWidgets([]);
    setIsNewDashboardModalOpen(false);
    setSuccessBanner('สร้างแดชบอร์ดใหม่เรียบร้อย');
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const handleSelectDashboard = (id: string) => {
    const found = dashboards.find((d) => d.id === id);
    if (found) {
      setActiveDashboardIdState(id);
      setActiveDashboardId(id, user?.email);
      setWidgets(found.widgets || []);
      if (found.sheetConfig) setSheetConfig(found.sheetConfig);
      if (found.dashboardSpacing) setDashboardSpacing(found.dashboardSpacing);
      if (found.dashboardTheme) setDashboardTheme(found.dashboardTheme);
      setSuccessBanner(`สลับไปยังแดชบอร์ด "${found.name}" เรียบร้อย`);
      setTimeout(() => setSuccessBanner(null), 2500);
    }
  };

  const handleSaveCurrentDashboard = () => {
    const currentTitle =
      dashboards.find((d) => d.id === activeDashboardId)?.name ||
      sheetConfig.spreadsheetTitle ||
      'แดชบอร์ดหลัก';
    const inputName = prompt('ระบุชื่อแดชบอร์ดที่ต้องการบันทึก:', currentTitle);
    if (inputName === null) return;
    const finalName = inputName.trim() || currentTitle;

    const idToUse = activeDashboardId || `dash_${Date.now()}`;
    const item: DashboardItem = {
      id: idToUse,
      name: finalName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sheetConfig,
      widgets,
      dashboardSpacing,
      dashboardTheme,
      createdByEmail: user?.email || 'user@bi-studio.com',
      creatorName: user?.displayName || 'ผู้ใช้งาน',
    };
    saveDashboard(item, user?.email);
    setActiveDashboardId(idToUse, user?.email);
    setActiveDashboardIdState(idToUse);
    setDashboards(getDashboards(user?.email));
    setSuccessBanner(`บันทึกแดชบอร์ด "${finalName}" (${widgets.length} วิดเจ็ต) สำเร็จ`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  const handleDeleteDashboard = (id: string) => {
    const target = dashboards.find((d) => d.id === id);
    if (!target) return;
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแดชบอร์ด "${target.name}"?`)) {
      deleteDashboard(id, user?.email);
      const remaining = getDashboards(user?.email);
      setDashboards(remaining);
      if (activeDashboardId === id) {
        if (remaining.length > 0) {
          handleSelectDashboard(remaining[0].id);
        } else {
          setActiveDashboardIdState(null);
          setWidgets([]);
        }
      }
      setSuccessBanner('ลบแดชบอร์ดเรียบร้อย');
      setTimeout(() => setSuccessBanner(null), 2500);
    }
  };

  // Dashboard Title Inline Editing Handlers
  const handleStartEditDashboardTitle = () => {
    setEditedDashboardTitle(sheetConfig.spreadsheetTitle || 'แดชบอร์ดข้อมูล');
    setIsEditingDashboardTitle(true);
  };

  const handleSaveDashboardTitle = () => {
    const trimmed = editedDashboardTitle.trim();
    if (trimmed) {
      setSheetConfig((prev) => ({ ...prev, spreadsheetTitle: trimmed }));
      if (activeDashboardId) {
        const currentDash = dashboards.find((d) => d.id === activeDashboardId);
        if (currentDash) {
          const updatedDash = {
            ...currentDash,
            name: trimmed,
            updatedAt: new Date().toISOString(),
          };
          saveDashboard(updatedDash, user?.email);
          setDashboards(getDashboards(user?.email));
        }
      }
      setSuccessBanner(`เปลี่ยนชื่อแดชบอร์ดเป็น "${trimmed}" เรียบร้อยแล้ว`);
      setTimeout(() => setSuccessBanner(null), 3000);
    }
    setIsEditingDashboardTitle(false);
  };

  // Handle Save Calculated Fields
  const handleSaveCalculatedFields = (fields: CalculatedField[]) => {
    setCalculatedFields(fields);
    try {
      localStorage.setItem('gs_calculated_fields', JSON.stringify(fields));
    } catch (e) {
      console.error(e);
    }
    if (rawRows.length > 0) {
      const processed = processSheetGrid(
        rawRows,
        sheetConfig.headerRowIndex,
        sheetConfig.dataStartRowIndex,
        sheetConfig.dataEndRowIndex,
        sheetConfig.selectedColumns
      );
      const finalData = fields.length > 0 ? applyCalculatedFields(processed, fields) : processed;
      setProcessedData(finalData);
    }
    setSuccessBanner(`อัปเดตฟิลด์คำนวณสำเร็จ (${fields.length} รายการ)`);
    setTimeout(() => setSuccessBanner(null), 2500);
  };

  // Process data whenever rawRows, row config, or calculatedFields change
  useEffect(() => {
    if (rawRows.length > 0) {
      const processed = processSheetGrid(
        rawRows,
        sheetConfig.headerRowIndex,
        sheetConfig.dataStartRowIndex,
        sheetConfig.dataEndRowIndex,
        sheetConfig.selectedColumns
      );
      const finalData =
        calculatedFields.length > 0
          ? applyCalculatedFields(processed, calculatedFields)
          : processed;
      setProcessedData(finalData);

      // If widgets are empty, initialize with default template
      if (widgets.length === 0) {
        const savedLayout = getSavedLayout(sheetConfig.spreadsheetId);
        if (savedLayout && savedLayout.widgets.length > 0) {
          setWidgets(savedLayout.widgets);
          if (savedLayout.templateId) setActiveTemplateId(savedLayout.templateId);
        } else {
          const defaultTmpl = DASHBOARD_TEMPLATES[0];
          setWidgets(defaultTmpl.createWidgets(finalData));
          setActiveTemplateId(defaultTmpl.id);
        }
      }
    }
  }, [
    rawRows,
    sheetConfig.headerRowIndex,
    sheetConfig.dataStartRowIndex,
    sheetConfig.dataEndRowIndex,
    sheetConfig.selectedColumns,
    calculatedFields,
  ]);

  // Persist current config whenever it changes
  useEffect(() => {
    saveCurrentConfig(sheetConfig);
  }, [sheetConfig]);

  // Persist widget layout whenever widgets change
  useEffect(() => {
    if (widgets.length > 0 && sheetConfig.spreadsheetId) {
      saveDashboardLayout({
        id: sheetConfig.spreadsheetId,
        name: sheetConfig.spreadsheetTitle || 'My Dashboard',
        templateId: activeTemplateId,
        updatedAt: new Date().toISOString(),
        widgets,
      });
    }
  }, [widgets, sheetConfig.spreadsheetId, sheetConfig.spreadsheetTitle, activeTemplateId]);

  // Load Sheet Data
  const loadSheetData = useCallback(
    async (
      spreadsheetId: string,
      tabTitle?: string,
      providedToken?: string | null,
      customUrl?: string,
      isInitialLoad?: boolean
    ) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const token = providedToken || accessToken || getAccessToken();

        // Check if sample dataset
        const sample = SAMPLE_DATASETS.find((s) => s.id === spreadsheetId);
        if (sample) {
          const meta: SpreadsheetMetadata = {
            id: sample.id,
            title: sample.title,
            sheets: [
              {
                sheetId: 0,
                title: sample.sheetName,
                index: 0,
                rowCount: sample.rows.length,
                columnCount: sample.rows[0]?.length || 0,
              },
            ],
            url: sample.title,
            lastFetchedAt: new Date().toISOString(),
          };

          setMetadata(meta);
          setRawRows(sample.rows);
          setOriginalRawRows(sample.rows.map((r) => [...r]));
          setSheetConfig((prev) => ({
            ...prev,
            spreadsheetId: sample.id,
            spreadsheetTitle: sample.title,
            sheetUrl: customUrl || prev.sheetUrl || sample.title,
            selectedSheetTitle: sample.sheetName,
            headerRowIndex: sample.headerRow,
            dataStartRowIndex: sample.dataStartRow,
          }));

          const processed = processSheetGrid(
            sample.rows,
            sample.headerRow,
            sample.dataStartRow
          );
          setProcessedData(processed);

          const defaultTmpl =
            sample.id === 'sample-projects'
              ? DASHBOARD_TEMPLATES[1]
              : DASHBOARD_TEMPLATES[0];
          setWidgets(defaultTmpl.createWidgets(processed));
          setActiveTemplateId(defaultTmpl.id);

          setSuccessBanner(`โหลดข้อมูลตัวอย่าง "${sample.title}" เรียบร้อย`);
          setTimeout(() => setSuccessBanner(null), 3500);
          setIsLoading(false);
          return;
        }

        // Real Google Sheets API call
        let rows: (string | number | boolean | null)[][] | null = null;
        let metaTitle = 'Google Spreadsheet';
        let targetTab = tabTitle || 'Sheet1';
        let tabCount = 1;

        if (token) {
          try {
            const meta = await fetchSpreadsheetMetadata(spreadsheetId, token);
            setMetadata(meta);
            metaTitle = meta.title;
            tabCount = meta.sheets.length;
            targetTab = tabTitle || (meta.sheets.length > 0 ? meta.sheets[0].title : 'Sheet1');
            rows = await fetchSheetValues(spreadsheetId, targetTab, token);
          } catch (apiErr: any) {
            console.warn('API fetch with OAuth token failed, attempting public CSV fallback:', apiErr);
            rows = await fetchPublicSheetCsv(spreadsheetId, targetTab);
          }
        } else {
          // No token provided: fetch metadata via public proxy and extract all sheet tabs!
          let publicMeta: SpreadsheetMetadata | null =
            metadata && metadata.id === spreadsheetId ? { ...metadata } : null;

          if (!publicMeta || publicMeta.sheets.length <= 1) {
            try {
              publicMeta = await fetchPublicSpreadsheetMetadata(
                spreadsheetId,
                customUrl || sheetConfig.sheetUrl
              );
            } catch (pErr) {
              console.warn('Failed to fetch public metadata:', pErr);
            }
          }

          const effectiveUrl = customUrl || sheetConfig.sheetUrl;
          const urlGid = effectiveUrl ? extractGidFromUrl(effectiveUrl) : null;

          if (tabTitle) {
            targetTab = tabTitle;
          } else if (urlGid !== null && publicMeta && publicMeta.sheets.length > 0) {
            const matched = publicMeta.sheets.find((s) => s.sheetId === urlGid);
            targetTab = matched ? matched.title : `Sheet (gid:${urlGid})`;
          } else if (publicMeta && publicMeta.sheets.length > 0) {
            targetTab = publicMeta.sheets[0].title;
          }

          // Fetch the rows for the selected sheet/tab
          let targetSheetGid: number | null = urlGid;
          if (publicMeta) {
            const found = publicMeta.sheets.find(
              (s) => s.title.toLowerCase() === targetTab.toLowerCase()
            );
            if (found && found.sheetId !== undefined) {
              targetSheetGid = found.sheetId;
            }
          }

          rows = await fetchPublicSheetCsv(spreadsheetId, targetTab, targetSheetGid);

          if (rows && rows.length > 0) {
            const finalMeta: SpreadsheetMetadata = publicMeta || {
              id: spreadsheetId,
              title: 'Google Spreadsheet (สาธารณะ)',
              sheets: [],
              url: effectiveUrl,
              lastFetchedAt: new Date().toISOString(),
            };

            // Ensure targetTab is registered in sheets list
            const existingSheet = finalMeta.sheets.find(
              (s) => s.title.toLowerCase() === targetTab.toLowerCase()
            );
            if (!existingSheet) {
              finalMeta.sheets.push({
                sheetId: targetSheetGid ?? finalMeta.sheets.length,
                title: targetTab,
                index: finalMeta.sheets.length,
                rowCount: rows.length,
                columnCount: rows[0]?.length || 0,
              });
            } else {
              existingSheet.rowCount = rows.length;
              existingSheet.columnCount = rows[0]?.length || 0;
            }

            setMetadata({ ...finalMeta });
            metaTitle = finalMeta.title;
            tabCount = finalMeta.sheets.length;
          }
        }

        if (!rows || rows.length === 0) {
          if (isInitialLoad) {
            console.warn(
              'Initial sheet load requires login or is private. Gracefully loading sample sales data.'
            );
            const fallbackSample = SAMPLE_DATASETS[0];
            const meta: SpreadsheetMetadata = {
              id: fallbackSample.id,
              title: fallbackSample.title,
              sheets: [
                {
                  sheetId: 0,
                  title: fallbackSample.sheetName,
                  index: 0,
                  rowCount: fallbackSample.rows.length,
                  columnCount: fallbackSample.rows[0]?.length || 0,
                },
              ],
              url: fallbackSample.title,
              lastFetchedAt: new Date().toISOString(),
            };
            setMetadata(meta);
            setRawRows(fallbackSample.rows);
            setOriginalRawRows(fallbackSample.rows.map((r) => [...r]));
            setSheetConfig({
              spreadsheetId: fallbackSample.id,
              spreadsheetTitle: fallbackSample.title,
              sheetUrl: '',
              selectedSheetTitle: fallbackSample.sheetName,
              headerRowIndex: fallbackSample.headerRow,
              dataStartRowIndex: fallbackSample.dataStartRow,
            });
            const processed = processSheetGrid(
              fallbackSample.rows,
              fallbackSample.headerRow,
              fallbackSample.dataStartRow
            );
            setProcessedData(processed);
            const defaultTmpl = DASHBOARD_TEMPLATES[0];
            setWidgets(defaultTmpl.createWidgets(processed));
            setActiveTemplateId(defaultTmpl.id);
            if (!token) {
              setErrorMessage(
                'สเปรดชีตนี้ยังไม่เปิดการเข้าถึงสาธารณะ: กรุณาตั้งค่าแชร์ใน Google Sheets เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view) หรือเลือกอัปโหลดไฟล์ Excel / CSV จากเครื่องของคุณ'
              );
            }
            setIsLoading(false);
            return;
          }

          const friendlyMsg = !token
            ? 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้: กรุณาตรวจสอบว่าตั้งค่าแชร์ใน Google Sheets เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" (Anyone with the link can view) แล้วหรือไม่ หรือคลิก "อัปโหลดไฟล์" จากเครื่องของคุณได้ทันที'
            : 'ไม่สามารถดึงข้อมูลจากชีทนี้ได้ กรุณาตรวจสอบว่าคุณมีสิทธิ์เข้าถึง หรือตรวจสอบว่าแท็บข้อมูลถูกต้อง';
          console.warn('Cannot fetch sheet rows:', friendlyMsg);
          setErrorMessage(friendlyMsg);
          setIsLoading(false);
          return;
        }

        setRawRows(rows);
        setOriginalRawRows(rows.map((r) => [...r]));

        const newConfig: SheetConfig = {
          ...sheetConfig,
          spreadsheetId,
          spreadsheetTitle: metaTitle,
          sheetUrl: customUrl || sheetConfig.sheetUrl,
          selectedSheetTitle: targetTab,
        };
        setSheetConfig(newConfig);

        // Process data
        const processed = processSheetGrid(
          rows,
          newConfig.headerRowIndex,
          newConfig.dataStartRowIndex,
          newConfig.dataEndRowIndex
        );
        setProcessedData(processed);

        // Apply saved or default template
        const savedLayout = getSavedLayout(spreadsheetId);
        if (savedLayout && savedLayout.widgets.length > 0) {
          setWidgets(savedLayout.widgets);
          if (savedLayout.templateId) setActiveTemplateId(savedLayout.templateId);
        } else {
          const defaultTmpl = DASHBOARD_TEMPLATES[0];
          setWidgets(defaultTmpl.createWidgets(processed));
          setActiveTemplateId(defaultTmpl.id);
        }

        // Save to recent sheets
        const recent: RecentSheet = {
          id: spreadsheetId,
          title: metaTitle,
          url: customUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
          tabCount,
          selectedSheet: targetTab,
          headerRow: newConfig.headerRowIndex,
          dataStartRow: newConfig.dataStartRowIndex,
          lastOpenedAt: new Date().toISOString(),
        };
        saveRecentSheet(recent);
        setRecentSheets(getRecentSheets());

        setSuccessBanner(`เชื่อมต่อและดึงข้อมูลจาก "${metaTitle}" สำเร็จ!`);
        setTimeout(() => setSuccessBanner(null), 4000);
      } catch (err: any) {
        console.warn('Notice while loading sheet:', err?.message || err);
        setErrorMessage(
          err.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้ กรุณาตรวจสอบสิทธิ์และการเชื่อมต่อ'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, sheetConfig]
  );

  // Initial load on first render
  useEffect(() => {
    if (sheetConfig.spreadsheetId) {
      loadSheetData(
        sheetConfig.spreadsheetId,
        sheetConfig.selectedSheetTitle,
        undefined,
        undefined,
        true
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize Firebase Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (authProfile, token) => {
        setUser(authProfile);
        if (token) {
          setAccessToken(token);
        }
      },
      () => {
        // Fallback to offline user when signed out
        setUser({
          uid: 'offline-local-user',
          email: 'local@device',
          displayName: 'ผู้ใช้งานเครื่องนี้ (ออฟไลน์)',
          photoURL: null,
          role: 'user',
        });
      }
    );
    return () => unsubscribe();
  }, []);

  // Google Login & Logout with Firebase Auth
  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setErrorMessage(null);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setSuccessBanner(`เข้าสู่ระบบด้วยบัญชี Google (${res.user.displayName || res.user.email}) สำเร็จ! พร้อมดึงข้อมูล Google Sheets`);
        setTimeout(() => setSuccessBanner(null), 4000);

        // If a Google Sheet is currently loaded or configured, refresh it with the new access token
        if (sheetConfig.spreadsheetId && sheetConfig.spreadsheetId !== 'sample-sales') {
          loadSheetData(
            sheetConfig.spreadsheetId,
            sheetConfig.selectedSheetTitle,
            res.accessToken,
            sheetConfig.sheetUrl
          );
        }
      }
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
      // Check if popup was blocked or closed
      if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('เบราว์เซอร์บล็อกหน้าต่างป๊อปอัปเข้าสู่ระบบ Google กรุณาอนุญาตป๊อปอัป หรือเปิดในแท็บใหม่');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        // User closed window, no error needed
      } else {
        setErrorMessage(err?.message || 'การเข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setAccessToken(null);
      setUser({
        uid: 'offline-local-user',
        email: 'local@device',
        displayName: 'ผู้ใช้งานเครื่องนี้ (ออฟไลน์)',
        photoURL: null,
        role: 'user',
      });
      setSuccessBanner('ออกจากระบบ Google เรียบร้อยแล้ว (กลับสู่โหมดออฟไลน์)');
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  // Handle Connecting to a new URL or Sheet ID
  const handleConnectUrl = async (urlOrId: string) => {
    const spreadsheetId = extractSpreadsheetId(urlOrId);
    if (!spreadsheetId) {
      setErrorMessage('รูปแบบลิงก์หรือไอดี Google Sheet ไม่ถูกต้อง กรุณาวาง URL เต็มรูปแบบ');
      return;
    }

    // Load sheet: uses OAuth token if logged in, or loads public sheet / prompts sign in
    loadSheetData(spreadsheetId, undefined, accessToken, urlOrId);
  };

  // Handle Tab Switch
  const handleSelectTab = (tabTitle: string) => {
    // 1. If this is an uploaded Excel file, switch instantly using cached sheets
    if (cachedWorkbookSheets && cachedWorkbookSheets[tabTitle]) {
      const rows = cachedWorkbookSheets[tabTitle];
      setRawRows(rows);
      setOriginalRawRows(rows.map((r) => [...r]));
      setSheetConfig((prev) => ({ ...prev, selectedSheetTitle: tabTitle }));
      const processed = processSheetGrid(
        rows,
        sheetConfig.headerRowIndex,
        sheetConfig.dataStartRowIndex,
        sheetConfig.dataEndRowIndex
      );
      setProcessedData(processed);
      setSuccessBanner(`สลับมาใช้ข้อมูลจากแผ่นงาน "${tabTitle}" สำเร็จ!`);
      setTimeout(() => setSuccessBanner(null), 3000);
      return;
    }

    // 2. Google Sheet or Sample
    setSheetConfig((prev) => ({ ...prev, selectedSheetTitle: tabTitle }));
    const currentId = metadata?.id || sheetConfig.spreadsheetId;
    if (currentId) {
      loadSheetData(currentId, tabTitle, accessToken, sheetConfig.sheetUrl);
    }
  };

  // Handle Adding a Custom Tab Name or GID manually
  const handleAddCustomTab = (tabTitle: string) => {
    const trimmed = tabTitle.trim();
    if (!trimmed) return;

    if (metadata) {
      const alreadyExists = metadata.sheets.some(
        (s) => s.title.toLowerCase() === trimmed.toLowerCase()
      );
      if (!alreadyExists) {
        const newSheet: SheetTabInfo = {
          sheetId: Date.now(),
          title: trimmed,
          index: metadata.sheets.length,
        };
        setMetadata({
          ...metadata,
          sheets: [...metadata.sheets, newSheet],
        });
      }
    }
    handleSelectTab(trimmed);
  };

  // Handle Row Config Change
  const handleUpdateRowConfig = (headerRow: number, startRow: number) => {
    setSheetConfig((prev) => ({
      ...prev,
      headerRowIndex: headerRow,
      dataStartRowIndex: startRow,
    }));
  };

  // Handle Upload File (CSV / TSV / Excel .xlsx / .xls)
  const handleUploadFile = async (file: File) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const { rows, sheetNames, workbookSheets } = await parseUploadedFileObject(file);

      if (!rows || rows.length === 0) {
        throw new Error('ไฟล์ว่างเปล่าหรือไม่มีข้อมูลตาราง');
      }

      setCachedWorkbookSheets(workbookSheets || null);

      const uploadId = `upload-${Date.now()}`;
      const title = file.name.replace(/\.[^/.]+$/, '');
      const primarySheetName = sheetNames?.[0] || 'Sheet1';

      const meta: SpreadsheetMetadata = {
        id: uploadId,
        title: `ไฟล์: ${title}`,
        sheets: sheetNames && sheetNames.length > 0
          ? sheetNames.map((name, idx) => ({
              sheetId: idx + 1,
              title: name,
              index: idx,
              rowCount: workbookSheets?.[name]?.length || (idx === 0 ? rows.length : 0),
              columnCount: workbookSheets?.[name]?.[0]?.length || (idx === 0 ? (rows[0]?.length || 0) : 0),
            }))
          : [
              {
                sheetId: 1,
                title: 'Sheet1',
                index: 0,
                rowCount: rows.length,
                columnCount: rows[0]?.length || 0,
              },
            ],
        url: file.name,
        lastFetchedAt: new Date().toISOString(),
      };

      setMetadata(meta);
      setRawRows(rows);
      setOriginalRawRows(rows.map((r) => [...r]));
      setSheetConfig({
        spreadsheetId: uploadId,
        spreadsheetTitle: `ไฟล์: ${title}`,
        sheetUrl: file.name,
        selectedSheetTitle: primarySheetName,
        headerRowIndex: 1,
        dataStartRowIndex: 2,
      });

      const processed = processSheetGrid(rows, 1, 2);
      setProcessedData(processed);

      // Initialize default template
      const defaultTmpl = DASHBOARD_TEMPLATES[0];
      setWidgets(defaultTmpl.createWidgets(processed));
      setActiveTemplateId(defaultTmpl.id);

      // Save to recent
      const recent: RecentSheet = {
        id: uploadId,
        title: `ไฟล์: ${title}`,
        url: file.name,
        tabCount: sheetNames?.length || 1,
        selectedSheet: primarySheetName,
        headerRow: 1,
        dataStartRow: 2,
        lastOpenedAt: new Date().toISOString(),
        isCustomUpload: true,
      };
      saveRecentSheet(recent);
      setRecentSheets(getRecentSheets());

      setSuccessBanner(`อัปโหลดและสร้างแดชบอร์ดจากไฟล์ "${file.name}" สำเร็จ!`);
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (e: any) {
      setErrorMessage(e.message || 'ไม่สามารถประมวลผลไฟล์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Selecting a Recent Sheet
  const handleSelectRecent = (recent: RecentSheet) => {
    setSheetConfig((prev) => ({
      ...prev,
      spreadsheetId: recent.id,
      spreadsheetTitle: recent.title,
      sheetUrl: recent.url,
      selectedSheetTitle: recent.selectedSheet,
      headerRowIndex: recent.headerRow || 1,
      dataStartRowIndex: recent.dataStartRow || 2,
    }));
    loadSheetData(recent.id, recent.selectedSheet, accessToken, recent.url);
  };

  // BI Data Grid Handlers: Save cell edits, header renames, row modifications
  const handleSaveGridData = (
    updatedRows: (string | number | boolean | null)[][],
    renamedHeaders: Record<string, string>
  ) => {
    setRawRows(updatedRows);

    // If any headers were renamed, automatically map existing widgets to the new column names!
    if (Object.keys(renamedHeaders).length > 0) {
      setWidgets((prevWidgets) =>
        prevWidgets.map((w) => {
          const updated = { ...w };
          if (w.categoryColumn && renamedHeaders[w.categoryColumn]) {
            updated.categoryColumn = renamedHeaders[w.categoryColumn];
          }
          if (w.valueColumn && renamedHeaders[w.valueColumn]) {
            updated.valueColumn = renamedHeaders[w.valueColumn];
          }
          if (w.secondaryValueColumn && renamedHeaders[w.secondaryValueColumn]) {
            updated.secondaryValueColumn = renamedHeaders[w.secondaryValueColumn];
          }
          return updated;
        })
      );

      // Also update filter state if filtered columns were renamed
      setFilters((prev) => {
        let updatedDateCol = prev.dateColumn;
        if (prev.dateColumn && renamedHeaders[prev.dateColumn]) {
          updatedDateCol = renamedHeaders[prev.dateColumn];
        }
        const updatedCategories: Record<string, string> = {};
        Object.entries(prev.categoryFilters).forEach(([col, val]) => {
          const newColName = renamedHeaders[col] || col;
          updatedCategories[newColName] = String(val);
        });
        const updatedActiveCols = (prev.activeFilterColumns || []).map(
          (col) => renamedHeaders[col] || col
        );
        return {
          ...prev,
          dateColumn: updatedDateCol,
          categoryFilters: updatedCategories,
          activeFilterColumns: updatedActiveCols,
        };
      });
    }

    setSuccessBanner('บันทึกการแก้ไขฐานข้อมูลและอัปเดตแดชบอร์ดเรียบร้อยแล้ว');
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // BI Data Grid: Revert to original fetched sheet data
  const handleRevertOriginalGridData = () => {
    if (originalRawRows.length > 0) {
      setRawRows(originalRawRows.map((r) => [...r]));
      setSuccessBanner('รีเซ็ตข้อมูลทั้งหมดกลับเป็นต้นฉบับเรียบร้อยแล้ว');
      setTimeout(() => setSuccessBanner(null), 4000);
    }
  };

  // Widget Operations: Move Up/Down
  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const newWidgets = [...widgets];
    const temp = newWidgets[index];
    newWidgets[index] = newWidgets[targetIndex];
    newWidgets[targetIndex] = temp;
    setWidgets(newWidgets);
  };

  // Widget Operations: Drag and Drop Reordering
  const handleReorderWidgets = (sourceIndex: number, targetIndex: number) => {
    if (sourceIndex === targetIndex) return;
    setWidgets((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, moved);
      return updated;
    });
  };

  // Widget Operations: Change 12-Column Grid Span
  const handleChangeColSpan = (id: string, colSpan: number) => {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const width: WidgetWidth = colSpan >= 10 ? 'full' : colSpan >= 6 ? 'half' : 'third';
          return { ...w, colSpan, width };
        }
        return w;
      })
    );
  };

  // Widget Operations: Change Width
  const handleChangeWidth = (id: string, width: WidgetWidth) => {
    const colSpanMap: Record<WidgetWidth, number> = {
      full: 12,
      half: 6,
      third: 4,
      custom: 6,
    };
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, width, colSpan: colSpanMap[width] } : w))
    );
  };

  // Widget Operations: Edit
  const handleEditWidget = (config: WidgetConfig) => {
    setActiveWidgetId(config.id);
    setEditingWidget(config);
  };

  const handleSaveWidget = (updated: WidgetConfig) => {
    setWidgets((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  // Widget Operations: Delete
  const handleDeleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    if (activeWidgetId === id) {
      setActiveWidgetId(null);
    }
  };

  // Widget Operations: Duplicate
  const handleDuplicateWidget = (config: WidgetConfig) => {
    const duplicate: WidgetConfig = {
      ...config,
      id: `w-${Date.now()}`,
      title: `${config.title} (คัดลอก)`,
    };
    const index = widgets.findIndex((w) => w.id === config.id);
    const updated = [...widgets];
    updated.splice(index + 1, 0, duplicate);
    setWidgets(updated);
    setActiveWidgetId(duplicate.id);
  };

  // Freeform Position & Resize Handlers
  const handleFreeDrag = (id: string, posX: number, posY: number) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, posX, posY } : w))
    );
  };

  const handleFreeResize = (id: string, posWidth: number, posHeight: number) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, posWidth, posHeight, customHeight: posHeight } : w
      )
    );
  };

  const handleBringToFront = (id: string) => {
    setWidgets((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex || 10), 10);
      return prev.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w));
    });
  };

  // Auto-align widgets in Freeform mode into neat cards
  const handleAutoAlignFreeform = () => {
    const gap =
      dashboardSpacing === 'none'
        ? 4
        : dashboardSpacing === 'tight'
        ? 12
        : dashboardSpacing === 'relaxed'
        ? 24
        : dashboardSpacing === 'loose'
        ? 36
        : 16;
    const cardWidth = 380;
    const cardHeight = 340;
    const cols = 3;

    setWidgets((prev) =>
      prev.map((w, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const posX = col * (cardWidth + gap);
        const posY = row * (cardHeight + gap);
        return {
          ...w,
          posX,
          posY,
          posWidth: w.posWidth || cardWidth,
          posHeight: w.posHeight || cardHeight,
        };
      })
    );
    setSuccessBanner('จัดตำแหน่งวิดเจ็ตอัตโนมัติเรียบร้อย');
    setTimeout(() => setSuccessBanner(null), 2500);
  };

  // Calculate dynamic bottom bounding box for canvas
  const maxWidgetBottom = useMemo(() => {
    if (layoutMode !== 'freeform' || widgets.length === 0) return 650;
    let maxBottom = 650;
    widgets.forEach((w, idx) => {
      const y = w.posY ?? Math.floor(idx / 3) * 370;
      const h = w.posHeight ?? w.customHeight ?? 340;
      if (y + h > maxBottom) {
        maxBottom = y + h;
      }
    });
    return maxBottom + 120;
  }, [layoutMode, widgets]);

  // Add New Widget from standard button
  const handleAddWidget = () => {
    const numCol = processedData.numericColumns[0] || processedData.headers[1] || '';
    const catCol = processedData.categoricalColumns[0] || processedData.headers[0] || '';

    const newWidget: WidgetConfig = {
      id: `w-${Date.now()}`,
      title: 'วิดเจ็ตใหม่ (New Widget)',
      type: 'bar',
      width: 'half',
      colSpan: 6,
      categoryColumn: catCol,
      valueColumn: numCol,
      aggregation: 'sum',
      colorTheme: 'blue',
      heightPreset: 'normal',
    };

    setWidgets((prev) => [newWidget, ...prev]);
    setActiveWidgetId(newWidget.id);
    setEditingWidget(newWidget);
  };

  // Add New Widget from BI Side Panel with specific visual type & presets
  const handleAddWidgetWithType = (
    type: WidgetConfig['type'],
    customProps?: Partial<WidgetConfig>
  ) => {
    const numCol = processedData.numericColumns[0] || processedData.headers[1] || '';
    const catCol = processedData.categoricalColumns[0] || processedData.headers[0] || '';
    const newId = `w-${Date.now()}`;

    const titleMap: Partial<Record<WidgetConfig['type'], string>> = {
      kpi: 'ตัวชี้วัด KPI',
      bar: 'กราฟแท่งเปรียบเทียบ',
      column: 'กราฟคอลัมน์แนวตั้ง',
      line: 'กราฟเส้นแนวโน้ม',
      area: 'กราฟพื้นที่แนวโน้ม',
      pie: 'กราฟวงกลมสัดส่วน',
      donut: 'กราฟโดนัท (Donut)',
      table: 'ตารางข้อมูลสรุป',
      horizontal_bar: 'กราฟแท่งแนวนอน',
      combo: 'กราฟผสม (แท่ง & เส้น)',
      radar: 'กราฟเรดาร์',
      radial_bar: 'มาตรวัดวงกลม Radial',
      gauge: 'เกจวัดค่าเป้าหมาย',
      scatter: 'กราฟจุดกระจาย Scatter',
      funnel: 'กราฟกรวย Funnel',
      waterfall: 'กราฟขั้นบันได Waterfall',
      heatmap: 'แผนที่ความร้อน Heatmap',
      treemap: 'แผนภาพต้นไม้ Treemap',
      pivot: 'ตารางสรุปแบบ Pivot',
      map: 'แผนที่ภูมิศาสตร์ Map',
      text: 'กล่องข้อความ / แบนเนอร์',
      rich_text: 'ข้อความจัดรูปแบบ',
      floating_text: 'การ์ดคำบรรยาย',
      ai_summary: 'บทวิเคราะห์สรุป AI',
      image: 'รูปภาพประกอบ',
      progress: 'แถบความคืบหน้า',
      timeline: 'ลำดับเวลา Timeline',
      calendar: 'ปฏิทินข้อมูล',
      list: 'รายการการ์ด List',
    };

    const newWidget: WidgetConfig = {
      id: newId,
      type,
      title: customProps?.title || titleMap[type] || 'วิดเจ็ตใหม่',
      description: customProps?.description || '',
      width: type === 'table' ? 'full' : type === 'kpi' ? 'third' : 'half',
      colSpan: type === 'table' ? 12 : type === 'kpi' ? 3 : 6,
      categoryColumn: catCol,
      valueColumn: numCol,
      aggregation: type === 'kpi' ? 'sum' : 'sum',
      colorTheme: 'blue',
      heightPreset: type === 'table' ? 'tall' : 'normal',
      ...customProps,
    };

    setWidgets((prev) => [...prev, newWidget]);
    setActiveWidgetId(newId);
    setSuccessBanner(`เพิ่มวิชวล "${newWidget.title}" เรียบร้อย`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  // Real-time Data Sync Handler (Google Sheets live polling / manual refresh)
  const handleLiveSync = useCallback(
    async (silent = false) => {
      if (!sheetConfig.spreadsheetId) return;

      if (!silent) setIsLoading(true);
      setIsSyncing(true);

      try {
        const token = accessToken || getAccessToken();
        const sample = SAMPLE_DATASETS.find((s) => s.id === sheetConfig.spreadsheetId);

        if (sample) {
          // Re-process sample data
          const processed = processSheetGrid(
            sample.rows,
            sheetConfig.headerRowIndex,
            sheetConfig.dataStartRowIndex,
            sheetConfig.dataEndRowIndex,
            sheetConfig.selectedColumns
          );
          setProcessedData(processed);
          setLastSyncedAt(new Date());
          if (!silent) {
            setSuccessBanner(`ซิงค์ข้อมูลล่าสุดสำเร็จ (${sample.rows.length} แถว)`);
            setTimeout(() => setSuccessBanner(null), 3000);
          }
        } else {
          const targetTab = sheetConfig.selectedSheetTitle || 'Sheet1';
          let rows: (string | number | boolean | null)[][] | null = null;

          if (token) {
            rows = await fetchSheetValues(sheetConfig.spreadsheetId, targetTab, token);
          } else {
            rows = await fetchPublicSheetCsv(sheetConfig.spreadsheetId, targetTab);
          }

          if (rows && rows.length > 0) {
            setRawRows(rows);
            setOriginalRawRows(rows.map((r) => [...r]));
            const processed = processSheetGrid(
              rows,
              sheetConfig.headerRowIndex,
              sheetConfig.dataStartRowIndex,
              sheetConfig.dataEndRowIndex,
              sheetConfig.selectedColumns
            );
            setProcessedData(processed);
            setLastSyncedAt(new Date());
            if (!silent) {
              setSuccessBanner(
                `ซิงค์ข้อมูลสดจาก Google Sheets สำเร็จ (${rows.length.toLocaleString('th-TH')} แถว)`
              );
              setTimeout(() => setSuccessBanner(null), 3000);
            }
          } else if (!silent) {
            throw new Error(
              'ไม่สามารถซิงค์ข้อมูลสดได้ กรุณาตรวจสอบว่าชีทตั้งค่าแชร์เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู" แล้วหรือไม่'
            );
          }
        }
      } catch (err: any) {
        if (!silent) {
          setErrorMessage(err.message || 'ไม่สามารถซิงค์ข้อมูลสดได้');
        }
      } finally {
        setIsSyncing(false);
        if (!silent) setIsLoading(false);
      }
    },
    [sheetConfig, accessToken]
  );

  // Background interval polling for real-time sync
  useEffect(() => {
    if (!liveSyncInterval || liveSyncInterval <= 0) return;

    const intervalTimer = setInterval(() => {
      handleLiveSync(true);
    }, liveSyncInterval * 1000);

    return () => clearInterval(intervalTimer);
  }, [liveSyncInterval, handleLiveSync]);

  // Select Dashboard Template
  const handleSelectTemplate = (template: DashboardTemplate) => {
    setActiveTemplateId(template.id);
    const newWidgets = template.createWidgets(processedData);
    setWidgets(newWidgets);
    setSuccessBanner(`เปลี่ยนเป็นเทมเพลต "${template.name}" เรียบร้อย`);
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  // Export / Print to PDF
  const handleExportPdf = () => {
    window.print();
  };

  // Export Dashboard as HD PNG
  const handleExportPng = async () => {
    try {
      setIsExportingPng(true);
      await exportDashboardAsPng({
        elementId: 'dashboard-canvas',
        fileName: sheetConfig.spreadsheetTitle?.replace(/\s+/g, '_') || 'sheets_dashboard',
      });
      setSuccessBanner('บันทึกรูปภาพแดชบอร์ด (PNG) สำเร็จแล้ว!');
      setTimeout(() => setSuccessBanner(null), 3500);
    } catch (err: any) {
      console.error('Export PNG failed:', err);
      setErrorMessage(err.message || 'ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExportingPng(false);
    }
  };

  const mainThemeBg =
    dashboardTheme === 'dark'
      ? 'bg-slate-950 text-slate-100'
      : dashboardTheme === 'midnight'
      ? 'bg-[#0b1120] text-blue-50'
      : dashboardTheme === 'ocean'
      ? 'bg-[#071727] text-cyan-50'
      : dashboardTheme === 'forest' || dashboardTheme === 'emerald'
      ? 'bg-[#041a15] text-emerald-50'
      : dashboardTheme === 'violet'
      ? 'bg-[#140b24] text-purple-50'
      : dashboardTheme === 'sunset' || dashboardTheme === 'amber'
      ? 'bg-[#1c1208] text-amber-50'
      : 'bg-slate-50 text-slate-800';

  // Dedicated Shared / Viewer Mode Portal (100% separate from admin studio, no back to admin, has viewer left sidebar)
  if (isViewerMode) {
    return (
      <ViewerPortal
        dashboardTitle={sheetConfig.spreadsheetTitle || sheetConfig.selectedSheetTitle || 'Business Analytics Dashboard'}
        processedData={processedData}
        widgets={widgets}
        whiteLabel={whiteLabelConfig}
        dashboardTheme={dashboardTheme}
        gridGap={dashboardSpacing}
        layoutMode={layoutMode}
        isPasswordProtected={isPasswordProtected}
        viewerPassword={viewerPassword}
        onRefreshData={() => {
          if (sheetConfig.spreadsheetId) {
            loadSheetData(
              sheetConfig.spreadsheetId,
              sheetConfig.selectedSheetTitle,
              accessToken,
              sheetConfig.sheetUrl
            );
          }
        }}
        filters={filters}
        onUpdateFilters={(newFilters) => setFilters(newFilters)}
        onResetFilters={handleResetFilters}
        availableDashboards={dashboards.map((d) => ({ id: d.id, name: d.name }))}
        currentDashboardId={activeDashboardId || undefined}
        onSelectDashboard={handleSelectDashboard}
      />
    );
  }

  return (
    <div
      className={`min-h-screen ${mainThemeBg} flex flex-col font-sans transition-colors duration-200`}
      style={activeFontFamilyStyle}
    >
      {/* Header Bar - Sticky & Fixed so it doesn't scroll away */}
      <div className="print:hidden sticky top-0 z-50">
        <Header
          user={user}
          isLoggingIn={isLoggingIn}
          isPreviewMode={isPreviewMode}
          isExportingPng={isExportingPng}
          isBIPanelOpen={isBIPanelOpen}
          liveSyncInterval={liveSyncInterval}
          layoutMode={layoutMode}
          onToggleLayoutMode={setLayoutMode}
          themeMode={themeMode}
          onToggleThemeMode={() => {
            const nextTheme = dashboardTheme === 'light' ? 'dark' : 'light';
            setDashboardTheme(nextTheme);
            setThemeMode(nextTheme);
          }}
          dashboardTheme={dashboardTheme}
          onChangeDashboardTheme={(theme) => {
            setDashboardTheme(theme);
            setThemeMode(theme === 'light' ? 'light' : 'dark');
          }}
          primaryColor={primaryColor}
          onChangePrimaryColor={handleUpdatePrimaryColor}
          fontFamily={fontFamily}
          onChangeFontFamily={handleUpdateFontFamily}
          cardRadius={cardRadius}
          onChangeCardRadius={handleUpdateCardRadius}
          cardShadow={cardShadow}
          onChangeCardShadow={handleUpdateCardShadow}
          onToggleBIPanel={() => setIsBIPanelOpen((prev) => !prev)}
          onTogglePreviewMode={() => setIsPreviewMode(!isPreviewMode)}
          onOpenTemplates={() => setIsTemplateModalOpen(true)}
          onOpenDataGrid={() => setIsDataGridModalOpen(true)}
          onAddWidget={handleAddWidget}
          onExportPng={handleExportPng}
          onExportPdf={handleExportPdf}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenFormulaBuilder={() => setIsFormulaModalOpen(true)}
          onOpenMarketplace={() => setIsMarketplaceOpen(true)}
          onOpenBackupRestore={() => setIsBackupModalOpen(true)}
          whiteLabel={whiteLabelConfig}
          userRole={userRole}
          isViewerMode={false}
          onLogin={handleGoogleLogin}
          onLogout={handleLogout}
        />
      </div>

      {/* Layout Body with Studio Left Sidebar, Main Content & Right-docked Panels */}
      <div className="flex-1 flex flex-row min-w-0">
        {!isPreviewMode && !isViewerMode && (
          <StudioLeftSidebar
            isOpen={isLeftSidebarOpen}
            onToggleOpen={() => setIsLeftSidebarOpen((prev) => !prev)}
            onOpenBIPanel={() => setIsBIPanelOpen(true)}
            dashboards={dashboards}
            activeDashboardId={activeDashboardId}
            onSelectDashboard={handleSelectDashboard}
            onRequestNewDashboard={handleRequestNewDashboard}
            onSaveCurrentDashboard={handleSaveCurrentDashboard}
            onDeleteDashboard={handleDeleteDashboard}
            widgets={widgets}
            activeWidgetId={activeWidgetId}
            onSelectWidget={(id) => setActiveWidgetId(id)}
            onUpdateWidget={handleSaveWidget}
            onAddWidgetWithType={handleAddWidgetWithType}
            onDeleteWidget={(id) => {
              handleDeleteWidget(id);
              if (activeWidgetId === id) setActiveWidgetId(null);
            }}
            onDuplicateWidget={(id) => {
              const target = widgets.find((w) => w.id === id);
              if (target) handleDuplicateWidget(target);
            }}
            onOpenDataGrid={() => setIsDataGridModalOpen(true)}
            sheetTitle={sheetConfig.spreadsheetTitle || sheetConfig.selectedSheetTitle || ''}
            sheetTabs={
              metadata?.sheets?.map((s) => s.title) ||
              (cachedWorkbookSheets
                ? Object.keys(cachedWorkbookSheets)
                : [sheetConfig.selectedSheetTitle || 'Sheet1'])
            }
            currentSelectedTab={sheetConfig.selectedSheetTitle || 'Sheet1'}
            onSelectSheetTab={handleSelectTab}
            headerRow={sheetConfig.headerRowIndex}
            dataStartRow={sheetConfig.dataStartRowIndex}
            onOpenRowConfigModal={() => setIsPreviewModalOpen(true)}
            headers={processedData.headers}
            numericColumns={processedData.numericColumns}
            categoricalColumns={processedData.categoricalColumns}
            dateColumns={processedData.dateColumns}
            totalRecordsCount={processedData.records.length}
            user={user}
            userRole={userRole}
            onToggleUserRole={(newRole) => {
              setUserRole(newRole);
              localStorage.setItem('gs_user_role', newRole);
              if (user) recordUserSession(user, newRole);
            }}
            siteStatus={siteStatus}
            sheetConfig={sheetConfig}
            metadata={metadata}
            recentSheets={recentSheets}
            isLoadingSheet={isLoading}
            onConnectUrl={handleConnectUrl}
            onAddCustomTab={handleAddCustomTab}
            onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
            onRefreshSheetData={() => {
              if (sheetConfig.spreadsheetId) {
                loadSheetData(
                  sheetConfig.spreadsheetId,
                  sheetConfig.selectedSheetTitle,
                  accessToken,
                  sheetConfig.sheetUrl
                );
              }
            }}
            onSelectRecentSheet={handleSelectRecent}
            onUploadFile={handleUploadFile}
            onLoadSample={(sampleId) => {
              loadSheetData(sampleId);
            }}
            onUpdateRowConfig={handleUpdateRowConfig}
            activeStudioTab={studioLeftSidebarTab}
            onSelectStudioTab={setStudioLeftSidebarTab}
            onOpenFormulaBuilder={() => setIsFormulaModalOpen(true)}
            onOpenMarketplace={() => setIsMarketplaceOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
            onOpenBackupRestore={() => setIsBackupModalOpen(true)}
            onOpenLoginHelp={() => setIsLoginHelpModalOpen(true)}
            whiteLabel={whiteLabelConfig}
          />
        )}

        {/* Main Container: Strictly standardized dimensions so Edit Mode and Preview Mode have the exact same usable canvas area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0">
        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-3 text-sm shadow-xs print:hidden">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">ข้อผิดพลาดในการโหลดไฟล์หรือชีทข้อมูล</p>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</p>
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      loadSheetData('sample-sales');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-2xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>ใช้ข้อมูลตัวอย่าง</span>
                  </button>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs rounded-xl transition-colors shadow-2xs cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadFile(file);
                        e.target.value = '';
                      }}
                      className="hidden"
                    />
                    <span>เลือกไฟล์ Excel / CSV จากเครื่อง</span>
                  </label>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-semibold px-2 py-1 rounded shrink-0 self-end sm:self-start"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Success Banner */}
        {successBanner && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs font-medium shadow-xs animate-fade-in print:hidden">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Presentation Top Banner in Preview Mode */}
        {isPreviewMode && (
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-md print:hidden animate-fade-in">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div>
                <span className="font-bold text-sm">โหมดพรีวิวนำเสนอ (Presentation Mode)</span>
                <span className="text-slate-400 block sm:inline sm:ml-2 text-xs">
                  ซ่อนปุ่มแก้ไขทั้งหมด เพื่อรายงานและแสดงผลแดชบอร์ดอย่างสวยงาม
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportPng}
                disabled={isExportingPng}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isExportingPng ? 'กำลังสร้างภาพ...' : 'บันทึกภาพ PNG'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-blue-400" />
                <span>พิมพ์ / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewMode(false)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>กลับสู่โหมดแก้ไข</span>
              </button>
            </div>
          </div>
        )}

        {/* Compact Sheet & Data Status Bar (Moved main SheetConnector into Left Studio Sidebar to keep canvas uncluttered) */}
        {!isPreviewMode && !isViewerMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 bg-white/90 backdrop-blur-sm border border-slate-200/90 rounded-2xl shadow-2xs transition-all">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                    {sheetConfig.spreadsheetTitle || sheetConfig.selectedSheetTitle || 'Google Sheets'}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                    แท็บ: {sheetConfig.selectedSheetTitle || 'Sheet1'}
                  </span>
                  {processedData.records.length > 0 && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      ({processedData.records.length.toLocaleString('th-TH')} แถว, {processedData.headers.length} คอลัมน์)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>หัวตารางแถว #{sheetConfig.headerRowIndex}</span>
                  <span>•</span>
                  <span>เริ่มข้อมูลแถว #{sheetConfig.dataStartRowIndex}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (sheetConfig.spreadsheetId) {
                    loadSheetData(
                      sheetConfig.spreadsheetId,
                      sheetConfig.selectedSheetTitle,
                      accessToken,
                      sheetConfig.sheetUrl
                    );
                  }
                }}
                disabled={isLoading}
                title="รีเฟรชดึงข้อมูลล่าสุดจากชีท"
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLeftSidebarOpen(true);
                  setStudioLeftSidebarTab('data');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-98"
                title="เปิดแถบเครื่องมือซ้ายมือ เพื่อเปลี่ยนลิงก์ชีท สลับแท็บ หรือตั้งค่าแถว"
              >
                <Database className="w-3.5 h-3.5" />
                <span>เชื่อมต่อชีท (แถบซ้าย)</span>
              </button>
            </div>
          </div>
        )}

        {/* Exportable Dashboard Canvas Element */}
        <div id="dashboard-canvas" className="space-y-4">
          {/* Dashboard Canvas Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div className="min-w-0 flex-1">
              {isEditingDashboardTitle ? (
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <input
                    type="text"
                    value={editedDashboardTitle}
                    onChange={(e) => setEditedDashboardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDashboardTitle();
                      if (e.key === 'Escape') setIsEditingDashboardTitle(false);
                    }}
                    autoFocus
                    placeholder="ระบุชื่อแดชบอร์ด..."
                    className="text-base sm:text-lg font-bold text-slate-900 bg-white border-2 border-blue-500 rounded-xl px-3 py-1 focus:outline-none shadow-sm min-w-[260px] sm:min-w-[340px]"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDashboardTitle}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                    title="บันทึกชื่อแดชบอร์ดใหม่"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึกชื่อ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingDashboardTitle(false)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>ยกเลิก</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap group">
                  <div
                    onClick={!isPreviewMode ? handleStartEditDashboardTitle : undefined}
                    className={`flex items-center gap-1.5 rounded-xl px-2 py-0.5 -ml-2 transition-all ${
                      !isPreviewMode
                        ? 'cursor-pointer hover:bg-white/80 hover:shadow-2xs border border-transparent hover:border-slate-200'
                        : ''
                    }`}
                    title={!isPreviewMode ? 'คลิกเพื่อแก้ไขชื่อแดชบอร์ดนี้' : undefined}
                  >
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {sheetConfig.spreadsheetTitle || 'แดชบอร์ดข้อมูล'}
                    </h2>
                    {!isPreviewMode && (
                      <span className="p-1 text-slate-400 group-hover:text-blue-600 rounded-lg transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-2xs font-medium">
                    {widgets.length} วิดเจ็ต
                  </span>
                  {isPreviewMode && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full">
                      พรีวิว
                    </span>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-500 mt-0.5">
                แท็บ:{' '}
                <span className="font-semibold text-slate-700">
                  {sheetConfig.selectedSheetTitle || 'Sheet1'}
                </span>{' '}
                • หัวตารางแถว: {sheetConfig.headerRowIndex} • ข้อมูลแถว:{' '}
                {sheetConfig.dataStartRowIndex} • แสดงผล{' '}
                <span className="font-semibold text-blue-600">
                  {filteredRecords.length.toLocaleString('th-TH')}
                </span>{' '}
                จาก{' '}
                <span className="font-semibold text-slate-700">
                  {processedData.totalRows.toLocaleString('th-TH')}
                </span>{' '}
                แถว
              </p>
            </div>

            {/* Action Buttons */}
            {!isPreviewMode ? (
              <div className="flex items-center gap-2 print:hidden flex-wrap">
                {/* Layout Mode Switch (Freeform vs Grid) */}
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs text-xs">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('freeform')}
                    className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                      layoutMode === 'freeform'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="โหมดผืนผ้าใบอิสระ"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>อิสระ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('grid')}
                    className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                      layoutMode === 'grid'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="โหมดตาราง"
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>ตาราง</span>
                  </button>
                </div>

                {/* Freeform Auto-Align button */}
                {layoutMode === 'freeform' && (
                  <button
                    type="button"
                    onClick={handleAutoAlignFreeform}
                    title="จัดเรียงชิดกันอัตโนมัติ"
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>จัดชิด</span>
                  </button>
                )}

                {/* Spacing / Grid Gap Selector */}
                <div className="hidden lg:flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 px-1.5 flex items-center gap-1">
                    <Minimize2 className="w-3 h-3 text-slate-400" />
                    <span>ช่องว่าง:</span>
                  </span>
                  {(
                    [
                      { id: 'none', label: 'ติดกัน' },
                      { id: 'tight', label: 'ชิด' },
                      { id: 'normal', label: 'ปกติ' },
                      { id: 'relaxed', label: 'ห่าง' },
                    ] as const
                  ).map((gap) => (
                    <button
                      key={gap.id}
                      type="button"
                      onClick={() => setDashboardSpacing(gap.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                        dashboardSpacing === gap.id
                          ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {gap.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-slate-500" />
                  <span>เทมเพลต</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  <span>จัดแถว</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDataGridModalOpen(true)}
                  title="แก้ไขเซลล์ข้อมูล"
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1"
                >
                  <Table className="w-3.5 h-3.5 text-indigo-600" />
                  <span>แก้ไขข้อมูล</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddWidget}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มวิดเจ็ต</span>
                </button>

                {/* Filter Sidebar Toggle Button (Edit Mode) */}
                {processedData.records.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (filterPosition === 'top') {
                        setFilterPosition('right');
                        setIsFilterSidebarVisible(true);
                      } else {
                        setIsFilterSidebarVisible((prev) => !prev);
                      }
                    }}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border shadow-2xs flex items-center gap-1.5 transition-all ${
                      filterPosition === 'right' && isFilterSidebarVisible
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                    title="เปิด/ปิด แถบตัวกรองแนวตั้งด้านข้างขวา"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>แถบตัวกรอง</span>
                    {activeFilterCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          filterPosition === 'right' && isFilterSidebarVisible
                            ? 'bg-white text-blue-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 print:hidden">
                {/* Filter Sidebar Toggle Button (Preview Mode) */}
                {processedData.records.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (filterPosition === 'top') {
                        setFilterPosition('right');
                        setIsFilterSidebarVisible(true);
                      } else {
                        setIsFilterSidebarVisible((prev) => !prev);
                      }
                    }}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl border shadow-2xs flex items-center gap-1.5 transition-all ${
                      filterPosition === 'right' && isFilterSidebarVisible
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                    title="เปิด/ปิด แถบตัวกรองแนวตั้งด้านข้างขวา"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>แถบตัวกรอง</span>
                    {activeFilterCount > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          filterPosition === 'right' && isFilterSidebarVisible
                            ? 'bg-white text-blue-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportPng}
                  disabled={isExportingPng}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 disabled:opacity-50"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>บันทึก PNG</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-600" />
                  <span>พิมพ์ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(false)}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>แก้ไข</span>
                </button>
              </div>
            )}
          </div>

          {/* Interactive Filter Bar: Only rendered on top when user explicitly switches to 'top' mode */}
          {filterPosition === 'top' && processedData.records.length > 0 && (
            <div className="relative z-40">
              <FilterBar
                filters={filters}
                onUpdateFilters={handleUpdateFilters}
                onResetFilters={handleResetFilters}
                dateColumns={processedData.dateColumns}
                categoricalColumns={processedData.categoricalColumns}
                allHeaders={processedData.headers}
                rawRecords={processedData.records}
                filteredCount={filteredRecords.length}
                totalCount={processedData.records.length}
                isVerticalSidebar={false}
                filterPosition={filterPosition}
                onTogglePosition={(pos) => setFilterPosition(pos)}
              />
            </div>
          )}

          {(() => {
            const activeWidget = widgets.find((w) => w.id === activeWidgetId) || null;
            return (
              /* Dedicated BI Dashboard Zone (โซนแสดงผลแดชบอร์ดเฉพาะ ป้องกันการเลื่อนหลุดออกนอกขอบ) */
              <div
                id="bi-dashboard-zone"
            className={`rounded-3xl border transition-all ${
              dashboardTheme === 'dark'
                ? 'border-slate-800 bg-slate-900/40'
                : dashboardTheme === 'midnight'
                ? 'border-blue-900/60 bg-[#0f172a]/60'
                : dashboardTheme === 'ocean'
                ? 'border-cyan-900/60 bg-[#0a192f]/60'
                : dashboardTheme === 'forest' || dashboardTheme === 'emerald'
                ? 'border-emerald-900/60 bg-[#06241e]/60'
                : dashboardTheme === 'violet'
                ? 'border-purple-900/60 bg-[#1e1035]/60'
                : dashboardTheme === 'sunset' || dashboardTheme === 'amber'
                ? 'border-amber-900/60 bg-[#26180d]/60'
                : 'border-slate-200/90 bg-slate-100/40'
            } p-3 sm:p-4 relative`}
          >
            {/* Zone Header / Status Bar */}
            {!isPreviewMode && (
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-blue-600 text-white rounded-md shadow-2xs">
                    <Sliders className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    โซนผืนผ้าใบแดชบอร์ด BI
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    • วิดเจ็ตถูกล็อกขอบเขตให้อยู่ในโซนนี้อย่างปลอดภัย
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {activeWidgetId && (
                    <button
                      type="button"
                      onClick={() => setActiveWidgetId(null)}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-medium transition-colors shadow-2xs"
                    >
                      ปลดการเลือกวิดเจ็ต
                    </button>
                  )}
                  <span className="text-[11px] font-mono text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs font-semibold">
                    {widgets.length} วิดเจ็ต
                  </span>
                </div>
              </div>
            )}

            {/* Centralized BI Quick Inspector Bar when a widget is selected */}
            {!isPreviewMode && activeWidget && (
              <div className="mb-3 px-4 py-2.5 bg-white rounded-2xl border border-blue-200 shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-xs animate-fade-in z-30 relative">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 shadow-2xs">
                    <Sliders className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 truncate max-w-[160px] sm:max-w-xs" title={activeWidget.title}>
                        {activeWidget.title}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] bg-blue-100 text-blue-800 rounded font-bold uppercase">
                        {activeWidget.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Centralized Quick Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Quick Prefix / Suffix */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                    <span className="text-[10px] font-bold text-slate-500">คำนำหน้า:</span>
                    <input
                      type="text"
                      placeholder="เช่น ฿, $"
                      value={activeWidget.prefix || ''}
                      onChange={(e) => handleSaveWidget({ ...activeWidget, prefix: e.target.value })}
                      className="w-12 text-xs px-1 py-0.5 bg-white border border-slate-200 rounded font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                    <span className="text-[10px] font-bold text-slate-500 ml-1">ต่อท้าย:</span>
                    <input
                      type="text"
                      placeholder="เช่น บาท, %"
                      value={activeWidget.suffix || ''}
                      onChange={(e) => handleSaveWidget({ ...activeWidget, suffix: e.target.value })}
                      className="w-14 text-xs px-1 py-0.5 bg-white border border-slate-200 rounded font-semibold focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  {/* Multi-Condition Filter Button */}
                  <button
                    type="button"
                    onClick={() => setEditingWidget(activeWidget)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                    title="เปิดระบบตัวกรองหลายเงื่อนไข (Multi-rule Filter)"
                  >
                    <Filter className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ตัวกรอง {activeWidget.filterRules?.length ? `(${activeWidget.filterRules.length})` : ''}</span>
                  </button>

                  {/* Freeform specific: Bring to front */}
                  {layoutMode === 'freeform' && (
                    <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleBringToFront(activeWidget.id)}
                        className="px-2 py-0.5 hover:bg-white text-slate-700 rounded text-[11px] font-semibold transition-colors"
                        title="นำการ์ดนี้ขึ้นมาหน้าสุด (Bring to Front)"
                      >
                        ลอยหน้าสุด
                      </button>
                      <span className="text-slate-300">|</span>
                      <span className="px-1.5 font-mono text-[10px] text-slate-500 font-semibold" title="ขนาดการ์ดปัจจุบัน">
                        {Math.round(activeWidget.customWidth || 420)}×{Math.round(activeWidget.customHeight || 300)}
                      </span>
                    </div>
                  )}

                  {/* Grid specific: Col span */}
                  {layoutMode === 'grid' && (
                    <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-[10px]">
                      <span className="px-1 font-semibold text-slate-500">กว้าง:</span>
                      {[3, 4, 6, 8, 12].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleChangeColSpan(activeWidget.id, s)}
                          className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
                            (activeWidget.colSpan || 6) === s
                              ? 'bg-blue-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Open full BI Settings Side Panel */}
                  <button
                    type="button"
                    onClick={() => setIsBIPanelOpen(true)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                    title="เปิดแผงตั้งค่า BI เพื่อปรับแต่งสี ฟอนต์ การรวมผล และฟิลด์แบบเต็มรูปแบบ"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>ตั้งค่าใน BI</span>
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    onClick={() => handleDuplicateWidget(activeWidget)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="คัดลอกวิดเจ็ตนี้ (Duplicate)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteWidget(activeWidget.id);
                      setActiveWidgetId(null);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="ลบวิดเจ็ตนี้"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Widgets Canvas / Grid Container */}
            {isLoading && widgets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                <p className="font-semibold text-slate-800">กำลังเชื่อมต่อและประมวลผลข้อมูลชีท...</p>
                <p className="text-xs text-slate-500 mt-1">กรุณารอสักครู่ ระบบกำลังจัดเตรียมกราฟและสถิติ</p>
              </div>
            ) : widgets.length > 0 ? (
              layoutMode === 'freeform' ? (
                /* FREEFORM CANVAS: Widgets move, overlap, and resize freely with drag-and-drop */
                <div
                  className="relative w-full rounded-2xl border border-slate-200/80 p-4 transition-all overflow-x-auto min-w-full"
                  style={{
                    minHeight: `${maxWidgetBottom}px`,
                    backgroundImage: !isPreviewMode
                      ? 'radial-gradient(#94a3b8 1px, transparent 1px)'
                      : undefined,
                    backgroundSize: '24px 24px',
                    backgroundColor:
                      dashboardTheme === 'dark'
                        ? '#0f172a'
                        : dashboardTheme === 'midnight'
                        ? '#0f172a'
                        : dashboardTheme === 'ocean'
                        ? '#0a192f'
                        : dashboardTheme === 'forest' || dashboardTheme === 'emerald'
                        ? '#06241e'
                        : dashboardTheme === 'violet'
                        ? '#1e1035'
                        : dashboardTheme === 'sunset' || dashboardTheme === 'amber'
                        ? '#26180d'
                        : '#f8fafc',
                  }}
                >
                  {/* Dynamic Smart Snap Alignment Guidelines on X & Y axes */}
                  {activeGuidelines &&
                    activeGuidelines.map((guide, idx) =>
                      guide.type === 'x' ? (
                        <div
                          key={`snap-x-${idx}`}
                          className="absolute top-0 bottom-0 pointer-events-none z-50 border-l-2 border-dashed border-blue-500 shadow-sm"
                          style={{ left: `${guide.position}px` }}
                        >
                          <span className="bg-blue-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-br shadow-xs select-none">
                            X: {Math.round(guide.position)}px
                          </span>
                        </div>
                      ) : (
                        <div
                          key={`snap-y-${idx}`}
                          className="absolute left-0 right-0 pointer-events-none z-50 border-t-2 border-dashed border-blue-500 shadow-sm"
                          style={{ top: `${guide.position}px` }}
                        >
                          <span className="bg-blue-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-tr inline-block shadow-xs select-none">
                            Y: {Math.round(guide.position)}px
                          </span>
                        </div>
                      )
                    )}

                  {widgets.map((widget, index) => (
                    <WidgetCard
                      key={widget.id}
                      config={widget}
                      records={filteredRecords}
                      headers={processedData.headers}
                      index={index}
                      totalWidgets={widgets.length}
                      allWidgets={widgets}
                      isPreviewMode={isPreviewMode}
                      isActive={activeWidgetId === widget.id}
                      layoutMode="freeform"
                      dashboardTheme={dashboardTheme}
                      primaryColor={primaryColor}
                      cardRadius={cardRadius}
                      cardShadow={cardShadow}
                      onCrossFilter={handleChartCrossFilter}
                      activeFilters={filters}
                      onGuideLinesChange={setActiveGuidelines}
                      onFreeDrag={handleFreeDrag}
                      onFreeResize={handleFreeResize}
                      onBringToFront={handleBringToFront}
                      onSelect={(id) => {
                        setActiveWidgetId(id);
                        if (!isPreviewMode) {
                          setIsBIPanelOpen(true);
                        }
                      }}
                      onMove={handleMoveWidget}
                      onReorder={handleReorderWidgets}
                      onEdit={handleEditWidget}
                      onDuplicate={handleDuplicateWidget}
                      onDelete={handleDeleteWidget}
                      onChangeWidth={handleChangeWidth}
                      onChangeColSpan={handleChangeColSpan}
                      onUpdateWidget={handleSaveWidget}
                    />
                  ))}
                </div>
              ) : (
                /* GRID LAYOUT: 12-Column Responsive Grid */
                <div
                  className={`grid grid-cols-12 ${
                    dashboardSpacing === 'none'
                      ? 'gap-1'
                      : dashboardSpacing === 'tight'
                      ? 'gap-2 sm:gap-3'
                      : dashboardSpacing === 'relaxed'
                      ? 'gap-6 sm:gap-8'
                      : dashboardSpacing === 'loose'
                      ? 'gap-8 sm:gap-12'
                      : 'gap-4 sm:gap-6'
                  }`}
                >
                  {widgets.map((widget, index) => (
                    <WidgetCard
                      key={widget.id}
                      config={widget}
                      records={filteredRecords}
                      headers={processedData.headers}
                      index={index}
                      totalWidgets={widgets.length}
                      allWidgets={widgets}
                      isPreviewMode={isPreviewMode}
                      isActive={activeWidgetId === widget.id}
                      layoutMode="grid"
                      dashboardTheme={dashboardTheme}
                      primaryColor={primaryColor}
                      cardRadius={cardRadius}
                      cardShadow={cardShadow}
                      onCrossFilter={handleChartCrossFilter}
                      activeFilters={filters}
                      onSelect={(id) => {
                        setActiveWidgetId(id);
                        if (!isPreviewMode) {
                          setIsBIPanelOpen(true);
                        }
                      }}
                      onMove={handleMoveWidget}
                      onReorder={handleReorderWidgets}
                      onEdit={handleEditWidget}
                      onDuplicate={handleDuplicateWidget}
                      onDelete={handleDeleteWidget}
                      onChangeWidth={handleChangeWidth}
                      onChangeColSpan={handleChangeColSpan}
                      onUpdateWidget={handleSaveWidget}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                <p className="text-slate-500 text-sm mb-3">ยังไม่มีวิดเจ็ตในแดชบอร์ดนี้</p>
                <button
                  type="button"
                  onClick={handleAddWidget}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มวิดเจ็ตแรกของคุณ</span>
                </button>
              </div>
            )}
          </div>
            );
          })()}
        </div>
      </main>

      {/* Right Pane: FilterBar Fixed Docked to Right (Vertical Sidebar) */}
      {filterPosition === 'right' && isFilterSidebarVisible && processedData.records.length > 0 && (
        <aside className="w-72 sm:w-80 shrink-0 border-l border-slate-200/90 bg-slate-50/70 p-3 sm:p-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto z-20 print:hidden transition-all">
          <FilterBar
            filters={filters}
            onUpdateFilters={handleUpdateFilters}
            onResetFilters={handleResetFilters}
            dateColumns={processedData.dateColumns}
            categoricalColumns={processedData.categoricalColumns}
            allHeaders={processedData.headers}
            rawRecords={processedData.records}
            filteredCount={filteredRecords.length}
            totalCount={processedData.records.length}
            isVerticalSidebar={true}
            filterPosition={filterPosition}
            onTogglePosition={(pos) => setFilterPosition(pos)}
            onCloseSidebar={() => setIsFilterSidebarVisible(false)}
          />
        </aside>
      )}

      {/* Right Pane: Dedicated BI Studio Tools Panel (Styling, live sync, formulas, KPI comparison) */}
      {!isPreviewMode && !isViewerMode && isBIPanelOpen && (
        <aside className="w-80 sm:w-96 shrink-0 border-l border-slate-200/90 bg-white sticky top-16 h-[calc(100vh-4rem)] overflow-hidden z-20 print:hidden shadow-lg transition-all flex flex-col">
          <BISidePanel
            isOpen={true}
            docked={true}
            onClose={() => setIsBIPanelOpen(false)}
            widgets={widgets}
            activeWidgetId={activeWidgetId}
            onSelectWidget={(id) => setActiveWidgetId(id)}
            onUpdateWidget={handleSaveWidget}
            onAddWidgetWithType={handleAddWidgetWithType}
            headers={processedData.headers}
            numericColumns={processedData.numericColumns}
            categoricalColumns={processedData.categoricalColumns}
            dateColumns={processedData.dateColumns}
            totalRecordsCount={processedData.records.length}
            liveSyncInterval={liveSyncInterval}
            onSetLiveSyncInterval={setLiveSyncInterval}
            lastSyncedAt={lastSyncedAt}
            isSyncing={isSyncing}
            onManualSync={() => handleLiveSync(false)}
            records={filteredRecords}
            onOpenDataGrid={() => setIsDataGridModalOpen(true)}
          />
        </aside>
      )}

      </div>

      {/* Modals */}
      {/* Modal: New Dashboard Confirmation (Save or Discard) */}
      <NewDashboardConfirmModal
        isOpen={isNewDashboardModalOpen}
        onClose={() => setIsNewDashboardModalOpen(false)}
        currentDashboardName={
          dashboards.find((d) => d.id === activeDashboardId)?.name ||
          sheetConfig.spreadsheetTitle ||
          'แดชบอร์ดปัจจุบัน'
        }
        widgetsCount={widgets.length}
        onSaveAndCreateNew={handleSaveAndCreateNew}
        onCreateNewWithoutSaving={handleCreateNewWithoutSaving}
      />

      <WidgetEditorModal
        isOpen={!!editingWidget}
        config={editingWidget}
        onClose={() => setEditingWidget(null)}
        onSave={handleSaveWidget}
        headers={processedData.headers}
        numericColumns={processedData.numericColumns}
        categoricalColumns={processedData.categoricalColumns}
        records={filteredRecords}
      />

      <SheetPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        rawRows={rawRows}
        sheetConfig={sheetConfig}
        onUpdateConfig={(updated) => {
          setSheetConfig((prev) => ({ ...prev, ...updated }));
        }}
      />

      <TemplateSelectorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        selectedTemplateId={activeTemplateId}
        onSelectTemplate={handleSelectTemplate}
        currentWidgets={widgets}
        onImportWidgets={(importedWidgets, templateName) => {
          setWidgets(importedWidgets);
          setSuccessBanner(
            `นำเข้าเทมเพลต "${templateName || 'Custom'}" สำเร็จ! (${importedWidgets.length} วิดเจ็ต)`
          );
          setTimeout(() => setSuccessBanner(null), 3500);
        }}
      />

      {isDataGridModalOpen && (
        <DataGridEditorModal
          isOpen={isDataGridModalOpen}
          onClose={() => setIsDataGridModalOpen(false)}
          rawRows={rawRows}
          sheetConfig={sheetConfig}
          originalRawRows={originalRawRows}
          onSaveData={handleSaveGridData}
          onRevertOriginal={handleRevertOriginalGridData}
        />
      )}

      {/* Formula Builder Modal (Calculated Field เช่น Profit = Revenue - Cost, Growth %, Margin %) */}
      <FormulaBuilderModal
        isOpen={isFormulaModalOpen}
        onClose={() => setIsFormulaModalOpen(false)}
        processedData={processedData}
        calculatedFields={calculatedFields}
        onSaveCalculatedFields={handleSaveCalculatedFields}
      />

      {/* Share Dashboard Modal (แชร์ลิงก์หน้าบ้านให้ผู้อื่นใช้งาน / สลับสิทธิ์) */}
      <ShareDashboardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        dashboardTitle={sheetConfig.spreadsheetTitle || 'แดชบอร์ดข้อมูล'}
        isPasswordProtected={isPasswordProtected}
        viewerPassword={viewerPassword}
        userRole={userRole}
        onUpdateSecurity={(protectedStatus, newPassword) => {
          setIsPasswordProtected(protectedStatus);
          setViewerPassword(newPassword || '');
          localStorage.setItem('gs_share_protected', protectedStatus ? 'true' : 'false');
          localStorage.setItem('gs_share_password', newPassword || '');
          setSuccessBanner('อัปเดตการตั้งค่าการแชร์แดชบอร์ดเรียบร้อย');
          setTimeout(() => setSuccessBanner(null), 2500);
        }}
        onSwitchToViewerMode={() => {
          setIsViewerMode(true);
          const url = new URL(window.location.href);
          url.searchParams.set('mode', 'viewer');
          window.history.replaceState({}, '', url.toString());
        }}
      />

      {/* Template Marketplace Modal (8 Pro BI Templates) */}
      <TemplateMarketplaceModal
        isOpen={isMarketplaceOpen}
        onClose={() => setIsMarketplaceOpen(false)}
        data={processedData}
        selectedTemplateId={activeTemplateId}
        onSelectTemplate={(template) => {
          setActiveTemplateId(template.id);
          const newWidgets = template.createWidgets(processedData);
          setWidgets(newWidgets);
          setIsMarketplaceOpen(false);
          setSuccessBanner(`ใช้งานเทมเพลต "${template.name}" เรียบร้อยแล้ว (${newWidgets.length} วิดเจ็ต)`);
          setTimeout(() => setSuccessBanner(null), 3000);
        }}
      />

      {/* Backup & Restore Modal (สำรองและกู้คืนข้อมูลในเครื่อง) */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentDashboard={{
          spreadsheetTitle: sheetConfig.spreadsheetTitle || sheetConfig.selectedSheetTitle,
          layoutMode: layoutMode,
          gridGap: dashboardSpacing,
          themeMode: themeMode,
          dashboardTheme: dashboardTheme,
        }}
        currentWidgets={widgets}
        currentSheetConfig={sheetConfig}
        currentCalculatedFields={calculatedFields}
        onRestore={(data, options) => {
          if (options.restoreDashboard && data.dashboard) {
            if (data.dashboard.layoutMode) setLayoutMode(data.dashboard.layoutMode);
            if (data.dashboard.gridGap) setDashboardSpacing(data.dashboard.gridGap);
          }
          if (options.restoreTheme && data.theme) {
            if (data.theme.themeMode) setThemeMode(data.theme.themeMode);
            if (data.theme.dashboardTheme) setDashboardTheme(data.theme.dashboardTheme);
          }
          if (options.restoreWidgets && data.widgets) {
            setWidgets(data.widgets);
          }
          if (options.restoreDatasource && data.sheetConfig) {
            setSheetConfig(data.sheetConfig);
          }
          if (data.calculatedFields) {
            setCalculatedFields(data.calculatedFields);
          }
          setSuccessBanner('กู้คืนข้อมูลสำเร็จตามรายการที่เลือกเรียบร้อยแล้ว');
          setTimeout(() => setSuccessBanner(null), 3500);
        }}
      />

      {/* Login & Sheet Connection Help Modal */}
      <LoginHelpModal
        isOpen={isLoginHelpModalOpen}
        onClose={() => setIsLoginHelpModalOpen(false)}
        onManualTokenSubmit={(token) => {
          setManualAccessToken(token);
          setAccessToken(token);
          setSuccessBanner('บันทึก Access Token ด้วยตนเองสำเร็จ');
          setTimeout(() => setSuccessBanner(null), 3000);
        }}
        onGoogleLogin={handleGoogleLogin}
      />
    </div>
  );
}
