'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Admin } from '@/types';
import { initializeData, getStudents, getAlumni, getUpcomingEvents, getActiveJobs } from '@/lib/data/store';

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<Admin | null>(null);
    const [stats, setStats] = useState({
        totalStudents: 0,
        pendingStudents: 0,
        totalAlumni: 0,
        pendingAlumni: 0,
        upcomingEvents: 0,
        activeJobs: 0
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
        const events = getUpcomingEvents();
        const jobs = getActiveJobs();

        setStats({
            totalStudents: students.length,
            pendingStudents: students.filter(s => s.status === 'pending').length,
            totalAlumni: alumni.length,
            pendingAlumni: alumni.filter(a => a.status === 'pending').length,
            upcomingEvents: events.length,
            activeJobs: jobs.length
        });
    }, [router]);

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Dashboard Header */}
            <div className="bg-[#1a1a2e] text-white py-6">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                    <p className="mt-1 text-gray-300">Welcome, {user.name}</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <div className="bg-white border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-[#800000]">{stats.totalStudents}</div>
                        <div className="text-sm text-gray-600">Total Students</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pendingStudents}</div>
                        <div className="text-sm text-gray-600">Pending Students</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-[#800000]">{stats.totalAlumni}</div>
                        <div className="text-sm text-gray-600">Total Alumni</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pendingAlumni}</div>
                        <div className="text-sm text-gray-600">Pending Alumni</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-[#800000]">{stats.upcomingEvents}</div>
                        <div className="text-sm text-gray-600">Upcoming Events</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-4">
                        <div className="text-2xl font-bold text-[#800000]">{stats.activeJobs}</div>
                        <div className="text-sm text-gray-600">Active Jobs</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/dashboard/admin/users" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">👥</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">User Management</h2>
                        <p className="text-gray-600 text-sm">View, approve, or reject student and alumni registrations.</p>
                        {(stats.pendingStudents + stats.pendingAlumni) > 0 && (
                            <span className="inline-block mt-2 bg-red-100 text-red-700 text-xs px-2 py-1">
                                {stats.pendingStudents + stats.pendingAlumni} pending approvals
                            </span>
                        )}
                    </Link>

                    <Link href="/dashboard/admin/events" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">📅</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Event Management</h2>
                        <p className="text-gray-600 text-sm">Create, edit, and manage alumni events.</p>
                    </Link>

                    <Link href="/dashboard/admin/slider" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">🖼️</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Slider Management</h2>
                        <p className="text-gray-600 text-sm">Manage homepage slider images.</p>
                    </Link>

                    <Link href="/dashboard/admin/notices" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">📢</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Notices</h2>
                        <p className="text-gray-600 text-sm">Post and manage notices for the portal.</p>
                    </Link>

                    <Link href="/dashboard/admin/gallery" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">📷</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Gallery</h2>
                        <p className="text-gray-600 text-sm">Manage photo gallery of alumni events.</p>
                    </Link>

                    <Link href="/dashboard/admin/jobs" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">💼</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Job Listings</h2>
                        <p className="text-gray-600 text-sm">Monitor and moderate job postings.</p>
                    </Link>
                </div>

                {/* Pending Approvals Alert */}
                {(stats.pendingStudents + stats.pendingAlumni) > 0 && (
                    <div className="mt-8 bg-yellow-50 border border-yellow-200 p-6">
                        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Pending Approvals</h3>
                        <p className="text-yellow-700 text-sm mb-3">
                            There are {stats.pendingStudents + stats.pendingAlumni} registration(s) awaiting your approval.
                        </p>
                        <Link
                            href="/dashboard/admin/users"
                            className="text-sm bg-[#800000] text-white px-4 py-2 hover:bg-[#660000] inline-block"
                        >
                            Review Now
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
