'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Student } from '@/types';
import { initializeData } from '@/lib/data/store';

export default function StudentProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<Student | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        skills: '',
        interests: ''
    });

    useEffect(() => {
        initializeData();

        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'student') {
            router.push('/login');
            return;
        }

        setUser(currentUser);
        setFormData({
            skills: currentUser.skills?.join(', ') || '',
            interests: currentUser.interests?.join(', ') || ''
        });
    }, [router]);

    const handleSave = () => {
        if (!user) return;

        const updatedUser = {
            ...user,
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
            interests: formData.interests.split(',').map(s => s.trim()).filter(s => s)
        };

        // Update in localStorage
        localStorage.setItem('vjit_current_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
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
            {/* Header */}
            <div className="bg-[#800000] text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-200 mb-2">
                        <Link href="/dashboard/student" className="hover:text-white">Dashboard</Link>
                        <span>/</span>
                        <span>My Profile</span>
                    </div>
                    <h1 className="text-2xl font-semibold">My Profile</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl">
                    <div className="bg-white border border-gray-200">
                        <div className="bg-[#800000] text-white px-6 py-4 flex justify-between items-center">
                            <h2 className="font-semibold">Profile Information</h2>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-sm bg-white/20 px-3 py-1 hover:bg-white/30"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            {/* Read-only fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="text-sm text-gray-500">Full Name</label>
                                    <div className="font-medium">{user.name}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Email</label>
                                    <div className="font-medium">{user.email}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Roll Number</label>
                                    <div className="font-medium">{user.rollNumber}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Department</label>
                                    <div className="font-medium">{user.department}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Graduation Year</label>
                                    <div className="font-medium">{user.graduationYear}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Account Status</label>
                                    <div className="font-medium capitalize">{user.status}</div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                {isEditing ? (
                                    <>
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Skills (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.skills}
                                                onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                                placeholder="e.g., Java, Python, Web Development"
                                            />
                                        </div>
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Interests (comma-separated)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.interests}
                                                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                                placeholder="e.g., Machine Learning, Cloud Computing"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleSave}
                                                className="bg-[#800000] text-white px-6 py-2 hover:bg-[#660000]"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setFormData({
                                                        skills: user.skills?.join(', ') || '',
                                                        interests: user.interests?.join(', ') || ''
                                                    });
                                                }}
                                                className="border border-gray-300 px-6 py-2 hover:bg-gray-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-4">
                                            <label className="text-sm text-gray-500">Skills</label>
                                            <div className="font-medium">
                                                {user.skills && user.skills.length > 0
                                                    ? user.skills.join(', ')
                                                    : <span className="text-gray-400">Not specified</span>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500">Interests</label>
                                            <div className="font-medium">
                                                {user.interests && user.interests.length > 0
                                                    ? user.interests.join(', ')
                                                    : <span className="text-gray-400">Not specified</span>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link href="/dashboard/student" className="text-[#800000] hover:underline">
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
