'use client';

import { useState, useEffect } from 'react';

interface AppSettings {
  morningTime: string;
  eveningTime: string;
  browserNotify: boolean;
  webhookUrl: string;
  webhookType: 'dingtalk' | 'wechat' | 'custom';
  webhookEnabled: boolean;
  pillNickname: string;
  pillColor: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  morningTime: '08:00',
  eveningTime: '20:00',
  browserNotify: false,
  webhookUrl: '',
  webhookType: 'dingtalk',
  webhookEnabled: false,
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

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const saved = localStorage.getItem('xiaohui_settings');
  return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
}

function saveSettings(settings: AppSettings) {
  localStorage.setItem('xiaohui_settings', JSON.stringify(settings));
}

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<'default' | 'granted' | 'denied'>('default');
  const [webhookTestResult, setWebhookTestResult] = useState<string>('');

  useEffect(() => {
    setSettings(loadSettings());
    if (typeof Notification !== 'undefined') {
      setNotifyStatus(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const requestNotifyPermission = async () => {
    if (typeof Notification === 'undefined') return;
    const result = await Notification.requestPermission();
    setNotifyStatus(result as 'default' | 'granted' | 'denied');
    if (result === 'granted') {
      setSettings({ ...settings, browserNotify: true });
      new Notification('小惠提醒', {
        body: '通知已开启，到时间会提醒你吃药哦 💊',
        icon: '/icon-192.png',
      });
    }
  };

  const testWebhook = async () => {
    if (!settings.webhookUrl) {
      setWebhookTestResult('请先填写 Webhook 地址');
      return;
    }
    setWebhookTestResult('发送中...');
    try {
      const res = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: settings.webhookUrl,
          type: settings.webhookType,
          message: '这是一条测试消息 —— 小惠吃药提醒已配置成功 💊',
        }),
      });
      if (res.ok) {
        setWebhookTestResult('✓ 发送成功！去看看消息有没有收到');
      } else {
        setWebhookTestResult('✗ 发送失败，请检查地址是否正确');
      }
    } catch {
      setWebhookTestResult('✗ 网络错误');
    }
    setTimeout(() => setWebhookTestResult(''), 5000);
  };

  const update = (partial: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  };

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
        <h2 className="font-semibold text-gray-800 mb-4">⏰ 吃药时间</h2>
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

      {/* Webhook Config */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h2 className="font-semibold text-gray-800 mb-3">📲 消息推送</h2>
        <p className="text-xs text-gray-400 mb-3">通过钉钉/微信机器人推送吃药提醒到手机</p>

        <div className="space-y-3">
          <div className="flex gap-2">
            {(['dingtalk', 'wechat', 'custom'] as const).map((type) => (
              <button
                key={type}
                onClick={() => update({ webhookType: type })}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                  settings.webhookType === type
                    ? 'bg-pink-100 text-pink-600'
                    : 'bg-gray-50 text-gray-400'
                }`}
              >
                {type === 'dingtalk' ? '钉钉' : type === 'wechat' ? '企业微信' : '自定义'}
              </button>
            ))}
          </div>

          <input
            type="url"
            value={settings.webhookUrl}
            onChange={(e) => update({ webhookUrl: e.target.value })}
            placeholder="粘贴 Webhook 地址..."
            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs focus:outline-none focus:border-pink-200"
          />

          <div className="flex items-center justify-between">
            <button
              onClick={testWebhook}
              className="text-xs text-pink-500 underline"
            >
              发送测试消息
            </button>
            {webhookTestResult && (
              <span className="text-xs text-gray-500">{webhookTestResult}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="webhookEnabled"
              checked={settings.webhookEnabled}
              onChange={(e) => update({ webhookEnabled: e.target.checked })}
              className="rounded accent-pink-400"
            />
            <label htmlFor="webhookEnabled" className="text-sm text-gray-600">启用消息推送</label>
          </div>
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
