'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni, Student, MentorshipRequest } from '@/types';
import { initializeData, getAlumni, getMentorshipRequestsByStudent, createMentorshipRequest } from '@/lib/data/store';

export default function StudentMentorshipPage() {
    const router = useRouter();
    const [user, setUser] = useState<Student | null>(null);
    const [alumni, setAlumni] = useState<Alumni[]>([]);
    const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
    const [message, setMessage] = useState('');

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
        setAlumni(getAlumni().filter(a => a.status === 'approved'));
        setMyRequests(getMentorshipRequestsByStudent(currentUser.id));
    }, [router]);

    const getRequestStatus = (alumniId: string) => {
        const request = myRequests.find(r => r.alumniId === alumniId);
        return request?.status;
    };

    const handleSendRequest = () => {
        if (!user || !selectedAlumni || !message.trim()) return;

        createMentorshipRequest(user.id, selectedAlumni.id, message);
        setMyRequests(getMentorshipRequestsByStudent(user.id));
        setShowRequestModal(false);
        setSelectedAlumni(null);
        setMessage('');
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
                        <span>Find Mentors</span>
                    </div>
                    <h1 className="text-2xl font-semibold">Find Mentors</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* My Requests */}
                {myRequests.length > 0 && (
                    <div className="bg-white border border-gray-200 p-6 mb-8">
                        <h2 className="text-lg font-semibold text-[#800000] mb-4">My Mentorship Requests</h2>
                        <div className="space-y-3">
                            {myRequests.map(request => {
                                const alumnus = alumni.find(a => a.id === request.alumniId);
                                return (
                                    <div key={request.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0">
                                        <div>
                                            <div className="font-medium">{alumnus?.name || 'Unknown'}</div>
                                            <div className="text-sm text-gray-500">{alumnus?.currentCompany} | {alumnus?.currentRole}</div>
                                        </div>
                                        <div className={`text-sm px-3 py-1 ${request.status === 'accepted'
                                                ? 'bg-green-100 text-green-700'
                                                : request.status === 'rejected'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Available Mentors */}
                <div className="bg-white border border-gray-200">
                    <div className="bg-[#800000] text-white px-6 py-4">
                        <h2 className="font-semibold">Available Mentors</h2>
                    </div>
                    <div className="p-6">
                        {alumni.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {alumni.map(alumnus => {
                                    const status = getRequestStatus(alumnus.id);
                                    return (
                                        <div key={alumnus.id} className="border border-gray-200 p-4">
                                            <div className="font-medium text-[#800000]">{alumnus.name}</div>
                                            <div className="text-sm text-gray-600">Class of {alumnus.graduationYear} | {alumnus.department}</div>
                                            {alumnus.currentCompany && (
                                                <div className="text-sm text-gray-500 mt-1">
                                                    {alumnus.currentRole} at {alumnus.currentCompany}
                                                </div>
                                            )}
                                            <div className="mt-3">
                                                {status === 'accepted' ? (
                                                    <span className="text-sm text-green-600">✓ Connected</span>
                                                ) : status === 'pending' ? (
                                                    <span className="text-sm text-yellow-600">⏳ Request Pending</span>
                                                ) : status === 'rejected' ? (
                                                    <span className="text-sm text-red-600">Request Declined</span>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedAlumni(alumnus);
                                                            setShowRequestModal(true);
                                                        }}
                                                        className="text-sm bg-[#800000] text-white px-4 py-2 hover:bg-[#660000]"
                                                    >
                                                        Request Mentorship
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-500">No mentors available at this time.</p>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <Link href="/dashboard/student" className="text-[#800000] hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>

            {/* Request Modal */}
            {showRequestModal && selectedAlumni && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-md mx-4">
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <h3 className="font-semibold">Request Mentorship</h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 mb-4">
                                Send a mentorship request to <strong>{selectedAlumni.name}</strong>
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    rows={4}
                                    placeholder="Introduce yourself and explain why you'd like this person as your mentor..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSendRequest}
                                    disabled={!message.trim()}
                                    className="flex-1 bg-[#800000] text-white py-2 hover:bg-[#660000] disabled:opacity-50"
                                >
                                    Send Request
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRequestModal(false);
                                        setSelectedAlumni(null);
                                        setMessage('');
                                    }}
                                    className="flex-1 border border-gray-300 py-2 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
