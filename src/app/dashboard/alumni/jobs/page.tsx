'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni, Job } from '@/types';
import { initializeData, getJobsByAlumni, createJob, deleteJob } from '@/lib/data/store';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import Breadcrumb from '@/components/layout/Breadcrumb';

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
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard/alumni' }, { label: 'Post Jobs' }]} />

            {/* Header */}
            <div className="bg-[#DAA520] text-[#333] py-6">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold">My Job Postings</h1>

                        <Dialog open={showForm} onOpenChange={setShowForm}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#800000] text-white hover:bg-[#660000]">
                                    + Post New Job
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Post New Job</DialogTitle>
                                    <DialogDescription>
                                        Share a job opportunity with fellow alumni and students.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Job Title <span className="text-red-500">*</span></Label>
                                            <Input
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Company</Label>
                                            <Input
                                                value={formData.company}
                                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                                placeholder={user.currentCompany || 'Enter company name'}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Location <span className="text-red-500">*</span></Label>
                                            <Input
                                                required
                                                value={formData.location}
                                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Job Type <span className="text-red-500">*</span></Label>
                                            <Select
                                                value={formData.type}
                                                onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="full-time">Full-Time</SelectItem>
                                                    <SelectItem value="part-time">Part-Time</SelectItem>
                                                    <SelectItem value="internship">Internship</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Job Description <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            required
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Requirements (one per line)</Label>
                                        <Textarea
                                            value={formData.requirements}
                                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                            rows={3}
                                            placeholder="B.Tech in CS/IT&#10;2+ years experience&#10;Strong programming skills"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Application Link</Label>
                                        <Input
                                            type="url"
                                            value={formData.applicationLink}
                                            onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })}
                                            placeholder="https://careers.company.com/apply"
                                        />
                                    </div>

                                    <div className="flex gap-3 justify-end pt-4">
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="bg-[#800000] hover:bg-[#660000]">
                                            Post Job
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
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
