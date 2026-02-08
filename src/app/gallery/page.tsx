'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import Pagination from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { GalleryImage } from '@/types';
import { initializeData, getGalleryPaginated } from '@/lib/data/store';

const ITEMS_PER_PAGE = 12;

export default function GalleryPage() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initializeData();
    }, []);

    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
            const { data, total, totalPages } = getGalleryPaginated(currentPage, ITEMS_PER_PAGE, filter);
            setImages(data);
            setTotalPages(totalPages);
            setLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, filter]);

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const categories = ['all', 'events', 'campus', 'reunion', 'other'];

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <Breadcrumb items={[{ label: 'Gallery' }]} />

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 pb-4 border-b-2 border-[#800000]">
                    <h1 className="text-3xl font-bold text-[#800000]">
                        Photo Gallery
                    </h1>

                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleFilterChange(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${filter === cat
                                    ? 'bg-[#800000] text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Gallery Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <CardSkeleton />
                            </div>
                        ))}
                    </div>
                ) : images.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {images.map(image => (
                            <div key={image.id} className="group relative overflow-hidden rounded-lg shadow-sm bg-gray-100 aspect-square cursor-pointer border border-gray-200">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={image.imageUrl}
                                    alt={image.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h3 className="text-white font-medium text-sm truncate shadow-black drop-shadow-md">{image.title}</h3>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-gray-200 text-xs capitalize bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">{image.category}</span>
                                        <span className="text-gray-300 text-xs font-mono">{image.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        icon="📷"
                        title="No photos found"
                        description="Check back later for updates in this category."
                        actionLabel="View all photos"
                        onAction={() => handleFilterChange('all')}
                    />
                )}

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}
