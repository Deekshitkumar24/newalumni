import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    return (
        <footer className="bg-[#111827] text-white pt-16 pb-8 border-t-4 border-[#800000]">
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
                                    <Link href={href} className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block">
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
                                <Link href="/register" className="text-gray-400 hover:text-white transition-colors">
                                    Member Registration
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                                    Login
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard/student" className="text-gray-400 hover:text-white transition-colors">
                                    Student Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard/alumni" className="text-gray-400 hover:text-white transition-colors">
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
                                <a href="mailto:alumni@vjit.ac.in" className="hover:text-white transition-colors">
                                    alumni@vjit.ac.in
                                </a>
                            </li>

                            {/* Socials */}
                            <li className="pt-4">
                                <div className="flex gap-4">
                                    {['facebook', 'twitter', 'linkedin', 'instagram'].map((social) => (
                                        <a
                                            key={social}
                                            href={`https://${social}.com`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-[#800000] hover:text-white transition-all transform hover:-translate-y-1"
                                        >
                                            <span className="sr-only">{social}</span>
                                            <i className={`icon-${social} not-italic text-lg`}>•</i>
                                        </a>
                                    ))}
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 mt-12 pt-8">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} VJIT Alumni Association. All Rights Reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <a href="https://vjit.edu.in" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">VJIT Main Website</a>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
