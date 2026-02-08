'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getJobById, initializeData } from '@/lib/data/store';
import { Job } from '@/types';

export default function JobDetailPage() {
    const params = useParams();
    const jobId = params.id as string;

    const [job, setJob] = useState<Job | null>(null);

    useEffect(() => {
        initializeData();
        const jobData = getJobById(jobId);
        if (jobData) {
            setJob(jobData);
        }
    }, [jobId]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (!job) {
        return (
            <div>
                <Breadcrumb items={[{ label: 'Jobs', href: '/jobs' }, { label: 'Not Found' }]} />
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
            <Breadcrumb items={[{ label: 'Jobs', href: '/jobs' }, { label: job.title }]} />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="border border-gray-200 bg-white">
                        {/* Job Header */}
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-semibold">{job.title}</h1>
                                <span className={`text-xs px-2 py-1 ${job.type === 'full-time'
                                    ? 'bg-green-500/30 text-green-100'
                                    : job.type === 'internship'
                                        ? 'bg-blue-500/30 text-blue-100'
                                        : 'bg-yellow-500/30 text-yellow-100'
                                    }`}>
                                    {job.type.replace('-', ' ').toUpperCase()}
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
                                        <div className="font-medium">{formatDate(job.postedAt)}</div>
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

                            {/* Requirements */}
                            {job.requirements.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-[#800000] mb-3">Requirements</h2>
                                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                                        {job.requirements.map((req, index) => (
                                            <li key={index}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-4">
                                {job.applicationLink ? (
                                    <a
                                        href={job.applicationLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#800000] text-white px-6 py-3 hover:bg-[#660000]"
                                    >
                                        Apply Now →
                                    </a>
                                ) : (
                                    <div className="text-gray-600 py-3">
                                        Contact the alumni directly for application details.
                                    </div>
                                )}

                                <Link
                                    href="/jobs"
                                    className="border-2 border-gray-300 text-gray-700 font-bold px-6 py-3 hover:bg-gray-100 hover:border-gray-400 transition-colors"
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
