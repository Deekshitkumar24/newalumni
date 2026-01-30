'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { User } from '@/types';

export default function Header() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        // Check for logged in user
        const userStr = localStorage.getItem('vjit_current_user');
        if (userStr) {
            try {
                setCurrentUser(JSON.parse(userStr));
            } catch {
                setCurrentUser(null);
            }
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
            {/* Top Bar */}
            <div className="bg-[#800000] text-white text-xs md:text-sm py-2">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <span className="hidden md:inline font-medium tracking-wide">Vidya Jyothi Institute of Technology</span>
                        <span className="md:hidden font-medium">VJIT Hyderabad</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <a href="https://vjit.edu.in" target="_blank" rel="noopener noreferrer" className="hover:text-gold-200 hover:underline transition-colors">
                            Main Website
                        </a>
                        <span className="text-white/50">|</span>
                        <a href="mailto:alumni@vjit.ac.in" className="hover:text-gold-200 hover:underline transition-colors">
                            alumni@vjit.ac.in
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="bg-white">
                <div className="container mx-auto px-4 py-3 md:py-4">
                    <div className="flex justify-between items-center">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <Image
                                src="/vjit-logo.png"
                                alt="VJIT Logo"
                                width={240}
                                height={70}
                                className="h-12 md:h-16 w-auto transition-transform group-hover:scale-105"
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
                                    className="text-gray-700 hover:text-[#800000] font-medium text-[15px] tracking-wide relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-[#800000] after:transition-all hover:after:w-full"
                                >
                                    {label}
                                </Link>
                            ))}

                            {currentUser ? (
                                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-200">
                                    <Link
                                        href={getDashboardLink()}
                                        className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 font-medium transition-colors border border-gray-200"
                                    >
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-[#800000] hover:text-[#660000] font-medium text-sm"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 ml-4">
                                    <Link
                                        href="/login"
                                        className="text-gray-600 hover:text-[#800000] font-medium text-[15px]"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="bg-[#800000] text-white px-5 py-2.5 rounded shadow-sm hover:bg-[#660000] hover:shadow-md transition-all font-medium tracking-wide"
                                    >
                                        Join Community
                                    </Link>
                                </div>
                            )}
                        </nav>

                        {/* Mobile Menu Button */}
                        <button
                            className="lg:hidden text-[#800000] text-2xl p-2"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? '✕' : '☰'}
                        </button>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <nav className="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4 animate-fadeIn">
                            <div className="flex flex-col gap-2">
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
                                        className="text-gray-700 hover:text-[#800000] hover:bg-gray-50 px-4 py-3 rounded-md font-medium"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {label}
                                    </Link>
                                ))}

                                <div className="border-t border-gray-200 pt-4 mt-2 px-4 flex flex-col gap-3">
                                    {currentUser ? (
                                        <>
                                            <Link
                                                href={getDashboardLink()}
                                                className="bg-[#800000] text-white px-4 py-3 rounded-md text-center font-medium"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                Go to Dashboard
                                            </Link>
                                            <button
                                                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                                className="text-[#800000] py-2 text-center font-medium"
                                            >
                                                Sign Out
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link
                                                href="/login"
                                                className="border border-gray-300 text-gray-700 px-4 py-3 rounded-md text-center font-medium hover:bg-gray-50"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                Login
                                            </Link>
                                            <Link
                                                href="/register"
                                                className="bg-[#800000] text-white px-4 py-3 rounded-md text-center font-medium shadow-sm"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                Join Community
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </nav>
                    )}
                </div>
            </div>
        </header>
    );
}
