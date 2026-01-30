'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getUpcomingEvents, getPastEvents, initializeData } from '@/lib/data/store';
import { Event } from '@/types';

export default function EventsPage() {
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        initializeData();
        setUpcomingEvents(getUpcomingEvents());
        setPastEvents(getPastEvents());
    }, []);

    const currentEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

    return (
        <div>
            <Breadcrumb items={[{ label: 'Events' }]} />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-[#800000] mb-6 pb-3 border-b-2 border-[#800000]">
                    Alumni Events
                </h1>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-6 py-3 font-medium ${activeTab === 'upcoming'
                                ? 'text-[#800000] border-b-2 border-[#800000]'
                                : 'text-gray-500 hover:text-[#800000]'
                            }`}
                    >
                        Upcoming Events ({upcomingEvents.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`px-6 py-3 font-medium ${activeTab === 'past'
                                ? 'text-[#800000] border-b-2 border-[#800000]'
                                : 'text-gray-500 hover:text-[#800000]'
                            }`}
                    >
                        Past Events ({pastEvents.length})
                    </button>
                </div>

                {/* Events List */}
                {currentEvents.length > 0 ? (
                    <div className="space-y-4">
                        {currentEvents.map((event) => (
                            <div key={event.id} className="border border-gray-200 bg-white">
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-grow">
                                            <Link href={`/events/${event.id}`}>
                                                <h2 className="text-lg font-semibold text-[#800000] hover:underline mb-2">
                                                    {event.title}
                                                </h2>
                                            </Link>
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {event.description}
                                            </p>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                <span>📅 {event.date}</span>
                                                <span>⏰ {event.time}</span>
                                                <span>📍 {event.venue}</span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Link
                                                href={`/events/${event.id}`}
                                                className="inline-block bg-[#800000] text-white px-4 py-2 text-sm hover:bg-[#660000]"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                    {activeTab === 'upcoming' && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                                            {event.registrations.length} registered
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 border border-gray-200 bg-white">
                        {activeTab === 'upcoming'
                            ? 'No upcoming events at this time. Please check back later.'
                            : 'No past events to display.'}
                    </div>
                )}
            </div>
        </div>
    );
}
