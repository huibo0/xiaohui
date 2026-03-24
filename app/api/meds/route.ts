import { NextRequest, NextResponse } from 'next/server';
import { getMedLog, markMedTaken, undoMedTaken, getWeekMedLogs } from '@/lib/db';

// GET /api/meds?date=2026-03-24  或  GET /api/meds?week=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  if (searchParams.get('week')) {
    return NextResponse.json(getWeekMedLogs());
  }

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  return NextResponse.json(getMedLog(date));
}

// POST /api/meds  { date, period, action: 'take' | 'undo', time? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, period, action, time } = body;

    if (!date || !period || !action) {
      return NextResponse.json({ error: 'Missing date, period, or action' }, { status: 400 });
    }

    if (!['morning', 'evening'].includes(period)) {
      return NextResponse.json({ error: 'period must be morning or evening' }, { status: 400 });
    }

    if (action === 'take') {
      const takenAt = time || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      markMedTaken(date, period, takenAt);
    } else if (action === 'undo') {
      undoMedTaken(date, period);
    } else {
      return NextResponse.json({ error: 'action must be take or undo' }, { status: 400 });
    }

    return NextResponse.json(getMedLog(date));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
