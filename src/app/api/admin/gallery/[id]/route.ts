import { NextResponse } from 'next/server';
import { db } from '@/db';
import { galleryImages } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { saveImageFile } from '@/lib/upload';
import { z } from 'zod';

const updateSchema = z.object({
    title: z.string().optional(),
    category: z.string().optional(),
    isActive: z.union([z.boolean(), z.string().transform(val => val === 'true')]).optional(),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH: Update gallery image
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const contentType = req.headers.get('content-type') || '';

        let data: any = {};
        let imageUrl: string | undefined;

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const file = formData.get('file') as File | null;

            data = {
                title: formData.get('title') as string || undefined,
                category: formData.get('category') as string || undefined,
                isActive: formData.get('isActive')
            };

            if (file && file.size > 0) {
                const uploadResult = await saveImageFile(file);
                imageUrl = uploadResult.url;
            }
        } else {
            data = await req.json();
        }


        const updateData: any = { ...data };
        if (imageUrl) {
            updateData.imageUrl = imageUrl;
        }

        // Safety: Do not delete old file
        await db.update(galleryImages)
            .set(updateData)
            .where(eq(galleryImages.id, id));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Admin Gallery PATCH Error:', error);
        if (error.message.includes('INVALID_FILE') || error.message.includes('FILE_TOO_LARGE')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove gallery image
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        // DB ONLY Delete
        await db.delete(galleryImages).where(eq(galleryImages.id, id));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin Gallery DELETE Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
