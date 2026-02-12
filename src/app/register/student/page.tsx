'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerStudent, initializeData } from '@/lib/data/store';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const departments = [
    'CSE',
    'ECE',
    'EEE',
    'MECH',
    'CIVIL',
    'IT'
];

const currentYear = new Date().getFullYear();
const graduationYears = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i); // Allow last year + future

export default function StudentRegistrationPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        rollNumber: '',
        department: '',
        graduationYear: '',
        skills: '',
        interests: ''
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

        if (!formData.department || !formData.graduationYear) {
            setError('Please select Department and Graduation Year.');
            setLoading(false);
            return;
        }

        // Initialize data if not already done
        initializeData();

        try {
            registerStudent({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'student',
                rollNumber: formData.rollNumber,
                department: formData.department,
                graduationYear: parseInt(formData.graduationYear),
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
                interests: formData.interests.split(',').map(s => s.trim()).filter(s => s)
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
                <div className="container mx-auto px-4 py-10">
                    <div className="max-w-md mx-auto text-center">
                        <Alert className="bg-green-50 border-green-200 text-green-800 p-8 flex flex-col items-center">
                            <div className="text-4xl mb-4">✓</div>
                            <AlertTitle className="text-xl font-semibold mb-2">Registration Successful!</AlertTitle>
                            <AlertDescription className="text-gray-600 mb-6 text-center">
                                Your registration has been submitted. An administrator will review and approve your account.
                                You will be able to login once your account is approved.
                            </AlertDescription>
                            <Link
                                href="/login"
                                className="inline-block bg-[#1e293b] text-white px-6 py-3 rounded-md hover:bg-[#0f172a] transition-colors"
                            >
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
            <div className="container mx-auto px-4 py-10">
                <div className="max-w-lg mx-auto">
                    <Card className="w-full shadow-md">
                        <CardHeader className="bg-[#800000] text-white rounded-t-lg py-4">
                            <CardTitle className="text-xl font-semibold">Student Registration</CardTitle>
                        </CardHeader>

                        <CardContent className="pt-6">
                            {error && (
                                <Alert variant="destructive" className="mb-4 bg-red-50 text-red-700 border-red-200">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="focus-visible:ring-[#800000]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="yourname@vjit.ac.in"
                                        required
                                        className="focus-visible:ring-[#800000]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            className="focus-visible:ring-[#800000]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            required
                                            className="focus-visible:ring-[#800000]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="rollNumber">Roll Number <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="rollNumber"
                                        type="text"
                                        value={formData.rollNumber}
                                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                        placeholder="e.g., 21B01A0501"
                                        required
                                        className="focus-visible:ring-[#800000]"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Department <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={formData.department}
                                            onValueChange={(val) => setFormData({ ...formData, department: val })}
                                        >
                                            <SelectTrigger className="focus:ring-[#800000]">
                                                <SelectValue placeholder="Select Department" />
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
                                            <SelectTrigger className="focus:ring-[#800000]">
                                                <SelectValue placeholder="Select Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {graduationYears.map(year => (
                                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                                    <Input
                                        id="skills"
                                        type="text"
                                        value={formData.skills}
                                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                        placeholder="e.g., Java, Python, Web Development"
                                        className="focus-visible:ring-[#800000]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="interests">Interests (comma-separated)</Label>
                                    <Input
                                        id="interests"
                                        type="text"
                                        value={formData.interests}
                                        onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                                        placeholder="e.g., Machine Learning, Cloud Computing"
                                        className="focus-visible:ring-[#800000]"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#800000] hover:bg-[#660000] text-white py-2"
                                >
                                    {loading ? 'Submitting...' : 'Register'}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex justify-center border-t pt-6 bg-gray-50 rounded-b-lg">
                            <p className="text-sm text-gray-600">
                                Already have an account? <Link href="/login" className="text-[#800000] hover:underline font-medium">Login here</Link>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
