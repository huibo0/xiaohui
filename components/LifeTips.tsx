'use client';

import { useState } from 'react';

interface TipSection {
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  tips: { title: string; content: string }[];
}

const TIPS: TipSection[] = [
  {
    title: '防晒是第一要务',
    icon: '☀️',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    tips: [
      { title: '为什么要防晒？', content: '有狼疮倾向的人对紫外线特别敏感，晒太阳可能直接触发或加重症状。这不是普通的"怕黑"，是真的会影响病情。' },
      { title: '日常防晒', content: '出门涂 SPF 50+ 的防晒霜，戴宽檐帽、穿长袖。阴天也要防晒，紫外线能穿透云层。' },
      { title: '室内也要注意', content: '靠窗坐的时候，UVA 可以穿透玻璃。如果长时间靠窗，可以考虑贴防紫外线膜。' },
      { title: '最佳出行时间', content: '尽量避开上午10点到下午4点的强烈日照时间。早晚出门更安全。' },
    ],
  },
  {
    title: '眼科检查很重要',
    icon: '👁️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    tips: [
      { title: '为什么要查？', content: '长期服用羟氯喹可能影响视网膜。虽然概率不高，但定期检查可以及早发现。' },
      { title: '检查频率', content: '开始服药后第一年做一次基线眼科检查，之后每年至少一次。服药超过5年的要更加注意。' },
      { title: '注意信号', content: '如果突然出现看东西模糊、眼前有暗点、色觉变化，要马上告诉医生。' },
    ],
  },
  {
    title: '运动与休息',
    icon: '🧘',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    tips: [
      { title: '适合的运动', content: '游泳（室内泳池）、瑜伽、散步、太极都是好选择。低冲击、不伤关节。' },
      { title: '运动原则', content: '累了就休息，不要硬撑。关节僵直或疼痛加重的时候减少运动量。倾听身体的声音。' },
      { title: '充足睡眠', content: '保证7-9小时的睡眠。疲劳是很常见的症状，好好休息不是偷懒。' },
    ],
  },
  {
    title: '情绪与心理',
    icon: '💗',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    tips: [
      { title: '情绪会影响病情', content: '压力和焦虑可能加重症状。学会接受自己的状态，不跟生病之前的自己比。' },
      { title: '寻求支持', content: '跟家人朋友聊聊自己的感受。也可以找病友群，知道你不是一个人在面对。' },
      { title: '记得犒劳自己', content: '每天坚持吃药、记录症状，这本身就很了不起。偶尔给自己一点小奖励吧。' },
    ],
  },
  {
    title: '生活小细节',
    icon: '🌿',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    tips: [
      { title: '戒烟', content: '如果有吸烟习惯，强烈建议戒烟。烟草会加重自身免疫性疾病。' },
      { title: '疫苗', content: '流感疫苗等常规疫苗通常是安全的，但用药期间最好先咨询医生。' },
      { title: '怀孕计划', content: '如果有怀孕计划，一定要提前跟风湿科医生沟通。UCTD 在怀孕期间可能有变化，需要密切监测。' },
      { title: '补充维生素D', content: '因为需要防晒减少日照，可能导致维生素D不足。可以让医生检查一下，必要时补充。' },
    ],
  },
];

const KNOWLEDGE = [
  {
    title: '什么是 UCTD？',
    content: '未分化结缔组织病是一种自身免疫性疾病，意思是免疫系统误攻击了自己的身体。"未分化"的意思是还没有发展成某种特定的结缔组织病（比如红斑狼疮、干燥综合征等）。',
  },
  {
    title: '会变成狼疮吗？',
    content: '大部分 UCTD 患者（约60-70%）会保持稳定，不会发展成其他疾病。只有约10%会进展为系统性红斑狼疮。坚持治疗和健康生活方式可以帮助保持稳定。',
  },
  {
    title: '什么是狼疮倾向？',
    content: '意思是检查结果显示有一些类似狼疮的特征（比如某些抗体阳性），但还没有达到诊断狼疮的标准。羟氯喹可以帮助控制症状、减少进展的风险。',
  },
  {
    title: '羟氯喹是什么？',
    content: '一种免疫调节药物，可以降低免疫系统的过度活跃。对皮肤症状、关节疼痛都有效果，还能降低疾病进展的风险。是 UCTD 和狼疮最常用的基础药物之一。',
  },
];

export default function LifeTips() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showKnowledge, setShowKnowledge] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-pink-50">
        <h2 className="font-semibold text-gray-800 mb-1">生活小贴士 🌸</h2>
        <p className="text-sm text-gray-500">了解这些，日子会过得更安心</p>
      </div>

      {/* Tips Sections */}
      {TIPS.map((section) => (
        <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
          <button
            onClick={() => setExpandedSection(expandedSection === section.title ? null : section.title)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{section.icon}</span>
              <h3 className={`font-medium ${section.color}`}>{section.title}</h3>
            </div>
            <span className={`text-gray-300 transition-transform ${expandedSection === section.title ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>

          {expandedSection === section.title && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              {section.tips.map((tip, i) => (
                <div key={i} className={`${section.bgColor} rounded-xl p-3`}>
                  <p className="font-medium text-gray-700 text-sm">{tip.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tip.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Knowledge Corner */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-50 overflow-hidden">
        <button
          onClick={() => setShowKnowledge(!showKnowledge)}
          className="w-full p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📚</span>
            <div className="text-left">
              <h3 className="font-medium text-purple-600">了解你的身体</h3>
              <p className="text-xs text-gray-400">关于 UCTD 和羟氯喹的小科普</p>
            </div>
          </div>
          <span className={`text-gray-300 transition-transform ${showKnowledge ? 'rotate-180' : ''}`}>
            ▾
          </span>
        </button>

        {showKnowledge && (
          <div className="px-4 pb-4 space-y-3 animate-fade-in">
            {KNOWLEDGE.map((item, i) => (
              <div key={i} className="bg-purple-50/50 rounded-xl p-3">
                <p className="font-medium text-purple-700 text-sm">{item.title}</p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.content}</p>
              </div>
            ))}
            <p className="text-xs text-gray-400 text-center pt-2">
              以上信息仅供参考，具体情况请遵医嘱
            </p>
          </div>
        )}
      </div>

      {/* Sources */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-xs text-gray-500 leading-relaxed">
          📖 信息来源：Lupus Foundation of America、Cleveland Clinic、Johns Hopkins Lupus Center、NCBI StatPearls。所有建议仅供参考，请以主治医生的意见为准。
        </p>
      </div>
    </div>
  );
}
