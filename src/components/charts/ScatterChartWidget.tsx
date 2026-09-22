import React from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { WidgetConfig } from '../../types';
import { aggregateWidgetData, getWidgetColorForCategory, THEME_PALETTES } from '../../utils/aggregateData';

interface ScatterChartWidgetProps {
  config: WidgetConfig;
  records: Record<string, any>[];
}

export const ScatterChartWidget: React.FC<ScatterChartWidgetProps> = ({ config, records }) => {
  const { chartData } = aggregateWidgetData(records, config);
  const theme = THEME_PALETTES[config.colorTheme || 'blue'] || THEME_PALETTES.blue;

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>ไม่มีข้อมูลสำหรับแสดงกราฟจุดกระจาย (Scatter)</p>
        <p className="text-xs text-slate-500 mt-1">โปรดเลือกหัวข้อกลุ่มข้อมูลและค่าตัวเลข</p>
      </div>
    );
  }

  // Map to x (index or count), y (value), z (secondary or 100)
  const scatterPoints = chartData.map((d, i) => ({
    x: i + 1,
    y: d.value,
    z: d.secondaryValue || d.count || 50,
    name: d.name,
    formattedValue: d.formattedValue,
    fill: getWidgetColorForCategory(d.name, i, config),
  }));

  return (
    <div
      className="w-full flex-1 min-h-[180px] pt-1 flex flex-col justify-between"
      style={{ fontFamily: config.fontFamily || undefined }}
    >
      <div className="w-full flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            {config.showGrid !== false && (
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            )}
            <XAxis
              type="number"
              dataKey="x"
              name="ลำดับ"
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => {
                const pt = scatterPoints[val - 1];
                return pt ? (pt.name.length > 8 ? `${pt.name.slice(0, 8)}...` : pt.name) : val;
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={config.valueColumn || 'ค่า'}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              }}
            />
            <ZAxis type="number" dataKey="z" range={[50, 400]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700">
                      <p className="font-semibold text-slate-200 mb-1">{pt.name}</p>
                      <p className="text-emerald-400 font-medium">
                        {config.valueColumn || 'ค่า'}: {pt.formattedValue}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name={config.title} data={scatterPoints} fill={theme.primary} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
