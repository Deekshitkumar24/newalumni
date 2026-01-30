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
            <div className="bg-[#1e293b] text-white text-xs md:text-sm py-2">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex gap-4 items-center text-xs md:text-sm">
                        <a href="https://vjit.edu.in" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#DAA520] hover:underline transition-colors font-medium">
                            Main Website
                        </a>
                        <span className="text-white/50">|</span>
                        <a href="mailto:alumni@vjit.ac.in" className="text-white hover:text-[#DAA520] hover:underline transition-colors font-medium">
                            alumni@vjit.ac.in
                        </a>
                    </div>
                    <div className="flex gap-3 items-center">
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#DAA520] transition-colors"><svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#DAA520] transition-colors"><svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg></a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#DAA520] transition-colors"><svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg></a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#DAA520] transition-colors"><svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.011-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg></a>
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
                                        className="bg-[#1e293b] text-white border border-[#1e293b] px-5 py-2.5 rounded hover:bg-[#0f172a] transition-all font-medium tracking-wide shadow-sm"
                                    >
                                        Member Login
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="bg-[#DAA520] text-[#1e293b] px-5 py-2.5 rounded shadow-sm hover:bg-[#b8860b] hover:text-white transition-all font-bold tracking-wide border border-[#DAA520]"
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
