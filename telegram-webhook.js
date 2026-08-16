const admin = require('firebase-admin');

function normalizePrivateKey(value) {
  return String(value || '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .trim();
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'hydra-ujjawal-api',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@hydra-ujjawal-api.iam.gserviceaccount.com',
      privateKey: normalizePrivateKey(
        process.env.FIREBASE_PRIVATE_KEY ||
        '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDJpqxVlVP3V22U\nIZdiF9rX99n3m6/y4Mkwv1oObcbvkNvryOYQR4vww85Tv6sHIIkfTR5EDU7CCSlI\nkYepZS8FPoXjpGrF8ElmwAKeN8U7UnKz4Iw30kGzkK73R7GPr4eEB8HYFPATiJ0v\nyOz/MqapYdp0vb22iGNiBlo5moKpqWzJwpzrkP+mwkYRDgfqymGddXq9ZUBhExxr\nNFPWkTV470BrQ/2J/FgblGlhMAS+R41gwbZ93E7vXVobyvJMqY6simX+vbgxF22a\nQpW54NweJbY5WTvDd13ZodBuQefmLcBexu8JjHHkwXp/MbplmX98FOLW4f3DAs5f\ng4Ljr3GvAgMBAAECggEAVy+EoGY1jSIUYzEY4lUdDjZ/29JJAzKUWkrJlaZ6Fldj\n9rCAZDaC92C5gzVCLY0wLEPsG5FDZZqPamxdoux4JYTQX8nVTmqjWdUX7K+BS7JM\nnnKAwD+yM8qXSOGEbkNvcNEYkVhhLaq6tA52UdoxAScjgqovlDBgxHA9SEEjRSKg\n+28fLJpGQJ2/gBa2MLoLwH4A+d1M8NsgAXBUHq+JQ1+UcG5JvaL9Ipv9NDaZVBKJ\n6JELS4kOzQu41NpuY8Nt5ciG6HnfU9y0HeKaI3GW5n9McRFTYWYm+0aWJF/pN1V6\nVJ+g2Ix4MIHf+j/CdzlfkPry51liSW6E2hSmEmKs3QKBgQD+sgRZu5RrFgleeAsu\nShzOclMM7yKjJKGdygH3EbPuO/R0ICrpuNzEn2DrTnQ+r3MUzonIpD3Y8OxvD/2K\nhWTbXUZvix2KB6b/hIO/FKBVnI4pPaj3Skro/8OeLyiGurc2u+2xJbtU2z7LxpkQ\nyubZBWhetImIZj2CihWB+un4QwKBgQDKrxlW3N+O18eJAJrAOjgOtjqbFpyAUJ8c\nknCxCyy88kPSZ7jYAiy1wKVrpljd8aGesRTDXl/xZGDYwT8XEg3OAm1GteWBLcC/\ncfyd6rVA/2pFE/Ukq2RngMlBOxCQxDD17tkaHHzx5apEi5jsLjBvuD81IN2kDOSb\ni4yaNUYwJQKBgQCKMj16EvXtRP/AapJmg4At5Ip7siWxL+chnsKCNPDUi2OQvwOJ\n3eysI26LPv6EJN7ko0zPuY51cARaHusLhmW7QVk+nNViV9SdQGHcBG0bBt98MSDF\nTWJoGp8h7aSnthhDcqT+QeLroCrqls/m9LFdgDmpaXxWrmMhuZsB9AuP0QKBgQCS\nF1/GUnH5PeMfBwaEI/Kf+A2KF+Q6QOJO7+a2Vf2rO1xTXlvHptmfL/qL+1z2rOH3\nxl/W6kFxdw6vbasR7/tvUCR/4UBJujbCR2D0WmbHMNLic54xDjDSwetOT0qDbkZ0\nHfLydTJCEW6G9bAGHMzg2gcFPmlDg9+LliyEQn4S2QKBgQDKFVVtbtUbKTOqFxZY\nOpidGQYIf9yhTuWf/9jLV9+KDmCYJ5jMdNPM9H9mcva/0E7O7pzlcB1E6RlmjjEy\n+Cs7yDAYxUoupFHxB/Ak8+pgFSjX1ZASt0iqMTE5C34H4oBvAz6E0GyKKTCoWbUY\nIzSkt5JzeVxbNAy994oqocF3dw==\n-----END PRIVATE KEY-----\n'
      )
    })
  });
}

const crypto = require('crypto');

const db = admin.firestore();

const META_PIXEL_ID = process.env.META_PIXEL_ID || '2190769568449496';
const META_EVENT_NAME = process.env.META_EVENT_NAME || 'Lead';
const CAMPAIGN_ID = process.env.CAMPAIGN_ID || 'ujjawal_landing';
const TRACKED_INVITE_LINK = process.env.TELEGRAM_INVITE_LINK || 'https://t.me/+DZ_iI3oNxIZlNzZl';

function normalizeInviteLink(link) {
  if (!link) return '';
  return String(link)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .replace('t.me/joinchat/', 't.me/+');
}

function isLandingPageInvite(inviteLink) {
  const incoming = normalizeInviteLink(inviteLink);
  const expected = normalizeInviteLink(TRACKED_INVITE_LINK);
  return Boolean(incoming && expected && incoming === expected);
}

function sha256(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

function getEventSourceUrl() {
  if (process.env.LANDING_PAGE_URL) return process.env.LANDING_PAGE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/`;
  }
  return undefined;
}

function cleanObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

async function approveTelegramJoinRequest({ chatId, userId }) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set');
  }

  const url = `https://api.telegram.org/bot${botToken}/approveChatJoinRequest`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      user_id: userId
    })
  });

  const result = await response.json();
  if (result.ok) {
    return { approved: true, already_member: false };
  }

  const description = (result.description || '').toLowerCase();
  const alreadyHandled =
    description.includes('already') ||
    description.includes('hide_requester_missing') ||
    description.includes('user_already_participant');

  if (alreadyHandled) {
    return { approved: true, already_member: true };
  }

  throw new Error(result.description || 'Telegram approveChatJoinRequest failed');
}

async function sendMetaJoinConversion({ userId, firstName, eventId }) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('META_ACCESS_TOKEN is not set');
  }

  const event = cleanObject({
    event_name: META_EVENT_NAME,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: 'website',
    event_source_url: getEventSourceUrl(),
    user_data: cleanObject({
      external_id: sha256(String(userId)),
      fn: sha256(firstName)
    })
  });

  const payload = { data: [event] };
  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!response.ok || result.error) {
    const message = result.error && result.error.message ? result.error.message : 'Meta CAPI request failed';
    throw new Error(message);
  }

  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const update = req.body;

    if (update && update.chat_join_request) {
      const joinRequest = update.chat_join_request;
      const user = joinRequest.from;
      const chatId = joinRequest.chat.id;
      const userId = user.id || 0;
      const incomingInvite = joinRequest.invite_link && joinRequest.invite_link.invite_link
        ? joinRequest.invite_link.invite_link
        : '';

      if (!isLandingPageInvite(incomingInvite)) {
        return res.status(200).json({
          status: 'ignored',
          reason: 'invite_link_mismatch'
        });
      }

      const eventId = `tg_join_${CAMPAIGN_ID}_${userId}_${chatId}`;
      const docRef = db.collection('campaign_stats').doc(eventId);
      const existing = await docRef.get();

      if (existing.exists) {
        return res.status(200).json({ status: 'duplicate' });
      }

      const approveResult = await approveTelegramJoinRequest({ chatId, userId });

      const metaResult = await sendMetaJoinConversion({
        userId,
        firstName: user.first_name || '',
        eventId
      });

      await docRef.set({
        event_type: 'telegram_join_request',
        campaign_id: CAMPAIGN_ID,
        user_id: userId,
        first_name: user.first_name || '',
        username: user.username ? `@${user.username}` : 'N/A',
        chat_id: chatId,
        invite_link: incomingInvite,
        approved: true,
        already_member: approveResult.already_member || false,
        meta_event: META_EVENT_NAME,
        meta_event_id: eventId,
        meta_events_received: metaResult.events_received || 0,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
};
