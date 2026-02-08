'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Notice } from '@/types';
import { initializeData, getNotices, createNotice, deleteNotice } from '@/lib/data/store';

export default function AdminNoticesPage() {
    const router = useRouter();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'general' as const
    });

    useEffect(() => {
        initializeData();

        const userStr = localStorage.getItem('vjit_current_user');
        if (!userStr) {
            router.push('/login');
            return;
        }

        const currentUser = JSON.parse(userStr);
        if (currentUser.role !== 'admin') {
            router.push('/login');
            return;
        }

        setNotices(getNotices());
    }, [router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        createNotice({
            title: formData.title,
            content: formData.content,
            type: formData.type
        });

        setNotices(getNotices());
        setShowForm(false);
        setFormData({ title: '', content: '', type: 'general' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this notice?')) {
            deleteNotice(id);
            setNotices(getNotices());
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Notices Management</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-[#800000] text-white px-4 py-2 rounded shadow-sm hover:bg-[#660000] transition-colors"
                >
                    + Post Notice
                </button>
            </div>
            {/* Add Form */}
            {showForm && (
                <div className="bg-white border border-gray-200 mb-8 max-w-2xl">
                    <div className="bg-[#800000] text-white px-6 py-4">
                        <h2 className="font-semibold">Post New Notice</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                placeholder="e.g., Annual Alumni Meet 2025"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                            >
                                <option value="general">General</option>
                                <option value="event">Event</option>
                                <option value="news">News</option>
                                <option value="important">Important</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Content <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                rows={4}
                                placeholder="Enter notice details..."
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="bg-[#800000] text-white px-6 py-2 hover:bg-[#660000]"
                            >
                                Post Notice
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="border border-gray-300 px-6 py-2 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Notices List */}
            <div className="bg-white border border-gray-200">
                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                    <h2 className="font-semibold text-gray-700">All Notices ({notices.length})</h2>
                </div>

                {notices.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                        {notices.map(notice => (
                            <div key={notice.id} className="p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-1 uppercase rounded font-medium ${notice.type === 'important' ? 'bg-red-100 text-red-700' :
                                            notice.type === 'event' ? 'bg-blue-100 text-blue-700' :
                                                notice.type === 'news' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {notice.type}
                                        </span>
                                        <h3 className="font-medium text-[#800000]">{notice.title}</h3>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{notice.content}</p>
                                    <div className="text-xs text-gray-400">
                                        Posted on: {notice.date}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(notice.id)}
                                    className="shrink-0 text-sm border border-red-500 text-red-500 px-3 py-1 hover:bg-red-500 hover:text-white"
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-gray-500">
                        No notices posted yet.
                    </div>
                )}
            </div>

        </div>
    );
}
