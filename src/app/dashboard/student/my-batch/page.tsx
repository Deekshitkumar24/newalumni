'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Student } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, RefreshCw } from 'lucide-react';

export default function StudentBatchPage() {
    const router = useRouter();
    const [user, setUser] = useState<Student | null>(null);
    const [batchmates, setBatchmates] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Search & filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [batchYearFilter, setBatchYearFilter] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Derive unique departments and batch years for filter dropdowns
    const departments = useMemo(() => {
        const depts = new Set(batchmates.map(s => s.department).filter(Boolean));
        return Array.from(depts).sort();
    }, [batchmates]);

    const batchYears = useMemo(() => {
        const years = new Set(batchmates.map(s => s.batch).filter(Boolean));
        return Array.from(years).sort((a, b) => b - a);
    }, [batchmates]);

    // Filtered list
    const filteredBatchmates = useMemo(() => {
        let list = batchmates;
        const q = debouncedQuery.toLowerCase().trim();

        if (q) {
            list = list.filter(s =>
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.email && s.email.toLowerCase().includes(q)) ||
                (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
            );
        }

        if (departmentFilter) {
            list = list.filter(s => s.department === departmentFilter);
        }

        if (batchYearFilter) {
            list = list.filter(s => s.batch === parseInt(batchYearFilter));
        }

        return list;
    }, [batchmates, debouncedQuery, departmentFilter, batchYearFilter]);

    const fetchBatchmates = useCallback(async (currentUser: Student) => {
        setLoading(true);
        setError(false);
        try {
            const year = currentUser.batch;

            if (!year) {
                console.warn("User has no batch/year defined.");
                setLoading(false);
                return;
            }

            const params = new URLSearchParams({
                role: 'student',
                year: year.toString(),
                limit: '100'
            });

            const res = await fetch(`/api/directory?${params}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();

            if (data.data) {
                setBatchmates(data.data.filter((s: any) => s.id !== currentUser.id));
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
        if (currentUser.role !== 'student') {
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
        <div className="bg-[#f5f5f5] min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-[#800000] mb-6">My Batch ({user.batch})</h1>

                {/* Search Bar */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or roll number..."
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
                    <select
                        value={batchYearFilter}
                        onChange={e => setBatchYearFilter(e.target.value)}
                        className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000] transition-colors"
                    >
                        <option value="">All Batch Years</option>
                        {batchYears.map(year => (
                            <option key={year} value={year.toString()}>{year}</option>
                        ))}
                    </select>
                    {(searchQuery || departmentFilter || batchYearFilter) && (
                        <button
                            onClick={() => { setSearchQuery(''); setDepartmentFilter(''); setBatchYearFilter(''); }}
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
                            {filteredBatchmates.map(student => (
                                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={student.profileImage || ""} />
                                            <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium text-gray-900">{student.name}</div>
                                            <div className="text-sm text-gray-600 flex gap-2">
                                                <span>{student.department}</span>
                                                {student.rollNumber && <span className="text-gray-400">• {student.rollNumber}</span>}
                                            </div>
                                            {student.skills && Array.isArray(student.skills) && student.skills.length > 0 && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Skills: {student.skills.slice(0, 3).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {student.linkedIn && (
                                        <a
                                            href={student.linkedIn}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-[#0077b5] hover:underline flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path></svg>
                                            <span className="hidden sm:inline">LinkedIn</span>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : batchmates.length > 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No matching members found
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            No other students from your batch have registered yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
