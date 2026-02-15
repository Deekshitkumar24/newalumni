import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development-only';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'fallback-refresh-secret';

// Access Token: Short-lived (e.g., 15m)
export const signAccessToken = (payload: object): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' }); // 15 mins
};

// Refresh Token: Long-lived (e.g., 7d)
export const signRefreshToken = (payload: object): string => {
    return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: '7d' }); // 7 days
};

export const verifyAccessToken = (token: string): any => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error: any) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[JWT Debug] Access Token Verification Failed:', {
                tokenPresent: !!token,
                errorName: error.name,
                errorMessage: error.message,
                jwtSecretPresent: !!JWT_SECRET
            });
        }
        return null; // Return null if verification fails
    }
};

export const verifyRefreshToken = (token: string): any => {
    try {
        return jwt.verify(token, REFRESH_TOKEN_SECRET);
    } catch (error: any) {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[JWT Debug] Refresh Token Verification Failed:', {
                tokenPresent: !!token,
                errorName: error.name,
                errorMessage: error.message,
                jwtSecretPresent: !!REFRESH_TOKEN_SECRET
            });
        }
        return null;
    }
};

// Keep original for backward compat if needed, or mapping
export const signToken = signAccessToken;
export const verifyToken = verifyAccessToken;
