import { writeFile, mkdir } from 'fs/promises';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export async function saveImageFile(file: File): Promise<{ url: string; filename: string; mime: string; size: number }> {
    // 1. Validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('INVALID_FILE_TYPE: Only JPG, PNG, and WEBP images are allowed.');
    }

    if (file.size > MAX_SIZE) {
        throw new Error('FILE_TOO_LARGE: Max file size is 5MB.');
    }

    const originalExt = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(originalExt)) {
        throw new Error('INVALID_FILE_EXTENSION: Extension does not match allowed types.');
    }

    // 2. Preparation
    await mkdir(UPLOAD_DIR, { recursive: true });

    const filename = `${uuidv4()}${originalExt}`;
    const filePath = join(UPLOAD_DIR, filename);

    // 3. Write File
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // 4. Return Result
    return {
        url: `/uploads/${filename}`,
        filename,
        mime: file.type,
        size: file.size
    };
}
