import Pusher from 'pusher-js';

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY;
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export const pusherClient = (PUSHER_KEY && PUSHER_CLUSTER)
    ? new Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
        authEndpoint: '/api/pusher/auth',
    })
    : {
        subscribe: () => ({ bind: () => { }, unbind: () => { } }),
        unsubscribe: () => { },
        signin: () => { },
    } as any; // Mock for development without keys
