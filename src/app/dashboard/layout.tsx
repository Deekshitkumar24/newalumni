'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import { initializeData, getStudentById, getAlumniById } from '@/lib/data/store';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeData();

        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        let freshUser = currentUser;

        // Refresh user data based on role to get latest status/details
        if (currentUser.role === 'student') {
            freshUser = getStudentById(currentUser.id) || currentUser;
        } else if (currentUser.role === 'alumni') {
            freshUser = getAlumniById(currentUser.id) || currentUser;
        }
        // Admin user is simpler, usually just from local storage or minimal fetch

        setUser(freshUser);
        setLoading(false);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#800000]"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            <DashboardTopbar />
            <div className="flex min-h-[calc(100vh-72px)]">
                <Sidebar user={user} />
                <main className="flex-1 w-full overflow-x-hidden p-6 md:p-8 transition-all duration-300">
                    {children}
                </main>
            </div>
        </div>
    );
}
