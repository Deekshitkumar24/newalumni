'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Event, Student } from '@/types';
import { initializeData, getEvents, getEventRegistrationsPaginated } from '@/lib/data/store';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton, RowSkeleton } from "@/components/ui/Skeleton"

export default function AdminEventDetailPage() {
    const router = useRouter();
    const params = useParams();
    const eventId = params.id as string;

    const [event, setEvent] = useState<Event | null>(null);
    const [registrations, setRegistrations] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Filters State
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [dept, setDept] = useState('All Departments');
    const [year, setYear] = useState('All Years');
    const [sort, setSort] = useState<'recent' | 'alphabetical' | 'year'>('recent');

    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) { router.push('/login'); return; }
        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'admin') { router.push('/login'); return; }

        setLoading(true);
        // Simulate network
        setTimeout(() => {
            const allEvents = getEvents();
            const foundEvent = allEvents.find(e => e.id === eventId);

            if (!foundEvent) {
                // If event not found, redirect back
                router.push('/dashboard/admin/events');
                return;
            }
            setEvent(foundEvent);

            // Fetch Registrations
            const { data, total, totalPages } = getEventRegistrationsPaginated(
                eventId,
                page,
                10,
                search,
                dept,
                year,
                'all',
                sort
            );
            setRegistrations(data);
            setTotal(total);
            setTotalPages(totalPages);

            setLoading(false);
        }, 500);

    }, [eventId, page, search, dept, year, sort, router]);

    if (!event && !loading) return null;

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-[#1a1a2e] text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-white mb-2">
                        <Link href="/dashboard/admin" className="hover:text-white">Dashboard</Link>
                        <span>/</span>
                        <Link href="/dashboard/admin/events" className="hover:text-white">Events</Link>
                        <span>/</span>
                        <span>{event?.title || 'Loading...'}</span>
                    </div>
                    <h1 className="text-2xl font-semibold">{event?.title || 'Loading...'}</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Link href="/dashboard/admin/events" className="text-[#800000] hover:underline flex items-center gap-2 font-medium">
                        ← Back to Events
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Event Overview Card */}
                        <Card>
                            <CardHeader className="border-b border-gray-100 pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-900">Event Details</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div>
                                        <span className="text-sm text-gray-500 block mb-1">Date & Time</span>
                                        <div className="font-medium">{new Date(event!.date).toLocaleDateString()} at {event!.time}</div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block mb-1">Venue</span>
                                        <div className="font-medium">{event!.venue}</div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500 block mb-1">Total Registrations</span>
                                        <div className="font-bold text-2xl text-[#800000]">{event!.registrations.length}</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Registrations Section */}
                        <Card>
                            <CardHeader className="border-b border-gray-100 pb-4">
                                <CardTitle className="text-lg font-semibold text-gray-900">Registered Students</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">

                                {/* Search & Filters */}
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="flex-1">
                                        <Input
                                            type="text"
                                            placeholder="Search by Name, Roll No..."
                                            value={search}
                                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        />
                                    </div>
                                    <div className="w-full md:w-48">
                                        <Select
                                            value={dept}
                                            onValueChange={(val) => { setDept(val); setPage(1); }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All Departments">All Departments</SelectItem>
                                                <SelectItem value="CSE">CSE</SelectItem>
                                                <SelectItem value="ECE">ECE</SelectItem>
                                                <SelectItem value="EEE">EEE</SelectItem>
                                                <SelectItem value="IT">IT</SelectItem>
                                                <SelectItem value="Mech">Mech</SelectItem>
                                                <SelectItem value="Civil">Civil</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full md:w-32">
                                        <Select
                                            value={year.toString()}
                                            onValueChange={(val) => { setYear(val); setPage(1); }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All Years">All Years</SelectItem>
                                                {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => (
                                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full md:w-32">
                                        <Select
                                            value={sort}
                                            onValueChange={(val) => { setSort(val as any); setPage(1); }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sort" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="recent">Recent</SelectItem>
                                                <SelectItem value="alphabetical">A-Z</SelectItem>
                                                <SelectItem value="year">Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Table */}
                                {registrations.length > 0 ? (
                                    <>
                                        <div className="border rounded-md mb-6">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-gray-50">
                                                        <TableHead>Name & Email</TableHead>
                                                        <TableHead>Roll No</TableHead>
                                                        <TableHead>Dept / Year</TableHead>
                                                        <TableHead>Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {registrations.map(student => (
                                                        <TableRow key={student.id}>
                                                            <TableCell>
                                                                <div className="font-medium text-gray-900">{student.name}</div>
                                                                <div className="text-xs text-gray-500">{student.email}</div>
                                                            </TableCell>
                                                            <TableCell className="text-gray-600 font-mono text-sm">{student.rollNumber}</TableCell>
                                                            <TableCell className="text-gray-600">
                                                                {student.department} '{student.graduationYear.toString().slice(-2)}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge variant="secondary" className={`font-semibold ${student.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}`}>
                                                                    {student.status.toUpperCase()}
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <Pagination
                                            currentPage={page}
                                            totalPages={totalPages}
                                            onPageChange={setPage}
                                        />
                                    </>
                                ) : (
                                    <EmptyState icon="📝" title="No registrations found" description="Try adjusting your filters." />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
