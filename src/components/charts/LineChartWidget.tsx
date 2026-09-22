import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { WidgetConfig, FilterState } from '../../types';
import { aggregateWidgetData, THEME_PALETTES } from '../../utils/aggregateData';

interface LineChartWidgetProps {
  config: WidgetConfig;
  records: Record<string, any>[];
  onCrossFilter?: (column?: string, value?: string) => void;
  activeFilters?: FilterState;
}

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({
  config,
  records,
  onCrossFilter,
  activeFilters,
}) => {
  const { chartData } = aggregateWidgetData(records, config);
  const theme = THEME_PALETTES[config.colorTheme || 'teal'] || THEME_PALETTES.teal;
  const isArea = config.type === 'area';

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>ไม่มีข้อมูลสำหรับแสดงกราฟเส้น</p>
        <p className="text-xs text-slate-500 mt-1">โปรดเลือกหัวข้อวันที่หรือข้อมูลแกน X</p>
      </div>
    );
  }

  const ChartComponent = isArea ? AreaChart : LineChart;

  return (
    <div
      className="w-full flex-1 min-h-0 pt-1"
      style={{ fontFamily: config.fontFamily || undefined }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
          style={{ cursor: config.categoryColumn ? 'pointer' : 'default' }}
          onClick={(e: any) => {
            if (e && e.activePayload && e.activePayload.length && config.categoryColumn && onCrossFilter) {
              onCrossFilter(config.categoryColumn, e.activePayload[0].payload.name);
            }
          }}
        >
          <defs>
            <linearGradient id={`grad-${config.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.primary} stopOpacity={0.4} />
              <stop offset="95%" stopColor={theme.primary} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id={`grad-sec-${config.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.secondary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={theme.secondary} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          {config.showGrid !== false && (
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          )}
          <XAxis
            dataKey="name"
            hide={config.showXAxis === false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={45}
            label={
              config.xAxisLabel
                ? { value: config.xAxisLabel, position: 'insideBottom', offset: -10, fontSize: 11, fill: '#475569' }
                : undefined
            }
          />
          <YAxis
            hide={config.showYAxis === false}
            tick={{ fontSize: 11, fill: '#64748b' }}
            label={
              config.yAxisLabel
                ? { value: config.yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#475569' }
                : undefined
            }
            tickFormatter={(val) => {
              if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
              if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
              return val;
            }}
          />
          {config.showTooltip !== false && (
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const meaning = config.categoryColorMeanings?.[item.name];
                  const labelText = config.customValueLabel || (config.showValueLabel !== false ? (config.valueColumn || 'ค่า') : '');
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700">
                      <p className="font-semibold mb-1 text-slate-200">{item.name}</p>
                      <p className="flex justify-between gap-4 text-teal-400 font-medium">
                        {labelText ? <span>{labelText}:</span> : <span />}
                        <span>{item.formattedValue}</span>
                      </p>
                      {config.secondaryValueColumn && item.secondaryValue !== undefined && (
                        <p className="flex justify-between gap-4 text-cyan-300 font-medium mt-1">
                          <span>{config.secondaryValueColumn}:</span>
                          <span>{item.secondaryValue.toLocaleString('th-TH')}</span>
                        </p>
                      )}
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
              verticalAlign={config.legendPosition === 'bottom' ? 'bottom' : 'top'}
              align="right"
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
            />
          )}
          {isArea ? (
            <>
              <Area
                type="monotone"
                name={config.customValueLabel || (config.showValueLabel !== false ? (config.valueColumn || 'ค่า') : 'ข้อมูล')}
                dataKey="value"
                stroke={theme.primary}
                strokeWidth={2.5}
                fill={`url(#grad-${config.id})`}
              />
              {config.secondaryValueColumn && (
                <Area
                  type="monotone"
                  name={config.secondaryValueColumn}
                  dataKey="secondaryValue"
                  stroke={theme.secondary}
                  strokeWidth={2}
                  fill={`url(#grad-sec-${config.id})`}
                />
              )}
            </>
          ) : (
            <>
              <Line
                type="monotone"
                name={config.customValueLabel || (config.showValueLabel !== false ? (config.valueColumn || 'ค่า') : 'ข้อมูล')}
                dataKey="value"
                stroke={theme.primary}
                strokeWidth={2.5}
                dot={{ r: 3, fill: theme.primary }}
                activeDot={{ r: 6 }}
              />
              {config.secondaryValueColumn && (
                <Line
                  type="monotone"
                  name={config.secondaryValueColumn}
                  dataKey="secondaryValue"
                  stroke={theme.secondary}
                  strokeWidth={2}
                  dot={{ r: 3, fill: theme.secondary }}
                />
              )}
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {config.chartNote && (
        <div className="mt-1 text-[10px] text-slate-400 text-center italic">
          {config.chartNote}
        </div>
      )}
    </div>
  );
};
