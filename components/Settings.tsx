'use client';

import { useState, useEffect } from 'react';

interface AppSettings {
  morningTime: string;
  eveningTime: string;
  checkDelay: string;
  browserNotify: string;
  pillNickname: string;
  pillColor: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  morningTime: '08:00',
  eveningTime: '20:00',
  checkDelay: '30',
  browserNotify: 'false',
  pillNickname: '小药丸',
  pillColor: '#f472b6',
};

const PILL_COLORS = [
  { name: '小粉', color: '#f472b6' },
  { name: '小黄', color: '#fbbf24' },
  { name: '小绿', color: '#4ade80' },
  { name: '小蓝', color: '#60a5fa' },
  { name: '小白', color: '#d1d5db' },
  { name: '小紫', color: '#c084fc' },
];

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifyStatus, setNotifyStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [pushResult, setPushResult] = useState<{ target: string; message: string } | null>(null);
  const [pushing, setPushing] = useState<string | null>(null);
  const [pushLogs, setPushLogs] = useState<any[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Load settings from API (fallback to localStorage)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        } else {
          throw new Error('API failed');
        }
      } catch {
        // Fallback to localStorage
        const saved = localStorage.getItem('xiaohui_settings');
        if (saved) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
          } catch {}
        }
      } finally {
        setLoading(false);
      }
    })();

    if (typeof Notification !== 'undefined') {
      setNotifyStatus(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, []);

  // Save settings to API + localStorage
  const handleSave = async () => {
    // Always save to localStorage as fallback
    localStorage.setItem('xiaohui_settings', JSON.stringify(settings));

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch {
      // localStorage already saved, silently continue
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const requestNotifyPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifyStatus(result as 'default' | 'granted' | 'denied');
    if (result === 'granted') {
      setSettings({ ...settings, browserNotify: 'true' });
      new Notification('小惠提醒', {
        body: '通知已开启，到时间会提醒你吃药哦 💊',
        icon: '/icon-192.png',
      });
    }
  };

  // Test WeChat push
  const testPush = async (target: 'wife' | 'husband' | 'both') => {
    setPushing(target);
    setPushResult(null);
    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, period: 'morning' }),
      });
      const data = await res.json();
      if (data.success) {
        setPushResult({ target, message: '推送成功！去微信看看有没有收到' });
      } else {
        // Show detailed error from WeChat API
        const detail = data.message || data.error || '推送失败';
        setPushResult({ target, message: detail });
      }
    } catch (err: any) {
      setPushResult({ target, message: `网络错误: ${err.message}` });
    } finally {
      setPushing(null);
      // Keep error visible longer so user can read
      setTimeout(() => setPushResult(null), 15000);
    }
  };

  // Load push logs
  const loadPushLogs = async () => {
    setShowLogs(!showLogs);
    if (!showLogs) {
      try {
        const res = await fetch('/api/push-logs?limit=20');
        if (res.ok) setPushLogs(await res.json());
      } catch {}
    }
  };

  const update = (partial: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-400">加载设置中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pill Config */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h2 className="font-semibold text-gray-800 mb-4">💊 药物设置</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">药丸昵称</label>
            <input
              type="text"
              value={settings.pillNickname}
              onChange={(e) => update({ pillNickname: e.target.value })}
              placeholder="给药起个可爱的名字"
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:border-pink-200"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-2 block">药丸颜色（等你看到药的颜色再选）</label>
            <div className="flex gap-3 flex-wrap">
              {PILL_COLORS.map((pc) => (
                <button
                  key={pc.name}
                  onClick={() => update({ pillColor: pc.color, pillNickname: pc.name })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    settings.pillColor === pc.color ? 'bg-pink-50 ring-2 ring-pink-300' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full shadow-sm"
                    style={{ backgroundColor: pc.color }}
                  />
                  <span className="text-xs text-gray-500">{pc.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Time Config */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h2 className="font-semibold text-gray-800 mb-2">⏰ 吃药时间</h2>
        <p className="text-xs text-gray-400 mb-4">修改后保存即可生效，定时推送会按新时间发送</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">🌅 早上</label>
            <input
              type="time"
              value={settings.morningTime}
              onChange={(e) => update({ morningTime: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:border-pink-200"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">🌙 晚上</label>
            <input
              type="time"
              value={settings.eveningTime}
              onChange={(e) => update({ eveningTime: e.target.value })}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:border-pink-200"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm text-gray-600 mb-1 block">⏱️ 未吃药提醒延迟（分钟）</label>
          <p className="text-xs text-gray-400 mb-2">到时间后如果没确认吃药，等多久通知丈夫</p>
          <input
            type="number"
            min="5"
            max="120"
            value={settings.checkDelay}
            onChange={(e) => update({ checkDelay: e.target.value })}
            className="w-24 p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:border-pink-200"
          />
        </div>
      </div>

      {/* Browser Notification */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h2 className="font-semibold text-gray-800 mb-3">🔔 浏览器通知</h2>
        <p className="text-xs text-gray-400 mb-3">到吃药时间自动弹出提醒（需要保持网页打开）</p>

        {notifyStatus === 'granted' ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <span>✓</span> 通知已开启
          </div>
        ) : notifyStatus === 'denied' ? (
          <div className="text-sm text-red-400">
            通知被拒绝了，需要在浏览器设置里手动开启
          </div>
        ) : (
          <button
            onClick={requestNotifyPermission}
            className="bg-pink-400 hover:bg-pink-500 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            开启通知提醒
          </button>
        )}
      </div>

      {/* WeChat Push Test */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h2 className="font-semibold text-gray-800 mb-3">📲 微信推送测试</h2>
        <p className="text-xs text-gray-400 mb-4">测试微信模板消息是否能正常发送</p>

        <div className="space-y-3">
          <button
            onClick={() => testPush('wife')}
            disabled={pushing !== null}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
              pushing === 'wife'
                ? 'bg-pink-100 text-pink-400'
                : 'bg-pink-50 text-pink-600 hover:bg-pink-100 active:scale-[0.98]'
            }`}
          >
            {pushing === 'wife' ? '发送中...' : '💊 推送给妻子（吃药提醒）'}
          </button>

          <button
            onClick={() => testPush('husband')}
            disabled={pushing !== null}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
              pushing === 'husband'
                ? 'bg-blue-100 text-blue-400'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 active:scale-[0.98]'
            }`}
          >
            {pushing === 'husband' ? '发送中...' : '📱 推送给丈夫（未吃药通知）'}
          </button>

          <button
            onClick={() => testPush('both')}
            disabled={pushing !== null}
            className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all ${
              pushing === 'both'
                ? 'bg-purple-100 text-purple-400'
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100 active:scale-[0.98]'
            }`}
          >
            {pushing === 'both' ? '发送中...' : '👫 同时推送给两人'}
          </button>

          {pushResult && (
            <div className={`text-xs p-3 rounded-xl ${
              pushResult.message.includes('成功') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
            }`}>
              {pushResult.message}
            </div>
          )}

          {/* Push Log Viewer */}
          <button onClick={loadPushLogs} className="text-xs text-gray-400 underline mt-1">
            {showLogs ? '收起推送日志' : '查看推送日志'}
          </button>

          {showLogs && (
            <div className="mt-2 max-h-60 overflow-y-auto space-y-1.5">
              {pushLogs.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-3">暂无推送记录</p>
              ) : pushLogs.map((log: any) => (
                <div key={log.id} className={`text-xs p-2.5 rounded-lg ${log.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className={log.success ? 'text-green-600' : 'text-red-500'}>
                      {log.success ? '✓' : '✗'} {log.type}
                    </span>
                    <span className="text-gray-300">{log.created_at}</span>
                  </div>
                  {log.error && (
                    <div className="text-red-400 mt-1 break-all font-mono text-[10px] leading-relaxed">
                      {log.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
          saved
            ? 'bg-green-100 text-green-600'
            : 'bg-pink-400 hover:bg-pink-500 text-white active:scale-[0.98]'
        }`}
      >
        {saved ? '✓ 保存成功' : '保存设置'}
      </button>

      {/* About */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-300">小惠 v1.0</p>
        <p className="text-xs text-gray-300 mt-1">用爱做的小工具 ♡</p>
      </div>
    </div>
  );
}
