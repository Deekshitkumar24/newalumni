'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { AlertTriangle, CheckCircle2, XCircle, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

const REQUEST_TYPES: Record<string, string> = {
    career_guidance: 'Career Guidance',
    project_help: 'Project Help',
    skill_development: 'Skill Development',
    industry_insights: 'Industry Insights',
    resume_review: 'Resume Review',
    interview_prep: 'Interview Preparation',
    general: 'General Mentorship',
};

export default function AlumniMentorshipPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const { data: requestsData, isLoading: requestsLoading, mutate } = useSWR(
        user?.role === 'alumni' ? '/api/mentorship/me' : null,
        fetcher
    );
    const requests: any[] = requestsData?.data || [];

    const [respondingId, setRespondingId] = useState<string | null>(null);

    if (authLoading || (user?.role === 'alumni' && requestsLoading)) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'alumni') return null;

    const handleRespond = async (requestId: string, status: 'accepted' | 'rejected') => {
        setRespondingId(requestId);
        try {
            const res = await fetch(`/api/mentorship/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || `Failed to ${status} request`);
            toast.success(`Request ${status}!`);
            mutate();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setRespondingId(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending' && !r.stoppedByAdmin);
    const stoppedRequests = requests.filter(r => r.stoppedByAdmin);
    const resolvedRequests = requests.filter(r => r.status !== 'pending' && !r.stoppedByAdmin);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#800000]">
                <div>
                    <h1 className="text-2xl font-bold text-[#800000]">Mentorship Hub</h1>
                    <p className="text-gray-600 mt-1">Manage mentorship requests from students.</p>
                </div>
                <Badge variant="outline" className="text-sm px-3 py-1">
                    {pendingRequests.length} pending
                </Badge>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg mb-2">No mentorship requests yet</p>
                    <p className="text-gray-400 text-sm">When students request your mentorship, they will appear here.</p>
                </div>
            ) : (
                <>
                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                Pending Requests
                                <Badge className="bg-yellow-100 text-yellow-800">{pendingRequests.length}</Badge>
                            </h2>
                            <div className="space-y-4">
                                {pendingRequests.map((request: any) => (
                                    <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={request.otherUser?.profileImage} />
                                                <AvatarFallback>{(request.otherUser?.fullName || request.otherUser?.name)?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-gray-900">{request.otherUser?.fullName || request.otherUser?.name}</h3>
                                                    <span className="text-xs text-gray-400">{new Date(request.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <Badge variant="outline" className="text-xs mb-2">{REQUEST_TYPES[request.requestType] || request.requestType}</Badge>
                                                <p className="text-sm text-gray-700 mt-1">{request.description || request.message}</p>
                                                <div className="flex gap-2 mt-4">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRespond(request.id, 'accepted')}
                                                        disabled={respondingId === request.id}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <CheckCircle2 size={14} className="mr-1" /> Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRespond(request.id, 'rejected')}
                                                        disabled={respondingId === request.id}
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        <XCircle size={14} className="mr-1" /> Decline
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stopped by Admin */}
                    {stoppedRequests.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                Stopped by Admin
                                <Badge variant="destructive">{stoppedRequests.length}</Badge>
                            </h2>
                            <div className="space-y-4">
                                {stoppedRequests.map((request: any) => (
                                    <div key={request.id} className="bg-red-50 border border-red-200 rounded-lg p-5">
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={request.otherUser?.profileImage} />
                                                <AvatarFallback>{(request.otherUser?.fullName || request.otherUser?.name)?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-gray-900">{request.otherUser?.fullName || request.otherUser?.name}</h3>
                                                    <Badge variant="destructive" className="bg-red-700">Stopped</Badge>
                                                </div>
                                                <Badge variant="outline" className="text-xs mb-2">{REQUEST_TYPES[request.requestType] || request.requestType}</Badge>
                                                <p className="text-sm text-gray-700 mt-1">{request.description || request.message}</p>
                                                {request.stopReason && (
                                                    <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-white/70 p-3 rounded border border-red-100">
                                                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                                        <span><strong>Admin reason:</strong> {request.stopReason}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resolved Requests */}
                    {resolvedRequests.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">Previous Requests</h2>
                            <div className="space-y-3">
                                {resolvedRequests.map((request: any) => (
                                    <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={request.otherUser?.profileImage} />
                                                    <AvatarFallback>{(request.otherUser?.fullName || request.otherUser?.name)?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-gray-900">{request.otherUser?.fullName || request.otherUser?.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {REQUEST_TYPES[request.requestType] || request.requestType} • {new Date(request.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={request.status === 'accepted' ? 'default' : 'destructive'}
                                                    className={request.status === 'accepted' ? 'bg-green-600' : ''}>
                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                </Badge>
                                                {request.status === 'accepted' && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#800000] hover:bg-[#660000] h-8"
                                                        onClick={() => router.push(`/dashboard/messages?to=${request.otherUser?.id}`)}
                                                    >
                                                        <MessageCircle size={14} className="mr-1" /> Message
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
