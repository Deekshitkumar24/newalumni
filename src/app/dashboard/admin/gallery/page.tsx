'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GalleryImage } from '@/types';

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
import { toast } from 'sonner';


export default function AdminGalleryPage() {
    const router = useRouter();
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<'events' | 'campus' | 'reunion' | 'other'>('events');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const fetchGallery = async () => {
        try {
            const res = await fetch('/api/admin/gallery');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (data.data) {
                // Map API response
                const mappedImages = data.data.map((img: any) => ({
                    ...img,
                    date: img.createdAt ? new Date(img.createdAt).toISOString().split('T')[0] : 'Just now',
                    category: img.category || 'other'
                }));
                setImages(mappedImages);
            }
        } catch (error) {
            console.error('Failed to fetch gallery', error);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File too large (Max 5MB)');
                return;
            }
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('category', category);

            if (file) {
                formData.append('file', file);
            }

            // POST only for now (Creation)
            if (!file) {
                toast.error('Image file is required');
                setIsSubmitting(false);
                return;
            }

            const res = await fetch('/api/admin/gallery', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Upload failed');
            }

            toast.success('Photo added');
            fetchGallery();
            resetForm();
        } catch (error: any) {
            console.error('Failed to add gallery image', error);
            toast.error(error.message || 'Failed to add photo');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setTitle('');
        setCategory('events');
        setFile(null);
        setPreviewUrl('');
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this image?')) {
            try {
                await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
                toast.success('Image deleted');
                fetchGallery();
            } catch (error) {
                console.error('Failed to delete gallery image', error);
                toast.error('Failed to delete image');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#1a1a2e]">Gallery Management</h1>
                <Dialog open={showForm} onOpenChange={setShowForm}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm} className="bg-[#800000] text-white hover:bg-[#660000]">
                            + Add Photo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>Add New Photo</DialogTitle>
                            <DialogDescription>
                                Upload photos to the gallery. Max 5MB.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title/Caption <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Alumni Meet 2024 Group Photo"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={category}
                                    onValueChange={(val) => setCategory(val as any)}
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
                                <Label htmlFor="file">Image File <span className="text-red-500">*</span></Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    onChange={handleFileChange}
                                    required
                                />
                                {previewUrl && (
                                    <div className="mt-2 relative w-full h-40 bg-gray-100 rounded-md overflow-hidden border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="bg-[#800000] hover:bg-[#660000] text-white">
                                    {isSubmitting ? 'Uploading...' : 'Add Photo'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="container mx-auto px-4 py-8">
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
                                    className="w-full text-center text-xs border border-red-500 text-red-500 py-1 hover:bg-red-500 hover:text-white transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {images.length === 0 && !showForm && (
                        <div className="col-span-full py-10 text-center text-gray-500 bg-white border border-gray-200">
                            No gallery images found. Upload one to get started.
                        </div>
                    )}
                </div>


            </div>
        </div>
    );
}
