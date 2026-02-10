'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni, MentorshipRequest, Student } from '@/types';
import { initializeData, getMentorshipRequestsByAlumni, respondToMentorshipRequest, getStudents } from '@/lib/data/store';

export default function AlumniMentorshipPage() {
    const router = useRouter();
    const [user, setUser] = useState<Alumni | null>(null);
    const [requests, setRequests] = useState<MentorshipRequest[]>([]);
    const [students, setStudents] = useState<Student[]>([]);

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
        setRequests(getMentorshipRequestsByAlumni(currentUser.id));
        setStudents(getStudents());
    }, [router]);

    const getStudentById = (id: string) => {
        return students.find(s => s.id === id);
    };

    const handleRespond = (requestId: string, status: 'accepted' | 'rejected') => {
        respondToMentorshipRequest(requestId, status);
        setRequests(getMentorshipRequestsByAlumni(user!.id));
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <p>Loading...</p>
            </div>
        );
    }

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const respondedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Header */}
            <div className="bg-[#DAA520] text-[#333] py-6">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-semibold">Mentorship Hub</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Pending Requests */}
                <div className="bg-white border border-gray-200 mb-8">
                    <div className="bg-[#800000] text-white px-6 py-4">
                        <h2 className="font-semibold">Pending Requests ({pendingRequests.length})</h2>
                    </div>

                    {pendingRequests.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {pendingRequests.map(request => {
                                const student = getStudentById(request.studentId);
                                return (
                                    <div key={request.id} className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                            <div>
                                                <div className="font-medium text-[#800000]">{student?.name || 'Unknown Student'}</div>
                                                <div className="text-sm text-gray-600">
                                                    {student?.department} | Class of {student?.graduationYear}
                                                </div>
                                                <div className="text-sm text-gray-500 mt-1">
                                                    Roll No: {student?.rollNumber}
                                                </div>
                                                {student?.skills && student.skills.length > 0 && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Skills: {student.skills.join(', ')}
                                                    </div>
                                                )}
                                                <div className="mt-3 p-3 bg-gray-50 text-sm text-gray-600">
                                                    <strong>Message:</strong> {request.message}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-2">
                                                    Requested on: {new Date(request.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleRespond(request.id, 'accepted')}
                                                    className="bg-[#800000] text-white px-4 py-2 text-sm hover:bg-[#660000]"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRespond(request.id, 'rejected')}
                                                    className="bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            No pending mentorship requests.
                        </div>
                    )}
                </div>

                {/* Responded Requests */}
                {respondedRequests.length > 0 && (
                    <div className="bg-white border border-gray-200">
                        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                            <h2 className="font-semibold text-gray-700">Previous Requests ({respondedRequests.length})</h2>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {respondedRequests.map(request => {
                                const student = getStudentById(request.studentId);
                                return (
                                    <div key={request.id} className="p-4 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{student?.name || 'Unknown Student'}</div>
                                            <div className="text-sm text-gray-600">
                                                {student?.department} | Class of {student?.graduationYear}
                                            </div>
                                        </div>
                                        <div className={`text-sm px-3 py-1 ${request.status === 'accepted'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {request.status === 'accepted' ? 'Accepted' : 'Declined'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
}
