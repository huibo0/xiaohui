'use client';

import { useState, useEffect } from 'react';

interface SymptomEntry {
  date: string;
  stiffness: number;
  pain: number;
  fatigue: number;
  mood: number;
  notes: string;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

async function fetchEntry(date: string): Promise<SymptomEntry | null> {
  try {
    const res = await fetch(`/api/symptoms?date=${date}`);
    if (res.ok) {
      const data = await res.json();
      if (data.date) return data;
    }
  } catch {}
  // fallback to localStorage
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
    // fallback: save to localStorage
    localStorage.setItem(`xiaohui_symptom_${entry.date}`, JSON.stringify(entry));
    return true;
  }
}

async function fetchHistory(days: number = 14): Promise<SymptomEntry[]> {
  try {
    const res = await fetch(`/api/symptoms?history=${days}`);
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

const MOOD_EMOJIS = ['😢', '😟', '😐', '🙂', '😊'];

function SliderField({ label, emoji, value, onChange, color }: {
  label: string; emoji: string; value: number; onChange: (v: number) => void; color: string;
}) {
  const getLabel = (v: number) => {
    if (v === 0) return '无';
    if (v <= 3) return '轻微';
    if (v <= 6) return '中等';
    if (v <= 8) return '较重';
    return '严重';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{emoji} {label}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '20', color }}>
          {value}/10 · {getLabel(value)}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ background: `linear-gradient(to right, ${color} ${value * 10}%, #e5e7eb ${value * 10}%)` }}
      />
    </div>
  );
}

export default function SymptomDiary() {
  const [entry, setEntry] = useState<SymptomEntry>({
    date: '', stiffness: 0, pain: 0, fatigue: 0, mood: 3, notes: '',
  });
  const [history, setHistory] = useState<SymptomEntry[]>([]);
  const [saved, setSaved] = useState(false);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const today = getToday();
    fetchEntry(today).then((existing) => {
      if (existing) setEntry(existing);
      else setEntry((e) => ({ ...e, date: today }));
    });
    fetchHistory(14).then(setHistory);
  }, []);

  const handleSave = async () => {
    const toSave = { ...entry, date: getToday() };
    const ok = await postEntry(toSave);
    if (ok) {
      setEntry(toSave);
      fetchHistory(14).then(setHistory);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Today's Record */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">今天感觉怎么样？</h2>
          <span className="text-xs text-gray-400">{getToday()}</span>
        </div>

        <div className="space-y-5">
          <SliderField
            label="手腕僵直" emoji="🤚" value={entry.stiffness}
            onChange={(v) => setEntry({ ...entry, stiffness: v })}
            color="#f59e0b"
          />
          <SliderField
            label="手腕疼痛" emoji="💫" value={entry.pain}
            onChange={(v) => setEntry({ ...entry, pain: v })}
            color="#ef4444"
          />
          <SliderField
            label="疲劳程度" emoji="😴" value={entry.fatigue}
            onChange={(v) => setEntry({ ...entry, fatigue: v })}
            color="#8b5cf6"
          />

          {/* Mood */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">💗 今天心情</span>
            <div className="flex justify-between px-2">
              {MOOD_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => setEntry({ ...entry, mood: i + 1 })}
                  className={`text-2xl p-2 rounded-xl transition-all ${
                    entry.mood === i + 1
                      ? 'bg-pink-100 scale-125 shadow-sm'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <span className="text-sm font-medium text-gray-700">📝 备注（可选）</span>
            <textarea
              value={entry.notes}
              onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
              placeholder="今天有什么特别的感受想记录..."
              className="w-full mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:border-pink-200 focus:ring-1 focus:ring-pink-100"
              rows={3}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full mt-4 py-3 rounded-xl font-medium text-sm transition-all ${
            saved
              ? 'bg-green-100 text-green-600'
              : 'bg-pink-400 hover:bg-pink-500 text-white active:scale-[0.98]'
          }`}
        >
          {saved ? '✓ 保存成功啦' : '保存今天的记录'}
        </button>
      </div>

      {/* History Chart Toggle */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <button
          onClick={() => setShowChart(!showChart)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-medium text-gray-700 text-sm">📊 最近趋势</h3>
          <span className="text-xs text-gray-400">{showChart ? '收起' : '展开'}</span>
        </button>

        {showChart && (
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">还没有记录，开始记录今天的感受吧</p>
            ) : (
              <div className="space-y-2">
                {/* Simple bar chart */}
                <div className="text-xs text-gray-400 mb-2">最近 {history.length} 天的变化</div>
                {history.slice(-7).map((h, i) => {
                  const d = new Date(h.date + 'T00:00:00');
                  const label = `${d.getMonth() + 1}/${d.getDate()}`;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-10 text-gray-400 text-right">{label}</span>
                      <div className="flex-1 flex gap-1 items-center">
                        <div className="h-3 rounded-full bg-yellow-300" style={{ width: `${h.stiffness * 10}%`, minWidth: h.stiffness ? '4px' : 0 }} title={`僵直:${h.stiffness}`} />
                      </div>
                      <div className="flex-1 flex gap-1 items-center">
                        <div className="h-3 rounded-full bg-red-300" style={{ width: `${h.pain * 10}%`, minWidth: h.pain ? '4px' : 0 }} title={`疼痛:${h.pain}`} />
                      </div>
                      <span className="w-6 text-center">{MOOD_EMOJIS[(h.mood || 3) - 1]}</span>
                    </div>
                  );
                })}
                <div className="flex gap-4 mt-2 text-xs text-gray-400 justify-center">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-300" /> 僵直</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-300" /> 疼痛</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tip */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          💡 <strong>小贴士：</strong>每天记录症状可以帮助医生更好地了解病情变化。复诊的时候可以把趋势图给医生看哦。
        </p>
      </div>
    </div>
  );
}
