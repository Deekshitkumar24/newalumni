'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getStudents, initializeData } from '@/lib/data/store';
import { Student, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function StudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }

        const allStudents = getStudents();
        const found = allStudents.find(s => s.id === params.id);

        // Simulate network delay
        setTimeout(() => {
            setStudent(found || null);
            setLoading(false);
        }, 300);
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-6xl mb-4">😕</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Student Not Found</h1>
                <p className="text-gray-600 mb-6">The profile you are looking for does not exist.</p>
                <Button onClick={() => router.back()} className="bg-[#800000] text-white hover:bg-[#660000]">
                    Go Back
                </Button>
            </div>
        );
    }

    const isOwnProfile = currentUser && currentUser.id === student.id;

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <div className="container mx-auto px-4 py-8">
                {/* Profile Header Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="h-32 bg-gradient-to-r from-[#800000] to-[#4a0000]"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="flex items-end gap-6">
                                <Avatar className="w-32 h-32 border-4 border-white shadow-md">
                                    <AvatarImage src={student.profileImage} alt={student.name} className="object-cover" />
                                    <AvatarFallback className="bg-gray-200 text-4xl font-bold text-gray-500">
                                        {student.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
                                    <p className="text-gray-600 font-medium">Student • {student.department}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {student.linkedIn && (
                                    <a
                                        href={student.linkedIn}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 border border-gray-300 rounded-md text-blue-700 font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path></svg>
                                        LinkedIn
                                    </a>
                                )}

                                {isOwnProfile && (
                                    <Link
                                        href="/dashboard/student/profile"
                                        className="px-5 py-2 bg-gray-800 text-white rounded-md font-medium hover:bg-gray-700 transition-colors"
                                    >
                                        Edit Profile
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <Badge variant="secondary" className="px-3 py-1 text-sm">
                                🎓 Batch of {student.graduationYear}
                            </Badge>
                            <Badge variant="outline" className="px-3 py-1 text-sm border-gray-300">
                                🆔 Roll No: {student.rollNumber}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Skills */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {student.skills && student.skills.length > 0 ? (
                                    student.skills.map((skill, index) => (
                                        <Badge key={index} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100">
                                            {skill}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-gray-400 italic">No skills listed</span>
                                )}
                            </div>
                        </div>

                        {/* Interests */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Interests</h2>
                            <div className="flex flex-wrap gap-2">
                                {student.interests && student.interests.length > 0 ? (
                                    student.interests.map((interest, index) => (
                                        <Badge key={index} variant="outline" className="text-gray-700 border-gray-300">
                                            {interest}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-gray-400 italic">No interests listed</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                         {!currentUser && (
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                                <p className="text-gray-600 text-sm mb-3">Login to connect with students.</p>
                                <Link href="/login" className="text-[#800000] font-medium hover:underline">
                                    Login Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
