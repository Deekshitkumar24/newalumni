'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Pagination from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { getEventsPaginated, initializeData } from '@/lib/data/store';
import { Event, User } from '@/types';

const ITEMS_PER_PAGE = 6;

export default function DashboardEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            const { data, total, totalPages } = getEventsPaginated(
                currentPage,
                ITEMS_PER_PAGE,
                activeTab
            );
            setEvents(data);
            setTotalItems(total);
            setTotalPages(totalPages);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [currentPage, activeTab]);

    const handleTabChange = (tab: 'upcoming' | 'past') => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

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

                    {/* Tabs */}
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200 mt-4 md:mt-0">
                        <button
                            onClick={() => handleTabChange('upcoming')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'upcoming'
                                ? 'bg-[#800000] text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => handleTabChange('past')}
                            className={`px-6 py-2 rounded-md font-medium transition-all ${activeTab === 'past'
                                ? 'bg-[#800000] text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Past Events
                        </button>
                    </div>
                </div>

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
                                                    <Link href={`/events/${event.id}`}>
                                                        <h2 className="text-xl font-bold text-gray-900 hover:text-[#800000] transition-colors mb-2">
                                                            {event.title}
                                                        </h2>
                                                    </Link>
                                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                                        <span className="flex items-center gap-1">
                                                            🕒 {event.time}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            📍 {event.venue}
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

                                            {activeTab === 'upcoming' && (
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
            </div>
        </div>
    );
}
