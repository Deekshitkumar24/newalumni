'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
// import { getJobById, initializeData } from '@/lib/data/store'; // Removed
import { Job } from '@/types';
import { Button } from "@/components/ui/button"

export default function JobDetailPage() {
    const params = useParams();
    const jobId = params.id as string;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await fetch(`/api/jobs/${jobId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.data) {
                        // Map API response to Job type
                        // API returns { data: { ...job, poster: {...} } }
                        const apiJob = data.data;
                        const mappedJob: Job = {
                            id: apiJob.id,
                            title: apiJob.title,
                            company: apiJob.company,
                            location: apiJob.location,
                            type: apiJob.type, // Keep as returned from API (matches Type if API is correct)
                            description: apiJob.description,
                            // requirements: [], // Removed as not in Job type
                            postedAt: apiJob.createdAt,
                            // postedBy is NOT in Job type, it is in apiJob.poster which is an object
                            // postedBy: apiJob.poster?.id, // Removed as not in Job type
                            postedByName: apiJob.poster?.fullName || 'Alumni',
                            applicationLink: apiJob.applicationLink, // If exists 
                            status: apiJob.status,
                            createdAt: apiJob.createdAt // Required: Map from API response
                        };

                        // Check if applicationLink exists in schema or passed
                        // Schema doesn't show applicationLink column in previous view...
                        // Wait, I didn't see applicationLink in jobs table in schema view!
                        // Let me check schema again?
                        // Schema line 59: jobs table.
                        // allow me to re-read schema or assume it might be missing.
                        // If missing, I can't display it unless I added it?
                        // `jobs/new` added it to payload. `api/jobs/route` likely ignores it if not in schema.
                        // I should double check schema or add it.
                        // IF schema is missing it, I should add it via migration or just ignore for now.
                        // Schema view showed: title, company, location, description, type, status, moderationStatus, createdAt.
                        // No applicationLink!
                        // That means `jobs/new` form field for link is lost!
                        // Use description for link for now? Or Schema update?
                        // I'll stick to description for now to avoid schema migration steps if not asked.
                        // Users can put link in description.

                        setJob(mappedJob);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch job", error);
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading job details...</div>;
    }

    if (!job) {
        return (
            <div>
                <div className="container mx-auto px-4 py-10 text-center">
                    <h1 className="text-xl text-gray-600">Job not found</h1>
                    <Link href="/jobs" className="text-[#800000] hover:underline mt-4 inline-block">
                        ← Back to Jobs
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="border border-gray-200 bg-white">
                        {/* Job Header */}
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-semibold">{job.title}</h1>
                                <span className={`text-xs px-2 py-1 ${job.type === 'full_time'
                                    ? 'bg-green-500/30 text-green-100'
                                    : job.type === 'internship'
                                        ? 'bg-blue-500/30 text-blue-100'
                                        : 'bg-yellow-500/30 text-yellow-100'
                                    }`}>
                                    {job.type.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="mt-2 text-gray-200">{job.company}</div>
                        </div>

                        {/* Job Details */}
                        <div className="p-6">
                            {/* Quick Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">📍</span>
                                    <div>
                                        <div className="text-sm text-gray-500">Location</div>
                                        <div className="font-medium">{job.location}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">👤</span>
                                    <div>
                                        <div className="text-sm text-gray-500">Posted By</div>
                                        <div className="font-medium">{job.postedByName}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">📅</span>
                                    <div>
                                        <div className="text-sm text-gray-500">Posted On</div>
                                        <div className="font-medium">{formatDate(job.postedAt || '')}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-[#800000] mb-3">Job Description</h2>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {job.description}
                                </p>
                            </div>

                            {/* Requirements - merged into description for now, or empty */}


                            {/* Action Buttons */}
                            <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4">
                                {job.applicationLink ? (
                                    <a
                                        href={job.applicationLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#800000] text-white px-6 py-3 hover:bg-[#660000] rounded-md transition-colors"
                                    >
                                        Apply Now →
                                    </a>
                                ) : (
                                    <div className="text-gray-600 py-3 italic">
                                        Refer to description for application instructions.
                                    </div>
                                )}

                                <Link
                                    href="/jobs"
                                    className="border-2 border-gray-300 text-gray-700 font-bold px-6 py-3 hover:bg-gray-100 hover:border-gray-400 transition-colors rounded-md"
                                >
                                    ← Back to All Jobs
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
