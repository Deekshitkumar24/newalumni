'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni, Job } from '@/types';
import { useAuth } from '@/hooks/useAuth'; // Use the hook!

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
import { toast } from 'sonner';


export default function AlumniJobsPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth(); // Consolidated auth
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        description: '',
        requirements: '',
        type: 'full_time' as 'full_time' | 'part_time' | 'internship',
        applicationLink: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch My Jobs
    const fetchMyJobs = async () => {
        try {
            setLoadingJobs(true);
            const res = await fetch('/api/jobs?my_jobs=true');
            if (res.ok) {
                const data = await res.json();
                setJobs(data.data);
            }
        } catch (error) {
            console.error('Error fetching my jobs:', error);
        } finally {
            setLoadingJobs(false);
        }
    };

    useEffect(() => {
        if (isLoading) return;
        if (!user || user.role !== 'alumni') {
            router.push('/login');
            return;
        }

        fetchMyJobs();
    }, [user, isLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: formData.title,
                    company: formData.company || (user as any).currentCompany || '',
                    location: formData.location,
                    description: formData.description + (formData.requirements ? '\n\nRequirements:\n' + formData.requirements : ''),
                    type: formData.type,
                    applicationLink: formData.applicationLink || undefined,
                })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Job posted successfully! It is pending admin approval.');
                setShowForm(false);
                setFormData({
                    title: '',
                    company: '',
                    location: '',
                    description: '',
                    requirements: '',
                    type: 'full_time',
                    applicationLink: ''
                });
                fetchMyJobs(); // Refresh list
            } else {
                let errMsg = data.error;
                if (typeof errMsg === 'object') {
                    errMsg = Array.isArray(errMsg)
                        ? errMsg.map((e: any) => e.message).join('. ')
                        : JSON.stringify(errMsg);
                }
                toast.error(errMsg || 'Failed to post job');
            }
        } catch (error) {
            console.error('Error posting job:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (jobId: string) => {
        if (!confirm('Are you sure you want to delete this job posting? This cannot be undone.')) return;

        try {
            // Wait, we didn't implement DELETE api/jobs/[id] yet?
            // The plan said "Admin can approve/reject". 
            // Alumni deleting their own job is a valid use case. I should check if API supports DELETE.
            // Converting to simple alert for now if not supported, or assume I'll add it.
            // For safety, I'll comment out the fetch and leave a TODO or add the endpoint.
            // Actually, I can add a DELETE handler in the same step or next. 
            // Let's assume I'll add DELETE /api/jobs/[id] next.

            toast.error("Delete functionality coming soon (API update pending)");

            /* 
            const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Job deleted');
                fetchMyJobs();
            }
            */
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading || !user) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#800000] mx-auto"></div>
                <p className="mt-4">Loading...</p>
            </div>
        );
    }

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
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
                                        Share a job opportunity. It will be reviewed by an admin before going public.
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
                                                placeholder={(user as any).currentCompany || 'Enter company name'}
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
                                                    <SelectItem value="full_time">Full-Time</SelectItem>
                                                    <SelectItem value="part_time">Part-Time</SelectItem>
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
                                        <Label>Requirements (Optional)</Label>
                                        <Textarea
                                            value={formData.requirements}
                                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                            rows={3}
                                            placeholder="B.Tech in CS/IT&#10;2+ years experience"
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
                                        <Button type="submit" disabled={isSubmitting} className="bg-[#800000] hover:bg-[#660000]">
                                            {isSubmitting ? 'Posting...' : 'Post Job'}
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
                <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-700">My Posted Jobs ({jobs.length})</h2>
                    </div>

                    {loadingJobs ? (
                        <div className="p-10 text-center text-gray-500">Loading your jobs...</div>
                    ) : jobs.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {jobs.map(job => (
                                <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-medium text-[#800000] text-lg">{job.title}</span>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${job.type === 'full_time' ? 'bg-green-100 text-green-800' :
                                                    job.type === 'internship' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {job.type.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="mb-2">
                                                {job.moderationStatus === 'pending' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                        ⏳ Pending Approval
                                                    </span>
                                                )}
                                                {job.moderationStatus === 'approved' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        ✅ Published
                                                    </span>
                                                )}
                                                {job.moderationStatus === 'rejected' && (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        ❌ Rejected
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-sm text-gray-600 mb-1">{job.company} | {job.location}</div>
                                            <div className="text-xs text-gray-400">
                                                Posted on {new Date(job.createdAt || '').toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/jobs/${job.id}`}
                                                className="text-sm border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(job.id)}
                                                className="text-sm text-red-600 hover:text-red-800 font-medium px-2"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-10 text-center text-gray-500">
                            You haven&apos;t posted any jobs yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
