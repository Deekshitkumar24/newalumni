'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SliderImage } from '@/types';
import { initializeData, getSliderImages, addSliderImage, deleteSliderImage } from '@/lib/data/store';

export default function AdminSliderPage() {
    const router = useRouter();
    const [images, setImages] = useState<SliderImage[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '', // For now, entering URL manually or using placeholder
        link: ''
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

        setImages(getSliderImages());
    }, [router]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        addSliderImage({
            title: formData.title,
            imageUrl: formData.imageUrl,
            link: formData.link || undefined
        });

        setImages(getSliderImages());
        setShowForm(false);
        setFormData({ title: '', imageUrl: '', link: '' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this slide?')) {
            deleteSliderImage(id);
            setImages(getSliderImages());
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
                        <span>Slider Management</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold">Slider Management</h1>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-[#800000] text-white px-4 py-2 text-sm hover:bg-[#660000]"
                        >
                            + Add Slide
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
                            <h2 className="font-semibold">Add New Slide</h2>
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
                                    placeholder="e.g., Convocation 2024"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Image URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    placeholder="https://example.com/image.jpg"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Tip: Use absolute URLs.
                                </p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Link (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#800000]"
                                    placeholder="/events/123 or https://external.com"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="bg-[#800000] text-white px-6 py-2 hover:bg-[#660000]"
                                >
                                    Add Slide
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

                {/* Slides List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map(image => (
                        <div key={image.id} className="bg-white border border-gray-200 overflow-hidden shadow-sm">
                            <div className="h-48 overflow-hidden bg-gray-100 relative">
                                {/* We use standard img for simplicity here to avoid Next.js Image config domain issues with external URLs */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={image.imageUrl}
                                    alt={image.title}
                                    className="w-full h-full object-cover"
                                />
                                {image.link && (
                                    <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                                        Has Link
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 mb-1 truncate">{image.title}</h3>
                                <div className="text-xs text-gray-500 mb-4 truncate">{image.imageUrl}</div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">ID: {image.id.slice(0, 8)}...</span>
                                    <button
                                        onClick={() => handleDelete(image.id)}
                                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {images.length === 0 && !showForm && (
                        <div className="col-span-full py-10 text-center text-gray-500 bg-white border border-gray-200">
                            No slides configured. Add one to show on the homepage.
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
