'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Job } from '@/types';
import { Building2, MapPin, User as UserIcon, Clock, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useAuth } from '@/hooks/useAuth';

const ITEMS_PER_PAGE = 10;

export default function DashboardJobsPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [jobType, setJobType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const [viewMode, setViewMode] = useState<'all' | 'my'>('all');

    useEffect(() => {
        const fetchJobs = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: ITEMS_PER_PAGE.toString(),
                    ...(searchTerm && { company: searchTerm }),
                    ...(jobType !== 'all' && { type: jobType }),
                    ...(viewMode === 'my' && { my_jobs: 'true' }),
                });

                const res = await fetch(`/api/jobs?${queryParams}`);
                const data = await res.json();

                if (res.ok) {
                    setJobs(data.data);
                    setTotalItems(data.data.length);
                    setTotalPages(data.data.length === ITEMS_PER_PAGE ? currentPage + 1 : currentPage);
                } else {
                    console.error('Failed to fetch jobs');
                }
            } catch (error) {
                console.error('Error fetching jobs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [currentPage, searchTerm, jobType]);

    const handleFilterChange = (setter: (val: string) => void, val: string) => {
        setter(val);
        setCurrentPage(1);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#800000]">
                <div>
                    <h1 className="text-2xl font-bold text-[#800000]">
                        Jobs & Internships
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {totalItems} opportunities posted by your alumni network
                    </p>
                </div>

                {user && user.role === 'alumni' && (
                    <Link
                        href="/jobs/new"
                        className="inline-flex items-center justify-center bg-[#800000] text-white px-5 py-2.5 rounded-md font-medium hover:bg-[#660000] transition-colors shadow-sm"
                    >
                        <span className="mr-2">+</span> Post a Job
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                        <div className="relative">

                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
                                placeholder="Title, Company, or Location"
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Job Type</label>
                        <select
                            value={jobType}
                            onChange={(e) => handleFilterChange(setJobType, e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white"
                        >
                            <option value="all">All Types</option>
                            <option value="full_time">Full-Time</option>
                            <option value="part_time">Part-Time</option>
                            <option value="internship">Internship</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setJobType('all');
                                setCurrentPage(1);
                            }}
                            className="w-full border border-gray-300 text-gray-600 px-4 py-2.5 rounded-md hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs for Alumni */}
            {user?.role === 'alumni' && (
                <div className="mb-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                            onClick={() => { setViewMode('all'); setCurrentPage(1); }}
                            className={`
                          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                          ${viewMode === 'all'
                                    ? 'border-[#800000] text-[#800000]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                        >
                            All Opportunities
                        </button>
                        <button
                            onClick={() => { setViewMode('my'); setCurrentPage(1); }}
                            className={`
                          whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                          ${viewMode === 'my'
                                    ? 'border-[#800000] text-[#800000]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                        >
                            My Posted Jobs
                        </button>
                    </nav>
                </div>
            )}

            {/* Jobs List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
                </div>
            ) : jobs.length > 0 ? (
                <div className="space-y-4">
                    {jobs.map((job) => (
                        <div key={job.id} className="group border border-gray-200 bg-white rounded-lg hover:shadow-md transition-shadow p-5">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-grow">
                                    <div className="flex items-center flex-wrap gap-2 mb-2">
                                        <Link href={`/jobs/${job.id}`}>
                                            <h2 className="text-lg font-bold text-gray-900 group-hover:text-[#800000] transition-colors">
                                                {job.title}
                                            </h2>
                                        </Link>
                                        {viewMode === 'my' && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${job.moderationStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                                job.moderationStatus === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                }`}>
                                                {job.moderationStatus?.toUpperCase()}
                                            </span>
                                        )}
                                        <span className={`tag ${job.type === 'full_time'
                                            ? 'tag-fulltime'
                                            : job.type === 'internship'
                                                ? 'tag-internship'
                                                : 'tag-parttime'
                                            }`}>
                                            {job.type.replace('-', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-gray-700 font-medium mb-3 flex items-center gap-2">
                                        <span className="flex items-center gap-1.5"><Building2 size={16} className="text-gray-500" /> {job.company}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="flex items-center gap-1.5"><MapPin size={16} className="text-gray-500" /> {job.location}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <UserIcon size={14} /> Posted by <span className="font-medium text-gray-700">{job.poster?.fullName || job.postedByName || 'Alumni'}</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={14} /> {formatDate(job.createdAt || job.postedAt || '')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 self-center md:self-start">
                                    <Link
                                        href={`/jobs/${job.id}`}
                                        className="inline-block border border-[#800000] text-[#800000] px-4 py-2 text-sm font-medium rounded hover:bg-[#800000]/[0.06] hover:border-[#660000] active:scale-[0.98] transition-all whitespace-nowrap"
                                    >
                                        View Details
                                    </Link>
                                    {job.applicationLink && (
                                        <a
                                            href={job.applicationLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block bg-[#800000] !text-white px-4 py-2 text-sm font-medium rounded hover:bg-[#660000] transition-colors whitespace-nowrap ml-2"
                                        >
                                            Apply Now
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon="💼"
                    title={viewMode === 'my' ? "You haven't posted any jobs" : "No jobs found"}
                    description={viewMode === 'my' ? "Share opportunities with your juniors by posting a job." : "Try adjusting your search criteria or come back later."}
                    actionLabel={viewMode === 'my' ? "Post a Job" : "Reset all filters"}
                    onAction={() => {
                        if (viewMode === 'my') {
                            // Redirect to post job?
                            window.location.href = '/jobs/new';
                        } else {
                            setSearchTerm('');
                            setJobType('all');
                            setCurrentPage(1);
                        }
                    }}
                />
            )}

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
