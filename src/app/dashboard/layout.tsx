'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isLoading, isError } = useAuth();

    useEffect(() => {
        if (!isLoading && (isError || !user)) {
            router.push('/login');
        }
    }, [user, isLoading, isError, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#800000]"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            <DashboardTopbar />
            <div className="flex min-h-[calc(100vh-72px)]">
                <Sidebar />
                <main className="flex-1 w-full overflow-x-hidden p-6 md:p-8 transition-all duration-300">
                    {children}
                </main>
            </div>
        </div>
    );
}
