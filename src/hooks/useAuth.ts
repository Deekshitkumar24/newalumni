'use client';

import useSWR from 'swr';
import { useRef, useMemo } from 'react';
import { User } from '@/types';

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isError: any;
    mutate: () => Promise<any>;
}

const fetcher = async (url: string) => {
    const res = await fetch(url, {
        credentials: 'include',
    });
    if (!res.ok) {
        if (res.status === 401) {
            return null;
        }
        throw new Error('Failed to fetch user');
    }
    return res.json();
};

export function useAuth() {
    const { data, error, isLoading, mutate } = useSWR('/api/profile/me', fetcher, {
        shouldRetryOnError: false,
        revalidateOnFocus: false,
    });

    // Deep-compare the user data to prevent infinite re-render loops.
    // SWR returns a new `data` reference on every revalidation, even when
    // the values are unchanged. Without this guard, any useEffect depending
    // on `user` would fire on every revalidation, creating infinite loops.
    const prevSerializedRef = useRef<string>('');
    const stableUserRef = useRef<User | null>(null);

    const fullUser = useMemo(() => {
        let merged: User | null = null;
        if (data?.user && data?.profile) {
            merged = { ...data.user, ...data.profile };
        } else {
            merged = data?.user || null;
        }

        const serialized = JSON.stringify(merged);
        if (serialized !== prevSerializedRef.current) {
            prevSerializedRef.current = serialized;
            stableUserRef.current = merged;
        }

        return stableUserRef.current;
    }, [data]);

    return {
        user: fullUser,
        isLoading,
        isError: error,
        mutate
    };
}
