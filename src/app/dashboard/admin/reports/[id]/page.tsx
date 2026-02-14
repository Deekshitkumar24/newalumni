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
import { ArrowLeft, MessageSquare, CheckCircle, XCircle, Shield, User as UserIcon } from 'lucide-react';
import { initializeData, getReportById, updateReportStatus } from '@/lib/data/store';
import { Report, ReportStatus, Message } from '@/types';
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

export default function ReportDetailPage() {
    const params = useParams();
    const router = useRouter();
    const reportId = params.id as string;

    const [report, setReport] = useState<Report | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        initializeData();
        const foundReport = getReportById(reportId);
        if (foundReport) {
            setReport(foundReport);
            setAdminNotes(foundReport.adminNotes || '');
        }
        setIsLoading(false);
    }, [reportId]);

    const handleStatusUpdate = (newStatus: ReportStatus) => {
        if (!report) return;

        const success = updateReportStatus(report.id, newStatus, adminNotes);
        if (success) {
            setReport({ ...report, status: newStatus, adminNotes });
            toast.success(`Report marked as ${newStatus.toLowerCase()}`, {
                description: 'The report status has been updated.'
            });
        } else {
            toast.error('Failed to update status');
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading report details...</div>;
    if (!report) return <div className="p-8 text-center text-red-500">Report not found</div>;

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
                {/* Main Content: Chat Snapshot & User Details */}
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
                                        <AvatarFallback>{report.reporterName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{report.reporterName}</p>
                                        <p className="text-xs text-gray-500 capitalize">{report.reporterRole}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                                <Label className="text-xs text-gray-600 font-bold uppercase">Reported User</Label>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{report.reportedUserName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{report.reportedUserName}</p>
                                        <p className="text-xs text-gray-500 capitalize">{report.reportedUserRole}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report Reason */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                <Shield className="h-4 w-4" /> Report Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label className="text-gray-500 text-xs uppercase font-bold">Category</Label>
                                <p className="font-medium text-gray-900 mt-1">{report.reason}</p>
                            </div>
                            <div>
                                <Label className="text-gray-500 text-xs uppercase font-bold">Description</Label>
                                <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded-md border text-sm leading-relaxed">
                                    {report.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chat Snapshot */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Conversation Snapshot
                            </CardTitle>
                            <CardDescription>
                                Looking at last 20 messages at time of report.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto p-4 bg-gray-50 rounded-md border border-gray-200">
                                {report.messagesSnapshot && report.messagesSnapshot.length > 0 ? (
                                    report.messagesSnapshot.map((msg: Message) => {
                                        const isReporter = msg.senderId === report.reporterId;
                                        const isReported = msg.senderId === report.reportedUserId;

                                        let senderName = 'Unknown';
                                        if (isReporter) senderName = report.reporterName;
                                        else if (isReported) senderName = report.reportedUserName;

                                        return (
                                            <div key={msg.id} className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-bold ${isReporter ? 'text-blue-600' : isReported ? 'text-red-600' : 'text-gray-600'
                                                        }`}>
                                                        {senderName}
                                                        {isReporter && ' (Reporter)'}
                                                        {isReported && ' (Reported)'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(msg.createdAt).toLocaleTimeString()}
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
                                    <p className="text-center text-gray-500 text-sm italic">No messages captured in snapshot.</p>
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
                                {report.status !== 'RESOLVED' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
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
                                                <AlertDialogAction onClick={() => handleStatusUpdate('RESOLVED')} className="bg-green-600">
                                                    Resolve
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                                {report.status !== 'DISMISSED' && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-gray-600 hover:text-gray-900"
                                        onClick={() => handleStatusUpdate('DISMISSED')}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Dismiss Report
                                    </Button>
                                )}

                                {report.status !== 'OPEN' && (
                                    <Button
                                        variant="ghost"
                                        className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => handleStatusUpdate('OPEN')}
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
        case 'OPEN':
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Open</Badge>;
        case 'RESOLVED':
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
        case 'DISMISSED':
            return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Dismissed</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
}
