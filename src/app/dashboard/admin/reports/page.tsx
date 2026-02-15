'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Report, ReportStatus, User } from '@/types'; // Ensure types match API response or adjust
import { Eye } from 'lucide-react';

export default function AdminReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]); // Type might need adjustment if API returns slight variations
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await fetch('/api/reports', { credentials: 'include' });
                if (res.status === 403 || res.status === 401) {
                    router.push('/login');
                    return;
                }
                const data = await res.json();
                if (Array.isArray(data)) {
                    setReports(data);
                    setFilteredReports(data);
                }
            } catch (error) {
                console.error('Failed to fetch reports', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [router]);

    useEffect(() => {
        let result = reports;

        if (statusFilter !== 'ALL') {
            result = result.filter(r => r.status === statusFilter);
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(r =>
                (r.reporterName || '').toLowerCase().includes(lowerQuery) ||
                (r.reportedUserName || '').toLowerCase().includes(lowerQuery) ||
                r.reason.toLowerCase().includes(lowerQuery) ||
                r.id.toLowerCase().includes(lowerQuery)
            );
        }

        setFilteredReports(result);
    }, [statusFilter, searchQuery, reports]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Open</Badge>;
            case 'resolved':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
            case 'dismissed':
                return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Dismissed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-[#800000]">Reports Management</h1>
                    <p className="text-gray-500">Review and moderate reported content.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                <div className="relative w-full sm:w-72">
                    <Input
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-4"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Select
                        value={statusFilter}
                        onValueChange={(val) => setStatusFilter(val as ReportStatus | 'ALL')}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="dismissed">Dismissed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50/50">
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Reported User</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                            </TableRow>
                        ) : filteredReports.length > 0 ? (
                            filteredReports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium text-xs text-gray-500">
                                        #{report.id.slice(-6)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{report.reporterName || 'Unknown'}</span>
                                            {/* API might return role if joined, strictly used checks TS errors if not in type */}
                                            <span className="text-xs text-gray-400 capitalize">{(report as any).reporterRole}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">{report.reportedUserName || 'Unknown'}</span>
                                            <span className="text-xs text-gray-400 capitalize">{(report as any).reportedUserRole}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="font-normal truncate max-w-[200px]">
                                                {report.reason}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(report.status)}
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-500">
                                        {new Date(report.timestamp).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            asChild
                                            className="h-8 w-8 p-0"
                                        >
                                            <Link href={`/dashboard/admin/reports/${report.id}`}>
                                                <Eye className="h-4 w-4 text-gray-500 hover:text-[#800000]" />
                                                <span className="sr-only">View Details</span>
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No reports found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
