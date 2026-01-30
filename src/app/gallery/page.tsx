'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { GalleryImage } from '@/types';
import { initializeData, getGalleryImages } from '@/lib/data/store';

export default function GalleryPage() {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        initializeData();
        setImages(getGalleryImages());
    }, []);

    const filteredImages = filter === 'all'
        ? images
        : images.filter(img => img.category === filter);

    const categories = ['all', 'events', 'campus', 'reunion', 'other'];

    // Group images by category for "all" view or just show grid?
    // Let's show a masonry-like grid or simple grid.

    return (
        <div>
            <Breadcrumb items={[{ label: 'Gallery' }]} />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-[#800000] mb-6 pb-3 border-b-2 border-[#800000]">
                    Photo Gallery
                </h1>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${filter === cat
                                    ? 'bg-[#800000] text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Gallery Grid */}
                {filteredImages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredImages.map(image => (
                            <div key={image.id} className="group relative overflow-hidden rounded-lg shadow-sm bg-gray-100 aspect-square cursor-pointer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={image.imageUrl}
                                    alt={image.title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h3 className="text-white font-medium text-sm truncate">{image.title}</h3>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-gray-300 text-xs capitalize">{image.category}</span>
                                        <span className="text-gray-400 text-xs">{image.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500 border border-gray-200 bg-white">
                        No photos found in this category.
                    </div>
                )}
            </div>
        </div>
    );
}
