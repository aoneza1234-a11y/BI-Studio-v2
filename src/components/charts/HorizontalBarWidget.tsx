import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LabelList,
} from 'recharts';
import { WidgetConfig, FilterState } from '../../types';
import { aggregateWidgetData, getWidgetColorForCategory, THEME_PALETTES } from '../../utils/aggregateData';

interface HorizontalBarWidgetProps {
  config: WidgetConfig;
  records: Record<string, any>[];
  onCrossFilter?: (column?: string, value?: string) => void;
  activeFilters?: FilterState;
}

export const HorizontalBarWidget: React.FC<HorizontalBarWidgetProps> = ({
  config,
  records,
  onCrossFilter,
  activeFilters,
}) => {
  const { chartData } = aggregateWidgetData(records, config);
  const theme = THEME_PALETTES[config.colorTheme || 'blue'] || THEME_PALETTES.blue;

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>ไม่มีข้อมูลสำหรับแสดงกราฟแท่งแนวนอน</p>
        <p className="text-xs text-slate-500 mt-1">โปรดเลือกหัวข้อกลุ่มข้อมูลและค่าตัวเลข</p>
      </div>
    );
  }

  // Reverse so top values start from top
  const displayData = [...chartData].reverse();

  return (
    <div
      className="w-full flex-1 min-h-0 pt-1 flex flex-col justify-between"
      style={{ fontFamily: config.fontFamily || undefined }}
    >
      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={displayData}
            margin={{ top: 10, right: 35, left: 10, bottom: 10 }}
          >
            {config.showGrid !== false && (
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            )}
            <XAxis
              type="number"
              hide={config.showXAxis === false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              hide={config.showYAxis === false}
              width={85}
              tick={{ fontSize: 11, fill: '#475569' }}
            />
            {config.showTooltip !== false && (
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const itemColor = getWidgetColorForCategory(item.name, 0, config);
                    const meaning = config.categoryColorMeanings?.[item.name];
                    const labelText = config.customValueLabel || (config.showValueLabel !== false ? (config.valueColumn || 'ค่า') : '');
                    return (
                      <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
                          <p className="font-semibold text-slate-200">{item.name}</p>
                        </div>
                        <p className="flex justify-between gap-4 text-emerald-400 font-medium">
                          {labelText ? <span>{labelText}:</span> : <span />}
                          <span>{item.formattedValue}</span>
                        </p>
                        {meaning && (
                          <p className="text-amber-300 text-[11px] mt-1 pt-1 border-t border-slate-800">
                            ความหมาย: {meaning}
                          </p>
                        )}
                        {config.showRowCount && item.count !== undefined && (
                          <p className="text-slate-400 mt-0.5">รวม {item.count} รายการ</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            )}
            {config.showLegend && (
              <Legend
                verticalAlign={config.legendPosition === 'top' ? 'top' : 'bottom'}
                align="center"
                wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
              />
            )}
            <Bar
              name={config.customValueLabel || (config.showValueLabel !== false ? (config.valueColumn || 'ค่า') : 'ข้อมูล')}
              dataKey="value"
              fill={theme.primary}
              radius={[0, 4, 4, 0]}
              maxBarSize={32}
            >
              {config.showDataLabels && (
                <LabelList
                  dataKey="formattedValue"
                  position={config.dataLabelPosition === 'inside' ? 'inside' : 'right'}
                  style={{ fontSize: '10px', fill: '#475569', fontWeight: 600 }}
                />
              )}
              {displayData.map((entry, index) => {
                const isSelected = Boolean(
                  config.categoryColumn &&
                  activeFilters?.categoryFilters?.[config.categoryColumn] === entry.name
                );
                const hasColFilter = Boolean(
                  config.categoryColumn &&
                  activeFilters?.categoryFilters?.[config.categoryColumn] &&
                  activeFilters.categoryFilters[config.categoryColumn] !== '__all__'
                );

                return (
                  <Cell
                    key={`hbar-cell-${index}`}
                    fill={getWidgetColorForCategory(entry.name, index, config)}
                    fillOpacity={hasColFilter ? (isSelected ? 1.0 : 0.35) : 1.0}
                    stroke={isSelected ? '#1d4ed8' : undefined}
                    strokeWidth={isSelected ? 2.5 : 0}
                    style={{ cursor: config.categoryColumn ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (config.categoryColumn && onCrossFilter) {
                        onCrossFilter(config.categoryColumn, entry.name);
                      }
                    }}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Color Meanings Legend Box ("สีนี้หมายถึงอะไร") */}
      {config.categoryColorMeanings && Object.keys(config.categoryColorMeanings).length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
          <span className="font-bold text-slate-600">ความหมายของสี:</span>
          {Object.entries(config.categoryColorMeanings).map(([cat, meaning], idx) => {
            const color = getWidgetColorForCategory(cat, idx, config);
            return (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <strong className="font-semibold">{cat}:</strong> {meaning}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
