'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GalleryImage } from '@/types';
import { initializeData, getGalleryImages, addGalleryImage, deleteGalleryImage } from '@/lib/data/store';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#1a1a2e]">Gallery Management</h1>
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#800000] text-white hover:bg-[#660000]">
                            + Add Photo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New Photo</DialogTitle>
                            <DialogDescription>
                                Add a photo to the alumni gallery.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title/Caption <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Alumni Meet 2024 Group Photo"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(val) => setFormData({ ...formData, category: val as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="events">Events</SelectItem>
                                        <SelectItem value="campus">Campus</SelectItem>
                                        <SelectItem value="reunion">Reunion</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">Image URL <span className="text-red-500">*</span></Label>
                                <Input
                                    id="imageUrl"
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    placeholder="https://example.com/photo.jpg"
                                    required
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-[#800000] hover:bg-[#660000] text-white">
                                    Add Photo
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Helper Note */}
                <div className="bg-blue-50 border border-blue-200 p-4 mb-6 text-sm text-blue-800">
                    <strong>Note:</strong> Since actual file upload requires backend storage, please provide direct image URLs (e.g., from Unsplash or other hosting) for this demo.
                </div>

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


            </div>
        </div>
    );
}
