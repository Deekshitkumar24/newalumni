'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SliderImage } from '@/types';
import { initializeData, getSliderImages, addSliderImage, updateSliderImage, deleteSliderImage } from '@/lib/data/store';

export default function AdminSliderPage() {
    const router = useRouter();
    const [images, setImages] = useState<SliderImage[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
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

        if (editingId) {
            updateSliderImage(editingId, {
                title: formData.title,
                imageUrl: formData.imageUrl,
                link: formData.link || undefined
            });
        } else {
            addSliderImage({
                title: formData.title,
                imageUrl: formData.imageUrl,
                link: formData.link || undefined
            });
        }

        setImages(getSliderImages());
        resetForm();
    };

    const handleEdit = (image: SliderImage) => {
        setEditingId(image.id);
        setFormData({
            title: image.title,
            imageUrl: image.imageUrl,
            link: image.link || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({ title: '', imageUrl: '', link: '' });
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this slide?')) {
            deleteSliderImage(id);
            setImages(getSliderImages());
        }
    };

    const handleToggleActive = (image: SliderImage) => {
        updateSliderImage(image.id, { isActive: !image.isActive });
        setImages(getSliderImages());
    };

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Header */}
            <div className="bg-[#1a1a2e] text-white py-6">
                <div className="container mx-auto px-4">
                    <div className="flex items-center gap-2 text-sm text-white mb-2">
                        <Link href="/dashboard/admin" className="hover:text-white">Dashboard</Link>
                        <span>/</span>
                        <span>Slider Management</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold">Slider Management</h1>
                        <button
                            onClick={() => {
                                resetForm();
                                setShowForm(true);
                            }}
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

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="bg-white border border-gray-200 mb-8 max-w-2xl">
                        <div className="bg-[#800000] text-white px-6 py-4">
                            <h2 className="font-semibold">{editingId ? 'Edit Slide' : 'Add New Slide'}</h2>
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
                                    {editingId ? 'Update Slide' : 'Add Slide'}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
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
                        <div key={image.id} className={`bg-white border overflow-hidden shadow-sm transition-all ${image.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
                            <div className="h-48 overflow-hidden bg-gray-100 relative group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={image.imageUrl}
                                    alt={image.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {image.link && (
                                    <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                                        Has Link
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${image.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {image.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 mb-1 truncate">{image.title}</h3>
                                <div className="text-xs text-gray-500 mb-4 truncate">{image.imageUrl}</div>

                                <div className="flex justify-between items-center mt-4 border-t border-gray-100 pt-3">
                                    <button
                                        onClick={() => handleToggleActive(image)}
                                        className={`text-xs px-2 py-1 rounded border ${image.isActive ? 'border-orange-200 text-orange-600 hover:bg-orange-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                                    >
                                        {image.isActive ? 'Deactivate' : 'Activate'}
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(image)}
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(image.id)}
                                            className="text-sm text-red-600 hover:text-red-800 font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
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
