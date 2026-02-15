import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { LogOut, User as UserIcon, ChevronDown, Bell, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';

export default function DashboardTopbar() {
    const { user, mutate } = useAuth();
    const { notifications, unreadCount, markAllRead } = useNotifications();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            localStorage.removeItem('vjit_current_user'); // Cleanup legacy just in case
            await mutate(); // Revalidate auth state
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed', error);
            window.location.href = '/login';
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (userMenuOpen && !target.closest('.user-menu-container')) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [userMenuOpen]);

    if (!user) return null;

    const getProfileLink = () => {
        switch (user?.role) {
            case 'student': return '/dashboard/student/profile';
            case 'alumni': return '/dashboard/alumni/profile';
            default: return '#';
        }
    };

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-[72px] flex items-center shadow-sm px-6">
            <div className="flex justify-between items-center w-full">
                {/* Logo Section */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/vjit-logo.png"
                            alt="VJIT Logo"
                            width={180}
                            height={50}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </Link>
                    <div className="hidden md:block w-px h-8 bg-gray-200 mx-2"></div>
                    <span className="hidden md:block text-gray-500 font-medium text-sm tracking-wide uppercase">
                        {user.role} Portal
                    </span>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    {/* Notifications */}
                    <Popover open={notifOpen} onOpenChange={setNotifOpen}>
                        <PopoverTrigger asChild>
                            <button className="text-gray-500 hover:text-[#800000] transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-[#800000]/30 focus-visible:outline-none" aria-label="Notifications">
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 mr-4" align="end">
                            <div className="flex items-center justify-between p-4 border-b">
                                <h4 className="font-semibold text-sm">Notifications</h4>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllRead()}
                                        className="text-xs text-[#800000] hover:underline font-medium"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <ScrollArea className="h-[300px]">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No notifications yet
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        {notifications.map((notif: any) => (
                                            <div
                                                key={notif.id}
                                                className={`p-4 border-b last:border-0 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-red-50/30' : ''}`}
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <h5 className="text-sm font-medium text-gray-900">{notif.title}</h5>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>

                    {/* User Profile */}
                    <div className="relative user-menu-container">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#800000]/30 rounded-lg p-1 group"
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900 leading-tight group-hover:text-[#800000] transition-colors">
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                    {user.email}
                                </p>
                            </div>
                            <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-[#800000]/20 transition-all">
                                <AvatarImage src={user.profileImage || ''} />
                                <AvatarFallback className="bg-[#800000] text-white font-bold">
                                    {user.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {userMenuOpen && (
                            <div className="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-black/5">
                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 md:hidden">
                                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{user.role}</p>
                                </div>

                                <div className="p-1">
                                    {user.role !== 'admin' && (
                                        <>
                                            <Link
                                                href={getProfileLink()}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#800000] rounded-md transition-colors"
                                            >
                                                <UserIcon size={18} className="opacity-70" />
                                                My Profile
                                            </Link>
                                            <Link
                                                href={`/dashboard/${user.role}/settings`}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#800000] rounded-md transition-colors"
                                            >
                                                <Settings size={18} className="opacity-70" />
                                                Settings
                                            </Link>
                                        </>
                                    )}
                                </div>

                                <div className="border-t border-gray-100 p-1 mt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <LogOut size={18} className="opacity-70" />
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
