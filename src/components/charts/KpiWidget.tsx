import React, { useMemo } from 'react';
import { WidgetConfig } from '../../types';
import { aggregateWidgetData, THEME_PALETTES, evaluateTwoColumnComparison } from '../../utils/aggregateData';
import { parseCleanNumber } from '../../services/sheetsApi';
import { TrendingUp, Hash, Layers, ArrowUp, ArrowDown, Minus, Sparkles, Scale, CheckCircle2 } from 'lucide-react';

interface KpiWidgetProps {
  config: WidgetConfig;
  records: Record<string, any>[];
  isCompact?: boolean;
  onQuickFormat?: (prefix: string, suffix: string) => void;
}

export const KpiWidget: React.FC<KpiWidgetProps> = ({
  config,
  records,
  isCompact = false,
  onQuickFormat,
}) => {
  const { formattedSingleValue, singleValue = 0 } = aggregateWidgetData(records, config);
  const theme = THEME_PALETTES[config.colorTheme || 'blue'] || THEME_PALETTES.blue;

  const aggLabels: Record<string, string> = {
    sum: 'ผลรวม (SUM)',
    avg: 'ค่าเฉลี่ย (AVG)',
    count: 'นับจำนวน (COUNT)',
    distinct_count: 'นับไม่ซ้ำ (UNIQUE)',
    max: 'ค่าสูงสุด (MAX)',
    min: 'ค่าต่ำสุด (MIN)',
    none: 'ค่าปัจจุบัน',
  };

  // คำนวณ KPI เปรียบเทียบ 2 คอลัมน์ตามเงื่อนไข (Two-Column Condition KPI)
  const twoColStats = useMemo(() => {
    if (!config.enableTwoColCompare || !config.compareColA || !config.compareColB) {
      return null;
    }
    const colA = config.compareColA;
    const colB = config.compareColB;
    const op = config.compareOperator || 'equals';
    const total = records.length;
    const matches = records.filter((r) =>
      evaluateTwoColumnComparison(r[colA], r[colB], op)
    ).length;
    const pct = total > 0 ? (matches / total) * 100 : 0;
    const opSymbols: Record<string, string> = {
      equals: '=',
      not_equals: '≠',
      greater_than: '>',
      less_than: '<',
      greater_than_or_equal: '≥',
      less_than_or_equal: '≤',
      contains: 'มีคำว่า',
    };
    return {
      total,
      matches,
      percentage: pct,
      symbol: opSymbols[op] || op,
      colA,
      colB,
    };
  }, [
    config.enableTwoColCompare,
    config.compareColA,
    config.compareColB,
    config.compareOperator,
    records,
  ]);

  const quickPresets = [
    { label: '฿ บาท', prefix: '฿', suffix: ' บาท' },
    { label: '$ USD', prefix: '$', suffix: ' USD' },
    { label: '%', prefix: '', suffix: '%' },
    { label: 'ชิ้น', prefix: '', suffix: ' ชิ้น' },
    { label: 'คน', prefix: '', suffix: ' คน' },
    { label: 'ล้านบาท', prefix: '฿', suffix: ' ล้านบาท' },
  ];

  // คำนวณการเปรียบเทียบข้อมูลเมื่อเปิดใช้งาน (Data Comparison / Trend vs Baseline)
  const comparison = useMemo(() => {
    if (!config.enableComparison) return null;

    const col = config.comparisonColumn;
    const mode = config.comparisonMode || 'previous_period';
    const baseline = config.comparisonBaselineValue ?? 0;

    let baselineVal = baseline;
    let periodLabel = config.comparisonLabel || 'เทียบช่วงก่อนหน้า';

    if (mode === 'baseline') {
      baselineVal = baseline;
      periodLabel = config.comparisonLabel || 'เทียบเป้าหมาย';
    } else if (mode === 'all_total') {
      const totalNumbers = records
        .map((r) => parseCleanNumber(r[config.valueColumn || '']))
        .filter((n) => !isNaN(n));
      baselineVal =
        config.aggregation === 'count'
          ? records.length
          : totalNumbers.reduce((a, b) => a + b, 0);
      periodLabel = config.comparisonLabel || 'เทียบยอดรวมทั้งหมด';
    } else if (col && records.length > 0) {
      // จัดกลุ่มตามคอลัมน์เปรียบเทียบ เช่น เดือน, วันที่
      const periodMap = new Map<string, number[]>();
      const periodOrder: string[] = [];

      for (const r of records) {
        const key = String(r[col] ?? '').trim();
        if (!key) continue;
        if (!periodMap.has(key)) {
          periodMap.set(key, []);
          periodOrder.push(key);
        }
        if (config.valueColumn) {
          const num = parseCleanNumber(r[config.valueColumn]);
          if (!isNaN(num)) periodMap.get(key)!.push(num);
        } else {
          periodMap.get(key)!.push(1);
        }
      }

      if (periodOrder.length >= 2) {
        // งวดก่อนหน้าคือ index ก่อนหน้าตัวสุดท้าย
        const prevKey = periodOrder[periodOrder.length - 2];
        const currentKey = periodOrder[periodOrder.length - 1];
        periodLabel = config.comparisonLabel || `เทียบ ${prevKey}`;

        const prevNums = periodMap.get(prevKey) || [];
        if (config.aggregation === 'count') {
          baselineVal = prevNums.length;
        } else if (config.aggregation === 'avg') {
          baselineVal = prevNums.length
            ? prevNums.reduce((a, b) => a + b, 0) / prevNums.length
            : 0;
        } else if (config.aggregation === 'max') {
          baselineVal = prevNums.length ? Math.max(...prevNums) : 0;
        } else if (config.aggregation === 'min') {
          baselineVal = prevNums.length ? Math.min(...prevNums) : 0;
        } else {
          baselineVal = prevNums.reduce((a, b) => a + b, 0);
        }
      } else if (baseline > 0) {
        baselineVal = baseline;
        periodLabel = config.comparisonLabel || 'เทียบเป้าหมาย';
      }
    }

    const current = singleValue;
    const diff = current - baselineVal;
    const percentage =
      baselineVal !== 0 ? (diff / Math.abs(baselineVal)) * 100 : current !== 0 ? 100 : 0;
    const direction: 'up' | 'down' | 'flat' =
      diff > 0.0001 ? 'up' : diff < -0.0001 ? 'down' : 'flat';

    return {
      current,
      baselineVal,
      diff,
      percentage: Math.abs(percentage),
      signedPercentage: percentage,
      direction,
      periodLabel,
    };
  }, [
    config.enableComparison,
    config.comparisonColumn,
    config.comparisonMode,
    config.comparisonBaselineValue,
    config.comparisonLabel,
    config.aggregation,
    config.valueColumn,
    singleValue,
    records,
  ]);

  // 1. Conditional Formatting Evaluator
  const matchedRule = useMemo(() => {
    if (!config.conditionalFormatting || config.conditionalFormatting.length === 0) {
      return null;
    }
    for (const rule of config.conditionalFormatting) {
      const val = singleValue;
      const target = rule.value;
      let matches = false;
      switch (rule.operator) {
        case 'greater_than':
          matches = val > target;
          break;
        case 'greater_than_or_equal':
          matches = val >= target;
          break;
        case 'less_than':
          matches = val < target;
          break;
        case 'less_than_or_equal':
          matches = val <= target;
          break;
        case 'equals':
          matches = val === target;
          break;
        case 'between':
          matches = val >= target && (rule.value2 === undefined || val <= rule.value2);
          break;
      }
      if (matches) return rule;
    }
    return null;
  }, [config.conditionalFormatting, singleValue]);

  // 2. Trend & Sparkline Data Generator
  const sparkline = useMemo(() => {
    if (!config.valueColumn || records.length < 2) return null;
    const vals = records
      .slice(-16)
      .map((r) => parseCleanNumber(r[config.valueColumn!]))
      .filter((n) => !isNaN(n));
    if (vals.length < 2) return null;

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min === 0 ? 1 : max - min;
    const w = 76;
    const h = 26;

    const points = vals.map((v, i) => {
      const x = (i / (vals.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return { x, y, v };
    });

    const first = vals[0];
    const last = vals[vals.length - 1];
    const trendDiff = last - first;
    const trendPct = first !== 0 ? (trendDiff / Math.abs(first)) * 100 : 0;
    const isUp = trendDiff > 0.0001;
    const isDown = trendDiff < -0.0001;

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

    return {
      points,
      pathD,
      areaD,
      trendPct: Math.abs(trendPct),
      isUp,
      isDown,
      color: isUp ? '#10b981' : isDown ? '#f43f5e' : '#64748b',
    };
  }, [records, config.valueColumn]);

  const showBadge = config.showAggregationBadge !== false && config.showCountBadge !== false;

  // Active Value Text Color (Priority: Conditional Rule > Config TextColor > Default)
  const displayTextColor = matchedRule?.textColor || config.textColor || undefined;

  return (
    <div className={`flex flex-col justify-between h-full ${isCompact ? 'p-1' : 'p-2'}`}>
      <div>
        {showBadge && (
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={`${
                isCompact ? 'text-[10px] px-1.5 py-0.2' : 'text-xs px-2 py-0.5'
              } font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 rounded truncate max-w-[85%]`}
              title={
                twoColStats
                  ? `${twoColStats.colA} ${twoColStats.symbol} ${twoColStats.colB}`
                  : aggLabels[config.aggregation] || config.aggregation
              }
            >
              {twoColStats
                ? `${twoColStats.colA} ${twoColStats.symbol} ${twoColStats.colB}`
                : aggLabels[config.aggregation] || config.aggregation}
            </span>
            <div
              className={`${
                isCompact ? 'w-6 h-6 rounded' : 'w-7 h-7 rounded-lg'
              } flex items-center justify-center text-white shadow-xs shrink-0`}
              style={{ backgroundColor: theme.primary }}
            >
              {twoColStats ? (
                <Scale className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              ) : config.aggregation === 'distinct_count' ? (
                <Sparkles className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              ) : config.aggregation === 'count' ? (
                <Hash className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              ) : config.aggregation === 'avg' ? (
                <Layers className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              ) : (
                <TrendingUp className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              )}
            </div>
          </div>
        )}

        <div className={showBadge ? (isCompact ? 'mt-1' : 'mt-2') : 'mt-0'}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div
              className={`${
                isCompact ? 'text-2xl sm:text-3xl' : 'text-3xl lg:text-4xl'
              } font-bold tracking-tight text-slate-900 truncate leading-tight pb-0.5`}
              style={{
                fontFamily: config.fontFamily || undefined,
                fontSize: config.valueFontSize ? `${config.valueFontSize}px` : undefined,
                color: displayTextColor,
                fontWeight: config.isBold ? 700 : undefined,
                fontStyle: config.isItalic ? 'italic' : undefined,
                textDecoration: config.isUnderline ? 'underline' : undefined,
                textAlign: config.textAlign || 'left',
              }}
              title={formattedSingleValue}
            >
              {formattedSingleValue}
            </div>

            {/* Sparkline Graphic (ผู้บริหารชอบมาก: KPI Trend พร้อม Sparkline) */}
            {sparkline && (
              <div className="flex flex-col items-end shrink-0">
                <svg
                  width="76"
                  height="26"
                  className="overflow-visible"
                  viewBox="0 0 76 26"
                >
                  <defs>
                    <linearGradient id={`spark-grad-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sparkline.color} stopOpacity="0.25" />
                      <stop offset="100%" stopColor={sparkline.color} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path d={sparkline.areaD} fill={`url(#spark-grad-${config.id})`} />
                  <path
                    d={sparkline.pathD}
                    fill="none"
                    stroke={sparkline.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {sparkline.points.length > 0 && (
                    <circle
                      cx={sparkline.points[sparkline.points.length - 1].x}
                      cy={sparkline.points[sparkline.points.length - 1].y}
                      r="3"
                      fill={sparkline.color}
                    />
                  )}
                </svg>
                <div
                  className={`text-[10px] font-bold flex items-center gap-0.5 ${
                    sparkline.isUp ? 'text-emerald-600' : sparkline.isDown ? 'text-rose-600' : 'text-slate-500'
                  }`}
                >
                  {sparkline.isUp ? '▲' : sparkline.isDown ? '▼' : '―'}
                  <span>{sparkline.trendPct.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Conditional Color Badge (ถ้าตรงเงื่อนไขสี เช่น Profit > 100,000 หรือ < 50,000) */}
          {matchedRule && (
            <div className="mt-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md"
                style={{
                  color: matchedRule.textColor || '#1e293b',
                  backgroundColor: matchedRule.backgroundColor || '#f1f5f9',
                  border: matchedRule.borderColor ? `1px solid ${matchedRule.borderColor}` : undefined,
                }}
              >
                ● {matchedRule.label || `เกณฑ์เงื่อนไข (${matchedRule.operator} ${matchedRule.value.toLocaleString('th-TH')})`}
              </span>
            </div>
          )}

          {/* แถบสรุปผลลัพธ์เมื่อเปิดเปรียบเทียบ 2 คอลัมน์ (Two-Column Comparison Stats) */}
          {twoColStats && (
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {config.compareDisplayMode === 'percent'
                    ? `ตรงเงื่อนไข ${twoColStats.matches.toLocaleString('th-TH')} จาก ${twoColStats.total.toLocaleString('th-TH')} อัน`
                    : config.compareDisplayMode === 'both'
                    ? `จากทั้งหมด ${twoColStats.total.toLocaleString('th-TH')} อัน`
                    : `คิดเป็น ${twoColStats.percentage.toFixed(1)}% (จาก ${twoColStats.total.toLocaleString('th-TH')} อัน)`}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                  {twoColStats.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, twoColStats.percentage))}%`,
                    backgroundColor: theme.primary,
                  }}
                />
              </div>
            </div>
          )}

          {/* ป้ายเปรียบเทียบข้อมูล (แสดงเฉพาะเมื่อเปิด enableComparison) */}
          {comparison && (
            <div
              className={`flex items-center gap-1.5 ${
                isCompact ? 'mt-1' : 'mt-1.5'
              } flex-wrap`}
            >
              <span
                className={`inline-flex items-center gap-1 ${
                  isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
                } rounded-full font-bold shadow-2xs ${
                  comparison.direction === 'up'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : comparison.direction === 'down'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {comparison.direction === 'up' && (
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                {comparison.direction === 'down' && (
                  <ArrowDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                {comparison.direction === 'flat' && (
                  <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                <span>
                  {comparison.direction === 'up' ? '+' : comparison.direction === 'down' ? '-' : ''}
                  {comparison.percentage.toFixed(1)}%
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium truncate">
                {comparison.periodLabel}
              </span>
            </div>
          )}

          {config.showValueLabel && (config.customValueLabel || config.valueColumn) && (
            <div
              className={`${isCompact ? 'mt-1' : 'mt-1.5'} truncate`}
              style={{ textAlign: config.textAlign || 'left' }}
            >
              <span
                className={`inline-block font-medium text-slate-600 bg-slate-100 ${
                  isCompact ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-[11px]'
                } rounded`}
              >
                {config.customValueLabel || config.valueColumn}
              </span>
            </div>
          )}
          {config.chartNote && (
            <p className="text-[10px] text-slate-500 mt-1 italic">{config.chartNote}</p>
          )}

          {/* Quick Format Chips on KPI Widget */}
          {onQuickFormat && !isCompact && (
            <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-slate-400 font-medium mr-1">ด่วน:</span>
              {quickPresets.map((p) => {
                const isCurrent = config.prefix === p.prefix && config.suffix === p.suffix;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickFormat(p.prefix, p.suffix);
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* คำนวณจาก ... แถว: ปิดเป็นค่าเริ่มต้น (default: false) และเปิดได้เฉพาะเมื่อเปิดสวิตช์ */}
      {config.showRowCount && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>คำนวณจาก {records.length.toLocaleString('th-TH')} แถว</span>
          <div className="flex items-center gap-1">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: theme.primary }}
            />
            <span className="text-slate-600 font-medium">Active</span>
          </div>
        </div>
      )}
    </div>
  );
};
