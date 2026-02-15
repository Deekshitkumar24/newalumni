import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sliderImages } from '@/db/schema';
import { desc, eq, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET: Public active slider images
export async function GET(req: Request) {
    try {
        const slides = await db.select()
            .from(sliderImages)
            .where(eq(sliderImages.isActive, true))
            .orderBy(asc(sliderImages.displayOrder), desc(sliderImages.createdAt));

        return NextResponse.json({ data: slides });
    } catch (error) {
        console.error('Public Slider GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
