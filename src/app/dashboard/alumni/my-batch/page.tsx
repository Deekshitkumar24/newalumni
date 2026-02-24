'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, RefreshCw } from 'lucide-react';

export default function AlumniBatchPage() {
    const router = useRouter();
    const [user, setUser] = useState<Alumni | null>(null);
    const [batchmates, setBatchmates] = useState<Alumni[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Search & filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Derive unique departments for filter dropdown
    const departments = useMemo(() => {
        const depts = new Set(batchmates.map(a => a.department).filter(Boolean));
        return Array.from(depts).sort();
    }, [batchmates]);

    // Filtered list
    const filteredBatchmates = useMemo(() => {
        let list = batchmates;
        const q = debouncedQuery.toLowerCase().trim();

        if (q) {
            list = list.filter(a =>
                (a.name && a.name.toLowerCase().includes(q)) ||
                (a.email && a.email.toLowerCase().includes(q)) ||
                (a.currentCompany && a.currentCompany.toLowerCase().includes(q))
            );
        }

        if (departmentFilter) {
            list = list.filter(a => a.department === departmentFilter);
        }

        return list;
    }, [batchmates, debouncedQuery, departmentFilter]);

    const fetchBatchmates = useCallback(async (currentUser: Alumni) => {
        setLoading(true);
        setError(false);
        try {
            const year = currentUser.graduationYear;
            if (!year) {
                setLoading(false);
                return;
            }

            const params = new URLSearchParams({
                role: 'alumni',
                year: year.toString(),
                limit: '100'
            });

            const res = await fetch(`/api/directory?${params}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            if (data.data) {
                setBatchmates(data.data.filter((a: any) => a.id !== currentUser.id));
            }
        } catch (err) {
            console.error("Failed to fetch batchmates", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'alumni') {
            router.push('/login');
            return;
        }

        setUser(currentUser);
        fetchBatchmates(currentUser);
    }, [router, fetchBatchmates]);

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-[#DAA520] mb-6">My Batch ({user.graduationYear})</h1>

            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or company..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-colors"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <select
                    value={departmentFilter}
                    onChange={e => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-colors"
                >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
                {(searchQuery || departmentFilter) && (
                    <button
                        onClick={() => { setSearchQuery(''); setDepartmentFilter(''); }}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-[#800000] text-white px-6 py-4 flex justify-between items-center">
                    <h2 className="font-semibold text-lg">Batchmates</h2>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{filteredBatchmates.length} Found</span>
                </div>

                {loading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-600 mb-4">Couldn't load batch members</p>
                        <button
                            onClick={() => user && fetchBatchmates(user)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#660000] transition-colors text-sm font-medium"
                        >
                            <RefreshCw size={16} />
                            Retry
                        </button>
                    </div>
                ) : filteredBatchmates.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                        {filteredBatchmates.map(alumnus => (
                            <div key={alumnus.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={alumnus.profileImage || ""} />
                                        <AvatarFallback>{alumnus.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-[#800000] text-lg">{alumnus.name}</div>
                                        <div className="text-sm text-gray-600">{alumnus.department}</div>
                                        {alumnus.currentCompany && (
                                            <div className="text-sm text-gray-500 font-medium mt-1">
                                                {alumnus.currentRole || 'Alumni'} at {alumnus.currentCompany}
                                            </div>
                                        )}
                                        {alumnus.linkedIn && (
                                            <a
                                                href={alumnus.linkedIn}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                            >
                                                LinkedIn Profile ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 self-start md:self-center">
                                    <Link
                                        href={`/dashboard/messages?to=${alumnus.id}`}
                                        className="text-sm bg-[#800000] text-white px-4 py-2 hover:bg-[#660000] rounded transition-colors shadow-sm"
                                    >
                                        Message
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : batchmates.length > 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No matching members found
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        No other alumni from your batch have registered yet.
                    </div>
                )}
            </div>

            {/* Batch Discussion - Placeholder */}
            <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden opacity-75">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-700">Batch Discussion Board (Coming Soon)</h2>
                </div>
                <div className="p-6">
                    <p className="text-gray-500 text-sm">
                        Share updates, memories, and connect with your batchmates.
                    </p>
                </div>
            </div>
        </div>
    );
}
