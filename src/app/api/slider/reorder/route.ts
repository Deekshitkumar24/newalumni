import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sliderImages } from '@/db/schema';
import { verifyToken } from '@/lib/auth/jwt';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const reorderSchema = z.array(z.object({
    id: z.string(),
    displayOrder: z.number().int()
}));

async function getAuthUser(req: Request) {
    const token = (req as any).cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function PATCH(req: Request) {
    try {
        const auth = await getAuthUser(req);
        if (!auth || auth.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const items = reorderSchema.parse(body);

        // Update all items in a transaction (simulated with Promise.all for now as Drizzle transaction depends on driver)
        // Using Promise.all for batch update
        await Promise.all(items.map(item =>
            db.update(sliderImages)
                .set({ displayOrder: item.displayOrder })
                .where(eq(sliderImages.id, item.id))
        ));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error('Slider Reorder Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
