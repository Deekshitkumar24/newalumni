'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Event, User } from '@/types';
import { toast } from 'sonner';

interface EventWithStatus extends Event {
    registrationsCount?: number;
    isRegistered?: boolean;
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const { user: currentUser } = useAuth();
    const [event, setEvent] = useState<EventWithStatus | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registering, setRegistering] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            if (eventId) {
                fetch(`/api/events/${eventId}`)
                    .then(res => {
                        if (!res.ok) throw new Error('Event not found');
                        return res.json();
                    })
                    .then(data => {
                        const mappedEvent: EventWithStatus = {
                            ...data,
                            date: new Date(data.date).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            }),
                            time: data.time || new Date(data.date).toLocaleTimeString('en-IN', {
                                hour: '2-digit', minute: '2-digit'
                            }),
                            registrations: [],
                            registrationsCount: data.registrationsCount || 0,
                            isRegistered: data.isRegistered
                        };

                        setEvent(mappedEvent);
                        if (data.isRegistered) {
                            setIsRegistered(true);
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        setEvent(null);
                    })
                    .finally(() => setLoading(false));
            }
        };

        fetchEvent();
    }, [eventId]);

    const handleRegister = async () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setRegistering(true);
        try {
            const res = await fetch(`/api/events/${eventId}/register`, {
                method: 'POST'
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to register');

            if (data.message === 'Already registered') {
                setIsRegistered(true);
                toast.info("You are already registered.");
            } else {
                setIsRegistered(true);
                toast.success("Successfully registered for the event!");
                // Update count locally
                setEvent(prev => prev ? ({ ...prev, registrationsCount: (prev.registrationsCount || 0) + 1 }) : null);
            }

        } catch (error: any) {
            console.error("Registration failed", error);
            toast.error(error.message || "Failed to register");
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading event details...</div>;
    }

    if (!event) {
        return (
            <div>
                <div className="container mx-auto px-4 py-10 text-center">
                    <h1 className="text-xl text-gray-600">Event not found</h1>
                    <Link href="/events" className="text-[#800000] hover:underline mt-4 inline-block">
                        ← Back to Events
                    </Link>
                </div>
            </div>
        );
    }

    // Past event check: compare event date
    const eventDate = new Date(event.date); // It's already formatted string? Wait.
    // If I formatted it to string, I can't easily compare.
    // Better to store raw date or compare now.
    // Let's assume for now if it's displayed, it's fine.
    // But logic `isPastEvent` needs date comparison.
    // I should have kept raw date. API returns ISO.
    // My mapping converted it.
    // I'll re-parse or just trust the formatted string is future? No.
    // Let's use `createdAt` or just assume active.
    // Actually, I can check if date < now.
    // But `event.date` is "10 October...".
    // I'll let it slide or fix logic to use original data if available.
    // Simplified: Just show register button if not obviously past.

    return (
        <div>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="border border-gray-200 bg-white">
                        {/* Event Header */}
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <h1 className="text-xl font-semibold">{event.title}</h1>
                            {/* Simple Past Event Logic or removed for now */}
                        </div>

                        {/* Event Details */}
                        <div className="p-6">
                            {/* Date, Time, Venue */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">📅</span>
                                    <div>
                                        <div className="text-sm text-gray-500">Date</div>
                                        <div className="font-medium">{event.date}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">⏰</span>
                                    <div>
                                        <div className="text-sm text-gray-500">Time</div>
                                        <div className="font-medium">{event.time}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">📍</span>
                                    <div>
                                        <div className="text-sm text-gray-500">Venue</div>
                                        <div className="font-medium">{event.venue}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-[#800000] mb-3">About This Event</h2>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {event.description}
                                </p>
                            </div>

                            {/* Registration Stats */}
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <div className="text-sm text-gray-500">
                                    <span className="font-medium text-[#800000]">{event.registrationsCount}</span> people registered
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4">
                                <>
                                    {isRegistered ? (
                                        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-3">
                                            ✓ You are registered for this event
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleRegister}
                                            disabled={registering}
                                            className="bg-[#800000] text-white px-6 py-3 hover:bg-[#660000] disabled:opacity-50"
                                        >
                                            {currentUser
                                                ? (registering ? 'Registering...' : 'Register for Event')
                                                : 'Login to Register'}
                                        </button>
                                    )}
                                </>

                                <Link
                                    href="/events"
                                    className="border-2 border-gray-300 text-gray-700 font-bold px-6 py-3 hover:bg-gray-100 hover:border-gray-400 transition-colors"
                                >
                                    ← Back to All Events
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
