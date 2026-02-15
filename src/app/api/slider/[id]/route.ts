import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sliderImages } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSliderSchema = z.object({
    displayOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
});

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// PATCH: Update Slider Image (Admin Only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const data = updateSliderSchema.parse(body);

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: 'No data provided' }, { status: 400 });
        }

        await db.update(sliderImages)
            .set(data)
            .where(eq(sliderImages.id, id));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Slider PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Delete Slider Image (Admin Only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        await db.delete(sliderImages)
            .where(eq(sliderImages.id, id));

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Slider DELETE Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
