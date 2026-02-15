import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sliderImages } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { saveImageFile } from '@/lib/upload';
import { z } from 'zod';

const updateSchema = z.object({
    title: z.string().optional(),
    linkUrl: z.string().optional(),
    sortOrder: z.coerce.number().optional(),
    isActive: z.union([z.boolean(), z.string().transform(val => val === 'true')]).optional(),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH: Update slider image (JSON or Multipart)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
                linkUrl: formData.get('linkUrl') as string || undefined,
                sortOrder: formData.get('sortOrder'),
                isActive: formData.get('isActive')
            };

            // Remove undefined keys
            Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

            if (file && file.size > 0) {
                const uploadResult = await saveImageFile(file);
                imageUrl = uploadResult.url;
            }
        } else {
            data = await req.json();
        }

        const validated = updateSchema.parse(data);

        const updateData: any = { ...validated };
        if (imageUrl) {
            updateData.imageUrl = imageUrl;
        }

        // Safety: Do not delete old file. Just update DB reference.
        await db.update(sliderImages)
            .set(updateData)
            .where(eq(sliderImages.id, id));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Admin Slider PATCH Error:', error);
        if (error.message.includes('INVALID_FILE') || error.message.includes('FILE_TOO_LARGE')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove slider image
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        // DB ONLY Delete. We do not delete the file from disk to be safe/non-destructive.
        await db.delete(sliderImages).where(eq(sliderImages.id, id));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin Slider DELETE Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
