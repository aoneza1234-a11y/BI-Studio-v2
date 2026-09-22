import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
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

interface ComboChartWidgetProps {
  config: WidgetConfig;
  records: Record<string, any>[];
  onCrossFilter?: (column?: string, value?: string) => void;
  activeFilters?: FilterState;
}

export const ComboChartWidget: React.FC<ComboChartWidgetProps> = ({
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
        <p>ไม่มีข้อมูลสำหรับแสดงกราฟผสม (แท่ง + เส้น)</p>
        <p className="text-xs text-slate-500 mt-1">โปรดเลือกหัวข้อกลุ่มข้อมูลและค่าตัวเลข</p>
      </div>
    );
  }

  const primaryLabel = config.valueColumn || 'มูลค่าแท่ง';
  const secondaryLabel = config.secondaryValueColumn || 'เส้นเฉลี่ย/เป้าหมาย';

  return (
    <div
      className="w-full flex-1 min-h-[180px] pt-1 flex flex-col justify-between"
      style={{ fontFamily: config.fontFamily || undefined }}
    >
      <div className="w-full flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
          >
            {config.showGrid !== false && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            )}
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={45}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              }}
            />
            {config.secondaryValueColumn && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                  return val;
                }}
              />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const itemColor = getWidgetColorForCategory(item.name, 0, config);
                  const meaning = config.categoryColorMeanings?.[item.name];
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
                        <p className="font-semibold text-slate-200">{item.name}</p>
                      </div>
                      <p className="flex justify-between gap-4 text-blue-400 font-medium">
                        <span>{primaryLabel} (แท่ง):</span>
                        <span>{item.formattedValue}</span>
                      </p>
                      {config.secondaryValueColumn && item.secondaryValue !== undefined && (
                        <p className="flex justify-between gap-4 text-amber-400 font-medium mt-1">
                          <span>{secondaryLabel} (เส้น):</span>
                          <span>{item.secondaryValue.toLocaleString('th-TH')}</span>
                        </p>
                      )}
                      {meaning && (
                        <p className="text-amber-300 text-[11px] mt-1 pt-1 border-t border-slate-800">
                          ความหมาย: {meaning}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />
            <Bar
              yAxisId="left"
              name={primaryLabel}
              dataKey="value"
              fill={theme.primary}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            >
              {config.showDataLabels && (
                <LabelList
                  dataKey="formattedValue"
                  position="top"
                  style={{ fontSize: '10px', fill: '#475569', fontWeight: 600 }}
                />
              )}
              {chartData.map((entry, index) => {
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
                    key={`combo-cell-${index}`}
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
            <Line
              yAxisId={config.secondaryValueColumn ? 'right' : 'left'}
              name={secondaryLabel}
              type="monotone"
              dataKey={config.secondaryValueColumn ? 'secondaryValue' : 'value'}
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Color Meanings Legend Box */}
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
