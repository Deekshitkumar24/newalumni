'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';
import { toast } from 'sonner';

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PostJobPage() {
    const router = useRouter();
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        type: 'full-time',
        description: '',
        requirements: '',
        applicationLink: ''
    });

    useEffect(() => {
        if (!authLoading) {
            if (!currentUser) {
                router.push('/login');
            } else if (currentUser.role !== 'alumni') {
                router.push('/jobs'); // Or dashboard
            }
        }
    }, [currentUser, authLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!currentUser) return;

        try {
            // Validate
            if (!formData.title || !formData.company || !formData.description) {
                setError('Please fill in all required fields.');
                setLoading(false);
                return;
            }

            // Append requirements to description if needed, or send as is if API supports it.
            // My API currently takes title, company, location, type, description, applicationLink.
            // It does NOT have a separate requirements field in schema (Job table).
            // So I will append it to Description for now.

            let finalDescription = formData.description;
            if (formData.requirements.trim()) {
                finalDescription += `\n\nRequirements:\n${formData.requirements}`;
            }

            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: formData.title,
                    company: formData.company,
                    location: formData.location || 'Remote',
                    type: formData.type.replace('-', '_'), // full-time -> full_time
                    description: finalDescription,
                    applicationLink: formData.applicationLink,
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                let errMsg = errData.error;
                if (Array.isArray(errMsg)) {
                    errMsg = errMsg.map((err: any) => err.message).join('. ');
                } else if (typeof errMsg === 'object') {
                    errMsg = JSON.stringify(errMsg);
                }
                throw new Error(errMsg || 'Failed to post job');
            }

            toast.success("Job posted successfully! Pending approval.");

            // Redirect back to jobs list after delay
            setTimeout(() => {
                router.push('/dashboard/alumni/jobs'); // Redirect to dashboard to see pending job?
            }, 1000);

        } catch (err: any) {
            console.error(err);
            const message = err?.message || 'Failed to post job. Please try again.';
            setError(typeof message === 'string' ? message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !currentUser || currentUser.role !== 'alumni') {
        return <div className="p-8 text-center text-gray-500">Checking permissions...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold text-[#800000] mb-2">Post a Job Opportunity</h1>
                    <p className="text-gray-600 mb-8">
                        Share career opportunities with your fellow alumni and current students.
                    </p>

                    <Card className="border-[#800000]/20 shadow-md overflow-hidden">
                        <div className="h-2 bg-[#800000] w-full"></div>
                        <CardContent className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-base font-semibold">Job Title *</Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Senior Software Engineer"
                                            required
                                            className="h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="type" className="text-base font-semibold">Employment Type</Label>
                                        <Select
                                            value={formData.type}
                                            onValueChange={(val) => handleSelectChange('type', val)}
                                        >
                                            <SelectTrigger className="h-12 bg-white">
                                                <SelectValue placeholder="Select Type" />
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="company" className="text-base font-semibold">Company Name *</Label>
                                        <Input
                                            id="company"
                                            name="company"
                                            value={formData.company}
                                            onChange={handleChange}
                                            placeholder="e.g. TechCorp Inc."
                                            required
                                            className="h-12"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="location" className="text-base font-semibold">Location</Label>
                                        <Input
                                            id="location"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="e.g. Hyderabad, Remote"
                                            className="h-12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-base font-semibold">Job Description *</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={5}
                                        placeholder="Describe the role, responsibilities, and team culture..."
                                        required
                                        className="resize-y"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="requirements" className="text-base font-semibold">Requirements (One per line)</Label>
                                    <Textarea
                                        id="requirements"
                                        name="requirements"
                                        value={formData.requirements}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="• Bachelor's Degree in CS&#10;• 3+ years React experience&#10;• Strong communication skills"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="applicationLink" className="text-base font-semibold">Application Link / Email</Label>
                                    <Input
                                        id="applicationLink"
                                        name="applicationLink"
                                        value={formData.applicationLink}
                                        onChange={handleChange}
                                        placeholder="e.g. https://company.com/careers/job-123 or hr@company.com"
                                        className="h-12"
                                    />
                                </div>

                                <div className="pt-6 flex items-center gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.back()}
                                        className="flex-1 h-12 text-base"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 h-12 text-base bg-[#800000] hover:bg-[#660000]"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                Posting...
                                            </>
                                        ) : (
                                            'Post Opportunity'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
