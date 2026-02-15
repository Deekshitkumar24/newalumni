'use client';

import useSWR from 'swr';
import { useState } from 'react';

export interface Notification {
    id: string;
    type: 'mentorship_request' | 'mentorship_accepted' | 'mentorship_rejected' | 'mentorship_force_stopped' | 'job_application_update' | 'new_message' | 'system_alert' | 'job_approved' | 'job_rejected' | 'admin_announcement';
    title: string;
    message: string;
    referenceId?: string;
    metadata?: any;
    isRead: boolean;
    createdAt: string;
    readAt?: string;
}

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
};

export function useNotifications() {
    // Poll every 30 seconds
    const { data, error, mutate } = useSWR('/api/notifications', fetcher, {
        refreshInterval: 30000,
        revalidateOnFocus: true,
    });

    const notifications: Notification[] = data?.data || [];
    // Prefer server-side count if available, otherwise calc from list (fallback)
    const unreadCount = data?.meta?.unreadCount ?? notifications.filter(n => !n.isRead).length;

    const [isMarking, setIsMarking] = useState(false);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH',
            });
            // Optimistic update
            await mutate({
                ...data,
                data: notifications.map(n => n.id === id ? { ...n, isRead: true } : n),
                meta: { ...data?.meta, unreadCount: Math.max(0, unreadCount - 1) }
            }, false);
        } catch (e) {
            console.error('Failed to mark read', e);
        }
    };

    const markAllRead = async () => {
        setIsMarking(true);
        try {
            await fetch('/api/notifications/read-all', {
                method: 'PATCH',
            });
            // Optimistic update
            await mutate({
                ...data,
                data: notifications.map(n => ({ ...n, isRead: true })),
                meta: { ...data?.meta, unreadCount: 0 }
            }, false);
        } catch (e) {
            console.error('Failed to mark all read', e);
        } finally {
            setIsMarking(false);
        }
    };

    return {
        notifications,
        unreadCount,
        isLoading: !data && !error,
        isError: error,
        markAsRead,
        markAllRead,
        isMarking
    };
}
