'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { User } from '@/types';
import { ChevronDown, LayoutDashboard, User as UserIcon, LogOut, X, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    const checkUserState = useCallback(() => {
        const userStr = localStorage.getItem('vjit_current_user');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch {
                setCurrentUser(null);
            }
        } else {
            setCurrentUser(null);
        }
    }, []);

    useEffect(() => {
        checkUserState();
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'vjit_current_user') {
                checkUserState();
            }
        };
        const handleAuthChange = () => {
            checkUserState();
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('vjit_auth_change', handleAuthChange);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('vjit_auth_change', handleAuthChange);
        };
    }, [pathname, checkUserState]);

    const handleLogout = () => {
        localStorage.removeItem('vjit_current_user');
        setCurrentUser(null);
        window.location.href = '/';
    };

    const getDashboardLink = () => {
        if (!currentUser) return '/login';
        switch (currentUser.role) {
            case 'admin': return '/dashboard/admin';
            case 'alumni': return '/dashboard/alumni';
            case 'student': return '/dashboard/student';
            default: return '/login';
        }
    };

    const isActive = (path: string) => {
        if (path === '/' && pathname !== '/') return false;
        return pathname?.startsWith(path);
    };

    const getProfileLink = () => {
        if (!currentUser) return '#';
        switch (currentUser.role) {
            case 'alumni': return '/dashboard/alumni/profile';
            case 'student': return '/dashboard/student/profile';
            default: return '/dashboard/student/profile';
        }
    };

    const [userMenuOpen, setUserMenuOpen] = useState(false);

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

    // STRICT: Do not render Public Header on Dashboard routes (Return AFTER all hooks)
    if (pathname?.startsWith('/dashboard')) return null;

    return (
        <header className={`sticky top-0 z-50 bg-white border-b border-gray-200 h-[72px] flex items-center shadow-sm transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
            <div className="w-full px-6">
                <div className="flex justify-between items-center w-full">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <Image
                            src="/vjit-logo.png"
                            alt="VJIT Logo"
                            width={240}
                            height={70}
                            className="h-14 w-auto object-contain"
                            priority
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8">
                        {[
                            ['Home', '/'],
                            ['About', '/about'],
                            ['Events', '/events'],
                            ['Jobs', '/jobs'],
                            ['Gallery', '/gallery'],
                            ['Directory', '/alumni-directory'],
                        ].map(([label, href]) => (
                            <Link
                                key={href}
                                href={href}
                                className={`text-[15px] font-medium transition-colors duration-200 ${isActive(href)
                                    ? 'text-[#800000] font-bold'
                                    : 'text-gray-600 hover:text-[#800000]'
                                    }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right Section */}
                    <div className="hidden lg:flex items-center">
                        {currentUser ? (
                            <div className="relative user-menu-container">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-[#800000]/20 rounded-full p-1 transition-all"
                                    aria-expanded={userMenuOpen}
                                    aria-haspopup="true"
                                >
                                    <Avatar className="h-10 w-10 border-2 border-transparent hover:border-[#800000]/20 transition-all">
                                        <AvatarImage src={currentUser.avatar || ''} alt={currentUser.name} className="object-cover" />
                                        <AvatarFallback className="bg-[#800000] text-white font-bold text-lg">
                                            {currentUser.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left hidden xl:block">
                                        <p className="text-sm font-bold text-gray-900 leading-tight">{currentUser.name}</p>
                                    </div>
                                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-3 w-60 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right ring-1 ring-black/5">
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                            <p className="text-sm font-bold text-gray-900 truncate">{currentUser.name}</p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{currentUser.email}</p>
                                        </div>

                                        <div className="p-1.5 space-y-0.5">
                                            <Link
                                                href={getDashboardLink()}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#800000] rounded-md transition-colors"
                                            >
                                                <LayoutDashboard size={18} className="opacity-70" />
                                                Dashboard
                                            </Link>

                                            {currentUser.role !== 'admin' && (
                                                <Link
                                                    href={getProfileLink()}
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#800000] rounded-md transition-colors"
                                                >
                                                    <UserIcon size={18} className="opacity-70" />
                                                    My Profile
                                                </Link>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-100 p-1.5 mt-1">
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
                        ) : (
                            <div className="flex items-center gap-4 ml-8">
                                <Link
                                    href="/login"
                                    className="bg-white text-[#800000] px-6 py-2.5 rounded hover:bg-red-50 transition-all font-semibold text-[15px] tracking-wide hover:shadow-md hover:border-black active:scale-95 transition-all shadow-sm"
                                >
                                    Member Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-white text-[#1a1a1a]  px-6 py-2.5 rounded font-bold text-[15px] tracking-wide hover:shadow-md hover:border-black active:scale-95 transition-all shadow-sm"
                                >
                                    Join Community
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="lg:hidden text-[#800000] p-2 -mr-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <X size={28} />
                        ) : (
                            <Menu size={28} />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <nav className="lg:hidden mt-4 pb-6 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-5 duration-200">
                        <div className="flex flex-col space-y-1">
                            {[
                                ['Home', '/'],
                                ['About', '/about'],
                                ['Events', '/events'],
                                ['Jobs', '/jobs'],
                                ['Gallery', '/gallery'],
                                ['Directory', '/alumni-directory'],
                            ].map(([label, href]) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${isActive(href)
                                        ? 'bg-[#800000]/5 text-[#800000] font-bold'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-[#800000]'
                                        }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {label}
                                </Link>
                            ))}

                            <div className="border-t border-gray-100 pt-5 mt-2 px-4 flex flex-col gap-4">
                                {currentUser ? (
                                    <>
                                        <div className="flex items-center gap-4 mb-2">
                                            <Avatar className="h-12 w-12 border-2 border-gray-100 shadow-sm">
                                                <AvatarImage src={currentUser.avatar || ''} alt={currentUser.name} className="object-cover" />
                                                <AvatarFallback className="bg-[#800000] text-white text-xl font-bold">
                                                    {currentUser.name?.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">{currentUser.name}</p>
                                                <p className="text-sm text-gray-500">{currentUser.email}</p>
                                            </div>
                                        </div>

                                        <Link
                                            href={getDashboardLink()}
                                            className="bg-[#800000] text-white px-4 py-3 rounded-lg text-center font-bold shadow-sm"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Go to Dashboard
                                        </Link>

                                        {currentUser.role !== 'admin' && (
                                            <Link
                                                href={getProfileLink()}
                                                className="border border-gray-200 text-gray-700 px-4 py-3 rounded-lg text-center font-medium hover:bg-gray-50"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                My Profile
                                            </Link>
                                        )}

                                        <button
                                            onClick={handleLogout}
                                            className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            Log Out
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <Link
                                            href="/login"
                                            className="bg-white text-[#800000] border border-[#800000] px-4 py-3 rounded-lg text-center font-semibold hover:bg-red-50"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Member Login
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="bg-white text-[#1a1a1a] border-2 border-gray-800 px-4 py-3 rounded-lg text-center font-bold hover:shadow-md hover:border-black active:scale-95 transition-all shadow-sm"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            Join Community
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}
