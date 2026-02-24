'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Suggestion, SuggestionWithCreator, SuggestionCategory, SuggestionStatus, SuggestionPriority } from '@/types';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Lightbulb,
    Plus,
    Search,
    RefreshCw,
    AlertCircle,
    MessageSquare,
    Clock,
    ChevronRight,
    ImageIcon,
    X
} from 'lucide-react';

const CATEGORIES: { value: SuggestionCategory; label: string }[] = [
    { value: 'BUG', label: 'Bug Report' },
    { value: 'FEATURE', label: 'Feature Request' },
    { value: 'UX', label: 'UX Improvement' },
    { value: 'CONTENT', label: 'Content' },
    { value: 'OTHER', label: 'Other' },
];

const STATUSES: { value: SuggestionStatus; label: string }[] = [
    { value: 'NEW', label: 'New' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'PLANNED', label: 'Planned' },
    { value: 'DONE', label: 'Done' },
    { value: 'REJECTED', label: 'Rejected' },
];

const PRIORITIES: { value: SuggestionPriority; label: string }[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
];

function getCategoryColor(category: SuggestionCategory) {
    switch (category) {
        case 'BUG': return 'bg-red-100 text-red-700';
        case 'FEATURE': return 'bg-blue-100 text-blue-700';
        case 'UX': return 'bg-purple-100 text-purple-700';
        case 'CONTENT': return 'bg-green-100 text-green-700';
        case 'OTHER': return 'bg-gray-100 text-gray-600';
    }
}

function getStatusColor(status: SuggestionStatus) {
    switch (status) {
        case 'NEW': return 'bg-yellow-100 text-yellow-700';
        case 'IN_REVIEW': return 'bg-blue-100 text-blue-700';
        case 'PLANNED': return 'bg-indigo-100 text-indigo-700';
        case 'DONE': return 'bg-green-100 text-green-700';
        case 'REJECTED': return 'bg-red-100 text-red-700';
    }
}

function getPriorityColor(priority: SuggestionPriority) {
    switch (priority) {
        case 'LOW': return 'bg-gray-100 text-gray-600';
        case 'MEDIUM': return 'bg-orange-100 text-orange-700';
        case 'HIGH': return 'bg-red-100 text-red-700';
    }
}

function SkeletonCard() {
    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-16 bg-gray-200 rounded" />
                <div className="h-5 w-14 bg-gray-200 rounded" />
            </div>
            <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-full bg-gray-200 rounded mb-1" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
            <div className="mt-3 h-3 w-24 bg-gray-200 rounded" />
        </div>
    );
}

export default function SuggestionsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [suggestions, setSuggestions] = useState<(Suggestion | SuggestionWithCreator)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tabs — set default based on role once user loads
    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
    const [tabInitialized, setTabInitialized] = useState(false);

    // Set the correct default tab once user loads
    useEffect(() => {
        if (!authLoading && user && !tabInitialized) {
            if (user.role === 'admin') {
                setActiveTab('all');
            }
            setTabInitialized(true);
        }
    }, [authLoading, user, tabInitialized]);

    // Filters (admin "All" tab)
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    // Submit dialog
    const [showSubmit, setShowSubmit] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'OTHER' as SuggestionCategory,
        screenshotUrl: '',
    });
    const [screenshotError, setScreenshotError] = useState('');

    // Detail dialog
    const [selectedSuggestion, setSelectedSuggestion] = useState<(Suggestion | SuggestionWithCreator) | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [adminEdits, setAdminEdits] = useState({
        status: '' as SuggestionStatus | '',
        priority: '' as SuggestionPriority | '',
        adminResponse: '',
    });
    const [saving, setSaving] = useState(false);

    const fetchSuggestions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (activeTab === 'all' && isAdmin) {
                if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);
                if (categoryFilter && categoryFilter !== 'ALL') params.set('category', categoryFilter);
                if (priorityFilter && priorityFilter !== 'ALL') params.set('priority', priorityFilter);
                if (searchQuery) params.set('search', searchQuery);
            }
            const url = `/api/suggestions${params.toString() ? `?${params.toString()}` : ''}`;
            const res = await fetch(url, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch suggestions');
            const json = await res.json();
            setSuggestions(json.data || []);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, [activeTab, isAdmin, statusFilter, categoryFilter, priorityFilter, searchQuery]);

    // When auth is done loading but there's no user, stop the page loading state
    useEffect(() => {
        if (!authLoading && !user) {
            setLoading(false);
            setError('You must be logged in to view suggestions. Please log in again.');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoading, user?.id]);

    useEffect(() => {
        if (user?.id) fetchSuggestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, fetchSuggestions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAdmin) {
            toast.error('Admins cannot submit suggestions.');
            return;
        }
        if (!formData.title.trim() || !formData.description.trim()) {
            toast.error('Title and description are required.');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    category: formData.category,
                    screenshotUrl: formData.screenshotUrl.trim() || undefined,
                }),
            });
            if (!res.ok) {
                const errData = await res.json();
                let msg = errData.error;
                if (Array.isArray(msg)) msg = msg.map((e: any) => e.message).join('. ');
                throw new Error(msg || 'Failed to submit suggestion');
            }
            toast.success('Suggestion submitted successfully!');
            setShowSubmit(false);
            setFormData({ title: '', description: '', category: 'OTHER', screenshotUrl: '' });
            setScreenshotError('');
            fetchSuggestions();
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit suggestion');
        } finally {
            setSubmitting(false);
        }
    };

    const openDetail = (suggestion: Suggestion | SuggestionWithCreator) => {
        setSelectedSuggestion(suggestion);
        setAdminEdits({
            status: suggestion.status,
            priority: suggestion.priority,
            adminResponse: suggestion.adminResponse || '',
        });
        setShowDetail(true);
    };

    const handleAdminSave = async () => {
        if (!selectedSuggestion) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/suggestions/${selectedSuggestion.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    status: adminEdits.status || undefined,
                    priority: adminEdits.priority || undefined,
                    adminResponse: adminEdits.adminResponse,
                }),
            });
            if (!res.ok) {
                const errData = await res.json();
                let msg = errData.error;
                if (Array.isArray(msg)) msg = msg.map((e: any) => e.message).join('. ');
                throw new Error(msg || 'Failed to update suggestion');
            }
            toast.success('Suggestion updated successfully!');
            setShowDetail(false);
            fetchSuggestions();
        } catch (err: any) {
            toast.error(err.message || 'Failed to update suggestion');
        } finally {
            setSaving(false);
        }
    };

    const handleScreenshotUrlChange = (url: string) => {
        setFormData({ ...formData, screenshotUrl: url });
        if (url && !url.match(/^https?:\/\/.+/)) {
            setScreenshotError('Please enter a valid URL starting with http:// or https://');
        } else {
            setScreenshotError('');
        }
    };

    // For user tab: filter client-side to show only own (API already filters)
    // For admin "all" tab: show all from API
    const displayedSuggestions = activeTab === 'my' && isAdmin
        ? suggestions.filter(s => s.createdByUserId === user?.id)
        : suggestions;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#800000]/10 rounded-lg">
                        <Lightbulb className="text-[#800000]" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Suggestions</h1>
                        <p className="text-sm text-gray-500">{isAdmin ? 'Review and manage user suggestions' : 'Share ideas to improve the portal'}</p>
                    </div>
                </div>
                {!isAdmin && (
                    <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#800000] text-white hover:bg-[#660000]">
                                <Plus size={18} className="mr-1" /> Submit Suggestion
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Submit a Suggestion</DialogTitle>
                                <DialogDescription>
                                    Share an idea, report a bug, or suggest an improvement.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sg-title">Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="sg-title"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Add dark mode to dashboard"
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sg-category">Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={val => setFormData({ ...formData, category: val as SuggestionCategory })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(c => (
                                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sg-desc">Description <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        id="sg-desc"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        placeholder="Describe your suggestion in detail..."
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sg-screenshot">Screenshot URL <span className="text-gray-400 text-xs font-normal">(optional)</span></Label>
                                    <Input
                                        id="sg-screenshot"
                                        value={formData.screenshotUrl}
                                        onChange={e => handleScreenshotUrlChange(e.target.value)}
                                        placeholder="https://example.com/screenshot.png"
                                    />
                                    {screenshotError && (
                                        <p className="text-xs text-red-500">{screenshotError}</p>
                                    )}
                                    {formData.screenshotUrl && !screenshotError && (
                                        <div className="mt-2 border border-gray-200 rounded-md p-2 relative">
                                            <img
                                                src={formData.screenshotUrl}
                                                alt="Screenshot preview"
                                                className="max-h-40 rounded object-contain mx-auto"
                                                onError={() => setScreenshotError('Failed to load image. Check the URL.')}
                                            />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setShowSubmit(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-[#800000] hover:bg-[#660000] text-white"
                                        disabled={submitting || !!screenshotError}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('my')}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my'
                        ? 'border-[#800000] text-[#800000]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    My Suggestions
                </button>
                {isAdmin && (
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === 'all'
                            ? 'border-[#800000] text-[#800000]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        All Suggestions
                    </button>
                )}
            </div>

            {/* Admin Filters (All tab) */}
            {isAdmin && activeTab === 'all' && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <Input
                                placeholder="Search suggestions..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                {STATUSES.map(s => (
                                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Categories</SelectItem>
                                {CATEGORIES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Priorities" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Priorities</SelectItem>
                                {PRIORITIES.map(p => (
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="grid gap-4">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
            ) : error ? (
                <div className="bg-white border border-red-200 rounded-lg p-8 text-center">
                    <AlertCircle className="mx-auto text-red-400 mb-3" size={32} />
                    <p className="text-red-600 font-medium mb-1">Failed to load suggestions</p>
                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                    <Button variant="outline" onClick={fetchSuggestions}>
                        <RefreshCw size={14} className="mr-1" /> Retry
                    </Button>
                </div>
            ) : displayedSuggestions.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                    <Lightbulb className="mx-auto text-gray-300 mb-3" size={40} />
                    <p className="text-gray-500 font-medium">
                        {activeTab === 'all'
                            ? 'No suggestions submitted yet.'
                            : 'No suggestions yet. Share an idea to improve the portal.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {displayedSuggestions.map(suggestion => (
                        <button
                            key={suggestion.id}
                            onClick={() => openDetail(suggestion)}
                            className="bg-white border border-gray-200 rounded-lg p-5 text-left hover:border-[#800000]/30 hover:shadow-sm transition-all group w-full"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getCategoryColor(suggestion.category)}`}>
                                            {CATEGORIES.find(c => c.value === suggestion.category)?.label || suggestion.category}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(suggestion.status)}`}>
                                            {STATUSES.find(s => s.value === suggestion.status)?.label || suggestion.status}
                                        </span>
                                        {(isAdmin || activeTab === 'all') && (
                                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${getPriorityColor(suggestion.priority)}`}>
                                                {suggestion.priority}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{suggestion.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{suggestion.description}</p>
                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(suggestion.createdAt).toLocaleDateString()}
                                        </span>
                                        {suggestion.adminResponse && (
                                            <span className="flex items-center gap-1 text-[#800000]">
                                                <MessageSquare size={12} />
                                                Admin responded
                                            </span>
                                        )}
                                        {isAdmin && activeTab === 'all' && 'creatorName' in suggestion && (
                                            <span className="text-gray-400">
                                                by {(suggestion as SuggestionWithCreator).creatorName} ({(suggestion as SuggestionWithCreator).creatorRole})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-[#800000] mt-1 flex-shrink-0 transition-colors" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
                <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
                    {selectedSuggestion && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-lg pr-6">{selectedSuggestion.title}</DialogTitle>
                                <DialogDescription>
                                    <span className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getCategoryColor(selectedSuggestion.category)}`}>
                                            {CATEGORIES.find(c => c.value === selectedSuggestion.category)?.label}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(selectedSuggestion.status)}`}>
                                            {STATUSES.find(s => s.value === selectedSuggestion.status)?.label}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getPriorityColor(selectedSuggestion.priority)}`}>
                                            {selectedSuggestion.priority}
                                        </span>
                                    </span>
                                </DialogDescription>
                            </DialogHeader>

                            {/* Creator Info (admin view) */}
                            {isAdmin && 'creatorName' in selectedSuggestion && (
                                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
                                    <p className="text-gray-600">
                                        <span className="font-medium text-gray-800">{(selectedSuggestion as SuggestionWithCreator).creatorName}</span>
                                        {' '}({(selectedSuggestion as SuggestionWithCreator).creatorEmail})
                                        {' · '}
                                        <span className="capitalize">{(selectedSuggestion as SuggestionWithCreator).creatorRole}</span>
                                    </p>
                                    <p className="text-gray-400 text-xs mt-1">
                                        Submitted {new Date(selectedSuggestion.createdAt).toLocaleDateString()} at{' '}
                                        {new Date(selectedSuggestion.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium text-sm">Description</Label>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-100">
                                    {selectedSuggestion.description}
                                </p>
                            </div>

                            {/* Screenshot */}
                            {selectedSuggestion.screenshotUrl && (
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium text-sm flex items-center gap-1">
                                        <ImageIcon size={14} /> Screenshot
                                    </Label>
                                    <div className="border border-gray-200 rounded-md p-2">
                                        <img
                                            src={selectedSuggestion.screenshotUrl}
                                            alt="Suggestion screenshot"
                                            className="max-h-48 rounded object-contain mx-auto"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Admin Response (read-only for non-admin) */}
                            {!isAdmin && selectedSuggestion.adminResponse && (
                                <div className="space-y-2">
                                    <Label className="text-gray-700 font-medium text-sm flex items-center gap-1">
                                        <MessageSquare size={14} /> Admin Response
                                    </Label>
                                    <p className="text-sm text-gray-600 bg-[#800000]/5 border border-[#800000]/10 p-3 rounded-md whitespace-pre-wrap">
                                        {selectedSuggestion.adminResponse}
                                    </p>
                                </div>
                            )}

                            {/* Admin Edit Panel */}
                            {isAdmin && (
                                <div className="border-t border-gray-200 pt-4 space-y-4">
                                    <h4 className="font-semibold text-gray-800 text-sm">Admin Actions</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-gray-500">Status</Label>
                                            <Select
                                                value={adminEdits.status}
                                                onValueChange={val => setAdminEdits({ ...adminEdits, status: val as SuggestionStatus })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUSES.map(s => (
                                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-gray-500">Priority</Label>
                                            <Select
                                                value={adminEdits.priority}
                                                onValueChange={val => setAdminEdits({ ...adminEdits, priority: val as SuggestionPriority })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {PRIORITIES.map(p => (
                                                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-gray-500">Admin Response</Label>
                                        <Textarea
                                            value={adminEdits.adminResponse}
                                            onChange={e => setAdminEdits({ ...adminEdits, adminResponse: e.target.value })}
                                            rows={3}
                                            placeholder="Add a response to the user..."
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleAdminSave}
                                            className="bg-[#800000] hover:bg-[#660000] text-white"
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
