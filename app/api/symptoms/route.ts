import { NextRequest, NextResponse } from 'next/server';
import { getSymptomLog, saveSymptomLog, getSymptomHistory } from '@/lib/db';

// GET /api/symptoms?date=2026-03-24  或  GET /api/symptoms?history=14
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const days = searchParams.get('history');
  if (days) {
    return NextResponse.json(getSymptomHistory(parseInt(days, 10)));
  }

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const log = getSymptomLog(date);
  return NextResponse.json(log || { date, stiffness: 0, pain: 0, fatigue: 0, mood: 3, notes: '' });
}

// POST /api/symptoms  { date, stiffness, pain, fatigue, mood, notes }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, stiffness, pain, fatigue, mood, notes } = body;

    if (!date) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    }

    saveSymptomLog({ date, stiffness: stiffness || 0, pain: pain || 0, fatigue: fatigue || 0, mood: mood || 3, notes: notes || '' });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
