'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { registerAlumni, initializeData } from '@/lib/data/store';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const departments = [
    'Computer Science',
    'Electronics',
    'Electrical',
    'Mechanical',
    'Civil',
    'Information Technology'
];

const currentYear = new Date().getFullYear();
const graduationYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function AlumniRegistrationPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        graduationYear: '',
        currentCompany: '',
        currentRole: '',
        linkedIn: '',
        careerJourney: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }

        // Initialize data if not already done
        initializeData();

        try {
            registerAlumni({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'alumni',
                department: formData.department,
                graduationYear: parseInt(formData.graduationYear),
                currentCompany: formData.currentCompany || undefined,
                currentRole: formData.currentRole || undefined,
                linkedIn: formData.linkedIn || undefined,
                careerJourney: formData.careerJourney || undefined
            });

            setSuccess(true);
        } catch (err) {
            setError('Registration failed. Please try again.');
        }

        setLoading(false);
    };

    if (success) {
        return (
            <div>
                <Breadcrumb items={[{ label: 'Register', href: '/register' }, { label: 'Alumni' }]} />

                <div className="container mx-auto px-4 py-10">
                    <div className="max-w-md mx-auto text-center">
                        <Alert className="bg-green-50 border-green-200 p-8 flex flex-col items-center">
                            <div className="text-4xl mb-4">✓</div>
                            <h2 className="text-xl font-semibold text-green-800 mb-4">Registration Successful!</h2>
                            <AlertDescription className="text-gray-600 mb-6 text-center">
                                Your registration has been submitted. An administrator will review and approve your account.
                                You will be able to login once your account is approved.
                            </AlertDescription>
                            <Link href="/login" className="inline-block bg-[#1a1a2e] text-white px-6 py-3 rounded hover:bg-[#2a2a4e] transition-colors">
                                Go to Login
                            </Link>
                        </Alert>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Breadcrumb items={[{ label: 'Register', href: '/register' }, { label: 'Alumni' }]} />

            <div className="container mx-auto px-4 py-10">
                <div className="max-w-lg mx-auto">
                    <Card className="shadow-lg">
                        <CardHeader className="bg-[#DAA520] text-[#333] rounded-t-lg py-4">
                            <CardTitle className="text-xl font-semibold">Alumni Registration</CardTitle>
                        </CardHeader>

                        <CardContent className="pt-6">
                            {error && (
                                <Alert variant="destructive" className="mb-4 bg-red-50 text-red-700 border-red-200">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="focus-visible:ring-[#DAA520]"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Email Address <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="focus-visible:ring-[#DAA520]"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Password <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="focus-visible:ring-[#DAA520]"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Confirm Password <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="focus-visible:ring-[#DAA520]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Department <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={formData.department}
                                            onValueChange={(val) => setFormData({ ...formData, department: val })}
                                        >
                                            <SelectTrigger className="focus:ring-[#DAA520]">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map(dept => (
                                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Graduation Year <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={formData.graduationYear}
                                            onValueChange={(val) => setFormData({ ...formData, graduationYear: val })}
                                        >
                                            <SelectTrigger className="focus:ring-[#DAA520]">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {graduationYears.map(year => (
                                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Current Company</Label>
                                        <Input
                                            type="text"
                                            value={formData.currentCompany}
                                            onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                                            className="focus-visible:ring-[#DAA520]"
                                            placeholder="e.g., Microsoft"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Current Role</Label>
                                        <Input
                                            type="text"
                                            value={formData.currentRole}
                                            onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                                            className="focus-visible:ring-[#DAA520]"
                                            placeholder="e.g., Software Engineer"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>LinkedIn Profile URL</Label>
                                    <Input
                                        type="url"
                                        value={formData.linkedIn}
                                        onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                                        className="focus-visible:ring-[#DAA520]"
                                        placeholder="https://linkedin.com/in/yourprofile"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Career Journey (Optional)</Label>
                                    <Textarea
                                        value={formData.careerJourney}
                                        onChange={(e) => setFormData({ ...formData, careerJourney: e.target.value })}
                                        className="focus-visible:ring-[#DAA520]"
                                        rows={3}
                                        placeholder="Brief description of your career path since graduation..."
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#DAA520] text-[#333] hover:bg-[#f0c75e]"
                                >
                                    {loading ? 'Submitting...' : 'Register'}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex justify-center border-t py-4">
                            <p className="text-gray-600 text-sm">
                                Already have an account? <Link href="/login" className="text-[#800000] hover:underline">Login here</Link>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
