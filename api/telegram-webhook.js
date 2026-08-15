// api/telegram-webhook.js
const crypto = require('crypto');

// Direct Configuration (Pre-configured for Client)
const TELEGRAM_BOT_TOKEN = "8877169399:AAEd_UjoU6P-YjkRkQssYWaEiNv9JOHhcbk";
const TARGET_INVITE_LINK = "https://t.me/+DZ_iI3oNxIZlNzZl";
const PIXEL_ID = "2190769568449496";
const ACCESS_TOKEN = "EAAepgs3b1ZBIBSJQ9vHrCX57JhfiFF77312mCUL8Wj6az0VAwSOhBpgdLpH3y325j7lsbOUzTreAvpIOEHZALi57dJs8N9DtKn7rS7DVZAcguzexya0sU14jZCqmlPgemuL83MqSCFFNhiTrozKSzTcYsqKYC7uNT2LT9nUXD4zflHsu1jziqNmcSZAoOXAZDZD";
const FIREBASE_DB_URL = "https://hydra-ujjawal-api-default-rtdb.firebaseio.com";

function hashData(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(String(data).trim().toLowerCase()).digest('hex');
}

// Check if user has already triggered CAPI (Deduplication)
async function isDuplicateRequest(telegramId) {
    if (!FIREBASE_DB_URL) return false;
    try {
        const url = `${FIREBASE_DB_URL}/processed_users/${telegramId}.json`;
        const res = await fetch(url);
        const data = await res.json();
        return data !== null;
    } catch (e) {
        return false;
    }
}

async function markUserProcessed(telegramId, eventData) {
    if (!FIREBASE_DB_URL) return;
    const url = `${FIREBASE_DB_URL}/processed_users/${telegramId}.json`;
    await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });
}

async function sendMetaCapiEvent(userData, eventId) {
    const url = `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;
    
    const payload = {
        data: [
            {
                event_name: 'Lead',
                event_time: Math.floor(Date.now() / 1000),
                event_id: eventId,
                action_source: 'system_generated',
                user_data: {
                    external_id: [hashData(userData.telegram_id)],
                    fn: userData.first_name ? hashData(userData.first_name) : undefined,
                    ln: userData.last_name ? hashData(userData.last_name) : undefined,
                },
                custom_data: {
                    lead_event_source: 'telegram_join_request',
                    invite_link: TARGET_INVITE_LINK
                }
            }
        ]
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    return response.json();
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const update = req.body;

        // IGNORE: Channel Left / Kicked Events
        if (update.chat_member && (update.chat_member.new_chat_member.status === 'left' || update.chat_member.new_chat_member.status === 'kicked')) {
            return res.status(200).json({ status: 'ignored', reason: 'User left the channel' });
        }

        // PROCESS ONLY: chat_join_request
        if (!update || !update.chat_join_request) {
            return res.status(200).json({ status: 'ignored', reason: 'Not a chat join request' });
        }

        const joinRequest = update.chat_join_request;
        const user = joinRequest.from;
        const inviteLinkUsed = joinRequest.invite_link ? joinRequest.invite_link.invite_link : null;

        // Link Verification Filter
        if (TARGET_INVITE_LINK && inviteLinkUsed !== TARGET_INVITE_LINK) {
            return res.status(200).json({ status: 'filtered', reason: 'Invite link mismatch' });
        }

        // Deduplication Check
        const isDuplicate = await isDuplicateRequest(user.id);
        if (isDuplicate) {
            return res.status(200).json({ status: 'filtered', reason: 'Duplicate join request ignored' });
        }

        const eventId = `tgrq_${joinRequest.chat.id}_${user.id}`;
        const userData = {
            telegram_id: String(user.id),
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            username: user.username || '',
            chat_id: joinRequest.chat.id,
            timestamp: new Date().toISOString()
        };

        const [capiResult] = await Promise.all([
            sendMetaCapiEvent(userData, eventId),
            markUserProcessed(user.id, { ...userData, invite_link: inviteLinkUsed, event_id: eventId })
        ]);

        return res.status(200).json({ status: 'success', event_id: eventId, meta_capi: capiResult });

    } catch (error) {
        console.error('Webhook Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
