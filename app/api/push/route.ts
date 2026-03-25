import { NextRequest, NextResponse } from 'next/server';
import { sendMedReminder, notifyHusband, sendTemplateMessage } from '@/lib/wechat';
import { logPush } from '@/lib/db';

// POST /api/push  { target: 'wife' | 'husband' | 'both', period?: 'morning' | 'evening' }
export async function POST(req: NextRequest) {
  try {
    const { target, period } = await req.json();
    const p = period || 'morning';
    const results: any[] = [];

    if (target === 'wife' || target === 'both') {
      const result = await sendMedReminder(p);
      logPush('test_wife', `测试推送-${p}`, result.success, result.error);
      results.push({ target: 'wife', ...result });
    }

    if (target === 'husband' || target === 'both') {
      const result = await notifyHusband(p);
      logPush('test_husband', `测试推送-通知丈夫`, result.success, result.error);
      results.push({ target: 'husband', ...result });
    }

    const allSuccess = results.every((r) => r.success);
    // Build detailed message with WeChat error info
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
