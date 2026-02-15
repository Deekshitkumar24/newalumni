'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import { RowSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { Alumni, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

const departments = [
    'All Departments',
    'CSE',
    'ECE',
    'EEE',
    'MECH',
    'CIVIL',
    'IT'
];

const currentYear = new Date().getFullYear();
const years = ['All Years', ...Array.from({ length: 20 }, (_, i) => String(currentYear - i))];

const ITEMS_PER_PAGE = 10;

export default function AlumniDirectoryPage() {
    const [alumni, setAlumni] = useState<Alumni[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);

    const [searchName, setSearchName] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
    const [selectedYear, setSelectedYear] = useState('All Years');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('vjit_current_user');
        if (userStr) {
            setCurrentUser(JSON.parse(userStr));
        }
    }, []);

    useEffect(() => {
        setLoading(true);

        const fetchAlumni = async () => {
            try {
                const queryParams = new URLSearchParams({
                    page: currentPage.toString(),
                    limit: ITEMS_PER_PAGE.toString(),
                    role: 'alumni', // Explicitly fetch alumni
                });

                if (searchName) queryParams.append('query', searchName);
                if (selectedDepartment !== 'All Departments') queryParams.append('department', selectedDepartment);
                if (selectedYear !== 'All Years') queryParams.append('year', selectedYear);

                const res = await fetch(`/api/directory?${queryParams}`);
                const data = await res.json();

                if (data.data) {
                    setAlumni(data.data);
                    setTotalItems(data.meta.total);
                    setTotalPages(data.meta.totalPages);
                }
            } catch (error) {
                console.error('Failed to fetch alumni directory', error);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search slightly
        const timer = setTimeout(() => {
            fetchAlumni();
        }, 300);

        return () => clearTimeout(timer);
    }, [currentPage, searchName, selectedDepartment, selectedYear]);

    // Reset page on filter change
    const handleFilterChange = (setter: (val: string) => void, val: string) => {
        setter(val);
        setCurrentPage(1);
    };

    return (
        <div>
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-end mb-6 pb-3 border-b-2 border-[#800000]">
                    <h1 className="text-2xl font-bold text-[#800000]">
                        Alumni Directory
                    </h1>
                    <span className="text-sm text-gray-500 font-medium">
                        Total Alumni: {totalItems}
                    </span>
                </div>

                {/* Filters */}
                <div className="bg-[#fbfcff] border border-gray-200 p-6 rounded-lg shadow-sm mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Search by Name</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    type="text"
                                    value={searchName}
                                    onChange={(e) => handleFilterChange(setSearchName, e.target.value)}
                                    placeholder="E.g. Rahul, Microsoft..."
                                    className="pl-10 focus-visible:ring-[#800000]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => handleFilterChange(setSelectedDepartment, e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white"
                            >
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Graduation Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => handleFilterChange(setSelectedYear, e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent bg-white"
                            >
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchName('');
                                    setSelectedDepartment('All Departments');
                                    setSelectedYear('All Years');
                                    setCurrentPage(1);
                                }}
                                className="w-full border border-gray-300 text-gray-600 px-4 py-2.5 rounded-md hover:bg-gray-100 hover:text-gray-900 font-medium transition-colors"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alumni List */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <RowSkeleton key={i} />
                        ))}
                    </div>
                ) : alumni.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-6 py-4 font-semibold text-gray-700">Name / Profile</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-700 hidden md:table-cell">Details</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-700 hidden lg:table-cell">Current Pos.</th>
                                    <th className="text-left px-6 py-4 font-semibold text-gray-700 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {alumni.map((alumnus) => (
                                    <tr
                                        key={alumnus.id}
                                        className="hover:bg-gray-50 transition-colors group"
                                    >

                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={alumnus.profileImage || ""} alt={alumnus.name} />
                                                    <AvatarFallback className="bg-[#800000] text-white">
                                                        {alumnus.name ? alumnus.name.charAt(0).toUpperCase() : '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium text-gray-900 group-hover:text-[#800000] transition-colors">
                                                        {alumnus.name}
                                                    </div>
                                                    {alumnus.linkedIn && (
                                                        <a
                                                            href={alumnus.linkedIn}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                                                        >
                                                            <span>LinkedIn Profile</span>
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"></path></svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800">{alumnus.department}</span>
                                                <span className="text-gray-500">Batch of {alumnus.graduationYear}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm hidden lg:table-cell">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800">{alumnus.currentCompany || 'N/A'}</span>
                                                <span className="text-gray-500">{alumnus.currentRole || 'Alumni'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/alumni-directory/${alumnus.id}`}
                                                className="text-sm font-medium text-[#800000] border border-[#800000] rounded px-3 py-1.5 hover:bg-[#800000]/[0.06] hover:border-[#660000] active:scale-[0.98] transition-all inline-block"
                                            >
                                                View Profile
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <EmptyState
                        icon="🔍"
                        title="No alumni found"
                        description="We couldn't find any alumni matching your current filters. Try adjusting your search criteria."
                        actionLabel="Clear all filters"
                        onAction={() => {
                            setSearchName('');
                            setSelectedDepartment('All Departments');
                            setSelectedYear('All Years');
                            setCurrentPage(1);
                        }}
                    />
                )}

                {/* Reusable Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />


            </div>
        </div>
    );
}
