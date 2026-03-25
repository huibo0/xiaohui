'use client';

import { useState, useEffect } from 'react';

interface UVData {
  current_uv: number;
  max_uv: number;
  temperature: number | null;
  sunrise: string | null;
  sunset: string | null;
  hourly: { hour: number; uv: number }[];
  location: string;
  error?: string;
}

function getUVLevel(uv: number): { level: string; color: string; bg: string; advice: string; emoji: string } {
  if (uv <= 2) return {
    level: '低', color: '#10b981', bg: '#ecfdf5',
    emoji: '😎',
    advice: '紫外线很低，可以放心外出。但如果长时间户外活动，建议还是涂防晒。',
  };
  if (uv <= 5) return {
    level: '中等', color: '#eab308', bg: '#fefce8',
    emoji: '🧴',
    advice: '紫外线中等，外出请涂防晒霜（SPF30+），戴帽子和太阳镜。UCTD患者建议避免正午前后外出。',
  };
  if (uv <= 7) return {
    level: '高', color: '#f97316', bg: '#fff7ed',
    emoji: '⚠️',
    advice: '紫外线较高！强烈建议减少户外活动，必须外出时穿长袖、涂SPF50+防晒霜、戴宽檐帽。',
  };
  if (uv <= 10) return {
    level: '很高', color: '#ef4444', bg: '#fef2f2',
    emoji: '🚫',
    advice: '紫外线很高！UCTD患者应尽量避免外出。如必须外出，全面防晒+打伞+避开10:00-16:00。',
  };
  return {
    level: '极高', color: '#7c3aed', bg: '#f5f3ff',
    emoji: '🛑',
    advice: '紫外线极端危险！请留在室内，避免任何户外活动。紫外线可能诱发病情加重。',
  };
}

function UVBar({ uv }: { uv: number }) {
  const maxUV = 12;
  const pct = Math.min(100, (uv / maxUV) * 100);
  const level = getUVLevel(uv);

  return (
    <div className="relative">
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(to right, #10b981, #eab308, #f97316, #ef4444, #7c3aed)`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-gray-300">
        <span>0</span>
        <span>3</span>
        <span>6</span>
        <span>9</span>
        <span>12+</span>
      </div>
    </div>
  );
}

function HourlyChart({ data }: { data: { hour: number; uv: number }[] }) {
  // Only show daytime hours (6-20)
  const daytime = data.filter((d) => d.hour >= 6 && d.hour <= 20);
  const maxUV = Math.max(...daytime.map((d) => d.uv), 1);
  const nowHour = new Date().getHours();

  return (
    <div className="flex items-end gap-1 h-20">
      {daytime.map((d) => {
        const h = Math.max(4, (d.uv / maxUV) * 100);
        const level = getUVLevel(d.uv);
        const isCurrent = d.hour === nowHour;
        return (
          <div key={d.hour} className="flex-1 flex flex-col items-center gap-1">
            <div className="text-[9px] text-gray-400">{d.uv > 0 ? d.uv.toFixed(0) : ''}</div>
            <div
              className={`w-full rounded-t transition-all ${isCurrent ? 'ring-2 ring-pink-300' : ''}`}
              style={{
                height: `${h}%`,
                backgroundColor: level.color + '60',
                minHeight: '2px',
              }}
            />
            <div className={`text-[9px] ${isCurrent ? 'text-pink-500 font-bold' : 'text-gray-300'}`}>
              {d.hour}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function UVIndex() {
  const [data, setData] = useState<UVData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/uv')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ current_uv: 0, max_uv: 0, temperature: null, sunrise: null, sunset: null, hourly: [], location: '北京', error: '获取失败' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <div className="text-sm text-gray-400 text-center py-4">正在获取紫外线数据...</div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <div className="text-sm text-gray-400 text-center py-4">紫外线数据暂时获取不到，稍后再试</div>
      </div>
    );
  }

  const level = getUVLevel(data.current_uv);
  const maxLevel = getUVLevel(data.max_uv);

  return (
    <div className="space-y-4">
      {/* Current UV */}
      <div className="rounded-2xl p-5 shadow-sm border" style={{ backgroundColor: level.bg, borderColor: level.color + '30' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              ☀️ 紫外线指数
              <span className="text-xs text-gray-400 font-normal">{data.location}</span>
            </h2>
          </div>
          <span className="text-3xl">{level.emoji}</span>
        </div>

        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-4xl font-bold" style={{ color: level.color }}>
            {data.current_uv}
          </span>
          <span className="text-sm font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: level.color + '20', color: level.color }}>
            {level.level}
          </span>
          {data.temperature !== null && (
            <span className="text-sm text-gray-400 ml-auto">{data.temperature}°C</span>
          )}
        </div>

        <UVBar uv={data.current_uv} />

        <div className="mt-4 p-3 rounded-xl bg-white/70">
          <p className="text-sm text-gray-600 leading-relaxed">
            {level.advice}
          </p>
        </div>
      </div>

      {/* Today Overview */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">今日紫外线变化</h3>

        {data.hourly.length > 0 ? (
          <HourlyChart data={data.hourly} />
        ) : (
          <div className="text-xs text-gray-400 text-center py-4">暂无每小时数据</div>
        )}

        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <div>
            今日最高 UV：
            <span className="font-semibold" style={{ color: maxLevel.color }}>
              {data.max_uv} ({maxLevel.level})
            </span>
          </div>
          {data.sunrise && data.sunset && (
            <div>
              🌅 {data.sunrise.slice(11, 16)} → 🌇 {data.sunset.slice(11, 16)}
            </div>
          )}
        </div>
      </div>

      {/* UCTD Sun Protection Tips */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
        <h3 className="text-sm font-medium text-gray-700 mb-2">🧴 UCTD 防晒要点</h3>
        <div className="space-y-1.5 text-xs text-gray-600 leading-relaxed">
          <p>• 紫外线可能激活免疫系统，诱发或加重症状</p>
          <p>• 即使阴天也有 UV，建议日常涂防晒（SPF30+、PA+++）</p>
          <p>• 外出优先物理防晒：长袖、宽檐帽、太阳伞</p>
          <p>• 避开 10:00~16:00 紫外线高峰时段</p>
          <p>• 服用羟氯喹期间皮肤可能更光敏，更要注意防晒</p>
        </div>
      </div>
    </div>
  );
}
