'use client';

import { useState, useMemo } from 'react';
import { FOOD_DATABASE, FOOD_CATEGORIES, SAFETY_INFO, searchFood, type FoodItem } from '@/lib/food-data';

function FoodCard({ food }: { food: FoodItem }) {
  const [expanded, setExpanded] = useState(false);
  const info = SAFETY_INFO[food.safety];

  return (
    <div
      className="rounded-xl p-3 flex items-start gap-3 cursor-pointer active:scale-[0.98] transition-all"
      style={{ backgroundColor: info.bg, borderLeft: `3px solid ${info.color}` }}
      onClick={() => setExpanded(!expanded)}
    >
      <span className="text-xl mt-0.5 flex-shrink-0">{food.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700 text-sm">{food.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{ backgroundColor: info.color + '20', color: info.color }}>
            {info.emoji} {info.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{food.reason}</p>
        {expanded && food.tip && (
          <p className="text-xs text-gray-400 mt-1.5 p-2 bg-white/60 rounded-lg leading-relaxed">
            💡 {food.tip}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DietGuide() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSafety, setActiveSafety] = useState<string | null>(null);

  // Search results
  const searchResults = useMemo(() => {
    if (query.trim()) return searchFood(query);
    return null;
  }, [query]);

  // Filtered by category and safety
  const filteredFoods = useMemo(() => {
    let foods = FOOD_DATABASE;
    if (activeCategory) foods = foods.filter((f) => f.category === activeCategory);
    if (activeSafety) foods = foods.filter((f) => f.safety === activeSafety);
    return foods;
  }, [activeCategory, activeSafety]);

  // Stats
  const stats = useMemo(() => ({
    good: FOOD_DATABASE.filter((f) => f.safety === 'good').length,
    ok: FOOD_DATABASE.filter((f) => f.safety === 'ok').length,
    caution: FOOD_DATABASE.filter((f) => f.safety === 'caution').length,
    avoid: FOOD_DATABASE.filter((f) => f.safety === 'avoid').length,
  }), []);

  const isSearching = query.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜食物...（如：三文鱼、牛奶、苜蓿）"
            className="w-full pl-10 pr-8 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:border-pink-200 focus:ring-1 focus:ring-pink-100"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {isSearching && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
          <div className="text-xs text-gray-400 mb-3">
            找到 {searchResults?.length || 0} 个结果
          </div>
          {searchResults && searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((food, i) => (
                <FoodCard key={`${food.name}-${i}`} food={food} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <span className="text-2xl">🤔</span>
              <p className="text-sm text-gray-400 mt-2">没找到「{query}」</p>
              <p className="text-xs text-gray-300 mt-1">试试其他关键词，或按分类浏览</p>
            </div>
          )}
        </div>
      )}

      {/* Non-search mode: browse */}
      {!isSearching && (
        <>
          {/* Safety Quick Filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
            {(Object.entries(SAFETY_INFO) as [string, typeof SAFETY_INFO['good']][]).map(([key, info]) => (
              <button key={key}
                onClick={() => setActiveSafety(activeSafety === key ? null : key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${
                  activeSafety === key
                    ? 'font-medium shadow-sm'
                    : 'bg-white border border-gray-100'
                }`}
                style={activeSafety === key ? { backgroundColor: info.bg, color: info.color, borderColor: info.border } : {}}
              >
                <span>{info.emoji}</span>
                <span>{info.label}</span>
                <span className="text-gray-300 text-[10px]">
                  {stats[key as keyof typeof stats]}
                </span>
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                !activeCategory ? 'bg-pink-100 text-pink-600 font-medium' : 'bg-white border border-gray-100 text-gray-400'
              }`}
            >全部</button>
            {FOOD_CATEGORIES.map((cat) => (
              <button key={cat.key}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 transition-all ${
                  activeCategory === cat.key ? 'bg-pink-100 text-pink-600 font-medium' : 'bg-white border border-gray-100 text-gray-400'
                }`}
              >{cat.emoji} {cat.key}</button>
            ))}
          </div>

          {/* Food List */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-pink-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                {activeCategory || '全部食物'}
                {activeSafety && ` · ${SAFETY_INFO[activeSafety as keyof typeof SAFETY_INFO].label}`}
              </h3>
              <span className="text-xs text-gray-300">{filteredFoods.length} 种</span>
            </div>
            <div className="space-y-2">
              {filteredFoods.slice(0, 50).map((food, i) => (
                <FoodCard key={`${food.name}-${i}`} food={food} />
              ))}
              {filteredFoods.length > 50 && (
                <p className="text-xs text-gray-300 text-center py-2">
                  还有 {filteredFoods.length - 50} 种，试试搜索更精确
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Key Warning */}
      <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
        <h3 className="text-sm font-medium text-red-600 mb-1">🚫 最重要的禁忌</h3>
        <p className="text-xs text-red-500 leading-relaxed">
          <strong>苜蓿（alfalfa）</strong>及任何含苜蓿的食品/保健品必须完全避免，它含有的L-刀豆氨酸可以直接触发狼疮症状。
        </p>
      </div>

      {/* Dietary principle */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-4 border border-green-100">
        <h3 className="text-sm font-medium text-gray-700 mb-1">🥗 饮食原则</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          推荐地中海饮食：多吃鱼、蔬果、全谷物、橄榄油，少吃加工食品和糖。每个人的身体不一样，以上是一般性建议。如果对某种食物有疑问，最好和医生讨论。
        </p>
      </div>
    </div>
  );
}
