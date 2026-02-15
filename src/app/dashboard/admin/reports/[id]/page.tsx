'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, CheckCircle, XCircle, User as UserIcon, MessageSquare } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface ReportData {
    id: string;
    reason: string;
    status: string;
    snapshot: any;
    adminNotes: string | null;
    timestamp: string;
    updatedAt: string;
    reporterId: string;
    reportedId: string;
    reporterName: string | null;
    reporterRole: string | null;
    reporterImage: string | null;
    reportedUserName: string | null;
    reportedUserRole: string | null;
    reportedUserImage: string | null;
}

export default function ReportDetailPage() {
    const params = useParams();
    const router = useRouter();
    const reportId = params.id as string;

    const [report, setReport] = useState<ReportData | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await fetch(`/api/reports/${reportId}`, { credentials: 'include' });
                if (res.status === 403 || res.status === 401) {
                    router.push('/login');
                    return;
                }
                const data = await res.json();
                if (res.ok && data.data) {
                    setReport(data.data);
                    setAdminNotes(data.data.adminNotes || '');
                }
            } catch (error) {
                console.error('Failed to fetch report', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [reportId, router]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!report) return;
        setIsUpdating(true);

        try {
            const res = await fetch(`/api/reports/${report.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus, adminNotes })
            });

            const data = await res.json();
            if (res.ok) {
                setReport({ ...report, status: newStatus, adminNotes });
                toast.success(`Report marked as ${newStatus}`, {
                    description: 'The report status has been updated.'
                });
            } else {
                const errMsg = typeof data.error === 'string' ? data.error : 'Failed to update status';
                toast.error(errMsg);
            }
        } catch {
            toast.error('Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading report details...</div>;
    if (!report) return (
        <div className="p-8 text-center space-y-4">
            <p className="text-red-500 text-lg font-medium">Report not found</p>
            <Button variant="outline" asChild>
                <Link href="/dashboard/admin/reports">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports
                </Link>
            </Button>
        </div>
    );

    // Split combined reason (format: "Category: Description")
    const reasonParts = report.reason.split(': ');
    const category = reasonParts[0];
    const description = reasonParts.length > 1 ? reasonParts.slice(1).join(': ') : '';

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/admin/reports">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Report #{report.id.slice(-6)}
                        <StatusBadge status={report.status} />
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Submitted on {new Date(report.timestamp).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    {/* Involved Parties */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                <UserIcon className="h-4 w-4" /> Involved Parties
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 p-3 bg-red-50 rounded-md border border-red-100">
                                <Label className="text-xs text-red-600 font-bold uppercase">Reporter</Label>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={report.reporterImage || undefined} />
                                        <AvatarFallback>{(report.reporterName || '?').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{report.reporterName || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500 capitalize">{report.reporterRole || ''}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                                <Label className="text-xs text-gray-600 font-bold uppercase">Reported User</Label>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={report.reportedUserImage || undefined} />
                                        <AvatarFallback>{(report.reportedUserName || '?').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{report.reportedUserName || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500 capitalize">{report.reportedUserRole || ''}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report Details */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Report Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-gray-500 text-xs uppercase font-bold">Category</Label>
                                <p className="font-medium text-gray-900 mt-1">{category}</p>
                            </div>
                            {description && (
                                <div>
                                    <Label className="text-gray-500 text-xs uppercase font-bold">Description</Label>
                                    <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded-md border text-sm leading-relaxed">
                                        {description}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Conversation Snapshot */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Conversation Snapshot
                            </CardTitle>
                            <CardDescription>
                                Last 20 messages at the time of report.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-md border border-gray-200">
                                {report.snapshot && Array.isArray(report.snapshot) && report.snapshot.length > 0 ? (
                                    report.snapshot.map((msg: any, idx: number) => {
                                        const isReporter = msg.senderId === report.reporterId;
                                        const isReported = msg.senderId === report.reportedId;

                                        return (
                                            <div key={msg.id || idx} className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold ${isReporter ? 'text-blue-600' : isReported ? 'text-red-600' : 'text-gray-600'
                                                        }`}>
                                                        {msg.senderName || (isReporter ? report.reporterName : report.reportedUserName) || 'Unknown'}
                                                        {isReporter && ' (Reporter)'}
                                                        {isReported && ' (Reported)'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={`p-2 rounded-md text-sm ${isReported ? 'bg-white border border-red-100' : 'bg-white border border-gray-100'
                                                    }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-center text-gray-500 text-sm italic">
                                        No messages captured in snapshot. Reports submitted before this update will not have snapshots.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Moderation Actions */}
                <div className="space-y-6">
                    <Card className="border-t-4 border-t-[#800000]">
                        <CardHeader>
                            <CardTitle className="text-lg">Moderation Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Admin Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add internal notes about this case..."
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <Separator />

                            <div className="flex flex-col gap-2">
                                {report.status !== 'resolved' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" disabled={isUpdating}>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Mark as Resolved
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Resolve Report?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will mark the report as resolved. Make sure you have taken necessary actions.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleStatusUpdate('resolved')} className="bg-green-600">
                                                    Resolve
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                                {report.status !== 'dismissed' && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-gray-600 hover:text-gray-900"
                                        onClick={() => handleStatusUpdate('dismissed')}
                                        disabled={isUpdating}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Dismiss Report
                                    </Button>
                                )}

                                {report.status !== 'open' && (
                                    <Button
                                        variant="ghost"
                                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => handleStatusUpdate('open')}
                                        disabled={isUpdating}
                                    >
                                        Re-open Case
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
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
}
