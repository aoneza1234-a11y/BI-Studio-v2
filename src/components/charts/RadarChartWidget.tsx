import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { WidgetConfig } from '../../types';
import { aggregateWidgetData, THEME_PALETTES } from '../../utils/aggregateData';

interface RadarChartWidgetProps {
  config: WidgetConfig;
  records: Record<string, any>[];
}

export const RadarChartWidget: React.FC<RadarChartWidgetProps> = ({ config, records }) => {
  const { chartData } = aggregateWidgetData(records, config);
  const theme = THEME_PALETTES[config.colorTheme || 'blue'] || THEME_PALETTES.blue;

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>ไม่มีข้อมูลสำหรับแสดงกราฟเรดาร์ (ใยแมงมุม)</p>
        <p className="text-xs text-slate-500 mt-1">โปรดเลือกหัวข้อกลุ่มข้อมูลและค่าตัวเลข</p>
      </div>
    );
  }

  const primaryLabel = config.valueColumn || 'คะแนน/มูลค่า';

  return (
    <div
      className="w-full flex-1 min-h-[180px] pt-1 flex flex-col justify-between"
      style={{ fontFamily: config.fontFamily || undefined }}
    >
      <div className="w-full flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 'auto']}
              tick={{ fontSize: 9, fill: '#94a3b8' }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700">
                      <p className="font-semibold text-slate-200 mb-1">{item.name}</p>
                      <p className="flex justify-between gap-4 text-cyan-400 font-medium">
                        <span>{primaryLabel}:</span>
                        <span>{item.formattedValue}</span>
                      </p>
                      {item.count !== undefined && (
                        <p className="text-slate-400 mt-0.5">รวม {item.count} รายการ</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Radar
              name={primaryLabel}
              dataKey="value"
              stroke={theme.primary}
              fill={theme.primary}
              fillOpacity={0.45}
            />
            {config.secondaryValueColumn && (
              <Radar
                name={config.secondaryValueColumn}
                dataKey="secondaryValue"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.35}
              />
            )}
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {config.chartNote && (
        <div className="mt-1 text-[11px] text-slate-500 text-center italic">
          {config.chartNote}
        </div>
      )}
    </div>
  );
};
