import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/push-logs?limit=20
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const db = getDb();
  const logs = db.prepare(
    'SELECT id, type, message, success, error, created_at FROM push_logs ORDER BY created_at DESC LIMIT ?'
  ).all(limit);

  return NextResponse.json(logs);
}
