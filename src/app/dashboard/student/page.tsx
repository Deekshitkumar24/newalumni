'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Student } from '@/types';
import { initializeData, getUpcomingEvents, getMentorshipRequestsByStudent } from '@/lib/data/store';

export default function StudentDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<Student | null>(null);
    const [stats, setStats] = useState({
        upcomingEvents: 0,
        pendingRequests: 0,
        acceptedMentors: 0
    });

    useEffect(() => {
        initializeData();

        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'student') {
            router.push('/login');
            return;
        }

        setUser(currentUser);

        // Get stats
        const events = getUpcomingEvents();
        const requests = getMentorshipRequestsByStudent(currentUser.id);

        setStats({
            upcomingEvents: events.length,
            pendingRequests: requests.filter(r => r.status === 'pending').length,
            acceptedMentors: requests.filter(r => r.status === 'accepted').length
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
            <div className="bg-[#800000] text-white py-6">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-semibold">Student Dashboard</h1>
                    <p className="mt-1 text-gray-200">Welcome back, {user.name}</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 p-6">
                        <div className="text-3xl font-bold text-[#800000]">{stats.upcomingEvents}</div>
                        <div className="text-gray-600 mt-1">Upcoming Events</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-6">
                        <div className="text-3xl font-bold text-[#800000]">{stats.pendingRequests}</div>
                        <div className="text-gray-600 mt-1">Pending Mentorship Requests</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-6">
                        <div className="text-3xl font-bold text-[#800000]">{stats.acceptedMentors}</div>
                        <div className="text-gray-600 mt-1">Connected Mentors</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/alumni-directory" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">📋</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Alumni Directory</h2>
                        <p className="text-gray-600 text-sm">Browse verified alumni profiles and connect with professionals in your field of interest.</p>
                    </Link>

                    <Link href="/dashboard/student/mentorship" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">🤝</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Find Mentors</h2>
                        <p className="text-gray-600 text-sm">Request mentorship from experienced alumni for career guidance and support.</p>
                    </Link>

                    <Link href="/jobs" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">💼</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Job Board</h2>
                        <p className="text-gray-600 text-sm">Explore job opportunities and internships posted by alumni at top companies.</p>
                    </Link>

                    <Link href="/dashboard/student/my-batch" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">👥</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">My Batch</h2>
                        <p className="text-gray-600 text-sm">View and connect with classmates from your graduation year.</p>
                    </Link>

                    <Link href="/events" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">📅</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Events</h2>
                        <p className="text-gray-600 text-sm">Register for alumni events, webinars, and workshops.</p>
                    </Link>

                    <Link href="/dashboard/student/profile" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">👤</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">My Profile</h2>
                        <p className="text-gray-600 text-sm">View and update your profile information.</p>
                    </Link>

                    <Link href="/messages" className="bg-white border border-gray-200 p-6 hover:border-[#800000] transition-colors">
                        <div className="text-2xl mb-3">💬</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Messages</h2>
                        <p className="text-gray-600 text-sm">Chat with your mentors and connected alumni.</p>
                    </Link>
                </div>

                {/* Profile Summary */}
                <div className="mt-8 bg-white border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-[#800000] mb-4">Profile Summary</h2>
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
        </div>
    );
}
