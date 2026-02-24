'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, AlertCircle, Ban, RefreshCw, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RowSkeleton } from "@/components/ui/Skeleton";
import EmptyState from '@/components/ui/EmptyState';

// Types based on schema
type User = {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'alumni' | 'admin';
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    profileImage?: string;
    canCreateEvents?: boolean;
    createdAt: string;
};

export default function AdminUsersPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('pending');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // ID of user being processed
    const [search, setSearch] = useState('');

    // Fetch Users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                status: activeTab,
                limit: '50' // Fetch more for admin view
            });
            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (res.status === 401 || res.status === 403) {
                toast.error('Unauthorized');
                router.push('/login');
                return;
            }
            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            setUsers(data.data || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab, router]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleStatusUpdate = async (userId: string, newStatus: string) => {
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Update failed');

            toast.success(`User updated to ${newStatus}`);
            fetchUsers(); // Refresh list to reflect changes (moved item to another tab)
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('Are you sure? This is permanent.')) return;

        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/status`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Delete failed');

            toast.success('User deleted');
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const handleEventPermission = async (userId: string, currentValue: boolean) => {
        setActionLoading(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/event-permission`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ canCreateEvents: !currentValue })
            });

            if (!res.ok) throw new Error('Update failed');

            const data = await res.json();
            toast.success(data.message);

            // Update local state immediately
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, canCreateEvents: !currentValue } : u
            ));
        } catch (error) {
            console.error(error);
            toast.error('Failed to update event permission');
        } finally {
            setActionLoading(null);
        }
    };

    // Client-side filtering for search
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[#1a1a2e]">User Management</h1>

            <div className="container mx-auto px-4 py-6">
                <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-white border border-gray-200 mb-6 w-full justify-start p-1 h-auto">
                        <TabsTrigger value="pending" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">
                            Pending
                        </TabsTrigger>
                        <TabsTrigger value="approved" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">
                            Approved
                        </TabsTrigger>
                        <TabsTrigger value="rejected" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">
                            Rejected
                        </TabsTrigger>
                        {/* Adding Suspended tab for completeness/cleanup if needed */}
                        <TabsTrigger value="suspended" className="px-6 py-2.5 data-[state=active]:bg-[#800000] data-[state=active]:text-white">
                            Suspended
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center mb-4 max-w-md">
                        <Search className="text-gray-400 mr-2" />
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    <Card className="min-h-[400px] border-none shadow-sm">
                        {loading ? (
                            <div className="p-6 space-y-4">{[1, 2, 3].map(i => <RowSkeleton key={i} />)}</div>
                        ) : filteredUsers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User Details</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Registered</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={user.profileImage} />
                                                        <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{user.name}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={
                                                    user.role === 'student' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        user.role === 'alumni' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            'bg-gray-100'
                                                }>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    user.status === 'pending' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' :
                                                        user.status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                            'bg-red-100 text-red-800 hover:bg-red-100'
                                                }>
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* Pending Actions */}
                                                    {user.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-600 hover:bg-red-50"
                                                                disabled={actionLoading === user.id}
                                                                onClick={() => handleStatusUpdate(user.id, 'rejected')}
                                                            >
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#800000] hover:bg-[#660000] text-white"
                                                                disabled={actionLoading === user.id}
                                                                onClick={() => handleStatusUpdate(user.id, 'approved')}
                                                            >
                                                                {actionLoading === user.id ? <RefreshCw className="animate-spin h-4 w-4" /> : 'Approve'}
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* Approved Actions */}
                                                    {user.status === 'approved' && (
                                                        <>
                                                            {user.role === 'student' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className={user.canCreateEvents
                                                                        ? 'text-green-700 bg-green-50 border-green-200 hover:bg-green-100'
                                                                        : 'text-gray-500 hover:bg-gray-50'
                                                                    }
                                                                    disabled={actionLoading === user.id}
                                                                    onClick={() => handleEventPermission(user.id, !!user.canCreateEvents)}
                                                                >
                                                                    {user.canCreateEvents ? '✓ Event Posting' : 'Event Posting'}
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-amber-600 hover:bg-amber-50"
                                                                disabled={actionLoading === user.id}
                                                                onClick={() => handleStatusUpdate(user.id, 'suspended')}
                                                            >
                                                                Suspend
                                                            </Button>
                                                        </>
                                                    )}

                                                    {/* Rejected/Suspended Actions */}
                                                    {(user.status === 'rejected' || user.status === 'suspended') && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:bg-green-50"
                                                            disabled={actionLoading === user.id}
                                                            onClick={() => handleStatusUpdate(user.id, 'approved')}
                                                        >
                                                            Re-Activate
                                                        </Button>
                                                    )}

                                                    {/* Always showing delete for admin power */}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-gray-400 hover:text-red-600"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <EmptyState
                                icon={
                                    activeTab === 'pending' ? <CheckCircle2 size={48} /> :
                                        activeTab === 'rejected' ? <XCircle size={48} /> :
                                            <AlertCircle size={48} />
                                }
                                title={`No ${activeTab} users found`}
                                description={activeTab === 'pending' ? "All caught up! No pending requests." : "No users in this category."}
                            />
                        )}
                    </Card>
                </Tabs>
            </div>
        </div>
    );
}
