/**
 * 微信公众号模板消息推送
 *
 * 需要配置环境变量:
 *   WECHAT_APPID       - 公众号 AppID
 *   WECHAT_APPSECRET   - 公众号 AppSecret
 *   WECHAT_TEMPLATE_ID - 模板消息 ID
 *   WECHAT_OPENID      - 接收人的 OpenID（你妻子关注公众号后的 OpenID）
 *   WECHAT_OPENID_HUSBAND - (可选) 你的 OpenID，用于接收"她还没吃药"的提醒
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

// ========== 预设消息 ==========

/** 提醒吃药 */
export async function sendMedReminder(period: 'morning' | 'evening'): Promise<{ success: boolean; error?: string }> {
  const openId = process.env.WECHAT_OPENID;
  const templateId = process.env.WECHAT_TEMPLATE_ID;

  if (!openId || !templateId) {
    return { success: false, error: '微信配置缺失: WECHAT_OPENID 或 WECHAT_TEMPLATE_ID' };
  }

  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const greetings = {
    morning: [
      '早安呀~新的一天开始啦',
      '早上好，今天也要元气满满哦',
      '太阳出来啦，该吃药咯',
      '早安，先吃药再开始美好的一天',
    ],
    evening: [
      '辛苦了一天，别忘了吃药哦',
      '晚上好~吃完药好好休息',
      '今天也辛苦啦，记得吃药呀',
      '晚安前别忘了小药丸哦',
    ],
  };
  const msgs = greetings[period];
  const greeting = msgs[Math.floor(Math.random() * msgs.length)];

  return sendTemplateMessage(openId, templateId, {
    first: { value: greeting, color: '#ec4899' },
    keyword1: { value: '羟氯喹 2片', color: '#333333' },
    keyword2: { value: timeStr, color: '#333333' },
    remark: { value: '随饭吃，搭配牛奶更好~ 点这里打开小惠记录吃药 💊', color: '#999999' },
  }, process.env.SITE_URL || 'https://xiaohui.sdfeer.site');
}

/** 通知丈夫：她还没吃药 */
export async function notifyHusband(period: 'morning' | 'evening'): Promise<{ success: boolean; error?: string }> {
  const openId = process.env.WECHAT_OPENID_HUSBAND;
  const templateId = process.env.WECHAT_TEMPLATE_ID;

  if (!openId || !templateId) {
    return { success: false, error: '丈夫 OpenID 未配置' };
  }

  const periodName = period === 'morning' ? '早上' : '晚上';
  const now = new Date();
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return sendTemplateMessage(openId, templateId, {
    first: { value: `小莲${periodName}的药还没有吃哦`, color: '#f59e0b' },
    keyword1: { value: '羟氯喹 2片', color: '#333333' },
    keyword2: { value: timeStr, color: '#333333' },
    remark: { value: '提醒已经发了但她还没确认，去关心一下她吧~ 💕', color: '#999999' },
  }, `${process.env.SITE_URL || 'https://xiaohui.sdfeer.site'}`);
}
