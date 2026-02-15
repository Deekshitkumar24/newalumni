import { NextResponse } from 'next/server';
import { db } from '@/db';
import { galleryImages } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { desc, eq, asc } from 'drizzle-orm';
import { saveImageFile } from '@/lib/upload';

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

// GET: List all gallery images (Admin)
export async function GET(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const images = await db.select()
            .from(galleryImages)
            .orderBy(desc(galleryImages.createdAt));

        return NextResponse.json({ data: images });
    } catch (error) {
        console.error('Admin Gallery GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create gallery image (Multipart)
export async function POST(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { title, category, imageUrl } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
        }
        if (!category) {
            return NextResponse.json({ error: 'Category is required' }, { status: 400 });
        }

        // Insert DB
        const [newImage] = await db.insert(galleryImages).values({
            imageUrl: imageUrl,
            title: title || null,
            category: category,
            isActive: true
        }).returning();

        return NextResponse.json({ success: true, data: newImage }, { status: 201 });

    } catch (error: any) {
        console.error('Admin Gallery POST Error:', error);
        if (error.message.includes('INVALID_FILE') || error.message.includes('FILE_TOO_LARGE')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
