'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni } from '@/types';
import { initializeData, getJobsByAlumni, getMentorshipRequestsByAlumni } from '@/lib/data/store';

export default function AlumniDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<Alumni | null>(null);
    const [stats, setStats] = useState({
        myJobs: 0,
        pendingRequests: 0,
        acceptedMentees: 0
    });

    useEffect(() => {
        initializeData();

        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'alumni') {
            router.push('/login');
            return;
        }

        setUser(currentUser);

        // Get stats
        const jobs = getJobsByAlumni(currentUser.id);
        const requests = getMentorshipRequestsByAlumni(currentUser.id);

        setStats({
            myJobs: jobs.length,
            pendingRequests: requests.filter(r => r.status === 'pending').length,
            acceptedMentees: requests.filter(r => r.status === 'accepted').length
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
            <div className="bg-[#DAA520] text-[#333] py-6">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-semibold">Alumni Dashboard</h1>
                    <p className="mt-1">Welcome back, {user.name}</p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white border border-gray-200 p-6">
                        <div className="text-3xl font-bold text-[#800000]">{stats.myJobs}</div>
                        <div className="text-gray-600 mt-1">Jobs Posted</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-6">
                        <div className="text-3xl font-bold text-[#800000]">{stats.pendingRequests}</div>
                        <div className="text-gray-600 mt-1">Pending Mentorship Requests</div>
                    </div>
                    <div className="bg-white border border-gray-200 p-6">
                        <div className="text-3xl font-bold text-[#800000]">{stats.acceptedMentees}</div>
                        <div className="text-gray-600 mt-1">Active Mentees</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/dashboard/alumni/my-batch" className="bg-white border border-gray-200 p-6 hover:border-[#DAA520] transition-colors">
                        <div className="text-2xl mb-3">👥</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">My Batch Reunion</h2>
                        <p className="text-gray-600 text-sm">Connect and chat with alumni from your graduation year.</p>
                    </Link>

                    <Link href="/dashboard/alumni/mentorship" className="bg-white border border-gray-200 p-6 hover:border-[#DAA520] transition-colors">
                        <div className="text-2xl mb-3">🤝</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Mentorship Hub</h2>
                        <p className="text-gray-600 text-sm">View and respond to mentorship requests from students.</p>
                        {stats.pendingRequests > 0 && (
                            <span className="inline-block mt-2 bg-red-100 text-red-700 text-xs px-2 py-1">
                                {stats.pendingRequests} pending
                            </span>
                        )}
                    </Link>

                    <Link href="/dashboard/alumni/jobs" className="bg-white border border-gray-200 p-6 hover:border-[#DAA520] transition-colors">
                        <div className="text-2xl mb-3">💼</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Post Jobs</h2>
                        <p className="text-gray-600 text-sm">Share job opportunities and internships at your company.</p>
                    </Link>

                    <Link href="/events" className="bg-white border border-gray-200 p-6 hover:border-[#DAA520] transition-colors">
                        <div className="text-2xl mb-3">📅</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Events</h2>
                        <p className="text-gray-600 text-sm">View and register for upcoming alumni events.</p>
                    </Link>

                    <Link href="/dashboard/alumni/profile" className="bg-white border border-gray-200 p-6 hover:border-[#DAA520] transition-colors">
                        <div className="text-2xl mb-3">👤</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">My Profile</h2>
                        <p className="text-gray-600 text-sm">View and update your professional profile.</p>
                    </Link>

                    <Link href="/messages" className="bg-white border border-gray-200 p-6 hover:border-[#DAA520] transition-colors">
                        <div className="text-2xl mb-3">💬</div>
                        <h2 className="text-lg font-semibold text-[#800000] mb-2">Messages</h2>
                        <p className="text-gray-600 text-sm">Chat with batchmates and mentees.</p>
                    </Link>
                </div>

                {/* Profile Summary */}
                <div className="mt-8 bg-white border border-gray-200 p-6">
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
        </div>
    );
}
