'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alumni } from '@/types';
// import { initializeData } from '@/lib/data/store'; // Removed
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
        profileImage: '',
        fullName: '' // Added fullName editing support
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
            try {
                const res = await fetch('/api/profile/me');
                if (res.status === 401 || res.status === 403) {
                    router.push('/login');
                    return;
                }
                const data = await res.json();

                if (data.user) {
                    // Merge User and Profile for UI
                    const mergedUser: Alumni = {
                        ...data.user,
                        ...data.profile, // Flatten profile fields
                        name: data.user.fullName || data.user.name,
                        // Ensure fields match types
                        currentCompany: data.profile?.company, // Map 'company' from DB to 'currentCompany' logic if needed, or stick to DB naming
                        currentRole: data.profile?.designation, // Map 'designation' to 'currentRole'
                        linkedIn: data.profile?.linkedin, // Map 'linkedin' (lowercase in db) to 'linkedIn' (camelCase in type?) type usually has linkedIn
                        careerJourney: data.profile?.bio, // Map 'bio' to 'careerJourney'
                    };

                    // Fix mapping if types differ
                    // In schema: company, designation, linkedin, bio
                    // In Alumni type (likely): currentCompany, currentRole, linkedIn, careerJourney?
                    // Let's check type definition if possible, but for now I'll map based on typical patterns or what I see in previous code.
                    // Previous code used: currentCompany, currentRole, linkedIn, careerJourney.

                    setUser(mergedUser);
                    setFormData({
                        currentCompany: data.profile?.company || '',
                        currentRole: data.profile?.designation || '',
                        linkedIn: data.profile?.linkedin || '',
                        careerJourney: data.profile?.bio || '',
                        profileImage: mergedUser.profileImage || '',
                        fullName: mergedUser.name
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
        document.cookie = 'token=; Max-Age=0; path=/;';
        localStorage.removeItem('vjit_current_user');
        window.location.href = '/login';
    };

    const handleSave = async () => {
        if (!user) return;

        try {
            // Map back to API expected keys (Schema)
            const payload = {
                company: formData.currentCompany,
                designation: formData.currentRole,
                linkedin: formData.linkedIn,
                bio: formData.careerJourney,
                profileImage: formData.profileImage || undefined,
                fullName: formData.fullName
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
                currentCompany: payload.company,
                currentRole: payload.designation,
                linkedIn: payload.linkedin,
                careerJourney: payload.bio,
                profileImage: payload.profileImage || user.profileImage,
                name: payload.fullName || user.name
            };

            setUser(updatedUser as any);
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
                    <Skeleton className="h-[600px] w-full max-w-2xl mx-auto rounded-lg" />
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
                                                    profileImage: user.profileImage || '',
                                                    fullName: user.name
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
    );
}
