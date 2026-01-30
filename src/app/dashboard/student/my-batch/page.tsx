'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Student } from '@/types';
import { initializeData, getStudents } from '@/lib/data/store';

export default function StudentBatchPage() {
    const router = useRouter();
    const [user, setUser] = useState<Student | null>(null);
    const [batchmates, setBatchmates] = useState<Student[]>([]);

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

        setUser(currentUser);

        // Get batchmates (same graduation year, approved, excluding self)
        const allStudents = getStudents();
        const myBatch = allStudents.filter(
            s => s.graduationYear === currentUser.graduationYear &&
                s.status === 'approved' &&
                s.id !== currentUser.id
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
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Header */}
            <div className="bg-[#800000] text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-200 mb-2">
                        <Link href="/dashboard/student" className="hover:text-white">Dashboard</Link>
                        <span>/</span>
                        <span>My Batch</span>
                    </div>
                    <h1 className="text-2xl font-semibold">My Batch - Class of {user.graduationYear}</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white border border-gray-200">
                    <div className="bg-[#800000] text-white px-6 py-4">
                        <h2 className="font-semibold">Batchmates ({batchmates.length})</h2>
                    </div>

                    {batchmates.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {batchmates.map(student => (
                                <div key={student.id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-[#800000]">{student.name}</div>
                                        <div className="text-sm text-gray-600">{student.department}</div>
                                        <div className="text-sm text-gray-500">Roll No: {student.rollNumber}</div>
                                        {student.skills && student.skills.length > 0 && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                Skills: {student.skills.slice(0, 3).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        href={`/messages?to=${student.id}`}
                                        className="text-sm border border-[#800000] text-[#800000] px-4 py-2 hover:bg-[#800000] hover:text-white"
                                    >
                                        Message
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            No other students from your batch have registered yet.
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <Link href="/dashboard/student" className="text-[#800000] hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
