/**
 * 定时任务调度器
 * 在 VPS 上通过 node-cron 运行
 */
import cron from 'node-cron';
import { getMedLog, logPush } from './db';
import { sendMedReminder, notifyHusband } from './wechat';

let initialized = false;

export function startScheduler() {
  if (initialized) return;
  initialized = true;

  const morningTime = process.env.MORNING_TIME || '08:00';
  const eveningTime = process.env.EVENING_TIME || '20:00';
  const checkDelay = parseInt(process.env.CHECK_DELAY_MINUTES || '30', 10);

  const [mH, mM] = morningTime.split(':').map(Number);
  const [eH, eM] = eveningTime.split(':').map(Number);

  console.log(`[Scheduler] 启动定时任务`);
  console.log(`  早上提醒: ${morningTime}, 检查: ${mH}:${String(mM + checkDelay).padStart(2, '0')}`);
  console.log(`  晚上提醒: ${eveningTime}, 检查: ${eH}:${String(eM + checkDelay).padStart(2, '0')}`);

  // === 早上吃药提醒 ===
  cron.schedule(`${mM} ${mH} * * *`, async () => {
    console.log(`[Scheduler] 发送早上吃药提醒`);
    const result = await sendMedReminder('morning');
    logPush('wechat_reminder', '早上吃药提醒', result.success, result.error);
    console.log(`[Scheduler] 早上提醒结果:`, result);
  }, { timezone: process.env.TZ || 'Asia/Shanghai' });

  // === 晚上吃药提醒 ===
  cron.schedule(`${eM} ${eH} * * *`, async () => {
    console.log(`[Scheduler] 发送晚上吃药提醒`);
    const result = await sendMedReminder('evening');
    logPush('wechat_reminder', '晚上吃药提醒', result.success, result.error);
    console.log(`[Scheduler] 晚上提醒结果:`, result);
  }, { timezone: process.env.TZ || 'Asia/Shanghai' });

  // === 早上检查（提醒后30分钟检查是否吃了） ===
  const mCheckM = (mM + checkDelay) % 60;
  const mCheckH = mH + Math.floor((mM + checkDelay) / 60);
  cron.schedule(`${mCheckM} ${mCheckH} * * *`, async () => {
    console.log(`[Scheduler] 检查早上是否吃药`);
    const today = new Date().toISOString().split('T')[0];
    const log = getMedLog(today);
    if (!log.morning.taken) {
      console.log(`[Scheduler] 早上未吃药，通知丈夫`);
      const result = await notifyHusband('morning');
      logPush('wechat_husband', '通知丈夫-早上未吃药', result.success, result.error);
    } else {
      console.log(`[Scheduler] 早上已吃药 ✓`);
    }
  }, { timezone: process.env.TZ || 'Asia/Shanghai' });

  // === 晚上检查 ===
  const eCheckM = (eM + checkDelay) % 60;
  const eCheckH = eH + Math.floor((eM + checkDelay) / 60);
  cron.schedule(`${eCheckM} ${eCheckH} * * *`, async () => {
    console.log(`[Scheduler] 检查晚上是否吃药`);
    const today = new Date().toISOString().split('T')[0];
    const log = getMedLog(today);
    if (!log.evening.taken) {
      console.log(`[Scheduler] 晚上未吃药，通知丈夫`);
      const result = await notifyHusband('evening');
      logPush('wechat_husband', '通知丈夫-晚上未吃药', result.success, result.error);
    } else {
      console.log(`[Scheduler] 晚上已吃药 ✓`);
    }
  }, { timezone: process.env.TZ || 'Asia/Shanghai' });

  console.log(`[Scheduler] 所有定时任务已注册`);
}
