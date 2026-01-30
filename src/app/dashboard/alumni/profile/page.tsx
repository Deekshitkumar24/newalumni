'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni } from '@/types';
import { initializeData } from '@/lib/data/store';

export default function AlumniProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<Alumni | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        currentCompany: '',
        currentRole: '',
        linkedIn: '',
        careerJourney: ''
    });

    useEffect(() => {
        initializeData();

        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'alumni') {
            router.push('/login');
            return;
        }

        setUser(currentUser);
        setFormData({
            currentCompany: currentUser.currentCompany || '',
            currentRole: currentUser.currentRole || '',
            linkedIn: currentUser.linkedIn || '',
            careerJourney: currentUser.careerJourney || ''
        });
    }, [router]);

    const handleSave = () => {
        if (!user) return;

        const updatedUser = {
            ...user,
            currentCompany: formData.currentCompany || undefined,
            currentRole: formData.currentRole || undefined,
            linkedIn: formData.linkedIn || undefined,
            careerJourney: formData.careerJourney || undefined
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
            <div className="bg-[#DAA520] text-[#333] py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm mb-2">
                        <Link href="/dashboard/alumni" className="hover:underline">Dashboard</Link>
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
                                    <label className="text-sm text-gray-500">Department</label>
                                    <div className="font-medium">{user.department}</div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Graduation Year</label>
                                    <div className="font-medium">{user.graduationYear}</div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-6">
                                {isEditing ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Current Company
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.currentCompany}
                                                    onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
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
                                                Career Journey
                                            </label>
                                            <textarea
                                                value={formData.careerJourney}
                                                onChange={(e) => setFormData({ ...formData, careerJourney: e.target.value })}
                                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                                rows={4}
                                                placeholder="Share your career path since graduation..."
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
                                                        currentCompany: user.currentCompany || '',
                                                        currentRole: user.currentRole || '',
                                                        linkedIn: user.linkedIn || '',
                                                        careerJourney: user.careerJourney || ''
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="text-sm text-gray-500">Current Company</label>
                                                <div className="font-medium">
                                                    {user.currentCompany || <span className="text-gray-400">Not specified</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-500">Current Role</label>
                                                <div className="font-medium">
                                                    {user.currentRole || <span className="text-gray-400">Not specified</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mb-6">
                                            <label className="text-sm text-gray-500">LinkedIn</label>
                                            <div className="font-medium">
                                                {user.linkedIn ? (
                                                    <a href={user.linkedIn} target="_blank" rel="noopener noreferrer" className="text-[#800000] hover:underline">
                                                        {user.linkedIn}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">Not specified</span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm text-gray-500">Career Journey</label>
                                            <div className="font-medium mt-1">
                                                {user.careerJourney || <span className="text-gray-400">Not specified</span>}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link href="/dashboard/alumni" className="text-[#800000] hover:underline">
                            ← Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
