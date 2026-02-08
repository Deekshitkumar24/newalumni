'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { authenticateUser, initializeData } from '@/lib/data/store';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

            // Dispatch custom event to notify Header component
            window.dispatchEvent(new CustomEvent('vjit_auth_change'));

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
                    <Card className="w-full shadow-md">
                        <CardHeader className="bg-[#800000] text-white rounded-t-lg py-4">
                            <CardTitle className="text-xl font-semibold">Login to VJIT Alumni Portal</CardTitle>
                        </CardHeader>

                        <CardContent className="pt-6">
                            {error && (
                                <Alert variant="destructive" className="mb-4 bg-red-50 text-red-700 border-red-200">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
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

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        className="focus-visible:ring-[#800000]"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#800000] hover:bg-[#660000] text-white"
                                >
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4 border-t pt-6">
                            <div className="text-center text-sm w-full">
                                <p className="text-gray-600 mb-2">
                                    Don&apos;t have an account?
                                </p>
                                <Link href="/register" className="text-[#800000] hover:underline font-medium">
                                    Register as Student or Alumni
                                </Link>
                            </div>
                            <div className="text-center text-xs text-gray-500 w-full">
                                <p>Note: New registrations require admin approval.</p>
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Demo Credentials */}
                    <Card className="mt-6 bg-[#f5f5f5] text-sm">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold text-[#800000] mb-2">Demo Credentials</h3>
                            <div className="space-y-2 text-gray-600">
                                <p><strong>Admin:</strong> admin@vjit.ac.in / admin123</p>
                                <p><strong>Alumni:</strong> sanjay.patel@gmail.com / password123</p>
                                <p><strong>Student:</strong> rahul.kumar@vjit.ac.in / password123</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
