'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GalleryImage } from '@/types';
import { initializeData, getGalleryImages, addGalleryImage, deleteGalleryImage } from '@/lib/data/store';

export default function AdminGalleryPage() {
    const router = useRouter();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '', // Manually entering URL for now
        category: 'events' as const
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

        setImages(getGalleryImages());
    }, [router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        addGalleryImage({
            title: formData.title,
            imageUrl: formData.imageUrl,
            category: formData.category
        });

        setImages(getGalleryImages());
        setShowForm(false);
        setFormData({ title: '', imageUrl: '', category: 'events' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this image?')) {
            deleteGalleryImage(id);
            setImages(getGalleryImages());
        }
    };

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Header */}
            <div className="bg-[#1a1a2e] text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                        <Link href="/dashboard/admin" className="hover:text-white">Dashboard</Link>
                        <span>/</span>
                        <span>Gallery Management</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold">Gallery Management</h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-[#800000] text-white px-4 py-2 text-sm hover:bg-[#660000]"
                        >
                            + Add Photo
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Helper Note */}
                <div className="bg-blue-50 border border-blue-200 p-4 mb-6 text-sm text-blue-800">
                    <strong>Note:</strong> Since actual file upload requires backend storage, please provide direct image URLs (e.g., from Unsplash or other hosting) for this demo.
                </div>

                {/* Add Form */}
                {showForm && (
                    <div className="bg-white border border-gray-200 mb-8 max-w-2xl">
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <h2 className="font-semibold">Add New Photo</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title/Caption <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    placeholder="e.g., Alumni Meet 2024 Group Photo"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                >
                                    <option value="events">Events</option>
                                    <option value="campus">Campus</option>
                                    <option value="reunion">Reunion</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Image URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    placeholder="https://example.com/photo.jpg"
                                    required
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-[#800000] text-white px-6 py-2 hover:bg-[#660000]"
                                >
                                    Add Photo
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

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map(image => (
                        <div key={image.id} className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                            <div className="h-48 overflow-hidden bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={image.imageUrl}
                                    alt={image.title}
                                    className="w-full h-full object-cover transition-transform hover:scale-105"
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{image.title}</h3>
                                <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                                    <span className="capitalize">{image.category}</span>
                                    <span>{image.date}</span>
                                </div>

                                <button
                                    onClick={() => handleDelete(image.id)}
                                    className="w-full text-center text-xs border border-red-500 text-red-500 py-1 hover:bg-red-500 hover:text-white"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {images.length === 0 && !showForm && (
                        <div className="col-span-full py-10 text-center text-gray-500 bg-white border border-gray-200">
                            No gallery images found.
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <Link href="/dashboard/admin" className="text-[#800000] hover:underline">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
