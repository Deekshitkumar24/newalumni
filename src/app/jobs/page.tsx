'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { getJobsPaginated, initializeData } from '@/lib/data/store';
import { Job, User } from '@/types';
import { Building2, MapPin, User as UserIcon, Clock, Search } from 'lucide-react';
import { Input } from "@/components/ui/input";


const ITEMS_PER_PAGE = 10;

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [jobType, setJobType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        // Simulate network delay
        const timer = setTimeout(() => {
            const { data, total, totalPages } = getJobsPaginated(
                currentPage,
                ITEMS_PER_PAGE,
                searchTerm,
                jobType
            );
            setJobs(data);
            setTotalItems(total);
            setTotalPages(totalPages);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
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
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b-2 border-[#800000]">
                    <div>
                        <h1 className="text-2xl font-bold text-[#800000]">
                            Career Opportunities
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {totalItems} opportunities posted by your alumni network
                        </p>
                    </div>

                    {currentUser && currentUser.role === 'alumni' && (
                        <Link
                            href="/jobs/new"
                            className="inline-flex items-center justify-center bg-[#800000] text-white px-5 py-2.5 rounded-md font-medium hover:bg-[#660000] transition-colors shadow-sm"
                        >
                            <span className="mr-2">+</span> Post a Job
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
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
                                    setCurrentPage(1);
                                }}
                                className="w-full border border-gray-300 text-gray-600 px-4 py-2.5 rounded-md hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

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
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${job.type === 'full-time'
                                                ? 'bg-green-100 text-green-700'
                                                : job.type === 'internship'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-yellow-100 text-yellow-700'
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
                                                <UserIcon size={14} /> Posted by <span className="font-medium text-gray-700">{job.postedByName}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock size={14} /> {formatDate(job.postedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 self-center md:self-start">
                                        <Link
                                            href={`/jobs/${job.id}`}
                                            className="inline-block border border-[#800000] text-[#800000] px-4 py-2 text-sm font-medium rounded hover:bg-[#800000] hover:text-white transition-colors whitespace-nowrap"
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
                        title="No jobs found"
                        description="Try adjusting your search criteria or come back later for new opportunities."
                        actionLabel="Reset all filters"
                        onAction={() => {
                            setSearchTerm('');
                            setJobType('all');
                            setCurrentPage(1);
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
        </div>
    );
}
