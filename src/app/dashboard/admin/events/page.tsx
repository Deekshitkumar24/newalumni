'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Event } from '@/types';
import { initializeData, getUpcomingEvents, getPastEvents, getPendingEvents, createEvent, deleteEvent, updateEvent } from '@/lib/data/store';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';

import { Skeleton, RowSkeleton } from "@/components/ui/Skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import Breadcrumb from '@/components/layout/Breadcrumb';

export default function AdminEventsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('pending');
    const [events, setEvents] = useState<{ pending: Event[], upcoming: Event[], past: Event[] }>({ pending: [], upcoming: [], past: [] });
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Form State
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', time: '', venue: '', link: ''
    });

    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr || JSON.parse(userStr).role !== 'admin') {
            router.push('/login');
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setEvents({
                pending: getPendingEvents(),
                upcoming: getUpcomingEvents(),
                past: getPastEvents()
            });
            setLoading(false);
        }, 500);
    }, [router, refreshKey]);

    const handleStatusChange = (eventId: string, status: 'upcoming' | 'cancelled') => {
        if (!confirm(`Change event status to ${status.toUpperCase()}?`)) return;
        updateEvent(eventId, { status });
        setRefreshKey(k => k + 1);
        toast.success(`Event status updated to ${status}`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createEvent({
            ...formData,
            status: 'upcoming', // Admin created events are auto-approved
            eventType: 'upcoming',
            createdBy: 'admin', // In real app, get user ID
            postedBy: 'Admin', // Helper for UI if needed
            posterImage: '' // Optional
        } as any); // Type cast until Event type refactor matches fully

        setShowForm(false);
        setRefreshKey(k => k + 1);
        setFormData({ title: '', description: '', date: '', time: '', venue: '', link: '' });
        toast.success("Event created successfully!");
    };

    const handleDelete = (id: string) => {
        if (confirm('Permanently delete this event?')) {
            deleteEvent(id);
            setRefreshKey(k => k + 1);
            toast.success("Event deleted.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#1a1a2e]">Event Management</h1>

                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#800000] text-white hover:bg-[#660000]">
                            + Create Event
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Event</DialogTitle>
                            <DialogDescription>
                                Fill in the details to create a new upcoming event.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea required rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Date</Label>
                                    <Input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Time</Label>
                                    <Input type="time" required value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Venue</Label>
                                    <Input required placeholder="Venue" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>External Link (Optional)</Label>
                                <Input type="url" placeholder="https://..." value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} />
                            </div>
                            <div className="flex gap-2 pt-4 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button type="submit" className="bg-[#800000] hover:bg-[#660000]">Create Event</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="container mx-auto px-4 py-8">
                <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white border border-gray-200 mb-6 w-full justify-start p-1 h-auto">
                        <TabsTrigger value="pending" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">
                            Pending
                            {events.pending.length > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-white text-[#800000] hover:bg-white">{events.pending.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">Upcoming</TabsTrigger>
                        <TabsTrigger value="past" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">Past</TabsTrigger>
                    </TabsList>

                    <Card className="min-h-[400px]">
                        <TabsContent value={activeTab} className="m-0 border-none shadow-none">
                            {loading ? (
                                <div className="p-6 space-y-4">
                                    {[1, 2, 3].map(i => <RowSkeleton key={i} />)}
                                </div>
                            ) : events[activeTab as keyof typeof events].length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {events[activeTab as keyof typeof events].map(event => (
                                        <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                                                        {activeTab === 'pending' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">PENDING</Badge>}
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-2 flex flex-wrap items-center gap-4">
                                                        <span className="flex items-center gap-1">
                                                            📅 {event.date}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            ⏰ {event.time}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            📍 {event.venue}
                                                        </span>
                                                        {event.link && (
                                                            <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-[#800000] hover:underline font-medium">Link ↗</a>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-500">{event.description}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2 justify-end items-center mt-2 md:mt-0">
                                                    {activeTab === 'pending' && (
                                                        <>
                                                            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => handleStatusChange(event.id, 'cancelled')}>Reject</Button>
                                                            <Button size="sm" className="bg-[#800000] hover:bg-[#660000] text-white" onClick={() => handleStatusChange(event.id, 'upcoming')}>Approve</Button>
                                                        </>
                                                    )}

                                                    {activeTab === 'upcoming' && (
                                                        <Button size="sm" variant="outline" className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 border-orange-200" onClick={() => handleStatusChange(event.id, 'cancelled')}>Cancel Event</Button>
                                                    )}

                                                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => handleDelete(event.id)}>
                                                        Delete
                                                    </Button>

                                                    <Link
                                                        href={`/dashboard/admin/events/${event.id}`}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-[#800000] !text-white hover:bg-[#660000]"
                                                    >
                                                        Registrations →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={activeTab === 'pending' ? '✅' : activeTab === 'upcoming' ? '🗓️' : '🕰️'}
                                    title={`No ${activeTab} events`}
                                    description={`There are no ${activeTab} events at this moment.`}
                                />
                            )}
                        </TabsContent>
                    </Card>
                </Tabs>


            </div>
        </div >
    );
}
