import { db } from '@/db';
import { notifications } from '@/db/schema';

// Match the enum in schema.ts
export type NotificationType =
    | 'mentorship_request'
    | 'mentorship_accepted'
    | 'mentorship_rejected' // New
    | 'mentorship_force_stopped' // New
    | 'job_application_update'
    | 'new_message'
    | 'system_alert'
    | 'job_approved' // New
    | 'job_rejected' // New
    | 'admin_announcement'; // New

export interface CreateNotificationParams {
    recipientId: string;
    type: NotificationType;
    title: string;
    message: string;
    referenceId?: string;
    metadata?: Record<string, any>; // New
}

export async function createNotification({
    recipientId,
    type,
    title,
    message,
    referenceId,
    metadata,
}: CreateNotificationParams) {
    try {
        await db.insert(notifications).values({
            recipientId,
            type,
            title,
            message,
            referenceId,
            metadata: metadata || null,
            isRead: false,
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
        // Clean failure, don't crash main request
    }
}
