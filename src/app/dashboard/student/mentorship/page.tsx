'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni, Student, MentorshipRequest } from '@/types';
import { initializeData, getAlumni, getMentorshipRequestsByStudent, createMentorshipRequest } from '@/lib/data/store';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/Skeleton"

import Breadcrumb from '@/components/layout/Breadcrumb';

export default function StudentMentorshipPage() {
    const router = useRouter();
    const [user, setUser] = useState<Student | null>(null);
    const [alumni, setAlumni] = useState<Alumni[]>([]);
    const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        initializeData();

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

        // Simulate network delay
        setTimeout(() => {
            setUser(currentUser);
            setAlumni(getAlumni().filter(a => a.status === 'approved'));
            setMyRequests(getMentorshipRequestsByStudent(currentUser.id));
            setLoading(false);
        }, 500);
    }, [router]);

    const getRequestStatus = (alumniId: string) => {
        const request = myRequests.find(r => r.alumniId === alumniId);
        return request?.status;
    };

    const handleSendRequest = () => {
        if (!user || !selectedAlumni || !message.trim()) return;

        createMentorshipRequest(user.id, selectedAlumni.id, message);
        setMyRequests(getMentorshipRequestsByStudent(user.id));
        setShowRequestModal(false);
        setSelectedAlumni(null);
        setMessage('');
        toast.success(`Request sent to ${selectedAlumni.name}!`);
    };

    const openRequestModal = (alumnus: Alumni) => {
        setSelectedAlumni(alumnus);
        setShowRequestModal(true);
    };

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen">
                <div className="bg-[#800000] h-32 w-full animate-pulse"></div>
                <div className="container mx-auto px-4 -mt-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
                    </div>
                </div>
            </div>
        )
    }

    if (!user) return null;

    return (
        <div className="bg-gray-50 min-h-screen">
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard/student' }, { label: 'Find Mentors' }]} />

            {/* Header */}
            <div className="bg-[#800000] text-white py-6">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold">Find Mentors</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* My Requests Section */}
                {myRequests.length > 0 && (
                    <Card className="mb-8 border-gray-200 shadow-sm">
                        <CardHeader className="pb-3 border-b border-gray-100">
                            <CardTitle className="text-lg font-semibold text-[#800000]">My Mentorship Requests</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                {myRequests.map(request => {
                                    const alumnus = alumni.find(a => a.id === request.alumniId);
                                    return (
                                        <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <div className="font-medium text-gray-900">{alumnus?.name || 'Unknown'}</div>
                                                <div className="text-sm text-gray-500">{alumnus?.currentCompany} | {alumnus?.currentRole}</div>
                                            </div>
                                            <Badge variant={request.status === 'accepted' ? 'default' : request.status === 'rejected' ? 'destructive' : 'secondary'}
                                                className={`${request.status === 'accepted' ? 'bg-green-600' : request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : ''}`}
                                            >
                                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Available Mentors Section */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="bg-[#800000] text-white rounded-t-lg py-4">
                        <CardTitle className="text-lg font-semibold">Available Mentors</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {alumni.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {alumni.map(alumnus => {
                                    const status = getRequestStatus(alumnus.id);
                                    return (
                                        <Card key={alumnus.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                            <CardContent className="p-5">
                                                <div className="mb-3">
                                                    <h3 className="text-lg font-bold text-[#800000] mb-1">{alumnus.name}</h3>
                                                    <div className="text-sm text-gray-600 mb-2">Class of {alumnus.graduationYear} • {alumnus.department}</div>
                                                    {alumnus.currentCompany && (
                                                        <div className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-medium">
                                                            {alumnus.currentRole} @ {alumnus.currentCompany}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4">
                                                    {status === 'accepted' ? (
                                                        <Button variant="outline" className="w-full text-green-600 border-green-200 hover:bg-green-50 pointer-events-none">
                                                            ✓ Connected
                                                        </Button>
                                                    ) : status === 'pending' ? (
                                                        <Button variant="outline" className="w-full text-yellow-600 border-yellow-200 hover:bg-yellow-50 pointer-events-none">
                                                            ⏳ Request Pending
                                                        </Button>
                                                    ) : status === 'rejected' ? (
                                                        <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 pointer-events-none">
                                                            Request Declined
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => openRequestModal(alumnus)}
                                                            className="w-full bg-[#800000] hover:bg-[#660000] text-white"
                                                        >
                                                            Request Mentorship
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                <p>No mentors available at this time.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-6">
                    <Link href="/dashboard/student" className="text-[#800000] hover:underline flex items-center gap-2 font-medium">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>

            {/* Request Dialog */}
            <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#800000]">Request Mentorship</DialogTitle>
                        <DialogDescription>
                            Send a mentorship request to <span className="font-semibold text-gray-900">{selectedAlumni?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Introduce yourself and explain why you'd like this person as your mentor..."
                                rows={5}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => { setShowRequestModal(false); setMessage(''); }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSendRequest}
                            disabled={!message.trim()}
                            className="bg-[#800000] hover:bg-[#660000]"
                        >
                            Send Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
