'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { authenticateUser, initializeData } from '@/lib/data/store';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Initialize data if not already done
        initializeData();

        // Attempt authentication
        const user = authenticateUser(formData.email, formData.password);

        if (user) {
            // Store user in localStorage
            localStorage.setItem('vjit_current_user', JSON.stringify(user));

            // Redirect based on role
            switch (user.role) {
                case 'admin':
                    router.push('/dashboard/admin');
                    break;
                case 'alumni':
                    router.push('/dashboard/alumni');
                    break;
                case 'student':
                    router.push('/dashboard/student');
                    break;
                default:
                    router.push('/');
            }
        } else {
            setError('Invalid email or password. Please check your credentials or ensure your account is approved.');
            setLoading(false);
        }
    };

    return (
        <div>
            <Breadcrumb items={[{ label: 'Login' }]} />

            <div className="container mx-auto px-4 py-10">
                <div className="max-w-md mx-auto">
                    <div className="border border-gray-200 bg-white">
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <h1 className="text-xl font-semibold">Login to VJIT Alumni Portal</h1>
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
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        required
                                    />
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#800000] text-white py-3 hover:bg-[#660000] disabled:opacity-50"
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm">
                                <p className="text-gray-600 mb-3">
                                    Don&apos;t have an account?
                                </p>
                                <Link href="/register" className="text-[#800000] hover:underline font-medium">
                                    Register as Student or Alumni
                                </Link>
                            </div>

                            <div className="mt-4 text-center text-xs text-gray-500">
                                <p>Note: New registrations require admin approval.</p>
                            </div>
                        </div>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-[#f5f5f5] border border-gray-200 text-sm">
                        <h3 className="font-semibold text-[#800000] mb-2">Demo Credentials</h3>
                        <div className="space-y-2 text-gray-600">
                            <p><strong>Admin:</strong> admin@vjit.ac.in / admin123</p>
                            <p><strong>Alumni:</strong> sanjay.patel@gmail.com / password123</p>
                            <p><strong>Student:</strong> rahul.kumar@vjit.ac.in / password123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
