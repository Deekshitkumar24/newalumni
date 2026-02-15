'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AlumniDashboard() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [stats, setStats] = useState({
        myJobs: 0,
        pendingRequests: 0,
        acceptedMentees: 0
    });

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (user.role !== 'alumni') {
            router.push('/dashboard');
            return;
        }

        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/dashboard/alumni');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data.stats);
                } else {
                    console.error('Failed to fetch dashboard stats');
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            }
        };

        fetchDashboardData();
    }, [user, isLoading, router]);

    const handleLogout = () => {
        localStorage.removeItem('vjit_current_user');
        window.location.href = '/';
    };

    if (isLoading || !user) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#800000] mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Dashboard Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#DAA520]">Alumni Dashboard</h1>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-[#800000]">{stats.myJobs}</div>
                    <div className="text-gray-600 mt-1">Jobs Posted</div>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-[#800000]">{stats.pendingRequests}</div>
                    <div className="text-gray-600 mt-1">Pending Mentorship Requests</div>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-[#800000]">{stats.acceptedMentees}</div>
                    <div className="text-gray-600 mt-1">Active Mentees</div>
                </div>
            </div>

            {/* Welcome & Context */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back, {user.name}</h2>
                <p className="text-gray-600">
                    Thank you for staying connected with VJIT. You have posted <span className="font-semibold text-[#800000]">{stats.myJobs} jobs</span> and are currently mentoring <span className="font-semibold text-[#800000]">{stats.acceptedMentees} students</span>.
                </p>
            </div>

            {/* Profile Summary */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold text-[#800000] mb-4">Profile Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Department:</span>
                        <span className="ml-2">{user.department}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Graduation Year:</span>
                        <span className="ml-2">{user.graduationYear}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Current Company:</span>
                        <span className="ml-2">{user.currentCompany || 'Not specified'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Current Role:</span>
                        <span className="ml-2">{user.currentRole || 'Not specified'}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2">{user.email}</span>
                    </div>
                    {user.linkedIn && (
                        <div>
                            <span className="text-gray-500">LinkedIn:</span>
                            <a href={user.linkedIn} target="_blank" rel="noopener noreferrer" className="ml-2 text-[#800000] hover:underline">
                                View Profile
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
