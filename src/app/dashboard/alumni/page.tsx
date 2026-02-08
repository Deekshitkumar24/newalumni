'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni } from '@/types';
import { initializeData, getJobsByAlumni, getMentorshipRequestsByAlumni, getAlumniById } from '@/lib/data/store';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

        // Verify with latest data from store to check for suspension/status changes
        const freshUser = getAlumniById(currentUser.id);

        if (!freshUser || freshUser.status !== 'approved') {
            localStorage.removeItem('vjit_current_user');
            router.push('/login?error=access_revoked');
            return;
        }

        setUser(freshUser);

        // Get stats
        const jobs = getJobsByAlumni(freshUser.id);
        const requests = getMentorshipRequestsByAlumni(freshUser.id);

        setStats({
            myJobs: jobs.length,
            pendingRequests: requests.filter(r => r.status === 'pending').length,
            acceptedMentees: requests.filter(r => r.status === 'accepted').length
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
