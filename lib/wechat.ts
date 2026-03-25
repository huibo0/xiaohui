/**
 * 微信公众号模板消息推送
 *
 * 需要配置环境变量:
 *   WECHAT_APPID       - 公众号 AppID
 *   WECHAT_APPSECRET   - 公众号 AppSecret
 *   WECHAT_TEMPLATE_ID - 模板消息 ID
 *   WECHAT_OPENID      - 接收人的 OpenID（妻子）
 *   WECHAT_OPENID_HUSBAND - 丈夫的 OpenID
 */

interface AccessToken {
  token: string;
  expiresAt: number;
}

let cachedToken: AccessToken | null = null;

export async function getAccessToken(): Promise<string> {
  // Check cache
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const appId = process.env.WECHAT_APPID;
  const appSecret = process.env.WECHAT_APPSECRET;

  if (!appId || !appSecret) {
    throw new Error('微信配置缺失: 请设置 WECHAT_APPID 和 WECHAT_APPSECRET');
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errmsg}`);
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

interface TemplateData {
  [key: string]: { value: string; color?: string };
}

export async function sendTemplateMessage(
  openId: string,
  templateId: string,
  data: TemplateData,
  url?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getAccessToken();
    const apiUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${token}`;

    const body: any = {
      touser: openId,
      template_id: templateId,
      data,
    };
    if (url) body.url = url;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await res.json();

    if (result.errcode === 0) {
      return { success: true };
    }
    return { success: false, error: `${result.errcode}: ${result.errmsg}` };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ========== 时间格式化工具 ==========

function nowTimeStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function siteUrl(): string {
  return process.env.SITE_URL || 'https://xiaohui.sdfeer.site';
}

// ========== 提醒类型 ==========

export type ReminderType = 'first' | 'followup' | 'final';

// ========== 妻子提醒（3种） ==========

/** 第1次提醒：先喂奶再吃药 */
export async function sendFirstReminder(period: 'morning' | 'evening'): Promise<{ success: boolean; error?: string }> {
  const openId = process.env.WECHAT_OPENID;
  const templateId = process.env.WECHAT_TEMPLATE_ID;
  if (!openId || !templateId) {
    return { success: false, error: '微信配置缺失: WECHAT_OPENID 或 WECHAT_TEMPLATE_ID' };
  }

  const greetings = {
    morning: [
      '早安呀~先给宝宝喂奶，喂完记得吃药哦',
      '早上好，先喂宝宝，然后吃药开启新的一天',
      '太阳出来啦，先喂奶再吃药哦~',
      '早安，宝宝饿了先喂奶，喂完别忘吃药呀',
    ],
    evening: [
      '辛苦了一天~先喂宝宝，喂完记得吃药哦',
      '晚上好，先给宝宝喂奶，然后吃药休息~',
      '今天也辛苦啦，先喂奶再吃药呀',
      '晚安前先喂宝宝，喂完记得吃小药丸哦',
    ],
  };
  const msgs = greetings[period];
  const greeting = msgs[Math.floor(Math.random() * msgs.length)];

  return sendTemplateMessage(openId, templateId, {
    first: { value: greeting, color: '#ec4899' },
    keyword1: { value: '羟氯喹 2片', color: '#333333' },
    keyword2: { value: nowTimeStr(), color: '#333333' },
    remark: { value: '先喂奶，喂完再吃药~ 点这里记录吃药 💊', color: '#999999' },
  }, siteUrl());
}

/** 第2次提醒：催促吃药 */
export async function sendFollowupReminder(period: 'morning' | 'evening'): Promise<{ success: boolean; error?: string }> {
  const openId = process.env.WECHAT_OPENID;
  const templateId = process.env.WECHAT_TEMPLATE_ID;
  if (!openId || !templateId) {
    return { success: false, error: '微信配置缺失' };
  }

  const periodName = period === 'morning' ? '早上' : '晚上';
  const msgs = [
    `喂完奶了吗？${periodName}的药还没吃呢~`,
    `宝宝吃饱了吧？该吃药啦，别忘了哦`,
    `提醒一下，${periodName}的药还没确认吃哦`,
  ];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];

  return sendTemplateMessage(openId, templateId, {
    first: { value: msg, color: '#f59e0b' },
    keyword1: { value: '羟氯喹 2片', color: '#333333' },
    keyword2: { value: nowTimeStr(), color: '#333333' },
    remark: { value: '吃完点这里确认一下~ 💊', color: '#999999' },
  }, siteUrl());
}

/** 第3次提醒：最后催促 */
export async function sendFinalReminder(period: 'morning' | 'evening'): Promise<{ success: boolean; error?: string }> {
  const openId = process.env.WECHAT_OPENID;
  const templateId = process.env.WECHAT_TEMPLATE_ID;
  if (!openId || !templateId) {
    return { success: false, error: '微信配置缺失' };
  }

  const periodName = period === 'morning' ? '早上' : '晚上';

  return sendTemplateMessage(openId, templateId, {
    first: { value: `最后一次提醒啦，${periodName}的药一定要吃哦！`, color: '#ef4444' },
    keyword1: { value: '羟氯喹 2片', color: '#333333' },
    keyword2: { value: nowTimeStr(), color: '#333333' },
    remark: { value: '为了宝宝和自己的健康，记得按时吃药~ 点这里确认 💊', color: '#999999' },
  }, siteUrl());
}

// ========== 丈夫提醒 ==========

/** 通知丈夫：她还没吃药（每5分钟重复） */
export async function notifyHusband(period: 'morning' | 'evening', minutesOverdue?: number): Promise<{ success: boolean; error?: string }> {
  const openId = process.env.WECHAT_OPENID_HUSBAND;
  const templateId = process.env.WECHAT_TEMPLATE_ID;

  if (!openId || !templateId) {
    return { success: false, error: '丈夫 OpenID 未配置' };
  }

  const periodName = period === 'morning' ? '早上' : '晚上';
  const overdueText = minutesOverdue ? `已超时${minutesOverdue}分钟` : '';

  return sendTemplateMessage(openId, templateId, {
    first: { value: `小莲${periodName}的药还没有吃哦 ${overdueText}`, color: '#f59e0b' },
    keyword1: { value: '羟氯喹 2片', color: '#333333' },
    keyword2: { value: nowTimeStr(), color: '#333333' },
    remark: { value: '提醒已经发了但她还没确认，去关心一下她吧~ 💕', color: '#999999' },
  }, siteUrl());
}

// ========== 兼容旧接口（保留给 status API 等可能用到的地方）==========

/** 提醒吃药（兼容旧调用，实际调第1次提醒） */
export async function sendMedReminder(period: 'morning' | 'evening'): Promise<{ success: boolean; error?: string }> {
  return sendFirstReminder(period);
}
