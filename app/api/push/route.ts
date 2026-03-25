import { NextRequest, NextResponse } from 'next/server';
import {
  sendFirstReminder,
  sendFollowupReminder,
  sendFinalReminder,
  notifyHusband,
} from '@/lib/wechat';
import { logPush } from '@/lib/db';

/**
 * POST /api/push
 *
 * 测试推送接口，支持 3 种提醒类型：
 *   type: 'first'    - 第1次提醒（先喂奶再吃药）→ 妻子
 *   type: 'followup' - 第2次提醒（催促吃药）    → 妻子 + 丈夫
 *   type: 'final'    - 第3次提醒（最后催促）    → 妻子 + 丈夫
 *
 *   period: 'morning' | 'evening'（默认 morning）
 *
 * 兼容旧接口：
 *   target: 'wife' | 'husband' | 'both'
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, target, period: p } = body;
    const period = p || 'morning';
    const results: any[] = [];

    // 新接口：按提醒类型测试
    if (type) {
      if (type === 'first') {
        // 第1次：只推妻子
        const r = await sendFirstReminder(period);
        logPush('test_first', `测试-第1次提醒(先喂奶)`, r.success, r.error);
        results.push({ target: 'wife', type: 'first', ...r });
      } else if (type === 'followup') {
        // 第2次：推妻子 + 丈夫
        const r1 = await sendFollowupReminder(period);
        logPush('test_followup_wife', `测试-第2次提醒(催促)`, r1.success, r1.error);
        results.push({ target: 'wife', type: 'followup', ...r1 });

        const r2 = await notifyHusband(period, 30);
        logPush('test_followup_husband', `测试-第2次丈夫通知`, r2.success, r2.error);
        results.push({ target: 'husband', type: 'followup', ...r2 });
      } else if (type === 'final') {
        // 第3次：推妻子 + 丈夫
        const r1 = await sendFinalReminder(period);
        logPush('test_final_wife', `测试-第3次提醒(最后)`, r1.success, r1.error);
        results.push({ target: 'wife', type: 'final', ...r1 });

        const r2 = await notifyHusband(period, 60);
        logPush('test_final_husband', `测试-第3次丈夫通知`, r2.success, r2.error);
        results.push({ target: 'husband', type: 'final', ...r2 });
      }
    }
    // 兼容旧接口
    else if (target) {
      if (target === 'wife' || target === 'both') {
        const result = await sendFirstReminder(period);
        logPush('test_wife', `测试推送-${period}`, result.success, result.error);
        results.push({ target: 'wife', ...result });
      }
      if (target === 'husband' || target === 'both') {
        const result = await notifyHusband(period);
        logPush('test_husband', `测试推送-通知丈夫`, result.success, result.error);
        results.push({ target: 'husband', ...result });
      }
    }

    const allSuccess = results.every((r) => r.success);
    const failedResults = results.filter((r) => !r.success);
    let message = '';
    if (allSuccess) {
      message = '推送成功！去微信看看有没有收到';
    } else {
      const errorDetails = failedResults.map((r) => `${r.target}: ${r.error || '未知错误'}`).join('; ');
      message = `推送失败 — ${errorDetails}`;
    }
    return NextResponse.json({ success: allSuccess, results, message });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
