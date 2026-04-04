import { NextResponse } from 'next/server';
import { getMedStats } from '@/lib/db';

// GET /api/meds/stats
export async function GET() {
  try {
    return NextResponse.json(getMedStats());
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
