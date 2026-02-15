'use client';

import { useState } from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Briefcase, MessageSquare, AlertCircle, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { User } from '@/types';

interface NotificationBellProps {
    currentUser: User | null;
}

export function NotificationBell({ currentUser }: NotificationBellProps) {
    const { notifications, unreadCount, markAsRead, markAllRead, isLoading } = useNotifications();
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        setOpen(false);

        // Navigation Logic
        switch (notification.type) {
            case 'mentorship_request':
            case 'mentorship_accepted':
            case 'mentorship_rejected':
            case 'mentorship_force_stopped':
                // Redirect based on role
                if (currentUser?.role === 'student') router.push('/dashboard/student/mentorship');
                else if (currentUser?.role === 'alumni') router.push('/dashboard/alumni/mentorship');
                else router.push('/dashboard/admin/mentorship');
                break;
            case 'new_message':
                router.push('/dashboard/messages');
                break;
            case 'job_application_update':
            case 'job_approved':
            case 'job_rejected':
                router.push('/jobs');
                break;
            case 'admin_announcement':
            case 'system_alert':
            default:
                // No specific link for now
                break;
        }
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'mentorship_request':
            case 'mentorship_accepted':
                return <Check className="h-4 w-4 text-green-500" />;
            case 'mentorship_rejected':
            case 'mentorship_force_stopped':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'new_message':
                return <MessageSquare className="h-4 w-4 text-blue-500" />;
            case 'job_application_update':
            case 'job_approved':
            case 'job_rejected':
                return <Briefcase className="h-4 w-4 text-purple-500" />;
            default:
                return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-[#800000] hover:bg-red-50">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 text-xs text-[#800000] hover:text-[#600000] hover:bg-red-50"
                            onClick={markAllRead}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {isLoading ? (
                        <div className="p-4 text-center text-xs text-gray-500">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                            <Bell className="h-8 w-8 text-gray-200 mb-2" />
                            <p className="text-sm font-medium text-gray-900">No notifications</p>
                            <p className="text-xs text-gray-500">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    className={cn(
                                        "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3",
                                        !notification.isRead && "bg-blue-50/30"
                                    )}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className={cn(
                                        "mt-1 bg-white p-1.5 rounded-full shadow-sm border border-gray-100 shrink-0",
                                        "h-8 w-8 flex items-center justify-center"
                                    )}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm font-medium text-gray-900 truncate", !notification.isRead && "font-bold")}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-1.5">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className="shrink-0 self-center">
                                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
