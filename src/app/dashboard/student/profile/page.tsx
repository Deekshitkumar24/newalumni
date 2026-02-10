'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Student } from '@/types';
import { initializeData } from '@/lib/data/store';
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
        if (currentUser.role !== 'student') {
            router.push('/login');
            return;
        }

        // Simulate fetch delay for skeleton
        setTimeout(() => {
            setUser(currentUser);
            setFormData({
                skills: currentUser.skills?.join(', ') || '',
                interests: currentUser.interests?.join(', ') || '',
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
            skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
            interests: formData.interests.split(',').map(s => s.trim()).filter(s => s),
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
                                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
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
                                <Label className="text-gray-500">Graduation Year</Label>
                                <div className="font-medium text-gray-900">{user.graduationYear}</div>
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
