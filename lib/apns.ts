/**
 * Apple Push Notification Service (APNs)
 *
 * Uses HTTP/2 with token-based authentication (.p8 key)
 *
 * Required env vars:
 *   APNS_KEY_ID        - Key ID from Apple Developer portal
 *   APNS_KEY_PATH      - Path to .p8 key file (e.g., ./AuthKey_XXXX.p8)
 *   APNS_TEAM_ID       - Apple Developer Team ID
 *   APNS_BUNDLE_ID     - App bundle ID (e.g., com.sdfeer.xiaohui)
 *   APNS_PRODUCTION    - "true" for production, omit for sandbox
 */

import * as http2 from 'http2';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { getAllDeviceTokens, logPush } from './db';

const APNS_HOST_SANDBOX = 'https://api.sandbox.push.apple.com';
const APNS_HOST_PRODUCTION = 'https://api.push.apple.com';

interface APNsToken {
  jwt: string;
  issuedAt: number;
}

let cachedJwt: APNsToken | null = null;

function getAPNsHost(): string {
  return process.env.APNS_PRODUCTION === 'true' ? APNS_HOST_PRODUCTION : APNS_HOST_SANDBOX;
}

function generateJWT(): string {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const keyPath = process.env.APNS_KEY_PATH;

  if (!keyId || !teamId || !keyPath) {
    throw new Error('APNs config missing: APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_PATH');
  }

  // Read .p8 key
  const key = fs.readFileSync(keyPath, 'utf8');

  // JWT Header
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })).toString('base64url');

  // JWT Payload
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({ iss: teamId, iat: now })).toString('base64url');

  // Sign
  const signer = crypto.createSign('SHA256');
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(key, 'base64url');

  return `${header}.${payload}.${signature}`;
}

function getJWT(): string {
  // APNs tokens are valid for 1 hour, refresh at 50 minutes
  if (cachedJwt && Date.now() - cachedJwt.issuedAt < 50 * 60 * 1000) {
    return cachedJwt.jwt;
  }
  const jwt = generateJWT();
  cachedJwt = { jwt, issuedAt: Date.now() };
  return jwt;
}

interface APNsPayload {
  aps: {
    alert: {
      title: string;
      body: string;
      subtitle?: string;
    };
    sound?: string;
    badge?: number;
    'mutable-content'?: number;
    category?: string;
  };
  [key: string]: any;
}

async function sendToDevice(
  deviceToken: string,
  payload: APNsPayload
): Promise<{ success: boolean; error?: string }> {
  const bundleId = process.env.APNS_BUNDLE_ID || 'com.sdfeer.xiaohui';

  return new Promise((resolve) => {
    const client = http2.connect(getAPNsHost());

    client.on('error', (err) => {
      resolve({ success: false, error: `Connection error: ${err.message}` });
    });

    const headers = {
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      'authorization': `bearer ${getJWT()}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    };

    const req = client.request(headers);
    let responseData = '';
    let statusCode = 0;

    req.on('response', (headers) => {
      statusCode = headers[':status'] as number;
    });

    req.on('data', (chunk) => {
      responseData += chunk;
    });

    req.on('end', () => {
      client.close();
      if (statusCode === 200) {
        resolve({ success: true });
      } else {
        let error = `HTTP ${statusCode}`;
        try {
          const body = JSON.parse(responseData);
          error = `${statusCode}: ${body.reason || responseData}`;
        } catch {}
        resolve({ success: false, error });
      }
    });

    req.on('error', (err) => {
      client.close();
      resolve({ success: false, error: err.message });
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Send push notification to all registered iOS devices
 */
export async function sendAPNsToAll(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ success: boolean; sent: number; failed: number; error?: string }> {
  // Check if APNs is configured
  if (!process.env.APNS_KEY_ID || !process.env.APNS_KEY_PATH) {
    return { success: false, sent: 0, failed: 0, error: 'APNs not configured' };
  }

  const tokens = getAllDeviceTokens();
  if (tokens.length === 0) {
    return { success: true, sent: 0, failed: 0, error: 'No devices registered' };
  }

  const payload: APNsPayload = {
    aps: {
      alert: { title, body },
      sound: 'default',
      badge: 1,
    },
    ...data,
  };

  let sent = 0;
  let failed = 0;

  for (const token of tokens) {
    const result = await sendToDevice(token, payload);
    if (result.success) {
      sent++;
    } else {
      failed++;
      console.log(`[APNs] Failed to send to ${token.slice(0, 8)}...: ${result.error}`);
    }
  }

  return { success: failed === 0, sent, failed };
}

/**
 * Send medication reminder via APNs
 */
export async function sendMedReminderAPNs(
  period: 'morning' | 'evening',
  reminderType: 'first' | 'followup' | 'final'
): Promise<{ success: boolean; error?: string }> {
  const periodName = period === 'morning' ? '早上' : '晚上';

  let title: string;
  let body: string;

  switch (reminderType) {
    case 'first':
      title = '💊 吃药提醒';
      body = `${periodName}好～先喂宝宝，喂完记得吃药哦`;
      break;
    case 'followup':
      title = '💊 还没吃药哦';
      body = `${periodName}的药还没吃呢，喂完奶记得吃～`;
      break;
    case 'final':
      title = '💊 最后一次提醒';
      body = `${periodName}的药一定要吃哦！为了宝宝和自己的健康～`;
      break;
  }

  const result = await sendAPNsToAll(title, body, {
    type: 'med_reminder',
    period,
    reminderType,
  });

  logPush(`apns_${reminderType}`, `iOS推送-${periodName}${reminderType}`, result.sent > 0, result.error);
  return { success: result.sent > 0, error: result.error };
}

/**
 * Notify husband via APNs (if his device is registered)
 */
export async function notifyHusbandAPNs(
  period: 'morning' | 'evening',
  minutesOverdue: number
): Promise<{ success: boolean; error?: string }> {
  const periodName = period === 'morning' ? '早上' : '晚上';
  const result = await sendAPNsToAll(
    '⚠️ 吃药提醒',
    `小莲${periodName}的药还没吃，已超时${minutesOverdue}分钟`,
    { type: 'husband_notify', period, minutesOverdue }
  );
  return { success: result.sent > 0, error: result.error };
}
