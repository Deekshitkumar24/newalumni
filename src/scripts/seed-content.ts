// import { db } from '@/db'; // Removed static import
import { sliderImages, galleryImages } from '@/db/schema';
import fs from 'fs';
import path from 'path';

// Manual env loader
if (!process.env.DATABASE_URL) {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
                    if (key && value && !key.startsWith('#')) {
                        process.env[key] = value;
                    }
                }
            });
        }
    } catch (e) {
        console.error('Failed to load .env', e);
    }
}

async function seedContent() {
    const { db } = await import('@/db');
    console.log('Seeding Content...');

    // Seed Slider Images
    const sliders = [
        {
            imageUrl: '/images/slider/campus-main.png',
            title: 'Reconnecting the VJIT Family',
            displayOrder: 1,
            isActive: true
        },
        {
            imageUrl: '/images/slider/alum-meet.png',
            title: 'Celebrating Excellence & Achievements',
            displayOrder: 2,
            isActive: true
        },
        {
            imageUrl: '/images/slider/convocation.png',
            title: 'Giving Back to Alma Mater',
            displayOrder: 3,
            isActive: true
        }
    ];

    for (const slider of sliders) {
        await db.insert(sliderImages).values(slider).onConflictDoNothing(); // Actually schema doesn't have unique constraint on url, so insert might duplicate if run multiple times. Since it's a new table it's fine.
    }
    console.log(`Seeded ${sliders.length} slider images.`);

    // Seed Gallery Images
    const galleries = [
        {
            imageUrl: '/images/gallery/reunion.png',
            title: 'Alumni Reunion Group',
            category: 'Events',
            isActive: true
        },
        {
            imageUrl: '/images/gallery/workshop.png',
            title: 'Technology Workshop',
            category: 'Workshop',
            isActive: true
        },
        {
            imageUrl: '/images/gallery/auditorium.png',
            title: 'Convocation Ceremony',
            category: 'Ceremony',
            isActive: true
        }
    ];

    for (const gallery of galleries) {
        await db.insert(galleryImages).values(gallery);
    }
    console.log(`Seeded ${galleries.length} gallery images.`);

    process.exit(0);
}

seedContent().catch((err) => {
    console.error('Seeding Failed:', err);
    process.exit(1);
});
