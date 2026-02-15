import Pusher from 'pusher';

let pusherServer: Pusher | null = null;

try {
    if (process.env.PUSHER_APP_ID && process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.PUSHER_SECRET && process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
        pusherServer = new Pusher({
            appId: process.env.PUSHER_APP_ID,
            key: process.env.NEXT_PUBLIC_PUSHER_KEY,
            secret: process.env.PUSHER_SECRET,
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            useTLS: true,
        });
    } else {
        console.warn('⚠️ Pusher env vars not configured. Real-time events disabled.');
    }
} catch (e) {
    console.warn('⚠️ Pusher initialization failed:', e);
}

export { pusherServer };
