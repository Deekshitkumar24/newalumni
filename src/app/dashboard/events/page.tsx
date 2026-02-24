'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Event, EventInvitation } from '@/types';
import { Clock, MapPin, Plus, Mail, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 6;

export default function DashboardEventsPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    // Alumni invitations
    const [invitations, setInvitations] = useState<EventInvitation[]>([]);
    const [invitationsLoading, setInvitationsLoading] = useState(false);
    const [showInvitations, setShowInvitations] = useState(false);
    const [respondingId, setRespondingId] = useState<string | null>(null);

    // Check if user can create events
    const canCreate = user?.role === 'admin' || user?.role === 'alumni' ||
        (user?.role === 'student' && user?.canCreateEvents);

    const isAlumni = user?.role === 'alumni';

    useEffect(() => {
        setLoading(true);

        const fetchEvents = async () => {
            try {
                const queryParams = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: ITEMS_PER_PAGE.toString(),
                    type: activeTab,
                });

                const res = await fetch(`/api/events?${queryParams}`);
                const data = await res.json();

                if (data.data) {
                    setEvents(data.data);
                    setTotalItems(data.total || 0);
                    setTotalPages(data.totalPages || 0);
                }
            } catch (error) {
                console.error('Failed to fetch events', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchEvents();
        }, 300);

        return () => clearTimeout(timer);
    }, [currentPage, activeTab]);

    // Fetch invitations for alumni
    const fetchInvitations = useCallback(async () => {
        if (!isAlumni) return;
        setInvitationsLoading(true);
        try {
            const res = await fetch('/api/events/invitations');
            if (res.ok) {
                const data = await res.json();
                setInvitations(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch invitations', error);
        } finally {
            setInvitationsLoading(false);
        }
    }, [isAlumni]);

    useEffect(() => {
        if (isAlumni) {
            fetchInvitations();
        }
    }, [isAlumni, fetchInvitations]);

    const handleInvitationResponse = async (invitationId: string, status: 'accepted' | 'declined') => {
        setRespondingId(invitationId);
        try {
            const res = await fetch(`/api/events/invitations/${invitationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status })
            });

            if (!res.ok) throw new Error('Failed to respond');

            const data = await res.json();
            toast.success(data.message);

            // Refresh invitations and events
            fetchInvitations();
            // Force re-fetch events if accepted
            if (status === 'accepted') {
                setCurrentPage(p => p); // trigger re-fetch
            }
        } catch (error) {
            toast.error(`Failed to ${status === 'accepted' ? 'accept' : 'decline'} invitation`);
        } finally {
            setRespondingId(null);
        }
    };

    const handleTabChange = (tab: 'upcoming' | 'past') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const pendingInvitations = invitations.filter(i => i.status === 'pending');

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 pb-4 border-b-2 border-[#800000]">
                    <div>
                        <h1 className="text-3xl font-bold text-[#800000]">
                            Alumni Events
                        </h1>
                        <p className="text-gray-600 mt-2 max-w-2xl">
                            Stay connected with your alma mater through reunions, workshops, and guest lectures.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 mt-4 md:mt-0">
                        {/* Alumni: Mentor Invitations tab */}
                        {isAlumni && (
                            <button
                                onClick={() => setShowInvitations(!showInvitations)}
                                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all border ${showInvitations
                                    ? 'bg-[#800000] text-white border-[#800000]'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <Mail size={16} />
                                Mentor Invitations
                                {pendingInvitations.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                                        {pendingInvitations.length}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Create Event button */}
                        {canCreate && (
                            <Link
                                href="/dashboard/events/create"
                                className="flex items-center gap-2 px-4 py-2 bg-[#800000] text-white rounded-lg font-medium text-sm hover:bg-[#660000] transition-colors shadow-sm"
                                style={{ color: 'white' }}
                            >
                                <Plus size={16} />
                                Create Event
                            </Link>
                        )}

                        {/* Tabs */}
                        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                            <button
                                onClick={() => { handleTabChange('upcoming'); setShowInvitations(false); }}
                                className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'upcoming' && !showInvitations
                                    ? 'bg-[#800000] text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Upcoming
                            </button>
                            <button
                                onClick={() => { handleTabChange('past'); setShowInvitations(false); }}
                                className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'past' && !showInvitations
                                    ? 'bg-[#800000] text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                Past Events
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mentor Invitations Section */}
                {showInvitations && isAlumni ? (
                    <div className="space-y-4 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900">Mentor Invitations</h2>
                        {invitationsLoading ? (
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                                        <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                                        <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : invitations.length > 0 ? (
                            <div className="space-y-3">
                                {invitations.map(invitation => (
                                    <div key={invitation.id} className={`bg-white border rounded-lg p-5 transition-all ${invitation.status === 'pending'
                                        ? 'border-amber-200 bg-amber-50/30'
                                        : invitation.status === 'accepted'
                                            ? 'border-green-200 bg-green-50/30'
                                            : 'border-gray-200 opacity-75'
                                        }`}>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-lg">{invitation.event?.title}</h3>
                                                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                                                    {invitation.event?.date && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {new Date(invitation.event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                    {invitation.event?.venue && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin size={14} />
                                                            {invitation.event.venue}
                                                        </span>
                                                    )}
                                                </div>
                                                {invitation.invitedBy && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Invited by <span className="font-medium text-gray-700">{invitation.invitedBy.name}</span>
                                                    </p>
                                                )}
                                                {invitation.message && (
                                                    <p className="text-sm text-gray-600 mt-2 bg-white rounded px-3 py-2 border border-gray-100 italic">
                                                        "{invitation.message}"
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {invitation.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleInvitationResponse(invitation.id, 'declined')}
                                                            disabled={respondingId === invitation.id}
                                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
                                                        >
                                                            <X size={14} />
                                                            Decline
                                                        </button>
                                                        <button
                                                            onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
                                                            disabled={respondingId === invitation.id}
                                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#800000] rounded-lg hover:bg-[#660000] transition-colors disabled:opacity-50"
                                                        >
                                                            <Check size={14} />
                                                            Accept
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`text-sm font-medium px-3 py-1 rounded-full ${invitation.status === 'accepted'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                        {invitation.status === 'accepted' ? '✓ Accepted' : '✗ Declined'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon="📩"
                                title="No mentor invitations"
                                description="You'll see event invitations from students and admins here."
                            />
                        )}
                    </div>
                ) : (
                    <>
                        {/* Events List */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200">
                                        <CardSkeleton />
                                    </div>
                                ))}
                            </div>
                        ) : events.length > 0 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {events.map((event) => (
                                        <div key={event.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                                            <div className="flex flex-col md:flex-row">
                                                {/* Date Badge */}
                                                <div className="md:w-32 bg-[#800000] text-white flex flex-col items-center justify-center p-4">
                                                    <span className="text-3xl font-bold">{new Date(event.date).getDate()}</span>
                                                    <span className="text-sm uppercase tracking-wider">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                                                    <span className="text-xs opacity-80 mt-1">{new Date(event.date).getFullYear()}</span>
                                                </div>

                                                <div className="flex-1 p-6">
                                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Link href={`/events/${event.id}`}>
                                                                    <h2 className="text-xl font-bold text-gray-900 hover:text-[#800000] transition-colors">
                                                                        {event.title}
                                                                    </h2>
                                                                </Link>
                                                                {event.visibility && event.visibility !== 'public' && (
                                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${event.visibility === 'students_only'
                                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                                                                        }`}>
                                                                        {event.visibility === 'students_only' ? 'Students Only' : 'Invite Only'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock size={16} className="text-gray-400" /> {event.time}
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <MapPin size={16} className="text-gray-400" /> {event.venue}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-600 line-clamp-2 mb-4">
                                                                {event.description}
                                                            </p>
                                                        </div>

                                                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                                                            <div className="flex gap-2">
                                                                <Link
                                                                    href={`/events/${event.id}`}
                                                                    className="inline-block px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors text-sm"
                                                                >
                                                                    Details
                                                                </Link>
                                                                {event.link && (
                                                                    <a
                                                                        href={event.link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-block px-4 py-2 bg-[#800000] !text-white font-medium rounded hover:bg-[#660000] transition-colors text-sm"
                                                                    >
                                                                        Register / Info
                                                                    </a>
                                                                )}
                                                            </div>
                                                            {activeTab === 'upcoming' && (
                                                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                                                                    Registration Open
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {activeTab === 'upcoming' && event.registrations && (
                                                        <div className="mt-2 pt-3 border-t border-gray-100 text-sm text-gray-500 flex items-center justify-between">
                                                            <span>{event.registrations.length} registered members</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                icon="📅"
                                title={activeTab === 'upcoming' ? 'No upcoming events' : 'No past events found'}
                                description={activeTab === 'upcoming' ? 'Check back later for new event announcements.' : 'There are no past events in the archive.'}
                            />
                        )}

                        {/* Pagination */}
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
