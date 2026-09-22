import React from 'react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Tooltip,
  Legend,
} from 'recharts';
import { WidgetConfig } from '../../types';
import { aggregateWidgetData, getWidgetColorForCategory } from '../../utils/aggregateData';

interface RadialGaugeWidgetProps {
  config: WidgetConfig;
  records: Record<string, any>[];
}

export const RadialGaugeWidget: React.FC<RadialGaugeWidgetProps> = ({ config, records }) => {
  const { chartData } = aggregateWidgetData(records, config);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
        <p>ไม่มีข้อมูลสำหรับแสดงมาตรวัดวงกลม</p>
        <p className="text-xs text-slate-500 mt-1">โปรดเลือกหัวข้อกลุ่มข้อมูลและค่าตัวเลข</p>
      </div>
    );
  }

  // Top 7 items for clear concentric rings
  const ringData = chartData.slice(0, 7).map((item, index) => ({
    ...item,
    fill: getWidgetColorForCategory(item.name, index, config),
  }));

  return (
    <div
      className="w-full flex-1 min-h-[180px] pt-1 flex flex-col justify-between"
      style={{ fontFamily: config.fontFamily || undefined }}
    >
      <div className="w-full flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="90%"
            barSize={12}
            data={ringData}
          >
            <RadialBar
              background={{ fill: '#f1f5f9' }}
              dataKey="value"
              cornerRadius={6}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const meaning = config.categoryColorMeanings?.[item.name];
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-700">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                        <p className="font-semibold text-slate-200">{item.name}</p>
                      </div>
                      <p className="text-emerald-400 font-medium">
                        {config.valueColumn || 'ค่า'}: {item.formattedValue}
                      </p>
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
              iconSize={10}
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
          </RadialBarChart>
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
