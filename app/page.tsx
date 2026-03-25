'use client';

import { useState, useEffect, useCallback } from 'react';
import MedicationTracker from '@/components/MedicationTracker';
import SymptomDiary from '@/components/SymptomDiary';
import UVIndex from '@/components/UVIndex';
import DietGuide from '@/components/DietGuide';
import LifeTips from '@/components/LifeTips';
import Settings from '@/components/Settings';

const TABS = [
  { id: 'meds', label: '吃药', icon: '💊' },
  { id: 'diary', label: '记录', icon: '📝' },
  { id: 'uv', label: '防晒', icon: '☀️' },
  { id: 'diet', label: '饮食', icon: '🥗' },
  { id: 'tips', label: '小贴士', icon: '🌸' },
  { id: 'settings', label: '设置', icon: '⚙️' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('meds');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting('夜深了，早点休息哦');
    else if (hour < 9) setGreeting('早上好');
    else if (hour < 12) setGreeting('上午好');
    else if (hour < 14) setGreeting('中午好');
    else if (hour < 18) setGreeting('下午好');
    else if (hour < 22) setGreeting('晚上好');
    else setGreeting('夜深了，早点休息哦');
  }, []);

  const renderContent = useCallback(() => {
    switch (activeTab) {
      case 'meds': return <MedicationTracker />;
      case 'diary': return <SymptomDiary />;
      case 'uv': return <UVIndex />;
      case 'diet': return <DietGuide />;
      case 'tips': return <LifeTips />;
      case 'settings': return <Settings />;
    }
  }, [activeTab]);

  return (
    <main className="min-h-screen pb-20 max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              小惠 <span className="text-pink-400 text-lg">♡</span>
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">{greeting}，今天也要好好的</p>
          </div>
          <div className="text-2xl animate-bounce-gentle">🌷</div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-4 animate-fade-in">
        {renderContent()}
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-pink-100 tab-bar">
        <div className="max-w-lg mx-auto flex justify-between py-2 px-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'text-pink-500 scale-105'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="w-1 h-1 rounded-full bg-pink-400 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
