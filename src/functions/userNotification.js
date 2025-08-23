
import {
    json
} from 'https://unpkg.com/@cloudflare/workers-json-response@1.0.0';
import webpush from 'https://cdn.jsdelivr.net/npm/web-push@4.1.1/src/web-push.js';



export default {
    async fetch(request, env) {
        if (request.method !== 'POST') {
            return json({
                error: 'Method Not Allowed'
            }, {
                status: 405
            });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        if (path === '/userNotification') {
            try {
                const payload = await request.json();
                const {
                    recipientSubscription,
                    recipientFullName,
                    title,
                    body,
                    icon,
                    badge,
                    url: notificationUrl
                } = payload;

                if (!recipientSubscription || !title) {
                    return json({
                        error: 'Missing required fields: recipientSubscription, title'
                    }, {
                        status: 400
                    });
                }

                // Saita VAPID details
                webpush.setVapidDetails(
                    'mailto:TauraronWasa.com', 
                    env.VAPID_PUBLIC_KEY,
                    env.VAPID_PRIVATE_KEY
                );

                const subscription = recipientSubscription;
                const notificationPayload = {
                    title,
                    body,
                    icon,
                    badge,
                    url: notificationUrl
                };

                // Tura sanarwar zuwa ga mai amfani
                await webpush.sendNotification(
                    subscription,
                    JSON.stringify(notificationPayload), {
                        headers: {
                            'Urgency': 'high'
                        }
                    }
                );

                return json({
                    message: `Notification sent to ${recipientFullName}`
                });

            } catch (error) {
                console.error("Error sending notification:", error);
                return json({
                    error: 'Failed to send notification',
                    details: error.message
                }, {
                    status: 500
                });
            }
        }

        return json({
            error: 'Not Found'
        }, {
            status: 404
        });
    }
};
