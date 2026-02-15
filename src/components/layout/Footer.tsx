import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-[#1e293b] text-white pt-16 pb-8 border-t-4 border-[#DAA520]">
            {/* Main Footer */}
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* College Info */}
                    <div className="space-y-6">
                        <div className="bg-white p-3 rounded w-fit">
                            <Image
                                src="/vjit-logo.png"
                                alt="VJIT Logo"
                                width={200}
                                height={60}
                                className="h-10 w-auto"
                            />
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Vidya Jyothi Institute of Technology is an Autonomous Institution, Approved by AICTE, New Delhi & Permanently Affiliated to JNTUH.
                        </p>
                        <div className="space-y-2 text-sm text-gray-400">
                            <p>Aziznagar Gate, C.B. Post,</p>
                            <p>Hyderabad - 500 075, Telangana</p>
                        </div>
                    </div>

                    {/* Quick Link Groups */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-[#DAA520] tracking-wide">Quick Access</h3>
                        <ul className="space-y-3 text-sm">
                            {[
                                ['Home', '/'],
                                ['Alumni Directory', '/alumni-directory'],
                                ['Events', '/events'],
                                ['Job Portal', '/jobs'],
                                ['Gallery', '/gallery'],
                                ['About Association', '/about'],
                            ].map(([label, href]) => (
                                <li key={href}>
                                    <Link href={href} className="!text-gray-300 hover:!text-white transition-colors hover:translate-x-1 inline-block">
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Portals */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-[#DAA520] tracking-wide">Portals</h3>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/register" className="!text-gray-300 hover:!text-white transition-colors">
                                    Member Registration
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="!text-gray-300 hover:!text-white transition-colors">
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard/student" className="!text-gray-300 hover:!text-white transition-colors">
                                    Student Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard/alumni" className="!text-gray-300 hover:!text-white transition-colors">
                                    Alumni Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-[#DAA520] tracking-wide">Get in Touch</h3>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li className="flex items-start gap-3">
                                <span className="text-xl">📞</span>
                                <div>
                                    <p>040-23044944</p>
                                    <p>040-23042758</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-xl">✉️</span>
                                <a href="mailto:alumni@vjit.ac.in" className="!text-gray-300 hover:!text-white transition-colors">
                                    alumni@vjit.ac.in
                                </a>
                            </li>

                            {/* Socials */}
                            <li className="pt-4">
                                <div className="flex gap-4">
                                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center !text-white hover:bg-[#DAA520] hover:-translate-y-1 transition-all focus-visible:ring-2 focus-visible:ring-[#DAA520] focus-visible:outline-none">
                                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                    </a>
                                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center !text-white hover:bg-[#DAA520] hover:-translate-y-1 transition-all focus-visible:ring-2 focus-visible:ring-[#DAA520] focus-visible:outline-none">
                                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                                    </a>
                                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center !text-white hover:bg-[#DAA520] hover:-translate-y-1 transition-all focus-visible:ring-2 focus-visible:ring-[#DAA520] focus-visible:outline-none">
                                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                                    </a>
                                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center !text-white hover:bg-[#DAA520] hover:-translate-y-1 transition-all focus-visible:ring-2 focus-visible:ring-[#DAA520] focus-visible:outline-none">
                                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.011-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 mt-12 pt-8 pb-8">
                <div className="container mx-auto px-4">
                    {/* Copyright & Links */}
                    <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                        <p>&copy; {new Date().getFullYear()} VJIT Alumni Association. All Rights Reserved.</p>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <a href="https://vjit.edu.in" target="_blank" rel="noopener noreferrer" className="!text-gray-300 hover:!text-white transition-colors">VJIT Main Website</a>
                            <Link href="/privacy" className="!text-gray-300 hover:!text-white transition-colors">Privacy Policy</Link>
                            <Link href="/terms" className="!text-gray-300 hover:!text-white transition-colors">Terms of Use</Link>
                        </div>
                    </div>

                    {/* Developer Credit */}
                    <div className="mt-8 pt-6 border-t border-gray-800/50 flex justify-center md:justify-end">
                        <div className="flex items-center gap-2 text-base text-gray-500">
                            <span>Developed & Maintained by</span>
                            <a
                                href="https://www.linkedin.com/in/deekshit-kumar-46793a330/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-1.5 text-white hover:text-[#DAA520] transition-colors font-semibold focus:outline-none focus:underline"
                            >
                                Deekshit Kumar K.
                                <span className="bg-[#0077b5] text-white rounded-[2px] p-[1px] w-4 h-4 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity" title="LinkedIn">
                                    <svg fill="currentColor" viewBox="0 0 24 24" className="w-3 h-3"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
