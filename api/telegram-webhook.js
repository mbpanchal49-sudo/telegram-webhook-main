export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const update = req.body;
            console.log("Received Telegram Update:", JSON.stringify(update, null, 2));

            // Telegram ko 200 OK response dena zaroori hota hai
            return res.status(200).json({ status: 'ok', message: 'Webhook received successfully' });
        } catch (error) {
            console.error("Webhook processing error:", error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        // Agar browser se direct GET request aati hai
        return res.status(200).json({ 
            status: 'online', 
            message: 'Telegram Webhook Endpoint Ready (Send POST requests here)' 
        });
    }
}
