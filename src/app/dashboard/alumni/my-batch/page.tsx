'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alumni } from '@/types';
import { initializeData, getAlumni } from '@/lib/data/store';

export default function AlumniBatchPage() {
    const router = useRouter();
    const [user, setUser] = useState<Alumni | null>(null);
    const [batchmates, setBatchmates] = useState<Alumni[]>([]);

    useEffect(() => {
        initializeData();

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

        // Get batchmates (same graduation year, approved, excluding self)
        const allAlumni = getAlumni();
        const myBatch = allAlumni.filter(
            a => a.graduationYear === currentUser.graduationYear &&
                a.status === 'approved' &&
                a.id !== currentUser.id
        );
        setBatchmates(myBatch);
    }, [router]);

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-10 text-center">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-[#DAA520] mb-6">My Batch ({user.graduationYear})</h1>

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white border border-gray-200">
                    <div className="bg-[#800000] text-white px-6 py-4">
                        <h2 className="font-semibold">Batchmates ({batchmates.length})</h2>
                    </div>

                    {batchmates.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {batchmates.map(alumnus => (
                                <div key={alumnus.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <div className="font-medium text-[#800000]">{alumnus.name}</div>
                                        <div className="text-sm text-gray-600">{alumnus.department}</div>
                                        {alumnus.currentCompany && (
                                            <div className="text-sm text-gray-500">
                                                {alumnus.currentRole} at {alumnus.currentCompany}
                                            </div>
                                        )}
                                        {alumnus.linkedIn && (
                                            <a
                                                href={alumnus.linkedIn}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                LinkedIn Profile →
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/messages?to=${alumnus.id}`}
                                            className="text-sm bg-[#800000] !text-white px-4 py-2 hover:bg-[#660000] rounded transition-colors"
                                        >
                                            Message
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            No other alumni from your batch have registered yet.
                        </div>
                    )}
                </div>

                {/* Batch Discussion - Placeholder */}
                <div className="mt-8 bg-white border border-gray-200">
                    <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-700">Batch Discussion Board</h2>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-500 text-sm mb-4">
                            Share updates, memories, and connect with your batchmates.
                        </p>
                        <Link
                            href={`/messages/batch/${user.graduationYear}`}
                            className="text-[#800000] hover:underline text-sm"
                        >
                            Go to Batch Discussion →
                        </Link>
                    </div>
                </div>

                <div className="mt-6">
                    <Link href="/dashboard/alumni" className="text-[#800000] hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
