'use client';

import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { pusherClient } from '@/lib/pusherClient';
import { useAuth } from '@/hooks/useAuth';
import { Conversation, Message } from '@/types';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

export function useChat(conversationId?: string) {
    const { user } = useAuth();

    // 1. Fetch Conversations
    const { data: convData, mutate: mutateConvs } = useSWR('/api/conversations', fetcher);
    const conversations: Conversation[] = convData?.data || [];

    // 2. Fetch Messages (if conversationId is active)
    const { data: msgData, mutate: mutateMsgs } = useSWR(
        conversationId && conversationId !== 'new' ? `/api/conversations/${conversationId}/messages` : null,
        fetcher
    );
    const messages: Message[] = msgData?.data || [];

    // 3. Real-time Subscription
    useEffect(() => {
        if (!user || !conversationId || conversationId === 'new') return;

        const channelName = `private-conversation-${conversationId}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind('new_message', (newMessage: Message) => {
            // Optimistically update messages
            mutateMsgs((prev: any) => {
                const current = prev?.data || [];
                // Deduplicate
                if (current.find((m: Message) => m.id === newMessage.id)) return prev;
                return { ...prev, data: [...current, newMessage] };
            }, false);

            // Also update conversation list (refresh unread counts)
            mutateConvs();
        });

        return () => {
            pusherClient.unsubscribe(channelName);
        };
    }, [conversationId, user, mutateMsgs, mutateConvs]);

    const sendMessage = async (content: string) => {
        if (!conversationId) return;

        try {
            await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ content })
            });
            mutateMsgs();
            mutateConvs();
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    // Mark conversation as read
    const markAsRead = async (convId: string) => {
        try {
            await fetch(`/api/conversations/${convId}/read`, {
                method: 'PATCH',
                credentials: 'include',
            });
            // Optimistically set unreadCount to 0 locally
            mutateConvs((prev: any) => {
                if (!prev?.data) return prev;
                return {
                    ...prev,
                    data: prev.data.map((c: any) =>
                        c.id === convId ? { ...c, unreadCount: 0 } : c
                    )
                };
            }, false);
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    return {
        conversations,
        messages,
        sendMessage,
        markAsRead,
        mutateConversations: mutateConvs,
        isLoading: !convData,
    };
}
