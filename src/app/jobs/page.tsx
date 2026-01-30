'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getActiveJobs, initializeData } from '@/lib/data/store';
import { Job } from '@/types';

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [jobType, setJobType] = useState('all');

    useEffect(() => {
        initializeData();
        const activeJobs = getActiveJobs();
        setJobs(activeJobs);
        setFilteredJobs(activeJobs);
    }, []);

    useEffect(() => {
        let result = jobs;

        if (searchTerm) {
            result = result.filter(j =>
                j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                j.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                j.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (jobType !== 'all') {
            result = result.filter(j => j.type === jobType);
        }

        setFilteredJobs(result);
    }, [searchTerm, jobType, jobs]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div>
            <Breadcrumb items={[{ label: 'Jobs' }]} />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-[#800000] mb-6 pb-3 border-b-2 border-[#800000]">
                    Job Opportunities
                </h1>

                <p className="text-gray-600 mb-6">
                    Browse job opportunities and internships posted by VJIT alumni working at top companies.
                </p>

                {/* Filters */}
                <div className="bg-[#f5f5f5] border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by title, company, or location..."
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                            <select
                                value={jobType}
                                onChange={(e) => setJobType(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                            >
                                <option value="all">All Types</option>
                                <option value="full-time">Full-Time</option>
                                <option value="part-time">Part-Time</option>
                                <option value="internship">Internship</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setJobType('all');
                                }}
                                className="w-full border border-[#800000] text-[#800000] px-4 py-2 hover:bg-[#800000] hover:text-white"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
                </div>

                {/* Jobs List */}
                {filteredJobs.length > 0 ? (
                    <div className="space-y-4">
                        {filteredJobs.map((job) => (
                            <div key={job.id} className="border border-gray-200 bg-white">
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Link href={`/jobs/${job.id}`}>
                                                    <h2 className="text-lg font-semibold text-[#800000] hover:underline">
                                                        {job.title}
                                                    </h2>
                                                </Link>
                                                <span className={`text-xs px-2 py-1 ${job.type === 'full-time'
                                                        ? 'bg-green-100 text-green-700'
                                                        : job.type === 'internship'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {job.type.replace('-', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-gray-700 font-medium mb-2">{job.company}</div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                <span>📍 {job.location}</span>
                                                <span>👤 Posted by {job.postedByName}</span>
                                                <span>📅 {formatDate(job.postedAt)}</span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Link
                                                href={`/jobs/${job.id}`}
                                                className="inline-block bg-[#800000] text-white px-4 py-2 text-sm hover:bg-[#660000]"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 border border-gray-200 bg-white">
                        No jobs found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
