'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { getAlumni, initializeData } from '@/lib/data/store';
import { Alumni } from '@/types';

const departments = [
    'All Departments',
    'Computer Science',
    'Electronics',
    'Electrical',
    'Mechanical',
    'Civil',
    'Information Technology'
];

const currentYear = new Date().getFullYear();
const years = ['All Years', ...Array.from({ length: 20 }, (_, i) => String(currentYear - i))];

const ITEMS_PER_PAGE = 10;

export default function AlumniDirectoryPage() {
    const [alumni, setAlumni] = useState<Alumni[]>([]);
    const [filteredAlumni, setFilteredAlumni] = useState<Alumni[]>([]);
    const [searchName, setSearchName] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
    const [selectedYear, setSelectedYear] = useState('All Years');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        initializeData();
        const approvedAlumni = getAlumni().filter(a => a.status === 'approved');
        setAlumni(approvedAlumni);
        setFilteredAlumni(approvedAlumni);
    }, []);

    useEffect(() => {
        let result = alumni;

        // Filter by name
        if (searchName) {
            result = result.filter(a =>
                a.name.toLowerCase().includes(searchName.toLowerCase())
            );
        }

        // Filter by department
        if (selectedDepartment !== 'All Departments') {
            result = result.filter(a => a.department === selectedDepartment);
        }

        // Filter by year
        if (selectedYear !== 'All Years') {
            result = result.filter(a => a.graduationYear === parseInt(selectedYear));
        }

        setFilteredAlumni(result);
        setCurrentPage(1);
    }, [searchName, selectedDepartment, selectedYear, alumni]);

    // Pagination
    const totalPages = Math.ceil(filteredAlumni.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedAlumni = filteredAlumni.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div>
            <Breadcrumb items={[{ label: 'Alumni Directory' }]} />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-[#800000] mb-6 pb-3 border-b-2 border-[#800000]">
                    Alumni Directory
                </h1>

                {/* Filters */}
                <div className="bg-[#f5f5f5] border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Name</label>
                            <input
                                type="text"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                placeholder="Enter name..."
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                            >
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
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
                                }}
                                className="w-full border border-[#800000] text-[#800000] px-4 py-2 hover:bg-[#800000] hover:text-white"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-sm text-gray-600">
                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredAlumni.length)} of {filteredAlumni.length} alumni
                </div>

                {/* Alumni List */}
                {paginatedAlumni.length > 0 ? (
                    <div className="border border-gray-200">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[#800000] text-white">
                                    <th className="text-left px-4 py-3 font-medium">Name</th>
                                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Department</th>
                                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Batch</th>
                                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Company</th>
                                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAlumni.map((alumnus, index) => (
                                    <tr
                                        key={alumnus.id}
                                        className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-[#333]">{alumnus.name}</div>
                                            <div className="text-xs text-gray-500 md:hidden">
                                                {alumnus.department} | {alumnus.graduationYear}
                                            </div>
                                            {alumnus.linkedIn && (
                                                <a
                                                    href={alumnus.linkedIn}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    LinkedIn →
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm hidden md:table-cell">{alumnus.department}</td>
                                        <td className="px-4 py-3 text-sm hidden md:table-cell">{alumnus.graduationYear}</td>
                                        <td className="px-4 py-3 text-sm hidden lg:table-cell">{alumnus.currentCompany || '-'}</td>
                                        <td className="px-4 py-3 text-sm hidden lg:table-cell">{alumnus.currentRole || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500 border border-gray-200 bg-white">
                        No alumni found matching your criteria.
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                            Previous
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`px-4 py-2 border ${currentPage === page
                                        ? 'bg-[#800000] text-white border-[#800000]'
                                        : 'border-gray-300 hover:bg-gray-100'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
