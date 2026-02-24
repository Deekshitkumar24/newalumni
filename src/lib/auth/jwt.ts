import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

// Lazy getters — avoid triggering env validation at build time.
const getJwtSecret = () => env.JWT_SECRET;
const getRefreshSecret = () => process.env.REFRESH_TOKEN_SECRET || env.JWT_SECRET;

// Access Token: Short-lived (e.g., 15m)
export const signAccessToken = (payload: object): string => {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' });
};

// Refresh Token: Long-lived (e.g., 7d)
export const signRefreshToken = (payload: object): string => {
    return jwt.sign(payload, getRefreshSecret(), { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): any => {
    try {
        return jwt.verify(token, getJwtSecret());
    } catch (error: any) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[JWT Debug] Access Token Verification Failed:', {
                tokenPresent: !!token,
                errorName: error.name,
                errorMessage: error.message,
                jwtSecretPresent: !!getJwtSecret()
            });
        }
        return null;
    }
};

export const verifyRefreshToken = (token: string): any => {
    try {
        return jwt.verify(token, getRefreshSecret());
    } catch (error: any) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[JWT Debug] Refresh Token Verification Failed:', {
                tokenPresent: !!token,
                errorName: error.name,
                errorMessage: error.message,
                jwtSecretPresent: !!getRefreshSecret()
            });
        }
        return null;
    }
};

// Keep original for backward compat
export const signToken = signAccessToken;
export const verifyToken = verifyAccessToken;

