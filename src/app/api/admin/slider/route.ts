import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sliderImages } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { desc, eq, asc } from 'drizzle-orm';
import { saveImageFile } from '@/lib/upload';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// GET: List all slider images (Admin)
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const slides = await db.select()
            .from(sliderImages)
            .orderBy(asc(sliderImages.displayOrder), desc(sliderImages.createdAt));

        return NextResponse.json({ data: slides });
    } catch (error) {
        console.error('Admin Slider GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create slider image (Multipart)
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const title = formData.get('title') as string | null;
        const linkUrl = formData.get('linkUrl') as string | null;
        const sortOrder = formData.get('sortOrder') ? parseInt(formData.get('sortOrder') as string) : 0;

        if (!file) {
            return NextResponse.json({ error: 'File is required' }, { status: 400 });
        }

        // Save File
        const { url } = await saveImageFile(file);

        // Insert DB
        const [newSlide] = await db.insert(sliderImages).values({
            imageUrl: url,
            title: title || null,
            linkUrl: linkUrl || null,
            displayOrder: sortOrder,
            isActive: true
        }).returning();

        return NextResponse.json({ success: true, data: newSlide }, { status: 201 });

    } catch (error: any) {
        console.error('Admin Slider POST Error:', error);
        if (error.message.includes('INVALID_FILE') || error.message.includes('FILE_TOO_LARGE')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
