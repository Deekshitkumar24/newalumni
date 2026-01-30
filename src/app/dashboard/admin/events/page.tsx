'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Event } from '@/types';
import { initializeData, getUpcomingEvents, getPastEvents, createEvent, deleteEvent } from '@/lib/data/store';

export default function AdminEventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: ''
    });

    const refreshEvents = () => {
        const upcoming = getUpcomingEvents();
        const past = getPastEvents();
        setEvents([...upcoming, ...past]);
    };

    useEffect(() => {
        initializeData();

        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        refreshEvents();
    }, [router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createEvent({
            title: formData.title,
            description: formData.description,
            date: formData.date,
            time: formData.time,
            venue: formData.venue
        });

        refreshEvents();
        setShowForm(false);
        setFormData({
            title: '',
            description: '',
            date: '',
            time: '',
            venue: ''
        });
    };

    const handleDelete = (eventId: string) => {
        if (confirm('Are you sure you want to delete this event?')) {
            deleteEvent(eventId);
            refreshEvents();
        }
    };

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Header */}
            <div className="bg-[#1a1a2e] text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                        <Link href="/dashboard/admin" className="hover:text-white">Dashboard</Link>
                        <span>/</span>
                        <span>Event Management</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold">Event Management</h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-[#800000] text-white px-4 py-2 text-sm hover:bg-[#660000]"
                        >
                            + Create Event
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Event Form */}
                {showForm && (
                    <div className="bg-white border border-gray-200 mb-8">
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <h2 className="font-semibold">Create New Event</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Event Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        placeholder="e.g., January 15, 2025"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        placeholder="e.g., 10:00 AM"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Venue <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.venue}
                                        onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                        placeholder="e.g., VJIT Auditorium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-[#800000] text-white px-6 py-2 hover:bg-[#660000]"
                                >
                                    Create Event
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="border border-gray-300 px-6 py-2 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Events List */}
                <div className="bg-white border border-gray-200">
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-700">All Events ({events.length})</h2>
                    </div>

                    {events.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {events.map(event => (
                                <div key={event.id} className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-[#800000]">{event.title}</span>
                                                <span className={`text-xs px-2 py-1 ${event.eventType === 'upcoming'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {event.eventType === 'upcoming' ? 'Upcoming' : 'Past'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                📅 {event.date} | ⏰ {event.time} | 📍 {event.venue}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {event.registrations.length} registrations
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/events/${event.id}`}
                                                className="text-sm border border-[#800000] text-[#800000] px-3 py-1 hover:bg-[#800000] hover:text-white"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="text-sm border border-red-500 text-red-500 px-3 py-1 hover:bg-red-500 hover:text-white"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            No events created yet.
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <Link href="/dashboard/admin" className="text-[#800000] hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
