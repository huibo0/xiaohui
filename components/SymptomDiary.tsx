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

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getToday(): string {
  return formatDate(new Date());
}

async function fetchEntry(date: string): Promise<SymptomEntry | null> {
  try {
    const res = await fetch(`/api/symptoms?date=${date}`);
    if (res.ok) {
      const data = await res.json();
      if (data.date) return data;
    }
  } catch {}
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(`xiaohui_symptom_${date}`);
  return saved ? JSON.parse(saved) : null;
}

async function postEntry(entry: SymptomEntry): Promise<boolean> {
  try {
    const res = await fetch('/api/symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    return res.ok;
  } catch {
    localStorage.setItem(`xiaohui_symptom_${entry.date}`, JSON.stringify(entry));
    return true;
  }
}

async function fetchHistory(days: number): Promise<SymptomEntry[]> {
  try {
    const res = await fetch(`/api/symptoms?history=${days}`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

const MOOD_EMOJIS = ['😢', '😟', '😐', '🙂', '😊'];

function getPainLevel(v: number): { label: string; color: string } {
  if (v === 0) return { label: '无', color: '#10b981' };
  if (v <= 20) return { label: '轻微', color: '#84cc16' };
  if (v <= 40) return { label: '中轻', color: '#eab308' };
  if (v <= 60) return { label: '中等', color: '#f97316' };
  if (v <= 80) return { label: '较重', color: '#ef4444' };
  return { label: '严重', color: '#dc2626' };
}

function PainSlider({ label, emoji, value, onChange, trackColor }: {
  label: string; emoji: string; value: number; onChange: (v: number) => void; trackColor: string;
}) {
  const level = getPainLevel(value);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{emoji} {label}</span>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tabular-nums" style={{ color: level.color }}>{value}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: level.color + '18', color: level.color }}>
            {level.label}
          </span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range" min="0" max="100" value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, ${trackColor} ${value}%, #e5e7eb ${value}%)` }}
        />
        <div className="flex justify-between mt-1 px-0.5">
          <span className="text-[10px] text-gray-300">0</span>
          <span className="text-[10px] text-gray-300">50</span>
          <span className="text-[10px] text-gray-300">100</span>
        </div>
      </div>
    </div>
  );
}

// ========== Trend Chart Tooltip ==========
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

const RANGES = [
  { label: '7天', days: 7 },
  { label: '14天', days: 14 },
  { label: '30天', days: 30 },
  { label: '90天', days: 90 },
];

export default function SymptomDiary() {
  const [entry, setEntry] = useState<SymptomEntry>({
    date: '', wrist_stiffness: 0, left_pain: 0, right_pain: 0, mood: 3, notes: '',
  });
  const [saved, setSaved] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getToday());

  // Trend state
  const [showTrend, setShowTrend] = useState(false);
  const [history, setHistory] = useState<SymptomEntry[]>([]);
  const [range, setRange] = useState(30);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    fetchEntry(selectedDate).then((existing) => {
      if (existing) setEntry(existing);
      else setEntry({ date: selectedDate, wrist_stiffness: 0, left_pain: 0, right_pain: 0, mood: 3, notes: '' });
    });
  }, [selectedDate]);

  // Load trend data when opening or changing range
  useEffect(() => {
    if (!showTrend) return;
    setTrendLoading(true);
    fetchHistory(range).then((data) => {
      setHistory(data);
      setTrendLoading(false);
    });
  }, [showTrend, range]);

  const handleSave = async () => {
    const toSave = { ...entry, date: selectedDate };
    const ok = await postEntry(toSave);
    if (ok) {
      setEntry(toSave);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      // Refresh trend if visible
      if (showTrend) fetchHistory(range).then(setHistory);
    }
  };

  const goDate = (offset: number) => {
    const d = new Date(selectedDate + 'T12:00:00'); // Use noon to avoid timezone edge cases
    d.setDate(d.getDate() + offset);
    const newDate = formatDate(d);
    if (newDate <= getToday()) setSelectedDate(newDate);
  };

  const isToday = selectedDate === getToday();
  const dateObj = new Date(selectedDate + 'T00:00:00');
  const dateLabel = isToday ? '今天' : `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

  // Chart data
  const chartData = history.map((h) => {
    const d = new Date(h.date + 'T00:00:00');
    return {
      date: h.date,
      dateLabel: `${d.getMonth() + 1}/${d.getDate()}`,
      手腕僵直: h.wrist_stiffness,
      左手疼痛: h.left_pain,
      右手疼痛: h.right_pain,
    };
  });

  const avg = history.length > 0 ? {
    wrist: Math.round(history.reduce((s, h) => s + h.wrist_stiffness, 0) / history.length),
    left: Math.round(history.reduce((s, h) => s + h.left_pain, 0) / history.length),
    right: Math.round(history.reduce((s, h) => s + h.right_pain, 0) / history.length),
  } : null;

  return (
    <div className="space-y-4">
      {/* Date Selector */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
        <div className="flex items-center justify-between">
          <button onClick={() => goDate(-1)} className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-50">
            ← 前一天
          </button>
          <div className="text-center">
            <div className="font-semibold text-gray-800">{dateLabel}</div>
            <div className="text-xs text-gray-400">{selectedDate}</div>
          </div>
          <button
            onClick={() => goDate(1)} disabled={isToday}
            className={`p-2 rounded-xl ${isToday ? 'text-gray-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            后一天 →
          </button>
        </div>
      </div>

      {/* Symptom Record */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h2 className="font-semibold text-gray-800 mb-5">{isToday ? '今天感觉怎么样？' : `${dateLabel}的记录`}</h2>
        <div className="space-y-6">
          <PainSlider label="手腕僵直" emoji="🤚" value={entry.wrist_stiffness}
            onChange={(v) => setEntry({ ...entry, wrist_stiffness: v })} trackColor="#f59e0b" />
          <PainSlider label="左手指节疼痛" emoji="👈" value={entry.left_pain}
            onChange={(v) => setEntry({ ...entry, left_pain: v })} trackColor="#ef4444" />
          <PainSlider label="右手指节疼痛" emoji="👉" value={entry.right_pain}
            onChange={(v) => setEntry({ ...entry, right_pain: v })} trackColor="#8b5cf6" />

          {/* Mood */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">💗 心情</span>
            <div className="flex justify-between px-2">
              {MOOD_EMOJIS.map((emoji, i) => (
                <button key={i} onClick={() => setEntry({ ...entry, mood: i + 1 })}
                  className={`text-2xl p-2 rounded-xl transition-all ${
                    entry.mood === i + 1 ? 'bg-pink-100 scale-125 shadow-sm' : 'opacity-40 hover:opacity-70'
                  }`}
                >{emoji}</button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <span className="text-sm font-medium text-gray-700">📝 备注</span>
            <textarea value={entry.notes}
              onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
              placeholder="今天有什么特别的感受想记录..."
              className="w-full mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:border-pink-200 focus:ring-1 focus:ring-pink-100"
              rows={3}
            />
          </div>
        </div>

        <button onClick={handleSave}
          className={`w-full mt-4 py-3 rounded-xl font-medium text-sm transition-all ${
            saved ? 'bg-green-100 text-green-600' : 'bg-pink-400 hover:bg-pink-500 text-white active:scale-[0.98]'
          }`}
        >
          {saved ? '✓ 保存成功啦' : '保存记录'}
        </button>
      </div>

      {/* Quick Summary */}
      {(entry.wrist_stiffness > 0 || entry.left_pain > 0 || entry.right_pain > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-pink-50 rounded-2xl p-4 border border-amber-100">
          <div className="text-sm text-gray-600 mb-2 font-medium">{dateLabel}概览</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold" style={{ color: getPainLevel(entry.wrist_stiffness).color }}>{entry.wrist_stiffness}</div>
              <div className="text-xs text-gray-400">手腕僵直</div>
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: getPainLevel(entry.left_pain).color }}>{entry.left_pain}</div>
              <div className="text-xs text-gray-400">左手疼痛</div>
            </div>
            <div>
              <div className="text-lg font-bold" style={{ color: getPainLevel(entry.right_pain).color }}>{entry.right_pain}</div>
              <div className="text-xs text-gray-400">右手疼痛</div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Trend Section ==================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-pink-50 overflow-hidden">
        <button
          onClick={() => setShowTrend(!showTrend)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <div className="text-left">
              <h3 className="font-medium text-gray-700 text-sm">查看症状趋势</h3>
              <p className="text-xs text-gray-400">折线图 · 统计 · 复诊可用</p>
            </div>
          </div>
          <span className={`text-gray-300 transition-transform ${showTrend ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {showTrend && (
          <div className="px-4 pb-4 space-y-4">
            {/* Range Selector */}
            <div className="flex gap-2">
              {RANGES.map((r) => (
                <button key={r.days} onClick={() => setRange(r.days)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    range === r.days ? 'bg-pink-100 text-pink-600 font-medium' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >{r.label}</button>
              ))}
              <span className="text-xs text-gray-300 ml-auto self-center">{history.length} 条</span>
            </div>

            {/* Chart */}
            {trendLoading ? (
              <div className="text-sm text-gray-400 text-center py-8">加载中...</div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <span className="text-3xl mb-2">📝</span>
                <span className="text-sm text-gray-400">还没有记录数据</span>
              </div>
            ) : (
              <>
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                      <Line type="monotone" dataKey="手腕僵直" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="左手疼痛" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="右手疼痛" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Averages */}
                {avg && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-amber-500">{avg.wrist}</div>
                      <div className="text-[10px] text-gray-500 mt-1">僵直均值</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-red-500">{avg.left}</div>
                      <div className="text-[10px] text-gray-500 mt-1">左手均值</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-purple-500">{avg.right}</div>
                      <div className="text-[10px] text-gray-500 mt-1">右手均值</div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Doctor tip */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-gray-500 leading-relaxed">
                🏥 复诊时截图这个趋势图给医生看，比口头描述更准确。
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          💡 <strong>小贴士：</strong>每天记录症状可以帮助医生更好地了解病情变化，也有助于发现自己的症状规律。
        </p>
      </div>
    </div>
  );
}
