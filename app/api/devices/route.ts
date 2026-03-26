import { NextRequest, NextResponse } from 'next/server';
import { registerDevice, unregisterDevice } from '@/lib/db';

// POST /api/devices — register or unregister iOS device token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, name, action } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing device token' }, { status: 400 });
    }

    if (action === 'unregister') {
      unregisterDevice(token);
      return NextResponse.json({ success: true, message: 'Device unregistered' });
    }

    // Default: register
    registerDevice(token, name);
    return NextResponse.json({ success: true, message: 'Device registered' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
