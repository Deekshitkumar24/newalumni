'use client';

import useSWR from 'swr';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isError: any;
    mutate: () => Promise<any>;
}

const fetcher = async (url: string) => {
    const res = await fetch(url, {
        credentials: 'include', // Ensure cookies are sent
    });
    if (!res.ok) {
        if (res.status === 401) {
            // Return null for 401 to signify "not logged in" but valid state
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
        // No global onError needed for 401 since we handle it in fetcher now
    });

    // If data is null (from 401) or valid user data, we are done loading.
    // data?.data assumes the API returns { data: user } or similar. 
    // Based on previous analysis of api/profile/me, it returns { user: ..., profile: ... }
    // Let's check the API response structure again to be sure.
    // The API /api/profile/me returns { user: {...}, profile: {...} } directly.
    // So 'data' will be that object or null.

    // However, the original code had `user: data?.data || null`. 
    // Let's double check if the previous fetcher was doing something different or if the usage was wrong.
    // The previous fetcher just returned `res.json()`.
    // The API route returns `NextResponse.json({ user: ..., profile: ... })`.
    // So `data` from SWR will be `{ user: ..., profile: ... }`.
    // The original code `data?.data` might have been wrong if the API returns `{ user: ... }` at the top level.
    // I will assume standard SWR behavior: data is the response body.

    // Merge user and profile data to match Student/Alumni types
    const fullUser = data?.user && data?.profile
        ? { ...data.user, ...data.profile }
        : data?.user || null;

    return {
        user: fullUser,
        isLoading,
        isError: error,
        mutate
    };
}
