import { NextRequest, NextResponse } from 'next/server';
import { getMedLog, getWeekMedLogs, getSymptomHistory } from '@/lib/db';

// GET /api/status?key=xxx — 你查看她的状态
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const statusKey = process.env.STATUS_KEY || 'xiaohui2026';

  if (key !== statusKey) {
    return NextResponse.json({ error: '访问密钥不正确' }, { status: 403 });
  }

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayLog = getMedLog(today);
  const weekLogs = getWeekMedLogs();
  const recentSymptoms = getSymptomHistory(7);

  return NextResponse.json({
    today: todayLog,
    week: weekLogs,
    symptoms: recentSymptoms,
    generatedAt: new Date().toISOString(),
  });
}
