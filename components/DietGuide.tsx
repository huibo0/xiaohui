'use client';

import { useState } from 'react';

interface FoodItem {
  name: string;
  emoji: string;
  detail?: string;
}

interface FoodCategory {
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  items: FoodItem[];
}

const FOOD_DATA: FoodCategory[] = [
  {
    title: '推荐多吃',
    icon: '💚',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-100',
    description: '抗炎、保护骨骼和心脏',
    items: [
      { name: '深海鱼', emoji: '🐟', detail: '三文鱼、鲭鱼、沙丁鱼，富含 Omega-3 抗炎' },
      { name: '绿叶蔬菜', emoji: '🥬', detail: '菠菜、羽衣甘蓝，补钙又抗炎' },
      { name: '全谷物', emoji: '🌾', detail: '糙米、燕麦、全麦面包' },
      { name: '新鲜水果', emoji: '🍎', detail: '蓝莓、樱桃、柑橘类，抗氧化好帮手' },
      { name: '坚果', emoji: '🥜', detail: '核桃、杏仁，好脂肪来源' },
      { name: '橄榄油', emoji: '🫒', detail: '用来做饭或拌沙拉，替代其他油' },
      { name: '豆类', emoji: '🫘', detail: '鹰嘴豆、黑豆、豆腐' },
      { name: '牛奶/酸奶', emoji: '🥛', detail: '低脂乳制品，补钙护骨骼' },
      { name: '鸡蛋', emoji: '🥚', detail: '优质蛋白质来源' },
      { name: '西兰花', emoji: '🥦', detail: '十字花科蔬菜，抗炎明星' },
    ],
  },
  {
    title: '尽量少吃',
    icon: '🟡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-100',
    description: '可能加重炎症或影响药效',
    items: [
      { name: '高糖食物', emoji: '🍰', detail: '糖果、蛋糕、含糖饮料，会促进炎症' },
      { name: '加工食品', emoji: '🥫', detail: '罐头、方便面、加工肉类' },
      { name: '高盐食物', emoji: '🧂', detail: '腌制食品、外卖，高盐加重水肿' },
      { name: '油炸食品', emoji: '🍟', detail: '炸鸡、薯条等，含大量反式脂肪' },
      { name: '饱和脂肪', emoji: '🥓', detail: '肥肉、香肠、高脂奶酪' },
      { name: '酒精', emoji: '🍷', detail: '如果要喝，每天不超过一杯' },
    ],
  },
  {
    title: '绝对避免',
    icon: '🔴',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-100',
    description: '可能直接触发症状',
    items: [
      { name: '苜蓿 / 苜蓿芽', emoji: '🌱', detail: '含左旋刀豆氨酸，可能直接触发狼疮症状！这是最重要的禁忌' },
      { name: '苜蓿补充剂', emoji: '💊', detail: '任何含苜蓿成分的保健品都要避免' },
    ],
  },
];

const MAYBE_ITEMS = [
  { name: '茄科蔬菜', emoji: '🍅', detail: '番茄、茄子、青椒、土豆 —— 有些人会加重症状，可以观察自己的反应' },
  { name: '麸质', emoji: '🍞', detail: '面筋蛋白 —— 并非所有人都敏感，如果觉得吃面食后不舒服可以试试少吃' },
];

export default function DietGuide() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h2 className="font-semibold text-gray-800 mb-2">饮食小指南 🍽️</h2>
        <p className="text-sm text-gray-500 leading-relaxed">
          地中海饮食是目前研究推荐的方向：多吃鱼、蔬果、全谷物、橄榄油，少吃加工食品和糖。不需要完全严格，慢慢调整就好。
        </p>
      </div>

      {/* Food Categories */}
      {FOOD_DATA.map((category) => (
        <div key={category.title} className={`bg-white rounded-2xl shadow-sm border ${category.borderColor} overflow-hidden`}>
          <button
            onClick={() => setExpanded(expanded === category.title ? null : category.title)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{category.icon}</span>
              <div className="text-left">
                <h3 className={`font-medium ${category.color}`}>{category.title}</h3>
                <p className="text-xs text-gray-400">{category.description}</p>
              </div>
            </div>
            <span className={`text-gray-300 transition-transform ${expanded === category.title ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          {expanded === category.title && (
            <div className={`px-4 pb-4 space-y-2 animate-fade-in`}>
              {category.items.map((item, i) => (
                <div key={i} className={`${category.bgColor} rounded-xl p-3 flex items-start gap-3`}>
                  <span className="text-xl mt-0.5">{item.emoji}</span>
                  <div>
                    <p className="font-medium text-gray-700 text-sm">{item.name}</p>
                    {item.detail && <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Maybe Section */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
          <span>🤔</span> 因人而异
        </h3>
        <p className="text-xs text-gray-400 mb-3">这些食物不是所有人都敏感，可以观察自己吃了之后的反应</p>
        {MAYBE_ITEMS.map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 flex items-start gap-3 mb-2 last:mb-0">
            <span className="text-xl mt-0.5">{item.emoji}</span>
            <div>
              <p className="font-medium text-gray-700 text-sm">{item.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Important Note */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 border border-green-100">
        <p className="text-sm text-gray-600 leading-relaxed">
          💡 每个人的身体不一样，这些是一般性的建议。如果对某种食物有疑问，最好和医生讨论。慢慢调整，不要给自己太大压力哦。
        </p>
      </div>
    </div>
  );
}
