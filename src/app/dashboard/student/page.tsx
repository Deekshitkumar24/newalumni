'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Student } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StudentDashboard() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [stats, setStats] = useState({
        upcomingEvents: 0,
        pendingRequests: 0,
        acceptedMentors: 0
    });

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        if (user.role !== 'student') {
            router.push('/dashboard');
            return;
        }

        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/dashboard/student');
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
                <h1 className="text-3xl font-bold text-[#800000]">Student Dashboard</h1>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-[#800000]">{stats.upcomingEvents}</div>
                    <div className="text-gray-600 mt-1">Upcoming Events</div>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-[#800000]">{stats.pendingRequests}</div>
                    <div className="text-gray-600 mt-1">Pending Mentorship Requests</div>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                    <div className="text-3xl font-bold text-[#800000]">{stats.acceptedMentors}</div>
                    <div className="text-gray-600 mt-1">Connected Mentors</div>
                </div>
            </div>

            {/* Welcome & Context */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to your Dashboard</h2>
                <p className="text-gray-600">
                    Here's what's happening in your network today. You have <span className="font-semibold text-[#800000]">{stats.upcomingEvents} upcoming events</span> and <span className="font-semibold text-[#800000]">{stats.pendingRequests} pending mentorship requests</span>.
                </p>
            </div>

            {/* Profile Summary */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold text-[#800000] mb-4">Profile Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Roll Number:</span>
                        <span className="ml-2">{user.rollNumber}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Department:</span>
                        <span className="ml-2">{user.department}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Graduation Year:</span>
                        <span className="ml-2">{user.graduationYear}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Email:</span>
                        <span className="ml-2">{user.email}</span>
                    </div>
                    {user.skills && user.skills.length > 0 && (
                        <div className="md:col-span-2">
                            <span className="text-gray-500">Skills:</span>
                            <span className="ml-2">{user.skills.join(', ')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
