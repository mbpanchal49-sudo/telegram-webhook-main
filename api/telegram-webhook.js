const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const update = req.body;

    if (update && update.chat_join_request) {
      const user = update.chat_join_request.from;
      const chatId = update.chat_join_request.chat.id;

      await db.collection('campaign_stats').add({
        event_type: 'telegram_join_request',
        user_id: user.id || 0,
        first_name: user.first_name || '',
        username: user.username ? `@${user.username}` : 'N/A',
        chat_id: chatId,
        created_at: new Date().toISOString()
      });
    }

    return res.status(200).json({ status: 'success' });
  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
