import Breadcrumb from '@/components/layout/Breadcrumb';

export default function AboutPage() {
    return (
        <div>
            <Breadcrumb items={[{ label: 'About' }]} />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-[#800000] mb-6 pb-3 border-b-2 border-[#800000]">
                    About VJIT Alumni Association
                </h1>

                <div className="max-w-4xl">
                    {/* Introduction */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-[#800000] mb-3">Our Mission</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            The VJIT Alumni Association serves as a vital link between Vidya Jyothi Institute of Technology
                            and its graduates. Our mission is to foster a strong, engaged community of alumni who contribute
                            to the growth and development of their alma mater while supporting the next generation of engineers.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            We strive to create meaningful connections between alumni and current students through mentorship
                            programs, career opportunities, networking events, and collaborative initiatives that benefit
                            the entire VJIT community.
                        </p>
                    </section>

                    {/* Vision */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-[#800000] mb-3">Our Vision</h2>
                        <p className="text-gray-600 leading-relaxed">
                            To build a vibrant, globally connected network of VJIT alumni who actively participate in
                            shaping the future of engineering education and contribute to the socio-economic development
                            of the nation through innovation, entrepreneurship, and knowledge sharing.
                        </p>
                    </section>

                    {/* Objectives */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-[#800000] mb-3">Our Objectives</h2>
                        <ul className="list-disc list-inside text-gray-600 space-y-2">
                            <li>Foster lifelong relationships among alumni and with the institution</li>
                            <li>Provide mentorship opportunities for current students</li>
                            <li>Share career opportunities and industry insights</li>
                            <li>Organize events, reunions, and networking sessions</li>
                            <li>Support institution development through alumni contributions</li>
                            <li>Create a platform for knowledge exchange and collaboration</li>
                        </ul>
                    </section>

                    {/* About VJIT */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-[#800000] mb-3">About VJIT</h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Vidya Jyothi Institute of Technology (VJIT), established in 1997, is an Autonomous Institution
                            affiliated to JNTUH and approved by AICTE. Located in Hyderabad, VJIT has been a center of
                            excellence in engineering education for over two decades.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            The institute offers undergraduate and postgraduate programs in various engineering disciplines
                            and has produced thousands of successful engineers who are making significant contributions
                            in their respective fields across the globe.
                        </p>
                    </section>

                    {/* Contact */}
                    <section className="bg-[#f5f5f5] border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-[#800000] mb-3">Contact Alumni Cell</h2>
                        <div className="text-gray-600 space-y-2">
                            <p><strong>Address:</strong> Vidya Jyothi Institute of Technology, Aziznagar Gate, C.B. Post, Hyderabad - 500 075, Telangana, India</p>
                            <p><strong>Phone:</strong> 040-23044944 / 23042758</p>
                            <p><strong>Email:</strong> alumni@vjit.ac.in</p>
                            <p><strong>Website:</strong> <a href="https://vjit.edu.in" target="_blank" rel="noopener noreferrer" className="text-[#800000] hover:underline">www.vjit.edu.in</a></p>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
