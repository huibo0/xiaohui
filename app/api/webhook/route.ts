import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url, type, message } = await req.json();

    if (!url || !message) {
      return NextResponse.json({ error: 'Missing url or message' }, { status: 400 });
    }

    let body: string;

    switch (type) {
      case 'dingtalk':
        body = JSON.stringify({
          msgtype: 'text',
          text: { content: message },
        });
        break;

      case 'wechat':
        body = JSON.stringify({
          msgtype: 'text',
          text: { content: message },
        });
        break;

      default:
        body = JSON.stringify({ text: message });
        break;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Webhook returned ${response.status}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send webhook' },
      { status: 500 }
    );
  }
}
