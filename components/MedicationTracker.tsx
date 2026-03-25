'use client';

import { useState, useEffect } from 'react';

interface MedLog {
  date: string;
  morning: { taken: boolean; time?: string };
  evening: { taken: boolean; time?: string };
}

interface MedSettings {
  pillNickname: string;
  pillColor: string;
  morningTime: string;
  eveningTime: string;
}

const DEFAULT_MED_SETTINGS: MedSettings = {
  pillNickname: '小药丸',
  pillColor: '#f472b6',
  morningTime: '08:00',
  eveningTime: '20:00',
};

function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function fetchLog(date: string): Promise<MedLog> {
  try {
    const res = await fetch(`/api/meds?date=${date}`);
    if (res.ok) return await res.json();
  } catch {}
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
  return { date, morning: { taken: false }, evening: { taken: false } };
}

async function fetchWeekLogs(): Promise<{ date: string; morning: boolean; evening: boolean }[]> {
  try {
    const res = await fetch('/api/meds?week=1');
    if (res.ok) return await res.json();
  } catch {}
  const logs = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    logs.push({ date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, morning: false, evening: false });
  }
  return logs;
}

async function fetchSettings(): Promise<MedSettings> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      return { ...DEFAULT_MED_SETTINGS, ...data };
    }
  } catch {}
  // fallback localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('xiaohui_settings');
    if (saved) {
      try { return { ...DEFAULT_MED_SETTINGS, ...JSON.parse(saved) }; } catch {}
    }
  }
  return DEFAULT_MED_SETTINGS;
}

export default function MedicationTracker() {
  const [log, setLog] = useState<MedLog>({ date: '', morning: { taken: false }, evening: { taken: false } });
  const [weekLogs, setWeekLogs] = useState<{ date: string; morning: boolean; evening: boolean }[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [medSettings, setMedSettings] = useState<MedSettings>(DEFAULT_MED_SETTINGS);
  const [confirmPeriod, setConfirmPeriod] = useState<'morning' | 'evening' | null>(null);

  useEffect(() => {
    fetchLog(getToday()).then(setLog);
    fetchWeekLogs().then(setWeekLogs);
    fetchSettings().then(setMedSettings);
    setCurrentTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 点"吃药啦"按钮 → 先弹确认喂奶弹窗
  const handleTakeClick = (period: 'morning' | 'evening') => {
    setConfirmPeriod(period);
  };

  // 确认已喂奶，提交吃药记录
  const confirmTaken = async () => {
    if (!confirmPeriod) return;
    const period = confirmPeriod;
    setConfirmPeriod(null);

    const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    setLog((prev) => ({ ...prev, date: getToday(), [period]: { taken: true, time: now } }));
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1500);
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
  const allDone = log.morning.taken && log.evening.taken;

  const { pillNickname, pillColor, morningTime, eveningTime } = medSettings;

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
            <div className="pill-icon" style={{ backgroundColor: pillColor + '30', color: pillColor }}>
              💊
            </div>
            <div>
              <p className="font-medium text-gray-700">{pillNickname}</p>
              <p className="text-xs text-gray-400">羟氯喹 · 每次2片</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 pl-12">📋 随餐或饭后服用，搭配牛奶更好</p>
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
            <p className="text-xs text-gray-400 mb-2">{morningTime}</p>
            {log.morning.taken ? (
              <div>
                <span className="text-green-500 text-sm font-medium check-animate">✓ 已吃</span>
                <p className="text-xs text-gray-400 mt-0.5">{log.morning.time}</p>
                <button onClick={() => undoTaken('morning')} className="text-xs text-gray-300 mt-1 underline">撤销</button>
              </div>
            ) : (
              <button
                onClick={() => handleTakeClick('morning')}
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
            <p className="text-xs text-gray-400 mb-2">{eveningTime}</p>
            {log.evening.taken ? (
              <div>
                <span className="text-green-500 text-sm font-medium check-animate">✓ 已吃</span>
                <p className="text-xs text-gray-400 mt-0.5">{log.evening.time}</p>
                <button onClick={() => undoTaken('evening')} className="text-xs text-gray-300 mt-1 underline">撤销</button>
              </div>
            ) : (
              <button
                onClick={() => handleTakeClick('evening')}
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
                  {bothDone ? '✓' : partial ? '½' : '·'}
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
          💡 <strong>小提醒：</strong>羟氯喹每次 2 片，跟着饭一起吃，胃会更舒服。搭配牛奶效果更好哦。如果有任何不舒服的感觉（特别是眼睛方面），记得跟医生说。
        </p>
      </div>

      {/* 喂奶确认弹窗 */}
      {confirmPeriod && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-3">🍼</div>
              <h3 className="font-semibold text-gray-800 text-lg mb-2">先喂奶了吗？</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                确保宝宝已经喂过奶了再吃{pillNickname}哦，这样对宝宝更安全~
              </p>
            </div>
            <div className="space-y-2">
              <button
                onClick={confirmTaken}
                className="w-full py-3 bg-pink-400 hover:bg-pink-500 text-white font-medium rounded-xl transition-colors active:scale-[0.98]"
              >
                已喂奶，确认吃{pillNickname}
              </button>
              <button
                onClick={() => setConfirmPeriod(null)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-xl transition-colors active:scale-[0.98]"
              >
                还没喂，等一下
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
