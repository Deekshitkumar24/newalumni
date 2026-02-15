import { NextResponse } from 'next/server';
import { db } from '@/db';
import { galleryImages } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET: Public active gallery images
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        let whereClause = eq(galleryImages.isActive, true);

        if (category && category !== 'All') {
            whereClause = and(whereClause, eq(galleryImages.category, category)) as any;
        }

        const images = await db.select()
            .from(galleryImages)
            .where(whereClause)
            .orderBy(desc(galleryImages.createdAt));

        return NextResponse.json({ data: images });
    } catch (error) {
        console.error('Public Gallery GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
