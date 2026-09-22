import { ProcessedSheetData, WidgetConfig } from '../types';

export interface DashboardTemplate {
  id: string;
  name: string;
  nameEn: string;
  category: 'Commercial' | 'Operations' | 'Finance' | 'Supply Chain' | 'People' | 'Custom';
  badge?: string;
  description: string;
  icon: string;
  createWidgets: (data: ProcessedSheetData) => WidgetConfig[];
}

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  // 1. Sales Dashboard
  {
    id: 'sales-dashboard',
    name: '1. แดชบอร์ดยอดขาย & ลูกค้า (Sales Dashboard)',
    nameEn: 'Sales & Revenue Analytics',
    category: 'Commercial',
    badge: 'ยอดนิยม #1',
    description: 'วิเคราะห์ยอดขายรวม อัตราเติบโต สินค้าขายดี สัดส่วนลูกค้า และผลงานรายเดือน',
    icon: 'TrendingUp',
    createWidgets: (data: ProcessedSheetData): WidgetConfig[] => {
      const num1 = data.numericColumns[0] || data.headers[1] || '';
      const num2 = data.numericColumns[1] || num1;
      const cat1 = data.categoricalColumns[0] || data.headers[0] || '';
      const cat2 = data.categoricalColumns[1] || cat1;
      const dateCol = data.dateColumns[0] || cat1;

      return [
        {
          id: 'w-sales-kpi-rev',
          title: num1 ? `ยอดขายรวม (${num1})` : 'ยอดขายรวม (Total Revenue)',
          type: 'kpi',
          width: 'third',
          valueColumn: num1,
          aggregation: 'sum',
          prefix: '฿',
          colorTheme: 'emerald',
          conditionalFormatting: [
            { id: 'c1', operator: 'greater_than', value: 100000, textColor: '#059669', label: 'ยอดขายดีเยี่ยม (>100k)' },
            { id: 'c2', operator: 'less_than', value: 50000, textColor: '#e11d48', label: 'ยอดขายต่ำกว่าเกณฑ์ (<50k)' },
          ],
        },
        {
          id: 'w-sales-kpi-orders',
          title: 'จำนวนคำสั่งซื้อ (Total Orders)',
          type: 'kpi',
          width: 'third',
          aggregation: 'count',
          suffix: ' บิล',
          colorTheme: 'blue',
        },
        {
          id: 'w-sales-kpi-avg',
          title: 'เฉลี่ยต่อบิล (Avg Ticket Size)',
          type: 'kpi',
          width: 'third',
          valueColumn: num1,
          aggregation: 'avg',
          prefix: '฿',
          colorTheme: 'violet',
        },
        {
          id: 'w-sales-bar-prod',
          title: `ยอดขายแยกตาม ${cat1}`,
          type: 'bar',
          width: 'half',
          categoryColumn: cat1,
          valueColumn: num1,
          aggregation: 'sum',
          colorTheme: 'blue',
          drillDownColumns: [cat1, cat2],
        },
        {
          id: 'w-sales-pie-channel',
          title: `สัดส่วนยอดขายตาม ${cat2}`,
          type: 'pie',
          width: 'half',
          categoryColumn: cat2,
          valueColumn: num1,
          aggregation: 'sum',
          colorTheme: 'emerald',
        },
        {
          id: 'w-sales-area-trend',
          title: `แนวโน้มยอดขายตาม ${dateCol}`,
          type: 'area',
          width: 'full',
          categoryColumn: dateCol,
          valueColumn: num1,
          secondaryValueColumn: num2 !== num1 ? num2 : undefined,
          aggregation: 'sum',
          colorTheme: 'teal',
        },
        {
          id: 'w-sales-table',
          title: 'รายการคำสั่งซื้อล่าสุด (Sales Records)',
          type: 'table',
          width: 'full',
          aggregation: 'none',
        },
      ];
    },
  },

  // 2. Inventory Dashboard
  {
    id: 'inventory-dashboard',
    name: '2. คลังสินค้า & สต็อกคงเหลือ (Inventory Dashboard)',
    nameEn: 'Inventory & Stock Management',
    category: 'Supply Chain',
    badge: 'คลังสินค้า',
    description: 'ตรวจเช็คระดับสต็อกคงเหลือ สินค้าพร้อมจ่าย จุดสั่งซื้อซ้ำ (Re-order point) และอัตราหมุนเวียน',
    icon: 'Package',
    createWidgets: (data: ProcessedSheetData): WidgetConfig[] => {
      const numQty = data.numericColumns[0] || data.headers[1] || '';
      const numVal = data.numericColumns[1] || numQty;
      const catSKU = data.categoricalColumns[0] || data.headers[0] || '';
      const catLoc = data.categoricalColumns[1] || catSKU;

      return [
        {
          id: 'w-inv-kpi-items',
          title: 'จำนวน SKU / รายการสินค้าทั้งหมด',
          type: 'kpi',
          width: 'third',
          aggregation: 'count',
          suffix: ' รายการ',
          colorTheme: 'blue',
        },
        {
          id: 'w-inv-kpi-total-qty',
          title: numQty ? `จำนวนคงคลังรวม (${numQty})` : 'ยอดสต็อกรวม (Total Stock)',
          type: 'kpi',
          width: 'third',
          valueColumn: numQty,
          aggregation: 'sum',
          suffix: ' ชิ้น',
          colorTheme: 'indigo',
        },
        {
          id: 'w-inv-kpi-val',
          title: numVal ? `มูลค่าสต็อกรวม (${numVal})` : 'มูลค่าสินค้าคงคลัง',
          type: 'kpi',
          width: 'third',
          valueColumn: numVal,
          aggregation: 'sum',
          prefix: '฿',
          colorTheme: 'amber',
        },
        {
          id: 'w-inv-bar-sku',
          title: `ระดับสินค้าคงคลังแยกตาม ${catSKU}`,
          type: 'bar',
          width: 'half',
          categoryColumn: catSKU,
          valueColumn: numQty,
          aggregation: 'sum',
          colorTheme: 'blue',
          drillDownColumns: [catSKU, catLoc],
        },
        {
          id: 'w-inv-pie-loc',
          title: `การกระจายสต็อกตาม ${catLoc}`,
          type: 'pie',
          width: 'half',
          categoryColumn: catLoc,
          valueColumn: numQty,
          aggregation: 'sum',
          colorTheme: 'teal',
        },
        {
          id: 'w-inv-table',
          title: 'ตารางสถานะสินค้าคงคลังทั้งหมด (Stock Master)',
          type: 'table',
          width: 'full',
          aggregation: 'none',
        },
      ];
    },
  },

  // 3. Finance Dashboard
  {
    id: 'finance-dashboard',
    name: '3. การเงิน รายรับ-รายจ่าย & กำไร (Finance Dashboard)',
    nameEn: 'Financial Performance & Profitability',
    category: 'Finance',
    badge: 'สายการเงิน',
    description: 'สรุปรายได้ ต้นทุน กำไรสุทธิ อัตราส่วนทางการเงิน (Margin %) และกระแสเงินสด',
    icon: 'DollarSign',
    createWidgets: (data: ProcessedSheetData): WidgetConfig[] => {
      const numRev = data.numericColumns[0] || data.headers[1] || '';
      const numCost = data.numericColumns[1] || numRev;
      const catType = data.categoricalColumns[0] || data.headers[0] || '';
      const catDept = data.categoricalColumns[1] || catType;
      const dateCol = data.dateColumns[0] || catType;

      return [
        {
          id: 'w-fin-kpi-rev',
          title: numRev ? `รายรับรวม (${numRev})` : 'รายรับรวม (Total Revenue)',
          type: 'kpi',
          width: 'third',
          valueColumn: numRev,
          aggregation: 'sum',
          prefix: '฿',
          colorTheme: 'emerald',
        },
        {
          id: 'w-fin-kpi-cost',
          title: numCost ? `ต้นทุนรวม (${numCost})` : 'ค่าใช้จ่ายรวม (Total Cost)',
          type: 'kpi',
          width: 'third',
          valueColumn: numCost,
          aggregation: 'sum',
          prefix: '฿',
          colorTheme: 'rose',
        },
        {
          id: 'w-fin-kpi-profit',
          title: 'กำไรประมาณการ (Estimated Profit)',
          type: 'kpi',
          width: 'third',
          valueColumn: numRev,
          aggregation: 'sum',
          prefix: '฿',
          colorTheme: 'violet',
          conditionalFormatting: [
            { id: 'f1', operator: 'greater_than', value: 100000, textColor: '#059669', label: 'กำไรเกินเป้าหมาย' },
            { id: 'f2', operator: 'less_than', value: 50000, textColor: '#e11d48', label: 'กำไรต่ำกว่าเป้าหมาย' },
          ],
        },
        {
          id: 'w-fin-waterfall',
          title: `วิเคราะห์รายรับ-รายจ่ายตาม ${catType}`,
          type: 'bar',
          width: 'half',
          categoryColumn: catType,
          valueColumn: numRev,
          secondaryValueColumn: numCost !== numRev ? numCost : undefined,
          aggregation: 'sum',
          colorTheme: 'blue',
        },
        {
          id: 'w-fin-pie-dept',
          title: `สัดส่วนงบประมาณตาม ${catDept}`,
          type: 'pie',
          width: 'half',
          categoryColumn: catDept,
          valueColumn: numRev,
          aggregation: 'sum',
          colorTheme: 'amber',
        },
        {
          id: 'w-fin-line-cashflow',
          title: `แนวโน้มกระแสเงินสดตาม ${dateCol}`,
          type: 'line',
          width: 'full',
          categoryColumn: dateCol,
          valueColumn: numRev,
          secondaryValueColumn: numCost !== numRev ? numCost : undefined,
          aggregation: 'sum',
          colorTheme: 'emerald',
        },
        {
          id: 'w-fin-table',
          title: 'บัญชีรายรับ-รายจ่ายอย่างละเอียด',
          type: 'table',
          width: 'full',
          aggregation: 'none',
        },
      ];
    },
  },

  // 4. Logistics Dashboard
  {
    id: 'logistics-dashboard',
    name: '4. โลจิสติกส์ & การขนส่ง (Logistics Dashboard)',
    nameEn: 'Logistics & Fleet Operations',
    category: 'Operations',
    badge: 'ขนส่ง & ข้ามแดน',
    description: 'ติดตามรอบส่งสินค้า อัตราส่งตรงเวลา (On-time Delivery) ต้นทุนค่าขนส่ง และยานพาหนะ',
    icon: 'Truck',
    createWidgets: (data: ProcessedSheetData): WidgetConfig[] => {
      const numTrip = data.numericColumns[0] || '';
      const catRoute = data.categoricalColumns[0] || data.headers[0] || '';
      const catStatus = data.categoricalColumns[1] || catRoute;
      const dateCol = data.dateColumns[0] || catRoute;

      return [
        {
          id: 'w-log-kpi-trips',
          title: 'รอบการขนส่งทั้งหมด (Total Shipments)',
          type: 'kpi',
          width: 'third',
          aggregation: 'count',
          suffix: ' เที่ยว',
          colorTheme: 'blue',
        },
        {
          id: 'w-log-kpi-vol',
          title: numTrip ? `ปริมาณขนส่งรวม (${numTrip})` : 'น้ำหนัก / ชิ้นงานรวม',
          type: 'kpi',
          width: 'third',
          valueColumn: numTrip,
          aggregation: 'sum',
          suffix: ' หน่วย',
          colorTheme: 'indigo',
        },
        {
          id: 'w-log-kpi-ontime',
          title: 'ประสิทธิภาพการจัดส่ง (Delivery Rate)',
          type: 'kpi',
          width: 'third',
          aggregation: 'count',
          suffix: ' งาน',
          colorTheme: 'emerald',
        },
        {
          id: 'w-log-bar-route',
          title: `จำนวนเที่ยวขนส่งแยกตาม ${catRoute}`,
          type: 'bar',
          width: 'half',
          categoryColumn: catRoute,
          valueColumn: numTrip,
          aggregation: numTrip ? 'sum' : 'count',
          colorTheme: 'blue',
          drillDownColumns: [catRoute, catStatus],
        },
        {
          id: 'w-log-pie-status',
          title: `สถานะการจัดส่ง (${catStatus})`,
          type: 'pie',
          width: 'half',
          categoryColumn: catStatus,
          aggregation: 'count',
          colorTheme: 'teal',
        },
        {
          id: 'w-log-table',
          title: 'บันทึกการเดินทางและสถานะการส่งมอบ (Shipment Logs)',
          type: 'table',
          width: 'full',
          aggregation: 'none',
        },
      ];
    },
  },

  // 5. Customs Dashboard
  {
    id: 'customs-dashboard',
    name: '5. พิธีการศุลกากร นำเข้า-ส่งออก (Customs Dashboard)',
    nameEn: 'Customs Clearance & Trade',
    category: 'Commercial',
    badge: 'ศุลกากร & ภาษี',
    description: 'ตรวจสอบสถานะใบขนสินค้า พิกัดศุลกากร (HS Code) ภาษีนำเข้า-ส่งออก และการปล่อยสินค้า (Clearance)',
    icon: 'FileText',
    createWidgets: (data: ProcessedSheetData): WidgetConfig[] => {
      const numTax = data.numericColumns[0] || data.headers[1] || '';
      const numVal = data.numericColumns[1] || numTax;
      const catHs = data.categoricalColumns[0] || data.headers[0] || '';
      const catCountry = data.categoricalColumns[1] || catHs;

      return [
        {
          id: 'w-cus-kpi-entries',
          title: 'จำนวนใบขนสินค้า (Customs Declarations)',
          type: 'kpi',
          width: 'third',
          aggregation: 'count',
          suffix: ' ฉบับ',
          colorTheme: 'blue',
        },
        {
          id: 'w-cus-kpi-duty',
          title: numTax ? `ภาษีและอากรศุลกากร (${numTax})` : 'อากรและภาษีรวม',
          type: 'kpi',
          width: 'third',
          valueColumn: numTax,
          aggregation: 'sum',
          prefix: '฿',
          colorTheme: 'rose',
        },
        {
          id: 'w-cus-kpi-cif',
          title: numVal ? `มูลค่าสินค้า CIF/FOB (${numVal})` : 'มูลค่าการค้าต่างประเทศ',
          type: 'kpi',
          width: 'third',
          valueColumn: numVal,
          aggregation: 'sum',
          prefix: '฿',
          colorTheme: 'emerald',
        },
        {
          id: 'w-cus-bar-hs',
          title: `มูลค่าตามพิกัดสินค้า (${catHs})`,
          type: 'bar',
          width: 'half',
          categoryColumn: catHs,
          valueColumn: numVal || numTax,
          aggregation: 'sum',
          colorTheme: 'blue',
          drillDownColumns: [catHs, catCountry],
        },
        {
          id: 'w-cus-pie-country',
          title: `สัดส่วนตามประเทศต้นทาง/ปลายทาง (${catCountry})`,
          type: 'pie',
          width: 'half',
          categoryColumn: catCountry,
          valueColumn: numVal || numTax,
          aggregation: 'sum',
          colorTheme: 'violet',
        },
        {
          id: 'w-cus-table',
          title: 'รายการใบขนสินค้าและสถานะศุลกากร (Declaration Master)',
          type: 'table',
          width: 'full',
          aggregation: 'none',
        },
      ];
    },
  },

  // 6. HR Dashboard
  {
    id: 'hr-dashboard',
    name: '6. บริหารทรัพยากรบุคคล (HR Dashboard)',
    nameEn: 'Human Resources & People Analytics',
    category: 'People',
    badge: 'ทรัพยากรบุคคล',
    description: 'วิเคราะห์จำนวนพนักงาน โครงสร้างแผนก อัตราการเข้า-ออก อัตราเงินเดือน และผลการประเมิน',
    icon: 'Users',
    createWidgets: (data: ProcessedSheetData): WidgetConfig[] => {
      const numSalary = data.numericColumns[0] || '';
      const catDept = data.categoricalColumns[0] || data.headers[0] || '';
      const catRole = data.categoricalColumns[1] || catDept;

      return [
        {
          id: 'w-hr-kpi-headcount',
          title: 'จำนวนพนักงานรวม (Total Headcount)',
          type: 'kpi',
          width: 'third',
          aggregation: 'count',
          suffix: ' คน',
          colorTheme: 'blue',
        },
        {
          id: 'w-hr-kpi-salary',
          title: numSalary ? `งบประมาณเงินเดือนรวม (${numSalary})` : 'ค่าเฉลี่ยเงินเดือนพนักงาน',
          type: 'kpi',
          width: 'third',
          valueColumn: numSalary,
          aggregation: numSalary ? 'sum' : 'count',
          prefix: numSalary ? '฿' : '',
          colorTheme: 'emerald',
        },
        {
          id: 'w-hr-kpi-depts',
          title: `จำนวนแผนกทั้งหมด (${catDept})`,
          type: 'kpi',
          width: 'third',
          valueColumn: catDept,
          aggregation: 'distinct_count',
          suffix: ' แผนก',
          colorTheme: 'violet',
        },
        {
          id: 'w-hr-bar-dept',
          title: `จำนวนพนักงานแยกตาม ${catDept}`,
          type: 'bar',
          width: 'half',
          categoryColumn: catDept,
          valueColumn: numSalary,
          aggregation: numSalary ? 'sum' : 'count',
          colorTheme: 'blue',
          drillDownColumns: [catDept, catRole],
        },
        {
          id: 'w-hr-pie-role',
          title: `การกระจายตำแหน่ง (${catRole})`,
          type: 'pie',
          width: 'half',
          categoryColumn: catRole,
          aggregation: 'count',
          colorTheme: 'amber',
        },
        {
          id: 'w-hr-table',
          title: 'ข้อมูลบุคลากรและประวัติการทำงาน (Employee Master)',
          type: 'table',
          width: 'full',
          aggregation: 'none',
        },
      ];
    },
  },

  // 7. Project Tracking
  {
    id: 'project-tracking',
    name: 'ติดตามงานและโครงการ (Projects & Tasks)',
    nameEn: 'Projects & Task Operations',
    category: 'Operations',
    description: 'เหมาะสำหรับรายการงาน ผู้รับผิดชอบ สถานะงาน ความคืบหน้า และการติดตามกำหนดเวลา',
    icon: 'CheckSquare',
    createWidgets: (data: ProcessedSheetData): WidgetConfig[] => {
      const catCol1 = data.categoricalColumns[0] || data.headers[0] || '';
      const catCol2 = data.categoricalColumns[1] || catCol1;
      const numCol = data.numericColumns[0] || '';

      return [
        {
          id: 'w-kpi-tasks',
          title: 'จำนวนงานทั้งหมด (Total Tasks)',
          type: 'kpi',
          width: 'half',
          aggregation: 'count',
          suffix: ' งาน',
          colorTheme: 'indigo',
        },
        {
          id: 'w-kpi-progress',
          title: numCol ? `เฉลี่ย ${numCol}` : 'ผลรวมปริมาณงาน (Workload)',
          type: 'kpi',
          width: 'half',
          valueColumn: numCol,
          aggregation: 'avg',
          suffix: numCol.toLowerCase().includes('%') ? '%' : '',
          colorTheme: 'emerald',
        },
        {
          id: 'w-bar-status',
          title: `สรุปจำนวนงานแยกตาม ${catCol1}`,
          type: 'bar',
          width: 'half',
          categoryColumn: catCol1,
          aggregation: 'count',
          colorTheme: 'blue',
        },
        {
          id: 'w-pie-assignee',
          title: `สัดส่วนการกระจายงานตาม ${catCol2}`,
          type: 'pie',
          width: 'half',
          categoryColumn: catCol2,
          aggregation: 'count',
          colorTheme: 'amber',
        },
        {
          id: 'w-table-tasks',
          title: 'รายการงานทั้งหมดในชีท',
          type: 'table',
          width: 'full',
          aggregation: 'none',
        },
      ];
    },
  },

  // 8. Blank Canvas
  {
    id: 'blank',
    name: 'หน้าว่าง ปรับแต่งเอง (Blank Custom Canvas)',
    nameEn: 'Blank Canvas',
    category: 'Custom',
    description: 'เริ่มต้นจากศูนย์ เพิ่มและจัดเรียงวิดเจ็ตต่างๆ ได้ตามใจคุณ',
    icon: 'PlusSquare',
    createWidgets: (): WidgetConfig[] => {
      return [
        {
          id: 'w-kpi-empty',
          title: 'จำนวนแถวข้อมูล',
          type: 'kpi',
          width: 'third',
          aggregation: 'count',
          colorTheme: 'blue',
        },
        {
          id: 'w-table-empty',
          title: 'ตารางข้อมูลจากชีท',
          type: 'table',
          width: 'full',
          aggregation: 'none',
        },
      ];
    },
  },
];
