'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Student, Alumni } from '@/types';
import { initializeData, getStudentsPaginated, getAlumni, updateUserStatus, getStudents, getPendingUsers } from '@/lib/data/store';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import { toast } from 'sonner';

import { Skeleton, RowSkeleton } from "@/components/ui/Skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

import Breadcrumb from '@/components/layout/Breadcrumb';

export default function AdminUsersPage() {
    const router = useRouter();
    // Students State
    const [students, setStudents] = useState<Student[]>([]);
    const [studentsPage, setStudentsPage] = useState(1);
    const [studentsTotal, setStudentsTotal] = useState(0);
    const [studentsTotalPages, setStudentsTotalPages] = useState(0);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentDept, setStudentDept] = useState('All Departments');
    const [studentYear, setStudentYear] = useState('All Years');
    const [studentSort, setStudentSort] = useState<'recent' | 'alphabetical' | 'year'>('recent');

    // Other State
    const [alumni, setAlumni] = useState<Alumni[]>([]);
    const [activeTab, setActiveTab] = useState('pending'); // Type inferred as string for Shadcn Tabs
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);

    // Initial Auth Check
    useEffect(() => {
        initializeData();
        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) { router.push('/login'); return; }
        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'admin') { router.push('/login'); return; }
    }, [router]);

    // Data Fetching
    useEffect(() => {
        setLoading(true);
        // Simulate network
        const timer = setTimeout(() => {
            // Fetch Pending Counts (Optimized)
            const pending = getPendingUsers();
            setPendingCount(pending.length);

            // Fetch Students (Paginated)
            if (activeTab === 'students') {
                const { data, total, totalPages } = getStudentsPaginated(
                    studentsPage,
                    10,
                    studentSearch,
                    studentDept,
                    studentYear,
                    studentSort
                );
                setStudents(data);
                setStudentsTotal(total);
                setStudentsTotalPages(totalPages);
            }

            // Fetch Alumni (Non-paginated for now as per scope)
            if (activeTab === 'alumni') {
                setAlumni(getAlumni());
            }

            setLoading(false);
        }, 400);

        return () => clearTimeout(timer);
    }, [refreshKey, activeTab, studentsPage, studentSearch, studentDept, studentYear]);


    const handleAction = (userId: string, status: 'approved' | 'rejected' | 'suspended') => {
        if (!window.confirm(`Are you sure you want to change user status to: ${status.toUpperCase()}?`)) {
            return;
        }
        updateUserStatus(userId, status);
        setRefreshKey(k => k + 1);
        toast.success(`User status updated to ${status}`);
    };

    // Filter Logic for Pending Tab (Client-side)
    const pendingList = getPendingUsers();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[#1a1a2e]">User Management</h1>

            <div className="container mx-auto px-4 py-8">
                <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white border border-gray-200 mb-6 w-full justify-start p-1 h-auto">
                        <TabsTrigger value="pending" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">
                            Pending Approvals
                            {pendingCount > 0 && (
                                <Badge variant="secondary" className="ml-2 bg-white text-[#800000] hover:bg-white">{pendingCount}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="students" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">All Students</TabsTrigger>
                        <TabsTrigger value="alumni" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">Alumni Directory</TabsTrigger>
                    </TabsList>

                    <Card className="min-h-[400px]">
                        {/* PENDING TAB */}
                        <TabsContent value="pending" className="m-0 border-none shadow-none">
                            <div className="bg-yellow-50 text-yellow-800 px-6 py-4 border-b border-yellow-100 flex items-center gap-2 rounded-t-lg mx-1 mt-1">
                                <span>⚠️</span>
                                <h2 className="font-semibold">Action Required: {pendingList.length} Pending Approvals</h2>
                            </div>
                            {loading ? (
                                <div className="p-6 space-y-4">{[1, 2, 3].map(i => <RowSkeleton key={i} />)}</div>
                            ) : pendingList.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User Details</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Requested On</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pendingList.map(user => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={user.profileImage} alt={user.name} />
                                                            <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{user.name}</div>
                                                            <div className="text-xs text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.role === 'student' ? 'default' : 'secondary'} className={user.role === 'student' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : 'bg-purple-100 text-purple-800 hover:bg-purple-100'}>
                                                        {user.role === 'student' ? 'Student' : 'Alumni'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-gray-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAction(user.id, 'rejected')}>
                                                            Reject
                                                        </Button>
                                                        <Button size="sm" className="bg-[#800000] hover:bg-[#660000] text-white" onClick={() => handleAction(user.id, 'approved')}>
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <EmptyState icon="✅" title="All caught up!" description="No pending registrations." />
                            )}
                        </TabsContent>


                        {/* STUDENTS TAB */}
                        <TabsContent value="students" className="m-0 border-none shadow-none">
                            <div className="p-6">
                                {/* Search & Filters */}
                                <div className="flex flex-col md:flex-row gap-4 mb-6">
                                    <div className="flex-1">
                                        <Input
                                            placeholder="Search by Name, Roll No, Email..."
                                            value={studentSearch}
                                            onChange={(e) => { setStudentSearch(e.target.value); setStudentsPage(1); }}
                                            className="focus-visible:ring-[#800000]"
                                        />
                                    </div>
                                    <div className="w-full md:w-[200px]">
                                        <Select value={studentDept} onValueChange={(val) => { setStudentDept(val); setStudentsPage(1); }}>
                                            <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All Departments">All Departments</SelectItem>
                                                {['CSE', 'ECE', 'EEE', 'IT', 'Mech', 'Civil'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full md:w-[150px]">
                                        <Select value={studentYear} onValueChange={(val) => { setStudentYear(val); setStudentsPage(1); }}>
                                            <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All Years">All Years</SelectItem>
                                                {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-full md:w-[180px]">
                                        <Select value={studentSort} onValueChange={(val: any) => { setStudentSort(val); setStudentsPage(1); }}>
                                            <SelectTrigger><SelectValue placeholder="Sort By" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="recent">Newest Registered</SelectItem>
                                                <SelectItem value="alphabetical">A-Z Name</SelectItem>
                                                <SelectItem value="year">Graduation Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="space-y-4">{[1, 2, 3, 4, 5].map(i => <RowSkeleton key={i} />)}</div>
                                ) : students.length > 0 ? (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name & Email</TableHead>
                                                    <TableHead>Roll No</TableHead>
                                                    <TableHead>Details</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.map(student => (
                                                    <TableRow key={student.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-9 w-9">
                                                                    <AvatarImage src={student.profileImage} alt={student.name} />
                                                                    <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{student.name}</div>
                                                                    <div className="text-xs text-gray-500">{student.email}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">{student.rollNumber}</TableCell>
                                                        <TableCell className="text-xs text-gray-600">
                                                            {student.department} - {student.graduationYear}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={student.status === 'approved' ? 'default' : student.status === 'suspended' ? 'destructive' : 'secondary'}
                                                                className={student.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                                            >
                                                                {student.status.toUpperCase()}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {student.status === 'approved' ? (
                                                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2" onClick={() => handleAction(student.id, 'suspended')}>Suspend</Button>
                                                            ) : student.status === 'suspended' ? (
                                                                <Button size="sm" variant="ghost" className="text-[#800000] hover:text-[#660000] hover:bg-red-50 h-8 px-2" onClick={() => handleAction(student.id, 'approved')}>Re-Activate</Button>
                                                            ) : (
                                                                <span className="text-gray-400 text-xs">None</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        <div className="mt-4">
                                            <Pagination
                                                currentPage={studentsPage}
                                                totalPages={studentsTotalPages}
                                                onPageChange={setStudentsPage}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <EmptyState icon="🎓" title="No students found" description="Try adjusting your filters or search." />
                                )}
                            </div>
                        </TabsContent>

                        {/* ALUMNI TAB */}
                        <TabsContent value="alumni" className="m-0 border-none shadow-none">
                            <div className="p-6">
                                {loading ? (
                                    <div className="space-y-4">{[1, 2, 3].map(i => <RowSkeleton key={i} />)}</div>
                                ) : alumni.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Batch / Dept</TableHead>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {alumni.map(a => (
                                                <TableRow key={a.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-9 w-9">
                                                                <AvatarImage src={a.profileImage} alt={a.name} />
                                                                <AvatarFallback>{a.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium text-gray-900">{a.name}</div>
                                                                <div className="text-xs text-gray-500">{a.email}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-xs text-gray-600">{a.department} '{a.graduationYear}</TableCell>
                                                    <TableCell className="text-xs text-gray-600">
                                                        {a.currentRole} @ {a.currentCompany}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={a.status === 'approved' ? 'default' : a.status === 'suspended' ? 'destructive' : 'secondary'}
                                                            className={a.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                                                        >
                                                            {a.status.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {a.status === 'approved' ? (
                                                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2" onClick={() => handleAction(a.id, 'suspended')}>Suspend</Button>
                                                        ) : a.status === 'suspended' ? (
                                                            <Button size="sm" variant="ghost" className="text-[#800000] hover:text-[#660000] hover:bg-red-50 h-8 px-2" onClick={() => handleAction(a.id, 'approved')}>Re-Activate</Button>
                                                        ) : null}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <EmptyState icon="🎓" title="No alumni found" description="Registered alumni will appear here." />
                                )}
                            </div>
                        </TabsContent>
                    </Card>

                    <div className="mt-8">
                        <Link href="/dashboard/admin" className="text-[#800000] hover:underline flex items-center gap-2 font-medium">
                            ← Back to Dashboard
                        </Link>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

