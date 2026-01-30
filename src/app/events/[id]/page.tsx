'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getEventById, registerForEvent, initializeData } from '@/lib/data/store';
import { Event, User } from '@/types';

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        initializeData();

        const eventData = getEventById(eventId);
        if (eventData) {
            setEvent(eventData);
        }

        const userStr = localStorage.getItem('vjit_current_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setCurrentUser(user);
            if (eventData) {
                setIsRegistered(eventData.registrations.includes(user.id));
            }
        }
    }, [eventId]);

    const handleRegister = () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setRegistering(true);
        registerForEvent(eventId, currentUser.id);
        setIsRegistered(true);
        setRegistering(false);

        // Refresh event data
        const updatedEvent = getEventById(eventId);
        if (updatedEvent) {
            setEvent(updatedEvent);
        }
    };

    if (!event) {
        return (
            <div>
                <Breadcrumb items={[{ label: 'Events', href: '/events' }, { label: 'Not Found' }]} />
                <div className="container mx-auto px-4 py-10 text-center">
                    <h1 className="text-xl text-gray-600">Event not found</h1>
                    <Link href="/events" className="text-[#800000] hover:underline mt-4 inline-block">
                        ← Back to Events
                    </Link>
                </div>
            </div>
        );
    }

    const isPastEvent = event.eventType === 'past';

    return (
        <div>
            <Breadcrumb items={[{ label: 'Events', href: '/events' }, { label: event.title }]} />

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="border border-gray-200 bg-white">
                        {/* Event Header */}
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <h1 className="text-xl font-semibold">{event.title}</h1>
                            {isPastEvent && (
                                <span className="inline-block bg-white/20 text-white text-xs px-2 py-1 mt-2">
                                    Past Event
                                </span>
                            )}
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
                                    <span className="font-medium text-[#800000]">{event.registrations.length}</span> people registered
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-4">
                                {!isPastEvent && (
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
                                )}

                                <Link
                                    href="/events"
                                    className="border border-gray-300 px-6 py-3 hover:bg-gray-50"
                                >
                                    ← Back to Events
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
