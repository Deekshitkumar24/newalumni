'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Job } from '@/types';
import { initializeData, getActiveJobs, deleteJob } from '@/lib/data/store';

export default function AdminJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);

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

        setJobs(getActiveJobs());
    }, [router]);

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this job posting?')) {
            deleteJob(id);
            setJobs(getActiveJobs());
        }
    };

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Header */}
            <div className="bg-[#1a1a2e] text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                        <Link href="/dashboard/admin" className="hover:text-white">Dashboard</Link>
                        <span>/</span>
                        <span>Job Listings Management</span>
                    </div>
                    <h1 className="text-2xl font-semibold">Job Listings Management</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Jobs List */}
                <div className="bg-white border border-gray-200">
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-700">All Active Jobs ({jobs.length})</h2>
                    </div>

                    {jobs.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {jobs.map(job => (
                                <div key={job.id} className="p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-[#800000]">{job.title}</h3>
                                            <span className={`text-xs px-2 py-1 rounded ${job.type === 'full-time'
                                                    ? 'bg-green-100 text-green-700'
                                                    : job.type === 'internship'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {job.type.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-gray-800">{job.company}</div>
                                        <div className="text-sm text-gray-600 mb-2">
                                            📍 {job.location} | Posted by: {job.postedByName}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Posted on: {new Date(job.postedAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/jobs/${job.id}`}
                                            className="text-sm border border-gray-300 text-gray-600 px-3 py-1 hover:bg-gray-100"
                                            target="_blank"
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            className="text-sm border border-red-500 text-red-500 px-3 py-1 hover:bg-red-500 hover:text-white"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            No active job listings found.
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <Link href="/dashboard/admin" className="text-[#800000] hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
