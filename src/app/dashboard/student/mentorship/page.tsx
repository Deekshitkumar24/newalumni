'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Send, AlertTriangle, XCircle, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

const REQUEST_TYPE_OPTIONS = [
    { value: 'career_guidance', label: 'Career Guidance' },
    { value: 'project_help', label: 'Project Help' },
    { value: 'skill_development', label: 'Skill Development' },
    { value: 'industry_insights', label: 'Industry Insights' },
    { value: 'resume_review', label: 'Resume Review' },
    { value: 'interview_prep', label: 'Interview Preparation' },
    { value: 'general', label: 'General Mentorship' },
];

const REQUEST_TYPES: Record<string, string> = Object.fromEntries(
    REQUEST_TYPE_OPTIONS.map(o => [o.value, o.label])
);

export default function StudentMentorshipPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Request modal state
    const [selectedMentor, setSelectedMentor] = useState<any>(null);
    const [requestType, setRequestType] = useState('career_guidance');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Cancellation
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Debounce search
    useState(() => {
        const timeout = setTimeout(() => setDebouncedQuery(searchQuery), 400);
        return () => clearTimeout(timeout);
    });

    // Mentors
    const mentorsUrl = `/api/mentors?${new URLSearchParams({ ...(debouncedQuery && { q: debouncedQuery }), limit: '20' }).toString()}`;
    const { data: mentorsData, isLoading: mentorsLoading } = useSWR(
        user?.role === 'student' ? mentorsUrl : null,
        fetcher
    );
    const mentors: any[] = mentorsData?.items || [];

    // My requests
    const { data: requestsData, isLoading: requestsLoading, mutate: mutateRequests } = useSWR(
        user?.role === 'student' ? '/api/mentorship/me' : null,
        fetcher
    );
    const myRequests: any[] = requestsData?.data || [];

    if (authLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'student') return null;

    const handleSubmitRequest = async () => {
        if (!selectedMentor) return;
        if (!description.trim() || description.length < 10) {
            toast.error('Description must be at least 10 characters');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/mentorship/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    mentorId: selectedMentor.id,
                    requestType,
                    description: description.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                const errMsg = typeof data.error === 'string' ? data.error : Array.isArray(data.error) ? data.error.map((e: any) => e.message).join(', ') : 'Failed to send request';
                throw new Error(errMsg);
            }
            toast.success('Mentorship request sent!');
            mutateRequests();
            setSelectedMentor(null);
            setDescription('');
            setRequestType('career_guidance');
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = async (requestId: string) => {
        setCancellingId(requestId);
        try {
            const res = await fetch(`/api/mentorship/${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: 'cancelled' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to cancel');
            toast.success('Request cancelled');
            mutateRequests();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#800000]">
                <div>
                    <h1 className="text-2xl font-bold text-[#800000]">Find a Mentor</h1>
                    <p className="text-gray-600 mt-1">Connect with alumni for guidance and mentorship.</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setDebouncedQuery(e.target.value); }}
                    placeholder="Search mentors by name, company, or department..."
                    className="pl-10"
                />
            </div>

            {/* Mentors Grid */}
            {mentorsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40 rounded-lg" />)}
                </div>
            ) : mentors.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">No mentors found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mentors.map((mentor: any) => (
                        <div key={mentor.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={mentor.profileImage} />
                                    <AvatarFallback>{(mentor.fullName || mentor.name)?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{mentor.fullName || mentor.name}</h3>
                                    <p className="text-sm text-gray-500 truncate">{mentor.designation ? `${mentor.designation} at ` : ''}{mentor.company || 'Alumni'}</p>
                                    <p className="text-xs text-gray-400">{mentor.department} • {mentor.graduationYear}</p>
                                </div>
                            </div>
                            {mentor.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{mentor.bio}</p>}
                            <Button
                                size="sm"
                                className="w-full mt-3 bg-[#800000] hover:bg-[#660000]"
                                onClick={() => setSelectedMentor(mentor)}
                            >
                                <Send size={14} className="mr-1" /> Request Mentorship
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* My Requests Section */}
            <div className="border-t pt-6 mt-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">My Requests</h2>
                {requestsLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                    </div>
                ) : myRequests.length === 0 ? (
                    <p className="text-gray-400 text-sm">No requests sent yet.</p>
                ) : (
                    <div className="space-y-3">
                        {myRequests.map((request: any) => (
                            <div key={request.id} className={`border rounded-lg p-4 ${request.stoppedByAdmin ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center justify-between gap-4">
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
                                            {request.description && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{request.description}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {request.stoppedByAdmin && (
                                            <Badge variant="destructive" className="bg-red-700 text-xs">Admin Stopped</Badge>
                                        )}
                                        <Badge
                                            variant={request.status === 'accepted' ? 'default' : request.status === 'rejected' || request.status === 'cancelled' ? 'destructive' : 'secondary'}
                                            className={request.status === 'accepted' ? 'bg-green-600' : request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        >
                                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                        </Badge>
                                        {request.status === 'pending' && !request.stoppedByAdmin && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 h-8"
                                                disabled={cancellingId === request.id}
                                                onClick={() => handleCancel(request.id)}
                                            >
                                                <XCircle size={14} />
                                            </Button>
                                        )}
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
                                {request.stoppedByAdmin && request.stopReason && (
                                    <div className="mt-2 flex items-start gap-2 text-sm text-red-700 bg-white/70 p-2 rounded border border-red-100">
                                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                        <span>Admin reason: {request.stopReason}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Modal */}
            <Dialog open={!!selectedMentor} onOpenChange={() => setSelectedMentor(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#800000]">Request Mentorship</DialogTitle>
                        <DialogDescription>
                            Send a mentorship request to {selectedMentor?.fullName || selectedMentor?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Request Type <span className="text-red-500">*</span></Label>
                            <select
                                value={requestType}
                                onChange={(e) => setRequestType(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000] bg-white"
                            >
                                {REQUEST_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Description <span className="text-red-500">*</span></Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Explain what you're looking for (min 10 characters)..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedMentor(null)}>Cancel</Button>
                        <Button
                            onClick={handleSubmitRequest}
                            disabled={!description.trim() || description.length < 10 || submitting}
                            className="bg-[#800000] hover:bg-[#660000]"
                        >
                            {submitting ? 'Sending...' : 'Send Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
