import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setMultipleSettings } from '@/lib/db';

// GET /api/settings
export async function GET() {
  return NextResponse.json(getAllSettings());
}

// POST /api/settings  { morningTime: '08:00', eveningTime: '20:00', ... }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    setMultipleSettings(body);
    return NextResponse.json({ success: true, settings: getAllSettings() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
