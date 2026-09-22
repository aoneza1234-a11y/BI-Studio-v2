import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { WidgetConfig, FilterState } from '../../types';
import { aggregateWidgetData, getWidgetColorForCategory } from '../../utils/aggregateData';

interface PieChartWidgetProps {
  config: WidgetConfig;
  records: Record<string, any>[];
  onCrossFilter?: (column?: string, value?: string) => void;
  activeFilters?: FilterState;
}

export const PieChartWidget: React.FC<PieChartWidgetProps> = ({
  config,
  records,
  onCrossFilter,
  activeFilters,
}) => {
  const { chartData } = aggregateWidgetData(records, config);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>ไม่มีข้อมูลสำหรับแสดงแผนภูมิวงกลม</p>
        <p className="text-xs text-slate-500 mt-1">โปรดเลือกหัวข้อกลุ่มข้อมูล</p>
      </div>
    );
  }

  const total = chartData.reduce((acc, c) => acc + c.value, 0);

  return (
    <div
      className="w-full flex-1 min-h-0 pt-1 flex flex-col justify-between"
      style={{ fontFamily: config.fontFamily || undefined }}
    >
      <div className="w-full flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 10, left: 10, bottom: 20 }}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              label={
                config.showDataLabels
                  ? ({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`
                  : undefined
              }
            >
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
                    key={`pie-cell-${index}`}
                    fill={getWidgetColorForCategory(entry.name, index, config)}
                    fillOpacity={hasColFilter ? (isSelected ? 1.0 : 0.35) : 1.0}
                    stroke={isSelected ? '#1d4ed8' : '#ffffff'}
                    strokeWidth={isSelected ? 3 : 1}
                    style={{ cursor: config.categoryColumn ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (config.categoryColumn && onCrossFilter) {
                        onCrossFilter(config.categoryColumn, entry.name);
                      }
                    }}
                  />
                );
              })}
            </Pie>
            {config.showTooltip !== false && (
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                    const itemColor = getWidgetColorForCategory(item.name, 0, config);
                    const meaning = config.categoryColorMeanings?.[item.name];
                    const labelText = config.customValueLabel || (config.showValueLabel !== false ? (config.valueColumn || 'ค่า') : '');
                    return (
                      <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
                          <p className="font-semibold text-slate-200">{item.name}</p>
                        </div>
                        <p className="text-blue-300 font-medium">
                          {labelText ? `${labelText}: ` : ''}{item.formattedValue}
                        </p>
                        <p className="text-slate-400 mt-0.5">คิดเป็น {percent}% ของทั้งหมด</p>
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
            {config.showLegend !== false && (
              <Legend
                verticalAlign={config.legendPosition === 'top' ? 'top' : 'bottom'}
                align="center"
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
            )}
          </PieChart>
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

      {config.chartNote && (
        <div className="mt-1 text-[10px] text-slate-400 text-center italic">
          {config.chartNote}
        </div>
      )}
    </div>
  );
};
