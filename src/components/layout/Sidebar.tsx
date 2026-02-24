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
    School
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
    user: any; // Using any for now to support Student | Alumni | Admin types flexibly
}

export default function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('vjit_current_user');
        window.dispatchEvent(new CustomEvent('vjit_auth_change'));
        window.location.href = '/';
    };

    const isActive = (path: string) => pathname === path;

    const studentMenu = [
        { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard },
        { label: 'My Batch', href: '/dashboard/student/my-batch', icon: Users },
        { label: 'Find Mentors', href: '/dashboard/student/mentorship', icon: GraduationCap },
        { label: 'Jobs & Internships', href: '/jobs', icon: Briefcase },
        { label: 'Events', href: '/events', icon: Calendar },
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'My Profile', href: '/dashboard/student/profile', icon: User },
    ];

    const alumniMenu = [
        { label: 'Dashboard', href: '/dashboard/alumni', icon: LayoutDashboard },
        { label: 'My Batch', href: '/dashboard/alumni/my-batch', icon: Users },
        { label: 'Mentorship Hub', href: '/dashboard/alumni/mentorship', icon: School },
        { label: 'Post Jobs', href: '/dashboard/alumni/jobs', icon: Briefcase },
        { label: 'Events', href: '/events', icon: Calendar },
        { label: 'Messages', href: '/messages', icon: MessageSquare },
        { label: 'My Profile', href: '/dashboard/alumni/profile', icon: User },
    ];

    const adminMenu = [
        { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        { label: 'User Management', href: '/dashboard/admin/users', icon: Users },
        { label: 'Event Management', href: '/dashboard/admin/events', icon: Calendar },
        { label: 'Job Moderation', href: '/dashboard/admin/jobs', icon: Briefcase },
        { label: 'Mentorship Oversight', href: '/dashboard/admin/mentorships', icon: School },
        { label: 'Gallery', href: '/dashboard/admin/gallery', icon: ImageIcon },
        { label: 'Slider Manager', href: '/dashboard/admin/slider', icon: ImageIcon },
        { label: 'Notices', href: '/dashboard/admin/notices', icon: ShieldAlert },
    ];

    let menuItems: { label: string; href: string; icon: any }[] = [];
    let roleLabel = '';

    if (user?.role === 'student') {
        menuItems = studentMenu;
        roleLabel = 'Student';
    } else if (user?.role === 'alumni') {
        menuItems = alumniMenu;
        roleLabel = 'Alumni';
    } else if (user?.role === 'admin') {
        menuItems = adminMenu;
        roleLabel = 'Administrator';
    }

    // Do not render sidebar on mobile by default (controlled by layout or drawer in future)
    // For this MVP step, we will hide it on mobile and rely on Navbar for mobile nav.
    // The requirement says "Collapsible on mobile".
    // We'll stick to 'hidden lg:flex' for now to fit the layout.

    return (
        <aside className="hidden lg:flex flex-col w-[260px] bg-[#f8fafc] border-r border-gray-200 h-[calc(100vh-72px)] sticky top-[72px] overflow-y-auto">
            {/* User Identity Section */}
            <div className="p-6 border-b border-gray-200 bg-white/50 backdrop-blur-sm">
                <div className="flex flex-col items-center text-center">
                    <Avatar className="h-16 w-16 mb-3 border-2 border-gray-100 shadow-sm">
                        <AvatarImage src={user?.avatar || ''} alt={user?.name} className="object-cover" />
                        <AvatarFallback className="bg-[#1a1a2e] text-white text-xl font-bold">
                            {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 bg-gray-100 px-2 py-0.5 rounded-full">
                        {roleLabel}
                    </span>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {menuItems.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group text-sm font-medium",
                                active
                                    ? "bg-[#800000]/5 text-[#800000] border-l-4 border-[#800000] font-semibold pl-3 shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent"
                            )}
                        >
                            <Icon
                                size={20}
                                className={cn(
                                    "transition-colors",
                                    active ? "text-[#800000]" : "text-gray-400 group-hover:text-gray-600"
                                )}
                                strokeWidth={active ? 2.5 : 2}
                            />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-all duration-200 group"
                >
                    <LogOut size={20} className="text-gray-400 group-hover:text-red-600 transition-colors" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
