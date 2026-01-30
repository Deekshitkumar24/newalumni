import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';

export default function RegisterPage() {
    return (
        <div>
            <Breadcrumb items={[{ label: 'Register' }]} />

            <div className="container mx-auto px-4 py-10">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold text-[#800000] mb-6 text-center">
                        Register for VJIT Alumni Portal
                    </h1>

                    <p className="text-gray-600 text-center mb-8">
                        Join the VJIT Alumni network to connect with fellow alumni, find mentors,
                        explore job opportunities, and stay updated with events.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Student Registration */}
                        <div className="border border-gray-200 bg-white">
                            <div className="bg-[#800000] text-white px-6 py-4">
                                <h2 className="text-lg font-semibold">I am a Student</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 text-sm mb-6">
                                    Current VJIT students can register to access the alumni directory,
                                    request mentorship, and explore career opportunities.
                                </p>
                                <ul className="text-sm text-gray-600 mb-6 space-y-2">
                                    <li>✓ Browse Alumni Directory</li>
                                    <li>✓ Request Mentorship</li>
                                    <li>✓ View Job Postings</li>
                                    <li>✓ Connect with Batchmates</li>
                                    <li>✓ Register for Events</li>
                                </ul>
                                <Link
                                    href="/register/student"
                                    className="block text-center bg-[#800000] text-white py-3 hover:bg-[#660000]"
                                >
                                    Register as Student
                                </Link>
                            </div>
                        </div>

                        {/* Alumni Registration */}
                        <div className="border border-gray-200 bg-white">
                            <div className="bg-[#DAA520] text-[#333] px-6 py-4">
                                <h2 className="text-lg font-semibold">I am an Alumni</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 text-sm mb-6">
                                    VJIT graduates can register to reconnect with batchmates,
                                    mentor students, and share job opportunities.
                                </p>
                                <ul className="text-sm text-gray-600 mb-6 space-y-2">
                                    <li>✓ Reconnect with Batchmates</li>
                                    <li>✓ Mentor Students</li>
                                    <li>✓ Post Job Opportunities</li>
                                    <li>✓ Attend Alumni Events</li>
                                    <li>✓ Share Success Stories</li>
                                </ul>
                                <Link
                                    href="/register/alumni"
                                    className="block text-center bg-[#DAA520] text-[#333] py-3 hover:bg-[#f0c75e]"
                                >
                                    Register as Alumni
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-600">
                        <p>Already have an account? <Link href="/login" className="text-[#800000] hover:underline">Login here</Link></p>
                        <p className="mt-2 text-xs">Note: All registrations require admin approval before activation.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
