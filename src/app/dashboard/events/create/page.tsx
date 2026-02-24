'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, X, Eye, Users, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';

type AlumniMentor = {
    id: string;
    name: string;
    email: string;
    profileImage?: string;
    department?: string;
};

export default function CreateEventPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [venue, setVenue] = useState('');
    const [posterUrl, setPosterUrl] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'students_only' | 'invite_only'>('public');

    // Mentor invitation state
    const [mentorSearch, setMentorSearch] = useState('');
    const [mentorResults, setMentorResults] = useState<AlumniMentor[]>([]);
    const [selectedMentors, setSelectedMentors] = useState<AlumniMentor[]>([]);
    const [invitationMessage, setInvitationMessage] = useState('');
    const [searchingMentors, setSearchingMentors] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    // Permission check
    const hasPermission = user?.role === 'admin' || user?.role === 'alumni' ||
        (user?.role === 'student' && user?.canCreateEvents);

    // Search alumni mentors when user types
    useEffect(() => {
        if (visibility !== 'invite_only' || !mentorSearch.trim()) {
            setMentorResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearchingMentors(true);
            try {
                const params = new URLSearchParams({
                    role: 'alumni',
                    query: mentorSearch,
                    limit: '10'
                });
                const res = await fetch(`/api/directory?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter out already selected mentors
                    const filtered = (data.data || []).filter(
                        (m: AlumniMentor) => !selectedMentors.find(s => s.id === m.id)
                    );
                    setMentorResults(filtered);
                }
            } catch (error) {
                console.error('Failed to search mentors', error);
            } finally {
                setSearchingMentors(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [mentorSearch, visibility, selectedMentors]);

    const addMentor = (mentor: AlumniMentor) => {
        setSelectedMentors(prev => [...prev, mentor]);
        setMentorResults(prev => prev.filter(m => m.id !== mentor.id));
        setMentorSearch('');
    };

    const removeMentor = (mentorId: string) => {
        setSelectedMentors(prev => prev.filter(m => m.id !== mentorId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !description || !date || !venue) {
            toast.error('Please fill in all required fields.');
            return;
        }

        if (visibility === 'invite_only' && selectedMentors.length === 0) {
            toast.error('Please invite at least one mentor for an invite-only event.');
            return;
        }

        setSubmitting(true);
        try {
            // Combine date and time into a single ISO string
            const eventDate = time ? new Date(`${date}T${time}`) : new Date(`${date}T00:00:00`);

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title,
                    description,
                    date: eventDate.toISOString(),
                    venue,
                    posterUrl: posterUrl || undefined,
                    visibility,
                    invitedMentorIds: visibility === 'invite_only' ? selectedMentors.map(m => m.id) : undefined,
                    invitationMessage: visibility === 'invite_only' ? invitationMessage : undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create event');
            }

            toast.success('Event created successfully!');
            router.push('/dashboard/events');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create event');
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#800000]"></div>
            </div>
        );
    }

    // Permission denied state
    if (!hasPermission) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="max-w-md text-center space-y-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-red-600" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Permission Denied</h1>
                    <p className="text-gray-600">
                        You don't have permission to create events. Please contact the administrator.
                    </p>
                    <Link
                        href="/dashboard/events"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#800000] text-white rounded-lg hover:bg-[#660000] transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back to Events
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
                <Link
                    href="/dashboard/events"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-[#800000]">Create Event</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Annual Alumni Reunion 2026"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Describe what the event is about, who should attend, and any other relevant details..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] resize-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
                        <input
                            type="text"
                            value={venue}
                            onChange={e => setVenue(e.target.value)}
                            placeholder="e.g. VJIT Auditorium, Main Block"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Poster URL (optional)</label>
                        <input
                            type="url"
                            value={posterUrl}
                            onChange={e => setPosterUrl(e.target.value)}
                            placeholder="https://example.com/poster.jpg"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                        />
                    </div>
                </div>

                {/* Visibility Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Visibility</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => setVisibility('public')}
                            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${visibility === 'public'
                                ? 'border-[#800000] bg-[#800000]/5'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Eye size={24} className={visibility === 'public' ? 'text-[#800000]' : 'text-gray-400'} />
                            <span className={`text-sm font-medium mt-2 ${visibility === 'public' ? 'text-[#800000]' : 'text-gray-700'}`}>
                                Public
                            </span>
                            <span className="text-xs text-gray-500 mt-1 text-center">Visible to everyone</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setVisibility('students_only')}
                            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${visibility === 'students_only'
                                ? 'border-[#800000] bg-[#800000]/5'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Users size={24} className={visibility === 'students_only' ? 'text-[#800000]' : 'text-gray-400'} />
                            <span className={`text-sm font-medium mt-2 ${visibility === 'students_only' ? 'text-[#800000]' : 'text-gray-700'}`}>
                                Students Only
                            </span>
                            <span className="text-xs text-gray-500 mt-1 text-center">Only students & admins</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setVisibility('invite_only')}
                            className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${visibility === 'invite_only'
                                ? 'border-[#800000] bg-[#800000]/5'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Lock size={24} className={visibility === 'invite_only' ? 'text-[#800000]' : 'text-gray-400'} />
                            <span className={`text-sm font-medium mt-2 ${visibility === 'invite_only' ? 'text-[#800000]' : 'text-gray-700'}`}>
                                Invite Only
                            </span>
                            <span className="text-xs text-gray-500 mt-1 text-center">Selected mentors only</span>
                        </button>
                    </div>
                </div>

                {/* Mentor Invitations (only for invite_only) */}
                {visibility === 'invite_only' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Invite Mentors</h2>
                        <p className="text-sm text-gray-500 mb-4">Search and select alumni mentors to invite to this event.</p>

                        {/* Mentor search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={mentorSearch}
                                onChange={e => setMentorSearch(e.target.value)}
                                placeholder="Search alumni by name or email..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                            />
                            {searchingMentors && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" size={16} />
                            )}
                        </div>

                        {/* Search results dropdown */}
                        {mentorResults.length > 0 && (
                            <div className="border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
                                {mentorResults.map(mentor => (
                                    <button
                                        key={mentor.id}
                                        type="button"
                                        onClick={() => addMentor(mentor)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">{mentor.name}</div>
                                            <div className="text-xs text-gray-500">{mentor.email}</div>
                                        </div>
                                        <Plus size={16} className="text-[#800000]" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Selected mentors */}
                        {selectedMentors.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Selected Mentors ({selectedMentors.length})
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {selectedMentors.map(mentor => (
                                        <span
                                            key={mentor.id}
                                            className="inline-flex items-center gap-1.5 bg-[#800000]/10 text-[#800000] px-3 py-1.5 rounded-full text-sm font-medium"
                                        >
                                            {mentor.name}
                                            <button
                                                type="button"
                                                onClick={() => removeMentor(mentor.id)}
                                                className="hover:bg-[#800000]/20 rounded-full p-0.5 transition-colors"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Optional message */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message to Mentors (optional)</label>
                            <textarea
                                value={invitationMessage}
                                onChange={e => setInvitationMessage(e.target.value)}
                                placeholder="Add a personalized message to your invitation..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] resize-none"
                            />
                        </div>
                    </div>
                )}

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Link
                        href="/dashboard/events"
                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </Link>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#800000] rounded-lg hover:bg-[#660000] transition-colors disabled:opacity-50"
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Create Event
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
