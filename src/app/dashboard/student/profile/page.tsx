'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Student } from '@/types';
// import { initializeData } from '@/lib/data/store'; // Removed
import { toast } from 'sonner';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pencil } from 'lucide-react';

export default function StudentProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<Student | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        skills: '',
        interests: '',
        profileImage: '',
        fullName: '', // Added fullName editing support
        batch: '' // Added batch editing support
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
        const fetchProfile = async () => {
            const token = document.cookie.includes('token='); // Simple client check or just rely on API 401
            // Better to just call API

            try {
                const res = await fetch('/api/profile/me');
                if (res.status === 401 || res.status === 403) {
                    router.push('/login');
                    return;
                }
                const data = await res.json();

                if (data.user) {
                    // Merge User and Profile for UI
                    const mergedUser: Student = {
                        ...data.user,
                        ...data.profile, // Flatten profile fields
                        name: data.user.fullName || data.user.name, // Ensure accurate name
                        // data.profile might have nulls, ensure arrays
                        skills: data.profile?.skills || [],
                        interests: data.profile?.interests || [],
                    };

                    setUser(mergedUser);
                    setFormData({
                        skills: mergedUser.skills?.join(', ') || '',
                        interests: mergedUser.interests?.join(', ') || '',
                        profileImage: mergedUser.profileImage || '',
                        fullName: mergedUser.name,
                        batch: mergedUser.batch?.toString() || ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile", error);
                toast.error("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleLogout = () => {
        document.cookie = 'token=; Max-Age=0; path=/;'; // Clear cookie // Basic clear
        localStorage.removeItem('vjit_current_user'); // Legacy clear
        window.location.href = '/login';
    };

    const handleSave = async () => {
        if (!user) return;

        try {
            const payload = {
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
                interests: formData.interests.split(',').map(s => s.trim()).filter(s => s),
                profileImage: formData.profileImage || undefined,
                fullName: formData.fullName,
                batch: formData.batch ? parseInt(formData.batch) : undefined
            };

            const res = await fetch('/api/profile/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to update');

            // Optimistic update
            const updatedUser = {
                ...user,
                ...payload,
                name: payload.fullName || user.name,
                batch: payload.batch || user.batch
            };

            setUser(updatedUser as any); // Cast as merging types is tricky sometimes
            setIsEditing(false);
            toast.success("Profile updated successfully!");

        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile.");
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="bg-[#800000] h-32 w-full animate-pulse"></div>
                <div className="container mx-auto px-4 -mt-10">
                    <Skeleton className="h-[500px] w-full max-w-2xl mx-auto rounded-lg" />
                </div>
            </div>
        )
    }

    if (!user) return null;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto px-4 py-8">
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
                                {isEditing ? (
                                    <Input
                                        value={formData.fullName}
                                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                        className="text-center font-bold text-xl max-w-xs mx-auto mt-2"
                                        placeholder="Full Name"
                                    />
                                ) : (
                                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                                )}

                                <p className="text-gray-500">{user.email}</p>
                                <Badge className={`mt-2 ${user.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}`}>
                                    {user.status?.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-1">
                                <Label className="text-gray-500">Roll Number</Label>
                                <div className="font-medium text-gray-900">{user.rollNumber}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-gray-500">Department</Label>
                                <div className="font-medium text-gray-900">{user.department}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-gray-500">Batch</Label>
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        value={formData.batch}
                                        onChange={e => setFormData({ ...formData, batch: e.target.value })}
                                        className="font-medium text-gray-900"
                                        placeholder="e.g., 2024"
                                    />
                                ) : (
                                    <div className="font-medium text-gray-900">{user.batch}</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-gray-500">Role</Label>
                                <div className="font-medium text-gray-900 capitalize">{user.role}</div>
                            </div>
                        </div>

                        {/* Editable Section */}
                        <div className="border-t border-gray-100 pt-6">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="skills">Skills (comma-separated)</Label>
                                        <Input
                                            id="skills"
                                            value={formData.skills}
                                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                                            placeholder="e.g., Java, Python, Web Development"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="interests">Interests (comma-separated)</Label>
                                        <Input
                                            id="interests"
                                            value={formData.interests}
                                            onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                                            placeholder="e.g., Machine Learning, Cloud Computing"
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
                                                    skills: user.skills?.join(', ') || '',
                                                    interests: user.interests?.join(', ') || '',
                                                    profileImage: user.profileImage || '',
                                                    fullName: user.name,
                                                    batch: user.batch?.toString() || ''
                                                });
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <Label className="text-gray-500">Skills</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {user.skills && user.skills.length > 0
                                                ? user.skills.map((skill, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-gray-100 text-gray-800">
                                                        {skill}
                                                    </Badge>
                                                ))
                                                : <span className="text-gray-400 italic">Not specified</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-gray-500">Interests</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {user.interests && user.interests.length > 0
                                                ? user.interests.map((interest, i) => (
                                                    <Badge key={i} variant="outline" className="text-gray-700">
                                                        {interest}
                                                    </Badge>
                                                ))
                                                : <span className="text-gray-400 italic">Not specified</span>}
                                        </div>
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
    );
}
