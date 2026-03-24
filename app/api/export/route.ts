import { NextRequest, NextResponse } from 'next/server';
import { exportAllData } from '@/lib/db';

// GET /api/export?key=xxx — 导出所有数据（迁移用）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const statusKey = process.env.STATUS_KEY || 'xiaohui2026';

  if (key !== statusKey) {
    return NextResponse.json({ error: '访问密钥不正确' }, { status: 403 });
  }

  const data = exportAllData();
  return NextResponse.json(data);
}
