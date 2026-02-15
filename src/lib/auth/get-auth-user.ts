import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

export async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return null;
    }

    try {
        const payload = verifyToken(token);
        if (!payload || !payload.id) {
            return null;
        }
        return payload;
    } catch (error) {
        return null;
    }
}
