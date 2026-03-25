/**
 * 定时任务调度器
 * 每分钟检查一次是否到了推送时间，从 DB 读取设置
 */
import cron from 'node-cron';
import { getMedLog, getSetting, logPush } from './db';
import { sendMedReminder, notifyHusband } from './wechat';

let initialized = false;

export function startScheduler() {
  if (initialized) return;
  initialized = true;

  console.log(`[Scheduler] 启动定时任务调度器（每分钟检查一次）`);

  // Every minute, check if it's time to send reminders
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    // Read settings from DB (falls back to env if DB not ready)
    let morningTime: string, eveningTime: string, checkDelay: number;
    try {
      morningTime = getSetting('morningTime') || process.env.MORNING_TIME || '08:00';
      eveningTime = getSetting('eveningTime') || process.env.EVENING_TIME || '20:00';
      checkDelay = parseInt(getSetting('checkDelay') || process.env.CHECK_DELAY_MINUTES || '30', 10);
    } catch {
      morningTime = process.env.MORNING_TIME || '08:00';
      eveningTime = process.env.EVENING_TIME || '20:00';
      checkDelay = parseInt(process.env.CHECK_DELAY_MINUTES || '30', 10);
    }

    // Calculate check times (reminder time + delay)
    const morningCheck = addMinutes(morningTime, checkDelay);
    const eveningCheck = addMinutes(eveningTime, checkDelay);

    // Morning reminder
    if (currentTime === morningTime) {
      console.log(`[Scheduler] 发送早上吃药提醒`);
      const result = await sendMedReminder('morning');
      logPush('wechat_reminder', '早上吃药提醒', result.success, result.error);
    }

    // Evening reminder
    if (currentTime === eveningTime) {
      console.log(`[Scheduler] 发送晚上吃药提醒`);
      const result = await sendMedReminder('evening');
      logPush('wechat_reminder', '晚上吃药提醒', result.success, result.error);
    }

    // Morning check - notify husband if not taken
    if (currentTime === morningCheck) {
      const log = getMedLog(today);
      if (!log.morning.taken) {
        console.log(`[Scheduler] 早上未吃药，通知丈夫`);
        const result = await notifyHusband('morning');
        logPush('wechat_husband', '通知丈夫-早上未吃药', result.success, result.error);
      }
    }

    // Evening check - notify husband if not taken
    if (currentTime === eveningCheck) {
      const log = getMedLog(today);
      if (!log.evening.taken) {
        console.log(`[Scheduler] 晚上未吃药，通知丈夫`);
        const result = await notifyHusband('evening');
        logPush('wechat_husband', '通知丈夫-晚上未吃药', result.success, result.error);
      }
    }
  }, { timezone: process.env.TZ || 'Asia/Shanghai' });

  console.log(`[Scheduler] 调度器已启动，每分钟检查推送时间`);
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}
