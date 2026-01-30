'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni, Job } from '@/types';
import { initializeData, getJobsByAlumni, createJob, deleteJob } from '@/lib/data/store';

export default function AlumniJobsPage() {
    const router = useRouter();
    const [user, setUser] = useState<Alumni | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        description: '',
        requirements: '',
        type: 'full-time' as 'full-time' | 'part-time' | 'internship',
        applicationLink: ''
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
        setJobs(getJobsByAlumni(currentUser.id));
    }, [router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        createJob({
            title: formData.title,
            company: formData.company || user.currentCompany || '',
            location: formData.location,
            description: formData.description,
            requirements: formData.requirements.split('\n').filter(r => r.trim()),
            type: formData.type,
            applicationLink: formData.applicationLink || undefined,
            postedBy: user.id,
            postedByName: user.name
        });

        setJobs(getJobsByAlumni(user.id));
        setShowForm(false);
        setFormData({
            title: '',
            company: '',
            location: '',
            description: '',
            requirements: '',
            type: 'full-time',
            applicationLink: ''
        });
    };

    const handleDelete = (jobId: string) => {
        if (confirm('Are you sure you want to delete this job posting?')) {
            deleteJob(jobId);
            setJobs(getJobsByAlumni(user!.id));
        }
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Header */}
            <div className="bg-[#DAA520] text-[#333] py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm mb-2">
                        <Link href="/dashboard/alumni" className="hover:underline">Dashboard</Link>
                        <span>/</span>
                        <span>Post Jobs</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold">My Job Postings</h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-[#800000] text-white px-4 py-2 text-sm hover:bg-[#660000]"
                        >
                            + Post New Job
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Job Posting Form */}
                {showForm && (
                    <div className="bg-white border border-gray-200 mb-8">
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <h2 className="font-semibold">Post New Job</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Job Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Company
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        placeholder={user.currentCompany || 'Enter company name'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Job Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as never })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    >
                                        <option value="full-time">Full-Time</option>
                                        <option value="part-time">Part-Time</option>
                                        <option value="internship">Internship</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Job Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Requirements (one per line)
                                </label>
                                <textarea
                                    value={formData.requirements}
                                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    rows={3}
                                    placeholder="B.Tech in CS/IT&#10;2+ years experience&#10;Strong programming skills"
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Application Link
                                </label>
                                <input
                                    type="url"
                                    value={formData.applicationLink}
                                    onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    placeholder="https://careers.company.com/apply"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-[#800000] text-white px-6 py-2 hover:bg-[#660000]"
                                >
                                    Post Job
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="border border-gray-300 px-6 py-2 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* My Jobs List */}
                <div className="bg-white border border-gray-200">
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-700">My Posted Jobs ({jobs.length})</h2>
                    </div>

                    {jobs.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {jobs.map(job => (
                                <div key={job.id} className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-medium text-[#800000]">{job.title}</span>
                                                <span className={`text-xs px-2 py-1 ${job.type === 'full-time'
                                                        ? 'bg-green-100 text-green-700'
                                                        : job.type === 'internship'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {job.type.replace('-', ' ').toUpperCase()}
                                                </span>
                                                {!job.isActive && (
                                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1">Inactive</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">{job.company} | {job.location}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Posted: {new Date(job.postedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/jobs/${job.id}`}
                                                className="text-sm border border-[#800000] text-[#800000] px-3 py-1 hover:bg-[#800000] hover:text-white"
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
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            You haven&apos;t posted any jobs yet.
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <Link href="/dashboard/alumni" className="text-[#800000] hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
