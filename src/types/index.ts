export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetMetadata {
  id: string;
  title: string;
  sheets: SheetTabInfo[];
  url?: string;
  lastFetchedAt: string;
}

export interface SheetConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  sheetUrl: string;
  selectedSheetTitle: string;
  headerRowIndex: number; // 1-based index (e.g. 1 means Row 1 is header)
  dataStartRowIndex: number; // 1-based index (e.g. 2 means Row 2 is first data row)
  dataEndRowIndex?: number; // optional max row
  selectedColumns?: string[]; // headers to include
}

export interface ProcessedSheetData {
  headers: string[];
  rawRows: (string | number | boolean | null)[][];
  records: Record<string, any>[];
  numericColumns: string[];
  categoricalColumns: string[];
  dateColumns: string[];
  totalRows: number;
}

export type WidgetType =
  | 'kpi'
  | 'bar'
  | 'column'
  | 'horizontal_bar'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'combo'
  | 'radar'
  | 'radial_bar'
  | 'gauge'
  | 'scatter'
  | 'funnel'
  | 'waterfall'
  | 'heatmap'
  | 'treemap'
  | 'table'
  | 'pivot'
  | 'list'
  | 'timeline'
  | 'map'
  | 'calendar'
  | 'progress'
  | 'ai_summary'
  | 'text'
  | 'rich_text'
  | 'floating_text'
  | 'image'
  | 'iframe'
  | 'embed';

export type AggregationType = 'sum' | 'avg' | 'count' | 'distinct_count' | 'min' | 'max' | 'none';

export type WidgetWidth = 'full' | 'half' | 'third' | 'custom';

export type HeightPreset = 'compact' | 'normal' | 'tall' | 'extra-tall';

export type NumberFormatType = 'general' | 'currency' | 'percent' | 'compact';

export type GridGapType = 'none' | 'tight' | 'normal' | 'relaxed' | 'loose';

export type DashboardTheme =
  | 'light'
  | 'midnight'
  | 'ocean'
  | 'violet'
  | 'forest'
  | 'sunset'
  | 'dark'
  | 'emerald'
  | 'amber';

export type FilterOperatorType =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal'
  | 'less_than_or_equal'
  | 'is_empty'
  | 'not_empty'
  | 'col_equals'
  | 'col_not_equals'
  | 'col_greater'
  | 'col_less';

export interface WidgetFilterRule {
  id: string;
  column: string;
  operator: FilterOperatorType;
  compareMode?: 'value' | 'column'; // กรองด้วยค่าที่พิมพ์ หรือเทียบกับอีกคอลัมน์
  value?: string;
  compareColumn?: string; // คอลัมน์ที่นำมาเทียบ
}

export interface AlignmentGuideline {
  type: 'x' | 'y';
  position: number;
  label?: string;
}

export type LayoutMode = 'grid' | 'freeform';

export type ThemeMode = 'light' | 'dark';

export interface WidgetConfig {
  id: string;
  title: string;
  type: WidgetType;
  width: WidgetWidth;
  colSpan?: number; // 1 to 12 columns in a 12-column grid (flexible layout!)
  heightPreset?: HeightPreset;
  customHeight?: number; // pixel height override

  // Freeform Canvas Positioning ("อิสระ วางชิด ทับ หรือซ้อนกันได้")
  posX?: number; // X position in pixels on canvas
  posY?: number; // Y position in pixels on canvas
  posWidth?: number; // Width in pixels on canvas (e.g. 380)
  posHeight?: number; // Height in pixels on canvas (e.g. 320)
  zIndex?: number; // Layer order (1, 2, 3...)

  categoryColumn?: string; // X-axis or grouping field
  valueColumn?: string; // Y-axis or metric field
  secondaryValueColumn?: string; // optional second metric
  aggregation: AggregationType;
  colorTheme?: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  sortBy?: 'asc' | 'desc' | 'none';
  limit?: number;

  // Filters & Blank Handling
  excludeBlank?: boolean; // ไม่แสดงข้อมูลว่างในกราฟ
  blankLabel?: string; // ชื่อแสดงผลสำหรับค่าว่าง เช่น "(ว่าง)" หรือ " " เหมือนใน Excel
  widgetFilterColumn?: string; // ฟิลเตอร์เฉพาะกราฟนี้ (Legacy single)
  widgetFilterOperator?: 'equals' | 'not_equals' | 'contains' | 'not_empty' | 'is_empty';
  widgetFilterValue?: string;
  filterRules?: WidgetFilterRule[]; // ฟิลเตอร์หลายเงื่อนไขระดับกราฟ
  filterLogic?: 'and' | 'or'; // ตรวจสอบแบบ ตรงทุกข้อ (AND) หรือ ตรงข้อใดข้อหนึ่ง (OR)

  // Category Colors & Palettes
  colorMode?: 'palette' | 'single';
  customCategoryColors?: Record<string, string>; // สีเฉพาะรายหัวข้อ/หมวดหมู่
  paletteName?: string; // e.g. 'vibrant' | 'pastel' | 'neon' | 'corporate' | 'warm' | 'cool'

  // Text / Banner / Note Widget Fields ("กล่องข้อความแต่งสีได้เพื่อออกแบบแดชบอร์ด")
  textContent?: string; // เนื้อหาข้อความหรือคำอธิบาย
  textSubtitle?: string; // คำโปรยหรือข้อย่อย
  badgeText?: string; // ข้อความป้ายกำกับ (Badge) เช่น "เป้าหมายองค์กร", "โน้ตสำคัญ"
  badgeColor?: string; // สีของป้าย Badge
  iconName?: string; // ไอคอนตกแต่ง เช่น 'sparkles', 'trophy', 'star', 'lightbulb', 'target', 'bell', 'info'
  calloutStyle?: 'card' | 'banner' | 'gradient' | 'minimal' | 'quote';

  // KPI Display & Comparison ("นับจำนวน (count) ติ๊กแสดง/ซ่อน และเปรียบเทียบข้อมูล ต่างกี่เปอร์เซ็นต์ มีสัญลักษณ์เพิ่มขึ้น/ลดลง")
  showAggregationBadge?: boolean; // แสดง/ซ่อน ป้ายนับจำนวน (COUNT), ผลรวม (SUM), ค่าเฉลี่ย (AVG)
  showCountBadge?: boolean; // ทางเลือกเพิ่มเติมสำหรับแสดง/ซ่อนป้ายนับจำนวน
  enableComparison?: boolean; // เปิด/ปิดการเปรียบเทียบข้อมูล
  comparisonColumn?: string; // คอลัมน์ที่ใช้เทียบ เช่น คอลัมน์ B (เดือน), วันที่, ไตรมาส
  comparisonMode?: 'previous_period' | 'baseline' | 'all_total'; // รูปแบบการเทียบ: งวดก่อนหน้า, เป้าหมายคงที่, หรือคิดเป็น % ของยอดรวม
  comparisonBaselineValue?: number; // ค่าเปรียบเทียบคงที่ (เช่น เป้าหมาย 50,000)
  comparisonLabel?: string; // ป้ายข้อความกำกับ เช่น "เทียบเดือนก่อน", "เทียบเป้าหมาย"

  // KPI Two-Column Condition Comparison ("เทียบ 2 คอลัมน์ตามเงื่อนไข เช่น คอลัมน์ A = คอลัมน์ B มีกี่อัน หรือกี่เปอร์เซ็นต์ หรือ A > B")
  enableTwoColCompare?: boolean; // เปิดโหมดเทียบ 2 คอลัมน์ตามเงื่อนไข
  compareColA?: string; // คอลัมน์แรก (A)
  compareColB?: string; // คอลัมน์สอง (B)
  compareOperator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'contains'; // เงื่อนไขเปรียบเทียบ (=, !=, >, <, >=, <=, contains)
  compareDisplayMode?: 'count' | 'percent' | 'both'; // แสดงผลเป็น: จำนวน (count), เปอร์เซ็นต์ (%), หรือทั้งคู่

  // Excel-like Chart Customization & Data Labels ("เหมือนกราฟในเอ็กเซล แก้หรือลบคำว่ามูลค่า ดาต้าเลเบล ชื่อนหัวข้อ")
  customValueLabel?: string; // แก้ชื่อแสดงแทนคำว่า "มูลค่า" หรือชื่อคอลัมน์ เช่น "ยอดขายรวมปี 2026"
  showValueLabel?: boolean; // แสดง/ซ่อนชื่อชุดข้อมูล
  showDescription?: boolean; // แสดง/ซ่อนคำอธิบายตัวเล็กใต้หัวข้อการ์ด (default: false เพื่อไม่ให้รก)
  showRowCount?: boolean; // ปิด/เปิด คำว่า "คำนวณจาก ... แถว" (เริ่มต้นปิดไว้ตามสั่ง)
  showLegend?: boolean; // แสดง/ซ่อนคำอธิบายสี
  legendPosition?: 'top' | 'bottom' | 'right';
  legendTitle?: string; // หัวข้อคำอธิบายสี เช่น "คำอธิบายสีสัญลักษณ์"
  categoryColorMeanings?: Record<string, string>; // กำหนดความหมายของแต่ละสี
  showDataLabels?: boolean; // แสดงตัวเลขดาต้าเลเบลบนกราฟ
  dataLabelPosition?: 'top' | 'inside' | 'bottom' | 'center';
  xAxisLabel?: string; // ชื่อกำกับแกน X
  yAxisLabel?: string; // ชื่อกำกับแกน Y
  showXAxis?: boolean; // แสดง/ซ่อนแกน X
  showYAxis?: boolean; // แสดง/ซ่อนแกน Y
  showGrid?: boolean; // แสดงเส้นตารางในกราฟ
  showTooltip?: boolean; // แสดงกล่องข้อความลอยเมื่อชี้ (Tooltip)
  chartNote?: string; // คำอธิบายเพิ่มเติมใต้กราฟ

  // Drill Down Hierarchy ("เจาะลึกข้อมูล เช่น 2026 -> Sep -> Week -> Date หรือ หมวดหมู่ -> สินค้า")
  drillDownColumns?: string[];
  drillDownLevel?: number;

  // Conditional Formatting ("ให้ KPI และการ์ดเปลี่ยนสีอัตโนมัติตามเงื่อนไข เช่น Profit > 100,000 สีเขียว, Profit < 50,000 สีแดง")
  conditionalFormatting?: ConditionalColorRule[];

  // Excel-like typography & visual formatting
  fontFamily?: string; // 'Inter' | 'Sarabun' | 'Prompt' | 'Kanit' | 'JetBrains Mono'
  titleFontSize?: number; // e.g. 12, 14, 16, 18, 20, 24
  valueFontSize?: number; // e.g. 20, 28, 36, 44, 52
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number; // 0, 1, 2, 4
  numberFormat?: NumberFormatType;
  decimalPlaces?: number;
  chartSubtype?: 'vertical' | 'horizontal';
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  gridGap?: GridGapType;
  layoutMode?: LayoutMode;
  themeMode?: ThemeMode;
  updatedAt: string;
  widgets: WidgetConfig[];
}

export interface ExportedDashboardTemplate {
  version: string;
  templateName: string;
  description?: string;
  exportedAt: string;
  layoutMode: LayoutMode;
  gridGap: GridGapType;
  themeMode: ThemeMode;
  widgets: WidgetConfig[];
}

export interface RecentSheet {
  id: string;
  title: string;
  url: string;
  tabCount: number;
  selectedSheet: string;
  headerRow: number;
  dataStartRow: number;
  lastOpenedAt: string;
  isCustomUpload?: boolean;
}

export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
}

export interface DashboardItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  sheetConfig: SheetConfig;
  widgets: WidgetConfig[];
  dashboardSpacing?: GridGapType;
  dashboardTheme?: DashboardTheme;
  createdByEmail: string;
  creatorName?: string;
  isPublic?: boolean;
  viewerPassword?: string;
  isPasswordProtected?: boolean;
  calculatedFields?: CalculatedField[];
  alertRules?: AlertRule[];
}

export interface UserActivityRecord {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  firstSeenAt: string;
  lastSeenAt: string;
  visitCount: number;
  lastAction?: string;
}

export interface SiteStatusConfig {
  isOnline: boolean;
  maintenanceMessage?: string;
  updatedAt: string;
  updatedBy: string;
}

export type DatePresetType = 'all' | 'custom' | 'this_month' | 'last_month' | 'this_year' | 'specific_month';

export interface FilterState {
  dateColumn: string;
  datePreset: DatePresetType;
  startDate?: string;
  endDate?: string;
  selectedYear?: string;
  selectedMonth?: string;
  categoryFilters: Record<string, string>;
  activeFilterColumns?: string[];
  searchQuery?: string;
  sqlFilterQuery?: string; // สาย Data: SQL-Like Expression (e.g. Revenue > 100000 AND Province = 'Chonburi')
}

export type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

// 1. Formula Builder: Calculated Field Model
export interface CalculatedField {
  id: string;
  name: string; // e.g. "กำไร (Profit)", "อัตราเติบโต %"
  formula: string; // e.g. "[ยอดขาย] - [ต้นทุน]" หรือ "([กำไร] / [ยอดขาย]) * 100"
  format?: 'number' | 'currency' | 'percent';
  decimals?: number;
  description?: string;
  createdAt?: string;
}

// 2. Conditional Color: Rule Model
export interface ConditionalColorRule {
  id: string;
  operator: 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'equals' | 'between';
  value: number;
  value2?: number; // for between
  textColor?: string; // e.g. '#10b981' (green) or '#ef4444' (red)
  backgroundColor?: string; // e.g. '#ecfdf5' (emerald-50) or '#fff1f2' (rose-50)
  borderColor?: string;
  label?: string; // e.g. "ยอดดีเยี่ยม (> 100,000)", "ต้องระวัง (< 50,000)"
}

// 8. Alert System: Alert Rule Model
export interface AlertRule {
  id: string;
  name: string;
  column: string;
  operator: 'greater_than' | 'less_than' | 'greater_than_or_equal' | 'less_than_or_equal' | 'equals';
  threshold: number;
  channel: 'line' | 'email' | 'telegram' | 'all';
  targetContact?: string; // e.g. LINE Token, email address, Telegram Chat ID
  isActive: boolean;
  lastTriggeredAt?: string;
  lastTriggeredValue?: number;
}

// 13. Notification Center Model
export type NotificationEventType = 'sync_failed' | 'datasource_expired' | 'dashboard_error' | 'user_login';
export type NotificationChannelType = 'email' | 'line' | 'teams' | 'slack';

export interface NotificationChannelConfig {
  email: {
    enabled: boolean;
    recipientEmail: string;
  };
  line: {
    enabled: boolean;
    token: string;
  };
  teams: {
    enabled: boolean;
    webhookUrl: string;
  };
  slack: {
    enabled: boolean;
    webhookUrl: string;
    channelName: string;
  };
}

export interface NotificationRuleMap {
  sync_failed: Record<NotificationChannelType, boolean>;
  datasource_expired: Record<NotificationChannelType, boolean>;
  dashboard_error: Record<NotificationChannelType, boolean>;
  user_login: Record<NotificationChannelType, boolean>;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  event: NotificationEventType;
  eventTitle: string;
  channel: NotificationChannelType;
  status: 'sent' | 'failed';
  message: string;
}

// 14. Backup & Restore Model
export type BackupFrequency = 'daily' | 'weekly' | 'monthly';

export interface BackupItem {
  id: string;
  title: string;
  createdAt: string;
  sizeBytes?: number;
  type: 'manual' | 'scheduled';
  data: {
    dashboard: {
      spreadsheetTitle?: string;
      layoutMode?: LayoutMode;
      gridGap?: GridGapType;
      themeMode?: ThemeMode;
      dashboardTheme?: DashboardTheme;
    };
    theme: {
      colorSystem?: string;
      canvasBackground?: string;
    };
    widgets: WidgetConfig[];
    datasource: {
      sheetConfig: SheetConfig;
      calculatedFields?: CalculatedField[];
    };
  };
}

export interface BackupScheduleConfig {
  isEnabled: boolean;
  frequency: BackupFrequency;
  backupTime: string; // e.g. "02:00"
  lastRunAt?: string;
  nextRunAt?: string;
}

export interface RestoreOptions {
  dashboard: boolean;
  theme: boolean;
  widget: boolean;
  datasource: boolean;
}

// 15. White Label System Model
export interface WhiteLabelConfig {
  companyName: string; // e.g. "Vista BI Studio" -> "ABC Analytic"
  companyLogoUrl?: string; // Logo image URL or data URI
  domain: string; // e.g. "analytics.abcanalytic.com"
  loginTheme: 'modern_blue' | 'enterprise_slate' | 'emerald_pro' | 'luxury_dark';
  loginWelcomeTitle?: string;
  loginWelcomeSubtitle?: string;
  primaryColor: string; // e.g. "#2563eb" or custom HEX
  accentColor: string;
  canvasTheme: 'light' | 'midnight' | 'dark' | 'slate';
  footerCredit?: string;
}
