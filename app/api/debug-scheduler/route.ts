import { NextResponse } from 'next/server';
import { getSetting, getMedLog } from '@/lib/db';

/**
 * GET /api/debug-scheduler
 * 调试接口：查看调度器当前时间、配置、状态
 */
export async function GET() {
  const now = new Date();
  const TZ = process.env.TZ || 'Asia/Shanghai';
  const shanghaiStr = now.toLocaleString('sv-SE', { timeZone: TZ });
  const [today, timePart] = shanghaiStr.split(' ');
  const currentTime = timePart.slice(0, 5);

  let morningTime: string, eveningTime: string, checkDelay: string;
  try {
    morningTime = getSetting('morningTime') || process.env.MORNING_TIME || '08:00';
    eveningTime = getSetting('eveningTime') || process.env.EVENING_TIME || '20:00';
    checkDelay = getSetting('checkDelay') || process.env.CHECK_DELAY_MINUTES || '30';
  } catch {
    morningTime = process.env.MORNING_TIME || '08:00';
    eveningTime = process.env.EVENING_TIME || '20:00';
    checkDelay = process.env.CHECK_DELAY_MINUTES || '30';
  }

  const medLog = getMedLog(today);

  return NextResponse.json({
    server: {
      now: now.toISOString(),
      localTime: now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
      currentTime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      envTZ: process.env.TZ || '未设置',
    },
    config: {
      morningTime,
      eveningTime,
      checkDelay: checkDelay + ' 分钟',
    },
    today: {
      date: today,
      morning: medLog.morning,
      evening: medLog.evening,
    },
    env: {
      WECHAT_APPID: process.env.WECHAT_APPID ? '已配置' : '❌ 未配置',
      WECHAT_APPSECRET: process.env.WECHAT_APPSECRET ? '已配置' : '❌ 未配置',
      WECHAT_TEMPLATE_ID: process.env.WECHAT_TEMPLATE_ID ? '已配置' : '❌ 未配置',
      WECHAT_OPENID: process.env.WECHAT_OPENID ? '已配置' : '❌ 未配置',
      WECHAT_OPENID_HUSBAND: process.env.WECHAT_OPENID_HUSBAND ? '已配置' : '❌ 未配置',
    },
  });
}
