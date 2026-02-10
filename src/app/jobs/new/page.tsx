'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createJob, initializeData } from '@/lib/data/store';
import { User } from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PostJobPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
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
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);

            // Redirect if not alumni
            if (user.role !== 'alumni') {
                router.push('/jobs');
            }
        } else {
            router.push('/login');
        }
    }, [router]);

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

    const handleSubmit = (e: React.FormEvent) => {
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

            const requirementsList = formData.requirements
                .split('\n')
                .filter(req => req.trim().length > 0);

            createJob({
                title: formData.title,
                company: formData.company,
                location: formData.location || 'Remote',
                type: formData.type as 'full-time' | 'part-time' | 'internship',
                description: formData.description,
                requirements: requirementsList,
                applicationLink: formData.applicationLink,
                postedBy: currentUser.id,
                postedByName: currentUser.name
            });

            // Redirect back to jobs list after delay
            setTimeout(() => {
                router.push('/jobs');
            }, 1000);

        } catch (err) {
            setError('Failed to post job. Please try again.');
            setLoading(false);
        }
    };

    if (!currentUser || currentUser.role !== 'alumni') {
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
