'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni } from '@/types';
import { initializeData } from '@/lib/data/store';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/Skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil } from 'lucide-react';


export default function AlumniProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<Alumni | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        currentCompany: '',
        currentRole: '',
        linkedIn: '',
        careerJourney: '',
        profileImage: ''
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setFormData(prev => ({ ...prev, profileImage: base64String }));
            };
            reader.readAsDataURL(file);
        }
    };

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

        setTimeout(() => {
            setUser(currentUser);
            setFormData({
                currentCompany: currentUser.currentCompany || '',
                currentRole: currentUser.currentRole || '',
                linkedIn: currentUser.linkedIn || '',
                careerJourney: currentUser.careerJourney || '',
                profileImage: currentUser.profileImage || ''
            });
            setLoading(false);
        }, 500);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('vjit_current_user');
        window.location.href = '/';
    };

    const handleSave = () => {
        if (!user) return;

        const updatedUser = {
            ...user,
            currentCompany: formData.currentCompany || undefined,
            currentRole: formData.currentRole || undefined,
            linkedIn: formData.linkedIn || undefined,
            careerJourney: formData.careerJourney || undefined,
            profileImage: formData.profileImage || undefined
        };

        // Update in localStorage
        localStorage.setItem('vjit_current_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="bg-[#DAA520] h-32 w-full animate-pulse"></div>
                <div className="container mx-auto px-4 -mt-10">
                    <Skeleton className="h-[600px] w-full max-w-2xl mx-auto rounded-lg" />
                </div>
            </div>
        )
    }

    if (!user) return null;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-[#800000] mb-6">My Profile</h1>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <Card className="border-gray-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-[#800000] text-white py-4 flex flex-row justify-between items-center rounded-t-lg">
                            <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
                            {!isEditing && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="bg-white/20 hover:bg-white/30 text-white border-transparent"
                                >
                                    Edit Profile
                                </Button>
                            )}
                        </CardHeader>

                        <CardContent className="p-8">
                            {/* Profile Image Section */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative group">
                                    <Avatar className="w-32 h-32 border-4 border-[#800000] shadow-lg">
                                        <AvatarImage
                                            src={isEditing ? formData.profileImage : (user.profileImage || "")}
                                            alt="Profile"
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-gray-100 text-4xl font-bold text-gray-400">
                                            {user.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {isEditing && (
                                        <label className="absolute bottom-0 right-0 bg-[#800000] text-white p-2.5 rounded-full cursor-pointer hover:bg-[#660000] shadow-md transition-all hover:scale-105">
                                            <Pencil size={16} />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                    )}
                                </div>
                                <div className="mt-4 text-center">
                                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                                    <p className="text-gray-500">{user.email}</p>
                                </div>
                            </div>

                            {/* Info Grid - Read Only */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Department</Label>
                                    <div className="font-semibold text-gray-900">{user.department}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-gray-500 text-xs uppercase tracking-wide">Graduation Year</Label>
                                    <div className="font-semibold text-gray-900">{user.graduationYear}</div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-6">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="currentCompany">Current Company</Label>
                                                <Input
                                                    id="currentCompany"
                                                    value={formData.currentCompany}
                                                    onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="currentRole">Current Role</Label>
                                                <Input
                                                    id="currentRole"
                                                    value={formData.currentRole}
                                                    onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="linkedIn">LinkedIn Profile URL</Label>
                                            <Input
                                                id="linkedIn"
                                                type="url"
                                                placeholder="https://linkedin.com/in/yourprofile"
                                                value={formData.linkedIn}
                                                onChange={(e) => setFormData({ ...formData, linkedIn: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="careerJourney">Career Journey</Label>
                                            <Textarea
                                                id="careerJourney"
                                                rows={4}
                                                placeholder="Share your career path since graduation..."
                                                value={formData.careerJourney}
                                                onChange={(e) => setFormData({ ...formData, careerJourney: e.target.value })}
                                            />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                            <Button onClick={handleSave} className="bg-[#800000] hover:bg-[#660000]">
                                                Save Changes
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setFormData({
                                                        currentCompany: user.currentCompany || '',
                                                        currentRole: user.currentRole || '',
                                                        linkedIn: user.linkedIn || '',
                                                        careerJourney: user.careerJourney || '',
                                                        profileImage: user.profileImage || ''
                                                    });
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <Label className="text-gray-500">Current Company</Label>
                                                <div className="font-medium text-gray-900">
                                                    {user.currentCompany || <span className="text-gray-400 italic">Not specified</span>}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-gray-500">Current Role</Label>
                                                <div className="font-medium text-gray-900">
                                                    {user.currentRole || <span className="text-gray-400 italic">Not specified</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-gray-500">LinkedIn</Label>
                                            <div className="font-medium">
                                                {user.linkedIn ? (
                                                    <a href={user.linkedIn} target="_blank" rel="noopener noreferrer" className="text-[#800000] hover:underline flex items-center gap-1">
                                                        {user.linkedIn} ↗
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 italic">Not specified</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-gray-500">Career Journey</Label>
                                            <p className="text-gray-700 whitespace-pre-wrap mt-1 leading-relaxed">
                                                {user.careerJourney || <span className="text-gray-400 italic">Not specified</span>}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="bg-gray-50 px-8 py-4 flex justify-end items-center border-t border-gray-100 rounded-b-lg">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleLogout}
                                className="bg-red-50 text-red-600 hover:bg-red-100 border-red-100 hover:border-red-200 shadow-none border"
                            >
                                Log Out
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
