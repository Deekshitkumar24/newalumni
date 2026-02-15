'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Event } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, MapPin } from 'lucide-react';

// import { initializeData } from '@/lib/data/store'; // Removed
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

    const { user: currentUser, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            if (!currentUser || currentUser.role !== 'admin') {
                router.push('/login');
                return;
            }
            fetchData();
        }
    }, [router, refreshKey, currentUser, isLoading]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch upcoming and past events
            const [upcomingRes, pastRes] = await Promise.all([
                fetch('/api/events?type=upcoming&limit=50'),
                fetch('/api/events?type=past&limit=50')
            ]);

            const upcomingData = await upcomingRes.json();
            const pastData = await pastRes.json();

            setEvents({
                pending: [], // Not supported in DB yet
                upcoming: upcomingData.data || [],
                past: pastData.data || []
            });
        } catch (error) {
            console.error('Failed to fetch events', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    // Status/Poster not supported/needed for now
                    posterUrl: '' // or formData.link if it was image? Link input is for external link.
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                let errMsg = errorData.error;
                if (Array.isArray(errMsg)) {
                    errMsg = errMsg.map((err: any) => err.message).join('. ');
                }
                throw new Error(errMsg || 'Failed to create event');
            }

            setShowForm(false);
            setRefreshKey(k => k + 1);
            setFormData({ title: '', description: '', date: '', time: '', venue: '', link: '' });
            toast.success("Event created successfully!");
        } catch (error: any) {
            console.error('Failed to create event', error);
            const message = error?.message || 'Failed to create event';
            toast.error(typeof message === 'string' ? message : 'Failed to create event (Invalid Error Format)');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Permanently delete this event?')) {
            try {
                await fetch(`/api/events/${id}`, { method: 'DELETE', credentials: 'include' });
                setRefreshKey(k => k + 1);
                toast.success("Event deleted.");
            } catch (error) {
                console.error('Failed to delete event', error);
                toast.error('Failed to delete event');
            }
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
                <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white border border-gray-200 mb-6 w-full justify-start p-1 h-auto">
                        <TabsTrigger value="upcoming" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">Upcoming</TabsTrigger>
                        <TabsTrigger value="past" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">Past</TabsTrigger>
                    </TabsList>

                    <Card className="min-h-[400px]">
                        <TabsContent value={activeTab} className="m-0 border-none shadow-none">
                            {loading ? (
                                <div className="p-6 space-y-4">
                                    {[1, 2, 3].map(i => <RowSkeleton key={i} />)}
                                </div>
                            ) : events[activeTab as keyof typeof events]?.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {events[activeTab as keyof typeof events].map(event => (
                                        <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mb-2 flex flex-wrap items-center gap-4">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar size={16} className="text-gray-400" /> {new Date(event.date).toLocaleDateString()}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock size={16} className="text-gray-400" /> {event.time}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <MapPin size={16} className="text-gray-400" /> {event.venue}
                                                        </span>
                                                        {event.link && (
                                                            <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-[#800000] hover:underline font-medium">Link ↗</a>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-500">{event.description}</p>
                                                </div>

                                                <div className="flex flex-wrap gap-2 justify-end items-center mt-2 md:mt-0">
                                                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => handleDelete(event.id)}>
                                                        Delete
                                                    </Button>

                                                    <Link
                                                        href={`/events/${event.id}`}
                                                        target="_blank"
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-[#800000] !text-white hover:bg-[#660000]"
                                                    >
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={activeTab === 'upcoming' ? '🗓️' : '🕰️'}
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
