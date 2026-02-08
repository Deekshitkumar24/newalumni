'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Breadcrumb from '@/components/layout/Breadcrumb';
import MentorshipRequestModal from '@/components/alumni/MentorshipRequestModal';
import { getAlumni, initializeData, getMentorshipRequestsByStudent } from '@/lib/data/store';
import { Alumni, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AlumniProfilePage() {
    const params = useParams();
    const router = useRouter();
    const [alumnus, setAlumnus] = useState<Alumni | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mentorshipStatus, setMentorshipStatus] = useState<'pending' | 'accepted' | 'rejected' | null>(null);

    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        let user: User | null = null;
        if (userStr) {
            user = JSON.parse(userStr);
            setCurrentUser(user);
        }

        const allAlumni = getAlumni();
        const found = allAlumni.find(a => a.id === params.id);

        // Check mentorship status
        if (user && user.role === 'student' && found) {
            const requests = getMentorshipRequestsByStudent(user.id);
            const req = requests.find(r => r.alumniId === found.id);
            if (req) {
                setMentorshipStatus(req.status);
            }
        }

        // Simulate network delay
        setTimeout(() => {
            setAlumnus(found || null);
            setLoading(false);
        }, 300);
    }, [params.id, isModalOpen]); // Re-check when modal closes (in case request was sent)

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
            </div>
        );
    }

    if (!alumnus) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-6xl mb-4">😕</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Alumni Not Found</h1>
                <p className="text-gray-600 mb-6">The profile you are looking for does not exist or has been removed.</p>
                <Link
                    href="/alumni-directory"
                    className="px-6 py-2 bg-[#800000] text-white rounded-md hover:bg-[#660000] transition-colors"
                >
                    Back to Directory
                </Link>
            </div>
        );
    }

    const canRequestMentorship = currentUser && currentUser.role === 'student';
    const isOwnProfile = currentUser && currentUser.id === alumnus.id;

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <Breadcrumb items={[
                { label: 'Alumni Directory', href: '/alumni-directory' },
                { label: alumnus.name }
            ]} />

            <div className="container mx-auto px-4 py-8">
                {/* Profile Header Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                    <div className="h-32 bg-gradient-to-r from-[#800000] to-[#4a0000]"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex justify-between items-end -mt-12 mb-6">
                            <div className="flex items-end gap-6">
                                <Avatar className="w-32 h-32 border-4 border-white shadow-md">
                                    <AvatarImage src={alumnus.imageUrl || alumnus.profileImage} alt={alumnus.name} className="object-cover" />
                                    <AvatarFallback className="bg-gray-200 text-4xl font-bold text-gray-500">
                                        {alumnus.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="mb-1">
                                    <h1 className="text-3xl font-bold text-gray-900">{alumnus.name}</h1>
                                    <p className="text-gray-600 font-medium">{alumnus.currentRole} at {alumnus.currentCompany}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {alumnus.linkedIn && (
                                    <a
                                        href={alumnus.linkedIn}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 border border-gray-300 rounded-md text-blue-700 font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path></svg>
                                        LinkedIn
                                    </a>
                                )}

                                {canRequestMentorship && (
                                    (() => {
                                        if (mentorshipStatus === 'pending') {
                                            return (
                                                <button
                                                    disabled
                                                    className="px-5 py-2 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-md font-medium cursor-not-allowed flex items-center gap-2"
                                                >
                                                    <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                                    Request Pending
                                                </button>
                                            );
                                        }
                                        if (mentorshipStatus === 'accepted') {
                                            return (
                                                <button
                                                    disabled
                                                    className="px-5 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md font-medium cursor-default flex items-center gap-2"
                                                >
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                    Mentorship Active
                                                </button>
                                            );
                                        }
                                        return (
                                            <button
                                                onClick={() => setIsModalOpen(true)}
                                                className="px-5 py-2 bg-[#800000] text-white rounded-md font-medium hover:bg-[#660000] transition-colors shadow-sm flex items-center gap-2"
                                            >
                                                Connect / Mentorship
                                            </button>
                                        );
                                    })()
                                )}

                                {isOwnProfile && (
                                    <Link
                                        href="/dashboard/alumni/profile"
                                        className="px-5 py-2 bg-gray-800 text-white rounded-md font-medium hover:bg-gray-700 transition-colors"
                                    >
                                        Edit Profile
                                    </Link>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                                🎓 Class of {alumnus.graduationYear}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
                                📚 {alumnus.department}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="md:col-span-2 space-y-6">
                        {/* About */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Career Journey</h2>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {alumnus.careerJourney || "No career journey details provided yet."}
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                            <h3 className="font-bold text-green-900 mb-2">Mentorship Status</h3>
                            <div className="flex items-center gap-2 text-green-700 font-medium">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Open to Mentoring
                            </div>
                            <p className="text-sm text-green-800 mt-2 opacity-80">
                                This alumni has volunteered to mentor students. Feel free to send a request.
                            </p>
                        </div>

                        {/* Contact Visibility Notice */}
                        {!currentUser && (
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
                                <p className="text-gray-600 text-sm mb-3">Login to view full profile details and connect.</p>
                                <Link href="/login" className="text-[#800000] font-medium hover:underline">
                                    Login Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {currentUser && (
                <MentorshipRequestModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    student={currentUser}
                    alumni={alumnus}
                />
            )}
        </div>
    );
}
