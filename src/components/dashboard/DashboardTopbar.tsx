'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { LogOut, User as UserIcon, ChevronDown, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardTopbar() {
    const [user, setUser] = useState<User | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        // Load user from local storage
        const loadUser = () => {
            const userStr = localStorage.getItem('vjit_current_user');
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch (e) {
                    console.error("Failed to parse user", e);
                }
            } else {
                setUser(null);
            }
        };

        loadUser();

        // Listen for storage changes
        window.addEventListener('storage', loadUser);

        return () => {
            window.removeEventListener('storage', loadUser);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('vjit_current_user');
        window.dispatchEvent(new CustomEvent('vjit_auth_change'));
        window.location.href = '/';
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
                    {/* Notifications (Placeholder for now) */}
                    <button className="text-gray-500 hover:text-[#800000] transition-colors relative">
                        <Bell size={20} />
                        {/* <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span> */}
                    </button>

                    {/* User Profile */}
                    <div className="relative user-menu-container">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-3 focus:outline-none group"
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
                                <AvatarImage src={user.avatar || ''} />
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
                                                href="#"
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#800000] rounded-md transition-colors"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="18"
                                                    height="18"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="opacity-70"
                                                >
                                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
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
