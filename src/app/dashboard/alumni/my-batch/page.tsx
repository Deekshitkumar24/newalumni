'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni } from '@/types';
import { Skeleton } from '@/components/ui/Skeleton';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AlumniBatchPage() {
    const router = useRouter();
    const [user, setUser] = useState<Alumni | null>(null);
    const [batchmates, setBatchmates] = useState<Alumni[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'alumni') {
            router.push('/login');
            return;
        }

        setUser(currentUser);

        // Fetch batchmates
        const fetchBatchmates = async () => {
            try {
                const year = currentUser.graduationYear;
                if (!year) {
                    setLoading(false);
                    return;
                }

                // Query API for alumni in same year
                const params = new URLSearchParams({
                    role: 'alumni',
                    year: year.toString(),
                    limit: '100'
                });

                const res = await fetch(`/api/directory?${params}`);
                const data = await res.json();

                if (data.data) {
                    // Filter out self
                    setBatchmates(data.data.filter((a: any) => a.id !== currentUser.id));
                }
            } catch (error) {
                console.error("Failed to fetch batchmates", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBatchmates();
    }, [router]);

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-[#DAA520] mb-6">My Batch ({user.graduationYear})</h1>

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="bg-[#800000] text-white px-6 py-4 flex justify-between items-center">
                    <h2 className="font-semibold text-lg">Batchmates</h2>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm">{batchmates.length} Found</span>
                </div>

                {loading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : batchmates.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                        {batchmates.map(alumnus => (
                            <div key={alumnus.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={alumnus.profileImage || ""} />
                                        <AvatarFallback>{alumnus.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium text-[#800000] text-lg">{alumnus.name}</div>
                                        <div className="text-sm text-gray-600">{alumnus.department}</div>
                                        {alumnus.currentCompany && (
                                            <div className="text-sm text-gray-500 font-medium mt-1">
                                                {/* Handle missing role gracefully if API doesn't populate it perfectly yet */}
                                                {alumnus.currentRole || 'Alumni'} at {alumnus.currentCompany}
                                            </div>
                                        )}
                                        {alumnus.linkedIn && (
                                            <a
                                                href={alumnus.linkedIn}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                            >
                                                LinkedIn Profile ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 self-start md:self-center">
                                    {/* Message link - assuming /messages or /chat exists */}
                                    <Link
                                        href={`/dashboard/messages?to=${alumnus.id}`}
                                        className="text-sm bg-[#800000] text-white px-4 py-2 hover:bg-[#660000] rounded transition-colors shadow-sm"
                                    >
                                        Message
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        No other alumni from your batch have registered yet.
                    </div>
                )}
            </div>

            {/* Batch Discussion - Placeholder */}
            {/* Keeping this as a visual placeholder for future features */}
            <div className="mt-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden opacity-75">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-700">Batch Discussion Board (Coming Soon)</h2>
                </div>
                <div className="p-6">
                    <p className="text-gray-500 text-sm">
                        Share updates, memories, and connect with your batchmates.
                    </p>
                </div>
            </div>
        </div>
    );
}
