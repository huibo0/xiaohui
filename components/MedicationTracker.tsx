'use client';

import { useState, useEffect } from 'react';

interface MedLog {
  date: string; // YYYY-MM-DD
  morning: { taken: boolean; time?: string };
  evening: { taken: boolean; time?: string };
}

interface MedConfig {
  name: string;
  nickname: string;
  color: string;
  colorHex: string;
  dosage: string;
  frequency: string;
  times: string[];
  withFood: string;
  notes: string;
}

const DEFAULT_MEDS: MedConfig[] = [
  {
    name: '羟氯喹',
    nickname: '小药丸',
    color: '待确认',
    colorHex: '#f472b6',
    dosage: '每次1片',
    frequency: '每天2次',
    times: ['08:00', '20:00'],
    withFood: '随餐或饭后服用，搭配牛奶更好',
    notes: '需定期做眼科检查',
  },
];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

// API helpers with localStorage fallback
async function fetchLog(date: string): Promise<MedLog> {
  try {
    const res = await fetch(`/api/meds?date=${date}`);
    if (res.ok) return await res.json();
  } catch {}
  // fallback to localStorage
  if (typeof window === 'undefined') return { date, morning: { taken: false }, evening: { taken: false } };
  const saved = localStorage.getItem(`xiaohui_med_${date}`);
  return saved ? JSON.parse(saved) : { date, morning: { taken: false }, evening: { taken: false } };
}

async function postMedAction(date: string, period: 'morning' | 'evening', action: 'take' | 'undo', time?: string): Promise<MedLog> {
  try {
    const res = await fetch('/api/meds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, period, action, time }),
    });
    if (res.ok) return await res.json();
  } catch {}
  // fallback: return current state (caller handles localStorage)
  return { date, morning: { taken: false }, evening: { taken: false } };
}

async function fetchWeekLogs(): Promise<{ date: string; morning: boolean; evening: boolean }[]> {
  try {
    const res = await fetch('/api/meds?week=1');
    if (res.ok) return await res.json();
  } catch {}
  // fallback
  const logs = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    logs.push({ date: dateStr, morning: false, evening: false });
  }
  return logs;
}

export default function MedicationTracker() {
  const [log, setLog] = useState<MedLog>({ date: '', morning: { taken: false }, evening: { taken: false } });
  const [weekLogs, setWeekLogs] = useState<{ date: string; morning: boolean; evening: boolean }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    fetchLog(getToday()).then(setLog);
    fetchWeekLogs().then(setWeekLogs);
    setCurrentTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const markTaken = async (period: 'morning' | 'evening') => {
    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    // Optimistic update
    setLog((prev) => ({ ...prev, date: getToday(), [period]: { taken: true, time: now } }));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
    // Sync to server
    const updated = await postMedAction(getToday(), period, 'take', now);
    if (updated.date) setLog(updated);
    fetchWeekLogs().then(setWeekLogs);
  };

  const undoTaken = async (period: 'morning' | 'evening') => {
    setLog((prev) => ({ ...prev, date: getToday(), [period]: { taken: false, time: undefined } }));
    const updated = await postMedAction(getToday(), period, 'undo');
    if (updated.date) setLog(updated);
    fetchWeekLogs().then(setWeekLogs);
  };

  const hour = new Date().getHours();
  const isMorningTime = hour >= 6 && hour < 14;
  const currentPeriod = isMorningTime ? 'morning' : 'evening';

  const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

  const med = DEFAULT_MEDS[0];

  const allDone = log.morning.taken && log.evening.taken;

  return (
    <div className="space-y-4">
      {/* Today Status Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50 relative overflow-hidden">
        {showConfetti && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span className="text-5xl check-animate">🎉</span>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-800 text-lg">今日吃药</h2>
            <p className="text-xs text-gray-400 mt-0.5">{currentTime}</p>
          </div>
          {allDone && (
            <span className="bg-green-50 text-green-600 text-xs font-medium px-3 py-1 rounded-full">
              今天全部完成啦 ✨
            </span>
          )}
        </div>

        {/* Medicine Info */}
        <div className="bg-pink-50/50 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="pill-icon" style={{ backgroundColor: med.colorHex + '30', color: med.colorHex }}>
              💊
            </div>
            <div>
              <p className="font-medium text-gray-700">{med.nickname}</p>
              <p className="text-xs text-gray-400">{med.name} · {med.dosage}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 pl-12">📋 {med.withFood}</p>
        </div>

        {/* Morning & Evening Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Morning */}
          <div className={`rounded-xl p-4 text-center transition-all ${
            log.morning.taken
              ? 'bg-green-50 border-2 border-green-200'
              : currentPeriod === 'morning'
                ? 'bg-warm-50 border-2 border-yellow-200 animate-pulse-soft'
                : 'bg-gray-50 border-2 border-gray-100'
          }`}>
            <div className="text-2xl mb-1">🌅</div>
            <p className="text-sm font-medium text-gray-700">早上</p>
            <p className="text-xs text-gray-400 mb-2">{med.times[0]}</p>
            {log.morning.taken ? (
              <div>
                <span className="text-green-500 text-sm font-medium check-animate">✓ 已吃</span>
                <p className="text-xs text-gray-400 mt-0.5">{log.morning.time}</p>
                <button onClick={() => undoTaken('morning')} className="text-xs text-gray-300 mt-1 underline">撤销</button>
              </div>
            ) : (
              <button
                onClick={() => markTaken('morning')}
                className="mt-1 bg-pink-400 hover:bg-pink-500 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors active:scale-95"
              >
                吃药啦
              </button>
            )}
          </div>

          {/* Evening */}
          <div className={`rounded-xl p-4 text-center transition-all ${
            log.evening.taken
              ? 'bg-green-50 border-2 border-green-200'
              : currentPeriod === 'evening'
                ? 'bg-lavender-50 border-2 border-purple-200 animate-pulse-soft'
                : 'bg-gray-50 border-2 border-gray-100'
          }`}>
            <div className="text-2xl mb-1">🌙</div>
            <p className="text-sm font-medium text-gray-700">晚上</p>
            <p className="text-xs text-gray-400 mb-2">{med.times[1]}</p>
            {log.evening.taken ? (
              <div>
                <span className="text-green-500 text-sm font-medium check-animate">✓ 已吃</span>
                <p className="text-xs text-gray-400 mt-0.5">{log.evening.time}</p>
                <button onClick={() => undoTaken('evening')} className="text-xs text-gray-300 mt-1 underline">撤销</button>
              </div>
            ) : (
              <button
                onClick={() => markTaken('evening')}
                className="mt-1 bg-purple-400 hover:bg-purple-500 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors active:scale-95"
              >
                吃药啦
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h3 className="font-medium text-gray-700 mb-3 text-sm">这周的坚持 💪</h3>
        <div className="flex justify-between">
          {weekLogs.map((day, i) => {
            const d = new Date(day.date + 'T00:00:00');
            const dayName = DAY_NAMES[d.getDay()];
            const isToday = day.date === getToday();
            const bothDone = day.morning && day.evening;
            const partial = day.morning || day.evening;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`text-xs ${isToday ? 'text-pink-500 font-semibold' : 'text-gray-400'}`}>
                  {dayName}
                </span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  bothDone
                    ? 'bg-green-100 text-green-500'
                    : partial
                      ? 'bg-yellow-100 text-yellow-500'
                      : isToday
                        ? 'bg-pink-50 text-pink-300 border-2 border-pink-200'
                        : 'bg-gray-50 text-gray-300'
                }`}>
                  {bothDone ? '✓' : partial ? '½' : isToday ? '·' : '·'}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 justify-center">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-200" /> 全部完成</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-200" /> 吃了一次</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200" /> 未吃</span>
        </div>
      </div>

      {/* Gentle Reminder */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 border border-pink-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          💡 <strong>小提醒：</strong>羟氯喹跟着饭一起吃，胃会更舒服。如果有任何不舒服的感觉（特别是眼睛方面），记得跟医生说哦。
        </p>
      </div>
    </div>
  );
}
