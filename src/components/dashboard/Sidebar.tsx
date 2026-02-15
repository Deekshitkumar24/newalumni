'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Briefcase,
    Calendar,
    MessageSquare,
    User,
    FileText,
    ShieldAlert,
    Image as ImageIcon,
    LogOut,
    GraduationCap,
    School,
    ChevronLeft,
    ChevronRight,
    Search,
    Flag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/hooks/useAuth';

export default function Sidebar() {
    const { user, mutate } = useAuth();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const savedState = localStorage.getItem('vjit_sidebar_collapsed');

        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setCollapsed(true);
                setIsMobile(true);
            } else {
                setIsMobile(false);
                if (savedState) {
                    setCollapsed(savedState === 'true');
                } else {
                    setCollapsed(false);
                }
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('vjit_sidebar_collapsed', String(newState));
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            localStorage.removeItem('vjit_current_user');
            await mutate();
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed', error);
            window.location.href = '/login';
        }
    };

    const isActive = (path: string) => pathname === path;

    const studentMenu = [
        { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
        { label: 'My Batch', href: '/dashboard/student/my-batch', icon: Users },
        { label: 'Find Mentors', href: '/dashboard/student/mentorship', icon: GraduationCap },
        { label: 'Jobs & Internships', href: '/dashboard/jobs', icon: Briefcase },
        { label: 'Events', href: '/dashboard/events', icon: Calendar },
        { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
        { label: 'My Profile', href: '/dashboard/student/profile', icon: User },
    ];

    const alumniMenu = [
        { label: 'Dashboard', href: '/dashboard/alumni', icon: LayoutDashboard },
        { label: 'My Batch', href: '/dashboard/alumni/my-batch', icon: Users },
        { label: 'Mentorship Hub', href: '/dashboard/alumni/mentorship', icon: School },
        { label: 'Post Jobs', href: '/dashboard/alumni/jobs', icon: Briefcase },
        { label: 'Events', href: '/dashboard/events', icon: Calendar },
        { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
        { label: 'My Profile', href: '/dashboard/alumni/profile', icon: User },
    ];

    const adminMenu = [
        { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        { label: 'User Management', href: '/dashboard/admin/users', icon: Users },
        { label: 'Event Management', href: '/dashboard/admin/events', icon: Calendar },
        { label: 'Job Moderation', href: '/dashboard/admin/jobs', icon: Briefcase },
        { label: 'Mentorship Oversight', href: '/dashboard/admin/mentorships', icon: School },
        { label: 'Reports', href: '/dashboard/admin/reports', icon: Flag },
        { label: 'Slider Management', href: '/dashboard/admin/slider', icon: ImageIcon },
        { label: 'Gallery', href: '/dashboard/admin/gallery', icon: ImageIcon },
        { label: 'Notices', href: '/dashboard/admin/notices', icon: ShieldAlert },
    ];

    let menuItems: any[] = [];
    if (user?.role === 'student') menuItems = studentMenu;
    else if (user?.role === 'alumni') menuItems = alumniMenu;
    else if (user?.role === 'admin') menuItems = adminMenu;

    // Optional: Return simplified skeleton if user is loading? 
    // For now, it will just render empty or default until user loads.

    return (
        <TooltipProvider>
            <aside
                className={cn(
                    "flex flex-col bg-white border-r border-gray-200 h-[calc(100vh-72px)] sticky top-[72px] transition-all duration-300 ease-in-out z-40 flex-shrink-0 overflow-hidden",
                    collapsed ? "w-[80px]" : "w-[260px]",
                )}
            >
                {/* Collapse Toggle */}
                <div className="absolute -right-3 top-6 z-50">
                    <button
                        onClick={toggleSidebar}
                        className="bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:bg-gray-50 text-gray-500 hover:text-[#800000] transition-colors focus-visible:ring-2 focus-visible:ring-[#800000]/30 focus-visible:outline-none min-h-[28px] min-w-[28px] flex items-center justify-center"
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                </div>

                {/* User Identity Section */}
                <div className={cn(
                    "border-b border-gray-100 transition-all duration-300",
                    collapsed ? "p-4 flex justify-center items-center" : "p-6"
                )}>
                    {collapsed ? (
                        <Avatar className="h-10 w-10 border border-gray-100 cursor-pointer" onClick={toggleSidebar}>
                            <AvatarImage src={user?.profileImage || ''} />
                            <AvatarFallback className="bg-[#1a1a2e] text-white font-bold text-sm">
                                {user?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-gray-100 shadow-sm">
                                <AvatarImage src={user?.profileImage || ''} alt={user?.name} className="object-cover" />
                                <AvatarFallback className="bg-[#1a1a2e] text-white text-lg font-bold">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="overflow-hidden">
                                <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">
                                    {user?.name || 'User'}
                                </h3>
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-0.5 truncate">
                                    {user?.role}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Section */}
                <nav className={cn(
                    "flex-1 py-6 overflow-y-auto custom-scrollbar",
                    collapsed ? "px-0 flex flex-col items-center space-y-2" : "px-3 space-y-1"
                )}>
                    {menuItems.map((item) => {
                        const active = isActive(item.href);
                        const Icon = item.icon;

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center justify-center h-10 w-10 mx-auto rounded-md transition-all duration-200 group relative focus-visible:ring-2 focus-visible:ring-[#800000]/30 focus-visible:outline-none",
                                                active
                                                    ? "bg-[#800000]/10 text-[#800000]"
                                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                            )}
                                        >
                                            {active && (
                                                <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#800000] rounded-r-sm"></div>
                                            )}
                                            <Icon
                                                size={20}
                                                strokeWidth={active ? 2.5 : 2}
                                                className="flex-shrink-0"
                                            />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-[#1a1a2e] text-white border-0 font-medium ml-2">
                                        <p>{item.label}</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group text-sm font-medium relative overflow-hidden focus-visible:ring-2 focus-visible:ring-[#800000]/30 focus-visible:outline-none",
                                    active
                                        ? "bg-[#800000]/10 text-[#800000] font-semibold"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                                )}
                            >
                                {active && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#800000] rounded-r-sm"></div>
                                )}
                                <Icon
                                    size={20}
                                    className={cn(
                                        "transition-colors flex-shrink-0",
                                        active ? "text-[#800000]" : "text-gray-400 group-hover:text-gray-600"
                                    )}
                                    strokeWidth={active ? 2.5 : 2}
                                />
                                <span className="truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    {collapsed ? (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center w-full h-10 rounded-md text-gray-500 hover:bg-red-50 hover:text-red-700 transition-colors focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:outline-none"
                                >
                                    <LogOut size={20} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-red-900 text-white border-0 font-medium ml-2">
                                <p>Sign Out</p>
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-all duration-200 group focus-visible:ring-2 focus-visible:ring-red-500/30 focus-visible:outline-none"
                        >
                            <LogOut size={20} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                            Sign Out
                        </button>
                    )}
                </div>
            </aside>
        </TooltipProvider>
    );
}
