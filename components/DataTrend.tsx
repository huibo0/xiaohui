'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SymptomEntry {
  date: string;
  wrist_stiffness: number;
  left_pain: number;
  right_pain: number;
  mood: number;
  notes: string;
}

async function fetchHistory(days: number): Promise<SymptomEntry[]> {
  try {
    const res = await fetch(`/api/symptoms?history=${days}`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

const RANGES = [
  { label: '7天', days: 7 },
  { label: '14天', days: 14 },
  { label: '30天', days: 30 },
  { label: '90天', days: 90 },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = new Date(label + 'T00:00:00');
  const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
  return (
    <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 text-xs">
      <div className="font-medium text-gray-700 mb-1.5">{dateStr}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold" style={{ color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DataTrend() {
  const [history, setHistory] = useState<SymptomEntry[]>([]);
  const [range, setRange] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchHistory(range).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [range]);

  // Format data for chart
  const chartData = history.map((h) => {
    const d = new Date(h.date + 'T00:00:00');
    return {
      date: h.date,
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      手腕僵直: h.wrist_stiffness,
      左手疼痛: h.left_pain,
      右手疼痛: h.right_pain,
      心情: h.mood * 20, // scale 1-5 to 0-100 for comparison
    };
  });

  // Compute averages
  const avg = history.length > 0 ? {
    wrist: Math.round(history.reduce((s, h) => s + h.wrist_stiffness, 0) / history.length),
    left: Math.round(history.reduce((s, h) => s + h.left_pain, 0) / history.length),
    right: Math.round(history.reduce((s, h) => s + h.right_pain, 0) / history.length),
  } : null;

  // Find worst day
  const worst = history.length > 0 ? history.reduce((prev, curr) => {
    const prevMax = Math.max(prev.wrist_stiffness, prev.left_pain, prev.right_pain);
    const currMax = Math.max(curr.wrist_stiffness, curr.left_pain, curr.right_pain);
    return currMax > prevMax ? curr : prev;
  }) : null;

  return (
    <div className="space-y-4">
      {/* Range Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">📊 症状趋势</h2>
          <span className="text-xs text-gray-400">{history.length} 条记录</span>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                range === r.days
                  ? 'bg-pink-100 text-pink-600 font-medium'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="text-sm text-gray-400">加载中...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-3xl mb-2">📝</span>
            <span className="text-sm text-gray-400">还没有记录数据</span>
            <span className="text-xs text-gray-300 mt-1">去"日记"页面记录症状吧</span>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">疼痛程度变化 (0-100)</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Line
                    type="monotone" dataKey="手腕僵直" stroke="#f59e0b" strokeWidth={2}
                    dot={{ r: 3 }} activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone" dataKey="左手疼痛" stroke="#ef4444" strokeWidth={2}
                    dot={{ r: 3 }} activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone" dataKey="右手疼痛" stroke="#8b5cf6" strokeWidth={2}
                    dot={{ r: 3 }} activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {avg && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
          <h3 className="text-sm font-medium text-gray-700 mb-3">📈 统计摘要（近 {range} 天）</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-amber-500">{avg.wrist}</div>
              <div className="text-xs text-gray-500 mt-1">手腕僵直均值</div>
            </div>
            <div className="bg-red-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-red-500">{avg.left}</div>
              <div className="text-xs text-gray-500 mt-1">左手疼痛均值</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-purple-500">{avg.right}</div>
              <div className="text-xs text-gray-500 mt-1">右手疼痛均值</div>
            </div>
          </div>

          {worst && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl">
              <div className="text-xs text-gray-400">最不舒服的一天</div>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(worst.date + 'T00:00:00').getMonth() + 1}月{new Date(worst.date + 'T00:00:00').getDate()}日 —
                僵直 {worst.wrist_stiffness} / 左手 {worst.left_pain} / 右手 {worst.right_pain}
                {worst.notes && <span className="text-gray-400"> · {worst.notes}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tip for doctor visit */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          🏥 <strong>复诊小助手：</strong>截图这页的趋势图带去看医生，比口头描述更准确。可以切换到 30 天或 90 天视图，让医生看到完整的变化。
        </p>
      </div>
    </div>
  );
}
