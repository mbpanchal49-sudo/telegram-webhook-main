const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = {
    "type": "service_account",
    "project_id": "hydra-ujjawal-api",
    "private_key_id": "f38830f9b3ab87479c9a4ee2b64ac0b8baa60116",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDJpqxVlVP3V22U\nIZdiF9rX99n3m6/y4Mkwv1oObcbvkNvryOYQR4vww85Tv6sHIIkfTR5EDU7CCSlI\nkYepZS8FPoXjpGrF8ElmwAKeN8U7UnKz4Iw30kGzkK73R7GPr4eEB8HYFPATiJ0v\nyOz/MqapYdp0vb22iGNiBlo5moKpqWzJwpzrkP+mwkYRDgfqymGddXq9ZUBhExxr\nNFPWkTV470BrQ/2J/FgblGlhMAS+R41gwbZ93E7vXVobyvJMqY6simX+vbgxF22a\nQpW54NweJbY5WTvDd13ZodBuQefmLcBexu8JjHHkwXp/MbplmX98FOLW4f3DAs5f\ng4Ljr3GvAgMBAAECggEAVy+EoGY1jSIUYzEY4lUdDjZ/29JJAzKUWkrJlaZ6Fldj\n9rCAZDaC92C5gzVCLY0wLEPsG5FDZZqPamxdoux4JYTQX8nVTmqjWdUX7K+BS7JM\nnKAwD+yM8qXSOGEbkNvcNEYkVhhLaq6tA52UdoxAScjgqovlDBgxHA9SEEjRSKgN\n+28fLJpGQJ2/gBa2MLoLwH4A+d1M8NsgAXBUHq+JQ1+UcG5JvaL9Ipv9NDaZVBKJ\n6JELS4kOzQu41NpuY8Nt5ciG6HnfU9y0HeKaI3GW5n9McRFTYWYm+0aWJF/pN1V6\nVJ+g2Ix4MIHf+j/CdzlfkPry51liSW6E2hSmEmKs3QKBgQD+sgRZu5RrFgleeAsu\nShzOclMM7yKjJKGdygH3EbPuO/R0ICrpuNzEn2DrTnQ+r3MUzonIpD3Y8OxvD/2K\nhWTbXUZvix2KB6b/hIO/FKBVnI4pPaj3Skro/8OeLyiGurc2u+2xJbtU2z7LxpkQ\nyubZBWhetImIZj2CihWB+un4QwKBgQDKrxlW3N+O18eJAJrAOjgOtjqbFpyAUJ8c\nknCxCyy88kPSZ7jYAiy1wKVrpljd8aGesRTDXl/xZGDYwT8XEg3OAm1GteWBLcC/\ncfyd6rVA/2pFE/Ukq2RngMlBOxCQxDD17tkaHHzx5apEi5jsLjBvuD81IN2kDOSb\ni4yaNUYwJQKBgQCKMj16EvXtRP/AapJmg4At5Ip7siWxL+chnsKCNPDUi2OQvwOJ\3eysI26LPv6EJN7ko0zPuY51cARaHusLhmW7QVk+nNViV9SdQGHcBG0bBt98MSDF\nTWJoGp8h7aSnthhDcqT+QeLroCrqls/m9LFdgDmpaXxWrmMhuZsB9AuP0QKBgQCS\F1/GUnH5PeMfBwaEI/Kf+A2KF+Q6QOJO7+a2Vf2rO1xTXlvHptmfL/qL+1z2rOH3\xl/W6kFxdw6vbasR7/tvUCR/4UBJujbCR2D0WmbHMNLic54xDjDSwetOT0qDbkZ0\nHfLydTJCEW6G9bAGHMzg2gcFPmlDg9+LliyEQn4S2QKBgQDKFVVtbtUbKTOqFxZY\nOpidGQYIf9yhTuWf/9jLV9+KDmCYJ5jMdNPM9H9mcva/0E7O7pzlcB1E6RlmjjEy\+Cs7yDAYxUoupFHxB/Ak8+pgFSjX1ZASt0iqMTE5C34H4oBvAz6E0GyKKTCoWbUY\nIzSkt5JzeVxbNAy994oqocF3dw==\n----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fbsvc@hydra-ujjawal-api.iam.gserviceaccount.com",
    "client_id": "106286854256551768527",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40hydra-ujjawal-api.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  };

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
