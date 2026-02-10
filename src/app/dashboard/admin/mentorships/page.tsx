'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MentorshipRequest } from '@/types';
import { Handshake } from 'lucide-react';
import { initializeData, getAllMentorships, updateMentorshipStatus, getStudentById, getAlumniById } from '@/lib/data/store';
import { RowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminMentorshipsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<MentorshipRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr || JSON.parse(userStr).role !== 'admin') {
            router.push('/login');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setRequests(getAllMentorships());
            setLoading(false);
        }, 500);
    }, [router, refreshKey]);

    const handleForceClose = (id: string) => {
        if (!confirm('Area you sure you want to FORCE CLOSE this mentorship connection? This will act as a rejection/termination.')) return;
        updateMentorshipStatus(id, 'rejected');
        setRefreshKey(k => k + 1);
    };

    const getNames = (req: MentorshipRequest) => {
        const student = getStudentById(req.studentId);
        const alumni = getAlumniById(req.alumniId);
        return {
            studentName: student?.name || 'Unknown Student',
            alumniName: alumni?.name || 'Unknown Alumni'
        };
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Mentorship Oversight</h1>
            {loading ? (
                <div className="bg-white p-6 space-y-4 rounded border border-gray-200">
                    {[1, 2, 3].map(i => <RowSkeleton key={i} />)}
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded shadow-sm">
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-700">All Mentorship Connections ({requests.length})</h2>
                    </div>
                    {requests.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {requests.map(req => {
                                const { studentName, alumniName } = getNames(req);
                                return (
                                    <div key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${req.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                        req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {req.status.toUpperCase()}
                                                    </span>
                                                    <span className="text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-900 font-medium">
                                                    <span>{studentName}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span>{alumniName}</span>
                                                </div>
                                                <p className="text-gray-600 mt-2 text-sm italic">"{req.message}"</p>
                                            </div>
                                            {req.status !== 'rejected' && (
                                                <button
                                                    onClick={() => handleForceClose(req.id)}
                                                    className="px-3 py-1 border border-red-200 text-red-700 rounded text-sm hover:bg-red-50"
                                                >
                                                    Force Close
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState icon={<Handshake size={48} />} title="No mentorship requests" description="No mentorship connections found in the system." />
                    )}
                </div>
            )}
        </div>
    );
}
