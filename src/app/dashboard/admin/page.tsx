'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initializeData, getStudents, getAlumni, getActiveJobs, getUpcomingEvents, getMentorshipRequests } from '@/lib/data/store';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalAlumni: 0,
        pendingAlumni: 0,
        activeJobs: 0,
        upcomingEvents: 0,
        mentorships: 0
    });

    useEffect(() => {
        initializeData();

        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        setUser(currentUser);

        // Get stats
        const students = getStudents();
        const alumni = getAlumni();
        const jobs = getActiveJobs();
        const events = getUpcomingEvents();
        const mentorships = getMentorshipRequests();

        setStats({
            totalStudents: students.length,
            totalAlumni: alumni.length,
            pendingAlumni: alumni.filter(a => a.status === 'pending').length,
            activeJobs: jobs.length,
            upcomingEvents: events.length,
            mentorships: mentorships.length
        });
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('vjit_current_user');
        window.location.href = '/';
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Dashboard Header */}
            <div>
                <h1 className="text-3xl font-bold text-[#1a1a2e]">Admin Dashboard</h1>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 p-6 shadow-sm rounded-lg">
                    <div className="text-3xl font-bold text-[#800000]">{stats.pendingAlumni}</div>
                    <div className="text-gray-600 mt-1">Pending Approvals</div>
                </div>
                <div className="bg-white border border-gray-200 p-6 shadow-sm rounded-lg">
                    <div className="text-3xl font-bold text-[#800000]">{stats.totalAlumni}</div>
                    <div className="text-gray-600 mt-1">Total Alumni</div>
                </div>
                <div className="bg-white border border-gray-200 p-6 shadow-sm rounded-lg">
                    <div className="text-3xl font-bold text-[#800000]">{stats.totalStudents}</div>
                    <div className="text-gray-600 mt-1">Total Students</div>
                </div>
                <div className="bg-white border border-gray-200 p-6 shadow-sm rounded-lg">
                    <div className="text-3xl font-bold text-[#800000]">{stats.activeJobs}</div>
                    <div className="text-gray-600 mt-1">Active Jobs</div>
                </div>
            </div>

            {/* System Health / Quick Overview */}
            <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded border border-gray-100">
                        <h3 className="font-semibold text-gray-700 mb-1">Upcoming Events</h3>
                        <p className="text-2xl font-bold text-[#800000]">{stats.upcomingEvents}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded border border-gray-100">
                        <h3 className="font-semibold text-gray-700 mb-1">Active Mentorships</h3>
                        <p className="text-2xl font-bold text-[#800000]">{stats.mentorships}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
