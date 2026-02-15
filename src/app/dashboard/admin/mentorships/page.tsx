'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Handshake, Search, ShieldAlert, Ban, AlertTriangle, Shield, ToggleLeft, ToggleRight } from 'lucide-react';

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

export default function AdminMentorshipsPage() {
    const { user, isLoading: authLoading } = useAuth();

    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'requests' | 'blocks'>('requests');

    const [forceStopDialog, setForceStopDialog] = useState(false);
    const [forceStopTargetId, setForceStopTargetId] = useState('');
    const [forceStopReason, setForceStopReason] = useState('');
    const [forceStopSubmitting, setForceStopSubmitting] = useState(false);

    const [blockDialog, setBlockDialog] = useState(false);
    const [blockScope, setBlockScope] = useState<'student_global' | 'mentor_global' | 'pair_block'>('student_global');
    const [blockStudentId, setBlockStudentId] = useState('');
    const [blockMentorId, setBlockMentorId] = useState('');
    const [blockReason, setBlockReason] = useState('');
    const [blockSubmitting, setBlockSubmitting] = useState(false);

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedQuery(searchQuery), 400);
        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const apiUrl = `/api/admin/mentorship/requests?${new URLSearchParams({
        ...(statusFilter && { status: statusFilter }),
        ...(debouncedQuery && { q: debouncedQuery }),
        limit: '50',
    }).toString()}`;

    const { data: requestsData, isLoading: requestsLoading, mutate: mutateRequests } = useSWR(
        user?.role === 'admin' ? apiUrl : null,
        fetcher
    );
    const requests: any[] = requestsData?.data || [];

    const { data: blocksData, isLoading: blocksLoading, mutate: mutateBlocks } = useSWR(
        user?.role === 'admin' && activeTab === 'blocks' ? '/api/admin/mentorship/blocks' : null,
        fetcher
    );
    const blocks: any[] = blocksData?.data || [];

    if (authLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') return null;

    const handleForceStop = async () => {
        if (!forceStopReason.trim()) {
            toast.error('Reason is required for force stop');
            return;
        }
        setForceStopSubmitting(true);
        try {
            const res = await fetch(`/api/admin/mentorship/requests/${forceStopTargetId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action: 'force_stop', reason: forceStopReason.trim() })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to force stop');
            toast.success('Request stopped successfully');
            mutateRequests();
            setForceStopDialog(false);
            setForceStopReason('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setForceStopSubmitting(false);
        }
    };

    const handleCreateBlock = async () => {
        if (blockScope === 'student_global' && !blockStudentId.trim()) {
            toast.error('Student ID is required'); return;
        }
        if (blockScope === 'mentor_global' && !blockMentorId.trim()) {
            toast.error('Mentor ID is required'); return;
        }
        if (blockScope === 'pair_block' && (!blockStudentId.trim() || !blockMentorId.trim())) {
            toast.error('Both IDs required for pair block'); return;
        }
        setBlockSubmitting(true);
        try {
            const res = await fetch('/api/admin/mentorship/blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    scope: blockScope,
                    blockedStudentId: blockStudentId.trim() || undefined,
                    blockedMentorId: blockMentorId.trim() || undefined,
                    reason: blockReason.trim() || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create block');
            toast.success('Block created');
            mutateBlocks();
            setBlockDialog(false);
            setBlockStudentId('');
            setBlockMentorId('');
            setBlockReason('');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setBlockSubmitting(false);
        }
    };

    const handleToggleBlock = async (blockId: string, currentlyActive: boolean) => {
        try {
            const res = await fetch(`/api/admin/mentorship/blocks/${blockId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isActive: !currentlyActive }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to toggle block');
            toast.success(`Block ${currentlyActive ? 'deactivated' : 'activated'}`);
            mutateBlocks();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const getStatusBadge = (request: any) => {
        if (request.stoppedByAdmin) {
            return <Badge variant="destructive" className="bg-red-700 text-xs">Stopped</Badge>;
        }
        switch (request.status) {
            case 'accepted': return <Badge className="bg-green-600 text-xs">Accepted</Badge>;
            case 'rejected': return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
            case 'cancelled': return <Badge variant="secondary" className="text-xs">Cancelled</Badge>;
            default: return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pending</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Mentorship Oversight</h1>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'requests' ? 'border-[#800000] text-[#800000]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Handshake size={16} className="inline mr-2" /> Requests
                </button>
                <button
                    onClick={() => setActiveTab('blocks')}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${activeTab === 'blocks' ? 'border-[#800000] text-[#800000]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Ban size={16} className="inline mr-2" /> Blocks
                </button>
            </div>

            {/* === REQUESTS TAB === */}
            {activeTab === 'requests' && (
                <>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search student or mentor..."
                                    className="pl-10"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000] bg-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <div className="flex justify-end">
                                <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setStatusFilter(''); }}>
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    </div>

                    {requestsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                            <Handshake className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500">No mentorship requests found.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                <h2 className="font-semibold text-gray-700 text-sm">All Requests ({requestsData?.total || requests.length})</h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {requests.map((req: any) => (
                                    <div key={req.id} className="p-5 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                                    {getStatusBadge(req)}
                                                    <Badge variant="outline" className="text-xs">{REQUEST_TYPES[req.requestType] || req.requestType}</Badge>
                                                    <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-900 font-medium mb-1">
                                                    <span>{req.student?.fullName || req.student?.name}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span>{req.mentor?.fullName || req.mentor?.name}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mb-2">
                                                    {req.student?.email} → {req.mentor?.email}
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2">{req.description || req.message || '(No description)'}</p>
                                                {req.stoppedByAdmin && req.stopReason && (
                                                    <div className="mt-2 flex items-start gap-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                                                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                                                        <span>Stop reason: {req.stopReason}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 flex-shrink-0">
                                                {!req.stoppedByAdmin && req.status === 'pending' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                                        onClick={() => {
                                                            setForceStopTargetId(req.id);
                                                            setForceStopDialog(true);
                                                        }}
                                                    >
                                                        <ShieldAlert size={12} className="mr-1" /> Force Stop
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-xs text-gray-500"
                                                    onClick={() => {
                                                        setBlockScope('pair_block');
                                                        setBlockStudentId(req.student?.id || '');
                                                        setBlockMentorId(req.mentor?.id || '');
                                                        setBlockDialog(true);
                                                    }}
                                                >
                                                    <Ban size={12} className="mr-1" /> Block Pair
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* === BLOCKS TAB === */}
            {activeTab === 'blocks' && (
                <>
                    <div className="flex justify-end">
                        <Button
                            onClick={() => { setBlockScope('student_global'); setBlockStudentId(''); setBlockMentorId(''); setBlockReason(''); setBlockDialog(true); }}
                            className="bg-[#800000] hover:bg-[#660000]"
                            size="sm"
                        >
                            <Shield size={14} className="mr-1" /> Create Block
                        </Button>
                    </div>

                    {blocksLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                        </div>
                    ) : blocks.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                            <Ban className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500">No mentorship blocks created.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
                            {blocks.map((block: any) => (
                                <div key={block.id} className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant={block.isActive ? 'destructive' : 'secondary'} className="text-xs">
                                                {block.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                                {block.scope === 'student_global' ? 'Student Global'
                                                    : block.scope === 'mentor_global' ? 'Mentor Global'
                                                        : 'Pair Block'}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-700">
                                            {block.scope === 'student_global' && (
                                                <span>Student: <strong>{block.blockedStudent?.fullName || block.blockedStudent?.name || 'N/A'}</strong> ({block.blockedStudent?.email})</span>
                                            )}
                                            {block.scope === 'mentor_global' && (
                                                <span>Mentor: <strong>{block.blockedMentor?.fullName || block.blockedMentor?.name || 'N/A'}</strong> ({block.blockedMentor?.email})</span>
                                            )}
                                            {block.scope === 'pair_block' && (
                                                <span>
                                                    <strong>{block.blockedStudent?.fullName || block.blockedStudent?.name}</strong>
                                                    {' → '}
                                                    <strong>{block.blockedMentor?.fullName || block.blockedMentor?.name}</strong>
                                                </span>
                                            )}
                                        </div>
                                        {block.reason && <p className="text-xs text-gray-500 mt-1">Reason: {block.reason}</p>}
                                        <p className="text-xs text-gray-400 mt-0.5">Created {new Date(block.createdAt).toLocaleDateString()} by {block.createdByAdmin?.name || 'Admin'}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleToggleBlock(block.id, block.isActive)}
                                        className={block.isActive ? 'text-green-600' : 'text-red-600'}
                                    >
                                        {block.isActive ? <><ToggleRight size={16} className="mr-1" /> Deactivate</> : <><ToggleLeft size={16} className="mr-1" /> Activate</>}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Force Stop Dialog */}
            <Dialog open={forceStopDialog} onOpenChange={setForceStopDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-700 flex items-center gap-2">
                            <ShieldAlert size={18} /> Force Stop Request
                        </DialogTitle>
                        <DialogDescription>
                            This will immediately cancel this mentorship request and prevent the mentor from accepting it. Both parties will see your reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label htmlFor="stopReason">Reason <span className="text-red-500">*</span></Label>
                        <Textarea
                            id="stopReason"
                            value={forceStopReason}
                            onChange={(e) => setForceStopReason(e.target.value)}
                            placeholder="Explain why this request is being stopped..."
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setForceStopDialog(false); setForceStopReason(''); }}>Cancel</Button>
                        <Button
                            onClick={handleForceStop}
                            disabled={!forceStopReason.trim() || forceStopSubmitting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {forceStopSubmitting ? 'Stopping...' : 'Confirm Force Stop'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Block Dialog */}
            <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#800000] flex items-center gap-2">
                            <Ban size={18} /> Create Mentorship Block
                        </DialogTitle>
                        <DialogDescription>
                            Blocks prevent mentorship requests based on scope.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Block Scope</Label>
                            <select
                                value={blockScope}
                                onChange={(e) => setBlockScope(e.target.value as any)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000] bg-white"
                            >
                                <option value="student_global">Student Global — Block student from sending any requests</option>
                                <option value="mentor_global">Mentor Global — Block mentor from receiving requests + hide from listing</option>
                                <option value="pair_block">Pair Block — Block specific student→mentor pair</option>
                            </select>
                        </div>
                        {(blockScope === 'student_global' || blockScope === 'pair_block') && (
                            <div className="space-y-2">
                                <Label>Student User ID</Label>
                                <Input
                                    value={blockStudentId}
                                    onChange={(e) => setBlockStudentId(e.target.value)}
                                    placeholder="Paste student UUID..."
                                />
                            </div>
                        )}
                        {(blockScope === 'mentor_global' || blockScope === 'pair_block') && (
                            <div className="space-y-2">
                                <Label>Mentor User ID</Label>
                                <Input
                                    value={blockMentorId}
                                    onChange={(e) => setBlockMentorId(e.target.value)}
                                    placeholder="Paste mentor UUID..."
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Reason (optional)</Label>
                            <Textarea
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                placeholder="Reason for blocking..."
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockDialog(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreateBlock}
                            disabled={blockSubmitting}
                            className="bg-[#800000] hover:bg-[#660000]"
                        >
                            {blockSubmitting ? 'Creating...' : 'Create Block'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
