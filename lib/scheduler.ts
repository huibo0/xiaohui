/**
 * 定时任务调度器
 *
 * 每分钟检查一次，执行推送逻辑：
 *
 * 【妻子】每个时段最多 3 次提醒（间隔 = checkDelay 分钟）
 *   第1次（吃药时间）    ：先喂奶再吃药
 *   第2次（+checkDelay） ：催促吃药
 *   第3次（+checkDelay×2）：最后催促
 *
 * 【丈夫】从 checkDelay 开始，每 5 分钟提醒一次，直到妻子吃药
 */
import cron from 'node-cron';
import { getMedLog, getSetting, logPush } from './db';
import {
  sendFirstReminder,
  sendFollowupReminder,
  sendFinalReminder,
  notifyHusband,
} from './wechat';

let initialized = false;

export function startScheduler() {
  if (initialized) return;
  initialized = true;

  console.log(`[Scheduler] 启动定时任务调度器（每分钟检查一次）`);

  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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

    // Helper: minutes since a given HH:MM time
    const minutesSince = (baseTime: string): number => {
      const [bh, bm] = baseTime.split(':').map(Number);
      const [ch, cm] = currentTime.split(':').map(Number);
      return (ch * 60 + cm) - (bh * 60 + bm);
    };

    // Process each period
    for (const { period, medTime } of [
      { period: 'morning' as const, medTime: morningTime },
      { period: 'evening' as const, medTime: eveningTime },
    ]) {
      const elapsed = minutesSince(medTime);

      // Skip if current time is before medication time or way past (> 3 hours)
      if (elapsed < 0 || elapsed > 180) continue;

      const log = getMedLog(today);
      const taken = period === 'morning' ? log.morning.taken : log.evening.taken;

      // If already taken, skip all reminders
      if (taken) continue;

      const periodLabel = period === 'morning' ? '早上' : '晚上';

      // ===== 妻子提醒（3次，间隔 checkDelay） =====

      // 第1次：吃药时间
      if (elapsed === 0) {
        console.log(`[Scheduler] 发送${periodLabel}第1次提醒（先喂奶再吃药）`);
        const result = await sendFirstReminder(period);
        logPush('wife_reminder_1', `${periodLabel}第1次提醒-先喂奶再吃药`, result.success, result.error);
      }

      // 第2次：吃药时间 + checkDelay
      if (elapsed === checkDelay) {
        console.log(`[Scheduler] 发送${periodLabel}第2次提醒（催促吃药）`);
        const result = await sendFollowupReminder(period);
        logPush('wife_reminder_2', `${periodLabel}第2次提醒-催促吃药`, result.success, result.error);
      }

      // 第3次：吃药时间 + checkDelay × 2
      if (elapsed === checkDelay * 2) {
        console.log(`[Scheduler] 发送${periodLabel}第3次提醒（最后催促）`);
        const result = await sendFinalReminder(period);
        logPush('wife_reminder_3', `${periodLabel}第3次提醒-最后催促`, result.success, result.error);
      }

      // ===== 丈夫提醒（从 checkDelay 开始，每 5 分钟一次） =====

      if (elapsed >= checkDelay && (elapsed - checkDelay) % 5 === 0) {
        const overdueMinutes = elapsed;
        console.log(`[Scheduler] 通知丈夫-${periodLabel}未吃药（超时${overdueMinutes}分钟）`);
        const result = await notifyHusband(period, overdueMinutes);
        logPush('husband_reminder', `通知丈夫-${periodLabel}未吃药(超时${overdueMinutes}min)`, result.success, result.error);
      }
    }
  }, { timezone: process.env.TZ || 'Asia/Shanghai' });

  console.log(`[Scheduler] 调度器已启动，每分钟检查推送时间`);
}
