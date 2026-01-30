'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Student, Alumni } from '@/types';
import { initializeData, getStudents, getAlumni, approveUser, rejectUser } from '@/lib/data/store';

export default function AdminUsersPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [alumni, setAlumni] = useState<Alumni[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'students' | 'alumni'>('pending');
    const [refreshKey, setRefreshKey] = useState(0);

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

        setStudents(getStudents());
        setAlumni(getAlumni());
    }, [router, refreshKey]);

    const handleApprove = (userId: string, role: 'student' | 'alumni') => {
        approveUser(userId, role);
        setRefreshKey(k => k + 1);
    };

    const handleReject = (userId: string, role: 'student' | 'alumni') => {
        rejectUser(userId, role);
        setRefreshKey(k => k + 1);
    };

    const pendingStudents = students.filter(s => s.status === 'pending');
    const pendingAlumni = alumni.filter(a => a.status === 'pending');
    const allPending = [...pendingStudents.map(s => ({ ...s, role: 'student' as const })), ...pendingAlumni.map(a => ({ ...a, role: 'alumni' as const }))];

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Header */}
            <div className="bg-[#1a1a2e] text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                        <Link href="/dashboard/admin" className="hover:text-white">Dashboard</Link>
                        <span>/</span>
                        <span>User Management</span>
                    </div>
                    <h1 className="text-2xl font-semibold">User Management</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-6 bg-white">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-3 font-medium ${activeTab === 'pending'
                                ? 'text-[#800000] border-b-2 border-[#800000]'
                                : 'text-gray-500 hover:text-[#800000]'
                            }`}
                    >
                        Pending ({allPending.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`px-6 py-3 font-medium ${activeTab === 'students'
                                ? 'text-[#800000] border-b-2 border-[#800000]'
                                : 'text-gray-500 hover:text-[#800000]'
                            }`}
                    >
                        Students ({students.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('alumni')}
                        className={`px-6 py-3 font-medium ${activeTab === 'alumni'
                                ? 'text-[#800000] border-b-2 border-[#800000]'
                                : 'text-gray-500 hover:text-[#800000]'
                            }`}
                    >
                        Alumni ({alumni.length})
                    </button>
                </div>

                {/* Pending Tab */}
                {activeTab === 'pending' && (
                    <div className="bg-white border border-gray-200">
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <h2 className="font-semibold">Pending Approvals</h2>
                        </div>
                        {allPending.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {allPending.map(user => (
                                    <div key={user.id} className="p-4">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-[#800000]">{user.name}</span>
                                                    <span className={`text-xs px-2 py-1 ${user.role === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {user.role.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600">{user.email}</div>
                                                <div className="text-sm text-gray-500">
                                                    {user.department} | Class of {user.graduationYear}
                                                </div>
                                                {user.role === 'student' && 'rollNumber' in user && (
                                                    <div className="text-xs text-gray-400">Roll No: {user.rollNumber}</div>
                                                )}
                                                {user.role === 'alumni' && 'currentCompany' in user && user.currentCompany && (
                                                    <div className="text-xs text-gray-400">{user.currentRole} at {user.currentCompany}</div>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(user.id, user.role)}
                                                    className="bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-700"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(user.id, user.role)}
                                                    className="bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                No pending approvals.
                            </div>
                        )}
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div className="bg-white border border-gray-200">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 font-medium text-sm">Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm hidden md:table-cell">Roll Number</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm hidden md:table-cell">Department</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm hidden lg:table-cell">Year</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(student => (
                                    <tr key={student.id} className="border-b border-gray-200">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{student.name}</div>
                                            <div className="text-xs text-gray-500">{student.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm hidden md:table-cell">{student.rollNumber}</td>
                                        <td className="px-4 py-3 text-sm hidden md:table-cell">{student.department}</td>
                                        <td className="px-4 py-3 text-sm hidden lg:table-cell">{student.graduationYear}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 ${student.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    student.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {student.status === 'pending' && (
                                                <button
                                                    onClick={() => handleApprove(student.id, 'student')}
                                                    className="text-xs text-green-600 hover:underline mr-2"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Alumni Tab */}
                {activeTab === 'alumni' && (
                    <div className="bg-white border border-gray-200">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-100 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 font-medium text-sm">Name</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm hidden md:table-cell">Department</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm hidden md:table-cell">Year</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm hidden lg:table-cell">Company</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm">Status</th>
                                    <th className="text-left px-4 py-3 font-medium text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alumni.map(alumnus => (
                                    <tr key={alumnus.id} className="border-b border-gray-200">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{alumnus.name}</div>
                                            <div className="text-xs text-gray-500">{alumnus.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm hidden md:table-cell">{alumnus.department}</td>
                                        <td className="px-4 py-3 text-sm hidden md:table-cell">{alumnus.graduationYear}</td>
                                        <td className="px-4 py-3 text-sm hidden lg:table-cell">{alumnus.currentCompany || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-1 ${alumnus.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    alumnus.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {alumnus.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {alumnus.status === 'pending' && (
                                                <button
                                                    onClick={() => handleApprove(alumnus.id, 'alumni')}
                                                    className="text-xs text-green-600 hover:underline mr-2"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-6">
                    <Link href="/dashboard/admin" className="text-[#800000] hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
