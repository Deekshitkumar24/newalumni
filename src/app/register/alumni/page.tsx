'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { registerAlumni, initializeData } from '@/lib/data/store';

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
                        <div className="bg-green-50 border border-green-200 p-8">
                            <div className="text-4xl mb-4">✓</div>
                            <h2 className="text-xl font-semibold text-green-800 mb-4">Registration Successful!</h2>
                            <p className="text-gray-600 mb-6">
                                Your registration has been submitted. An administrator will review and approve your account.
                                You will be able to login once your account is approved.
                            </p>
                            <Link href="/login" className="inline-block bg-[#800000] text-white px-6 py-3 hover:bg-[#660000]">
                                Go to Login
                            </Link>
                        </div>
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
                    <div className="border border-gray-200 bg-white">
                        <div className="bg-[#DAA520] text-[#333] px-6 py-4">
                            <h1 className="text-xl font-semibold">Alumni Registration</h1>
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Department <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                            required
                                        >
                                            <option value="">Select</option>
                                            {departments.map(dept => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Graduation Year <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formData.graduationYear}
                                            onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                            required
                                        >
                                            <option value="">Select</option>
                                            {graduationYears.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Company
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.currentCompany}
                                            onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                            placeholder="e.g., Microsoft"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Current Role
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.currentRole}
                                            onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                            placeholder="e.g., Software Engineer"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        LinkedIn Profile URL
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.linkedIn}
                                        onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        placeholder="https://linkedin.com/in/yourprofile"
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Career Journey (Optional)
                                    </label>
                                    <textarea
                                        value={formData.careerJourney}
                                        onChange={(e) => setFormData({ ...formData, careerJourney: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        rows={3}
                                        placeholder="Brief description of your career path since graduation..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#DAA520] text-[#333] py-3 hover:bg-[#f0c75e] disabled:opacity-50"
                                >
                                    {loading ? 'Submitting...' : 'Register'}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm">
                                <p className="text-gray-600">
                                    Already have an account? <Link href="/login" className="text-[#800000] hover:underline">Login here</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
