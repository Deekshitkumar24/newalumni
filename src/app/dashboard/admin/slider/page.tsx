'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SliderImage } from '@/types';

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
import { Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';


export default function AdminSliderPage() {
    const router = useRouter();
    const [images, setImages] = useState<SliderImage[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const fetchSliders = async () => {
        try {
            const res = await fetch('/api/slider?admin=true');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (data.data) {
                const sorted = data.data.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
                setImages(sorted);
            }
        } catch (error) {
            console.error('Failed to fetch sliders', error);
        }
    };

    useEffect(() => {
        fetchSliders();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                title,
                linkUrl,
                imageUrl,
                sortOrder: images.length + 1
            };

            if (editingId) {
                // PATCH
                await fetch(`/api/admin/slider/${editingId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                toast.success('Slider updated');
            } else {
                // POST
                if (!imageUrl) {
                    toast.error('Image URL is required');
                    setIsSubmitting(false);
                    return;
                }

                const res = await fetch('/api/admin/slider', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Upload failed');
                }

                toast.success('Slider added');
            }

            fetchSliders();
            resetForm();
        } catch (error: any) {
            console.error('Failed to save slider', error);
            toast.error(error.message || 'Failed to save slider');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (image: SliderImage) => {
        setEditingId(image.id);
        setTitle(image.title || '');
        setLinkUrl(image.linkUrl || image.link || '');
        setImageUrl(image.imageUrl || '');
        setPreviewUrl(image.imageUrl || '');
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setTitle('');
        setLinkUrl('');
        setImageUrl('');
        setPreviewUrl('');
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this slide?')) {
            try {
                await fetch(`/api/admin/slider/${id}`, { method: 'DELETE' });
                toast.success('Slider deleted');
                fetchSliders();
            } catch (error) {
                console.error('Failed to delete slider', error);
                toast.error('Failed to delete slider');
            }
        }
    };

    const handleToggleActive = async (image: SliderImage) => {
        try {
            await fetch(`/api/admin/slider/${image.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !image.isActive }),
                headers: { 'Content-Type': 'application/json' }
            });
            fetchSliders();
            toast.success(`Slider ${image.isActive ? 'deactivated' : 'activated'}`);
        } catch (error) {
            console.error('Failed to toggle active', error);
            toast.error('Failed to toggle active');
        }
    };

    return (
        <div className="bg-[#f5f5f5] min-h-screen">
            {/* Header */}
            <div className="bg-[#1a1a2e] text-white py-6">
                <div className="container mx-auto px-4">

                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-semibold">Slider Management</h1>
                        <Dialog open={showForm} onOpenChange={setShowForm}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => resetForm()}
                                    className="bg-[#800000] text-white hover:bg-[#660000]"
                                >
                                    + Add Slide
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>{editingId ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
                                    <DialogDescription>
                                        Upload banner images. Max 5MB. JPG/PNG/WEBP.
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="e.g., Convocation 2024"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="imageUrl">Image URL <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="imageUrl"
                                            value={imageUrl}
                                            onChange={(e) => {
                                                setImageUrl(e.target.value);
                                                setPreviewUrl(e.target.value);
                                            }}
                                            placeholder="https://example.com/image.jpg"
                                            required
                                        />
                                        {previewUrl && (
                                            <div className="mt-2 relative w-full h-40 bg-gray-100 rounded-md overflow-hidden border">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => { (e.target as any).src = 'https://placehold.co/600x400?text=Invalid+URL'; }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="link">Link (Optional)</Label>
                                        <Input
                                            id="link"
                                            value={linkUrl}
                                            onChange={(e) => setLinkUrl(e.target.value)}
                                            placeholder="/events/123 or https://external.com"
                                        />
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isSubmitting} className="bg-[#800000] hover:bg-[#660000] text-white">
                                            {isSubmitting ? 'Uploading...' : (editingId ? 'Update Slide' : 'Add Slide')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Slides List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image, index) => (
                        <div
                            key={image.id}
                            className={`bg-white border overflow-hidden shadow-sm transition-all group/card relative ${image.isActive ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}
                        >


                            <div className="h-48 overflow-hidden bg-gray-100 relative group">
                                {image.imageUrl ? (
                                    <img
                                        src={image.imageUrl}
                                        alt={image.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => { (e.target as any).src = 'https://placehold.co/600x400?text=Invalid+Image'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                        <span className="text-sm">No Image</span>
                                    </div>
                                )}
                                {(image.linkUrl || image.link) && (
                                    <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                                        Has Link
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 z-10">
                                    <span className={`px-2 py-1 text-xs font-bold rounded ${image.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {image.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 mb-1 truncate">{image.title}</h3>
                                <div className="text-xs text-gray-500 mb-4 truncate" title={image.imageUrl}>{image.imageUrl}</div>

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
                                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Edit size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(image.id)}
                                            className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {images.length === 0 && !showForm && (
                        <div className="col-span-full py-10 text-center text-gray-500 bg-white border border-gray-200">
                            No slides found. Click &quot;Add Slide&quot; to upload one.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
