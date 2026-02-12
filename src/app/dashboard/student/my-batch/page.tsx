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
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-[#800000] mb-6">My Batch ({user.graduationYear})</h1>
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
                                    {student.linkedIn && (
                                        <a
                                            href={student.linkedIn}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm border border-[#0077b5] text-[#0077b5] px-4 py-2 hover:bg-[#0077b5] hover:text-white flex items-center gap-2 transition-colors"
                                        >
                                            <span>LinkedIn</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                                                <rect width="4" height="12" x="2" y="9" />
                                                <circle cx="4" cy="4" r="2" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            No other students from your batch have registered yet.
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
}
