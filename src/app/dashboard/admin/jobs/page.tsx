'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Job, Admin } from '@/types';
import { initializeData, getActiveJobs, getPendingJobs, deleteJob, createJob, updateJobStatus } from '@/lib/data/store';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';

import { Skeleton, RowSkeleton } from "@/components/ui/Skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminJobsPage() {
    const router = useRouter();
    const [user, setUser] = useState<Admin | null>(null);
    const [activeJobs, setActiveJobs] = useState<Job[]>([]);
    const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '', company: '', location: '', type: 'full-time', description: '', requirements: '', applicationLink: ''
    });

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

        setUser(currentUser);
        setLoading(true);

        setTimeout(() => {
            setActiveJobs(getActiveJobs());
            setPendingJobs(getPendingJobs());
            setLoading(false);
        }, 500);
    }, [router, refreshKey]);

    // Handlers
    const handleStatusChange = (jobId: string, status: 'active' | 'rejected' | 'closed') => {
        if (!confirm(`Are you sure you want to change status to: ${status.toUpperCase()}?`)) return;
        updateJobStatus(jobId, status);
        setRefreshKey(k => k + 1);
        toast.success(`Job status updated to ${status}`);
    };

    const handleDelete = (id: string) => {
        if (!confirm('Are you sure you want to PERMANENTLY delete this job posting?')) return;
        deleteJob(id);
        setRefreshKey(k => k + 1);
        toast.success("Job posting deleted.");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        createJob({
            title: formData.title,
            company: formData.company || 'Admin Posted',
            location: formData.location,
            description: formData.description,
            requirements: formData.requirements.split('\n').filter(r => r.trim()),
            type: formData.type as any,
            applicationLink: formData.applicationLink || undefined,
            postedBy: user.id,
            postedByName: user.name + ' (Admin)',
            status: 'active' // Admin posts are auto-active
        });

        setRefreshKey(k => k + 1);
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
        toast.success("Job posted successfully!");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#1a1a2e]">Job Moderation</h1>
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#800000] text-white hover:bg-[#660000]">
                            + Post New Job
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Post New Job (Admin)</DialogTitle>
                            <DialogDescription>
                                Create a new job listing. Admin posts are automatically approved and active.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Job Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        required
                                        placeholder="e.g. Senior Software Engineer"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Company</Label>
                                    <Input
                                        placeholder="Company (Default: Admin Posted)"
                                        value={formData.company}
                                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Location <span className="text-red-500">*</span></Label>
                                    <Input
                                        required
                                        placeholder="e.g. Hyderabad, Remote"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Job Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="full-time">Full-Time</SelectItem>
                                            <SelectItem value="part-time">Part-Time</SelectItem>
                                            <SelectItem value="internship">Internship</SelectItem>
                                            <SelectItem value="contract">Contract</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Application Link (Optional)</Label>
                                <Input
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.applicationLink}
                                    onChange={e => setFormData({ ...formData, applicationLink: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description <span className="text-red-500">*</span></Label>
                                <Textarea
                                    required
                                    placeholder="Job description..."
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Requirements (One per line)</Label>
                                <Textarea
                                    placeholder="- React.js&#10;- TypeScript&#10;- Node.js"
                                    rows={4}
                                    value={formData.requirements}
                                    onChange={e => setFormData({ ...formData, requirements: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-2 pt-4 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button type="submit" className="bg-[#800000] hover:bg-[#660000]">Post Job</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Tabs */}
                <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white border border-gray-200 mb-6 w-full justify-start p-1 h-auto">
                        <TabsTrigger value="pending" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">
                            Pending Review
                            {pendingJobs.length > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-white text-[#800000] hover:bg-white">{pendingJobs.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="active" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">
                            Active Listings
                            <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600 group-data-[state=active]:bg-white group-data-[state=active]:text-[#800000]">{activeJobs.length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <Card className="min-h-[400px]">
                        <TabsContent value={activeTab} className="m-0 border-none shadow-none">
                            {loading ? (
                                <div className="p-6 space-y-4">
                                    {[1, 2, 3].map(i => <RowSkeleton key={i} />)}
                                </div>
                            ) : (
                                <>
                                    {loading ? null : (
                                        <div className="divide-y divide-gray-200">
                                            {(activeTab === 'pending' ? pendingJobs : activeJobs).length > 0 ? (
                                                (activeTab === 'pending' ? pendingJobs : activeJobs).map(job => (
                                                    <div key={job.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                                                                    {activeTab === 'pending' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDING</Badge>}
                                                                </div>
                                                                <div className="text-sm text-gray-500 mb-2 flex items-center gap-2 flex-wrap">
                                                                    <span>{job.company}</span>
                                                                    <span>•</span>
                                                                    <span>{job.location}</span>
                                                                    <span>•</span>
                                                                    <Badge variant="outline" className="uppercase text-[10px]">{job.type}</Badge>
                                                                    {job.applicationLink && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <a href={job.applicationLink} target="_blank" rel="noopener noreferrer" className="text-[#800000] hover:underline flex items-center gap-1">
                                                                                Link ↗
                                                                            </a>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-400 mb-2">
                                                                    Posted by: <span className="text-gray-600 font-medium">{job.postedByName}</span> • {new Date(job.postedAt).toLocaleDateString()}
                                                                </div>
                                                                <p className="text-gray-600 line-clamp-2 text-sm">{job.description}</p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 justify-end items-center mt-2 md:mt-0">
                                                                <Link href={`/jobs/${job.id}`} target="_blank">
                                                                    <Button variant="outline" size="sm">View</Button>
                                                                </Link>

                                                                {activeTab === 'pending' && (
                                                                    <>
                                                                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => handleStatusChange(job.id, 'rejected')}>Reject</Button>
                                                                        <Button size="sm" className="bg-[#800000] hover:bg-[#660000] text-white" onClick={() => handleStatusChange(job.id, 'active')}>Approve</Button>
                                                                    </>
                                                                )}

                                                                {activeTab === 'active' && (
                                                                    <Button size="sm" variant="outline" className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-orange-200" onClick={() => handleStatusChange(job.id, 'closed')}>Close</Button>
                                                                )}

                                                                <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => handleDelete(job.id)}>
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <EmptyState
                                                    icon={activeTab === 'pending' ? <CheckCircle2 size={48} /> : <Briefcase size={48} />}
                                                    title={`No ${activeTab} jobs`}
                                                    description={activeTab === 'pending' ? "All job postings have been reviewed." : "There are no active job listings currently."}
                                                />
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>
                    </Card>
                </Tabs>


            </div>
        </div >
    );
}
