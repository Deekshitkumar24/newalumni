'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { initializeData, getActiveSliderImages, getActiveNotices, getUpcomingEvents, getActiveJobs, getStatistics } from '@/lib/data/store';
import { SliderImage, Notice, Event, Job } from '@/types';

export default function HomePage() {
  const [sliderImages, setSliderImages] = useState<SliderImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState({ totalAlumni: 0, totalStudents: 0, totalEvents: 0, activeJobs: 0 });

  useEffect(() => {
    initializeData();
    setSliderImages(getActiveSliderImages());
    setNotices(getActiveNotices().slice(0, 5));
    setUpcomingEvents(getUpcomingEvents().slice(0, 3));
    setRecentJobs(getActiveJobs().slice(0, 3));
    setStats(getStatistics());
  }, []);

  // Auto-rotate slider
  useEffect(() => {
    if (sliderImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [sliderImages.length]);

  return (
    <div className="font-inter text-gray-800">
      {/* Hero Section */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden bg-gray-900">
        {sliderImages.length > 0 ? (
          <>
            {sliderImages.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              >
                {/* Gradient Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

                {/* Fallback color if image fails loading/not real */}
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  {/* Placeholder for real image */}
                  <span className="text-gray-600">Image: {slide.imageUrl}</span>
                </div>

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-md tracking-tight animate-fadeInUp">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl drop-shadow font-light animate-fadeInUp delay-100">
                    Connecting Generations of VJIT Excellence
                  </p>
                  <div className="flex gap-4 animate-fadeInUp delay-200">
                    <Link href="/register" className="bg-[#DAA520] text-black px-8 py-3 rounded-full font-semibold hover:bg-white transition-all shadow-lg transform hover:-translate-y-1">
                      Join the Network
                    </Link>
                    <Link href="/alumni-directory" className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition-all shadow-lg">
                      Find Alumni
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider Dots */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-30">
              {sliderImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-[#DAA520] w-8' : 'bg-white/50 hover:bg-white'}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-[#800000] z-0" />
            <div className="z-10 text-center text-white p-8">
              <h1 className="text-5xl font-bold mb-6">Welcome to VJIT Alumni Portal</h1>
              <p className="text-xl mb-8 opacity-90">Building a Stronger Community Together</p>
              <Link href="/register" className="bg-white text-[#800000] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Statistics Bar - Negative Margin to overlap Hero */}
      <section className="relative z-30 -mt-16 container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
          <StatItem value={stats.totalAlumni} label="Alumni Members" icon="🎓" />
          <StatItem value={stats.totalStudents} label="Current Students" icon="📚" />
          <StatItem value={stats.totalEvents} label="Events Hosted" icon="📅" />
          <StatItem value={stats.activeJobs} label="Career Opportunities" icon="💼" isLast />
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Left Column: Notices & Updates */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-[#800000] text-white px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold tracking-wide">NOTICE BOARD</h2>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">Latest</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                {notices.length > 0 ? (
                  notices.map((notice) => (
                    <Link href="#" key={notice.id} className="block p-5 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${notice.type === 'important' ? 'bg-red-100 text-red-600' :
                            notice.type === 'event' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {notice.type?.toUpperCase() || 'NEWS'}
                        </span>
                        <span className="text-xs text-gray-400">{notice.date}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-[#800000] transition-colors">
                        {notice.title}
                      </h3>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 text-sm">No new notices.</div>
                )}
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                <Link href="#" className="text-xs font-semibold text-[#800000] hover:underline">VIEW ARCHIVE</Link>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
              <h3 className="font-bold text-gray-800 mb-2">Have an Update?</h3>
              <p className="text-sm text-gray-600 mb-4">Share you achievements with the community.</p>
              <Link href="/dashboard/alumni" className="inline-block border border-gray-300 bg-white px-4 py-2 rounded text-sm font-medium hover:border-[#800000] hover:text-[#800000] transition-colors">
                Submit News
              </Link>
            </div>
          </div>

          {/* Right Column: Events & Jobs */}
          <div className="lg:col-span-2 space-y-12">

            {/* Upcoming Events */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-[#DAA520] pl-4">Upcoming Events</h2>
                <Link href="/events" className="text-sm font-semibold text-[#800000] hover:underline">View All &rarr;</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))
                ) : (
                  <div className="col-span-2 bg-gray-50 rounded p-8 text-center text-gray-500">
                    No upcoming events scheduled. check back later.
                  </div>
                )}
              </div>
            </section>

            {/* Jobs */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 border-l-4 border-[#DAA520] pl-4">Career Opportunities</h2>
                <Link href="/jobs" className="text-sm font-semibold text-[#800000] hover:underline">View All &rarr;</Link>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {recentJobs.length > 0 ? (
                  recentJobs.map(job => (
                    <JobRow key={job.id} job={job} />
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">No active job listings.</div>
                )}
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Call to Action */}
      <section className="bg-[#800000] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Proud to be VJITian?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join our official alumni network to mentor students, share opportunities, and stay connected with your alma mater.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="bg-white text-[#800000] px-8 py-3 rounded shadow hover:bg-gray-100 font-semibold transition-colors">
              Register Now
            </Link>
            <Link href="/about" className="border border-white text-white px-8 py-3 rounded hover:bg-white/10 font-semibold transition-colors">
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// Sub-components for cleaner code
function StatItem({ value, label, icon, isLast }: { value: number; label: string; icon: string; isLast?: boolean }) {
  return (
    <div className={`text-center ${!isLast ? '' : ''}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-4xl font-bold text-gray-900 mb-1">{value}+</div>
      <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-40 bg-gray-200 relative overflow-hidden">
        {/* Fallback pattern or image */}
        <div className="absolute inset-0 bg-[#800000]/10 group-hover:bg-[#800000]/20 transition-colors" />
        <div className="absolute bottom-0 left-0 bg-white/90 px-3 py-1 text-xs font-bold text-[#800000] uppercase rounded-tr-lg">
          {event.eventType}
        </div>
      </div>
      <div className="p-5">
        <div className="text-xs font-semibold text-[#DAA520] mb-2 uppercase tracking-wider">{event.date} • {event.time}</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight group-hover:text-[#800000] transition-colors">{event.title}</h3>
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <span className="mr-2">📍</span> {event.venue}
        </div>
        <Link href={`/events/${event.id}`} className="text-sm font-semibold text-[#800000] hover:underline">
          Event Details &rarr;
        </Link>
      </div>
    </div>
  )
}

function JobRow({ job }: { job: Job }) {
  return (
    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 transition-colors group">
      <div>
        <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#800000] transition-colors">{job.title}</h3>
        <div className="text-sm text-gray-600 mt-1">
          <span className="font-medium text-gray-900">{job.company}</span> • {job.location}
        </div>
        <div className="flex gap-2 mt-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{job.type}</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">New</span>
        </div>
      </div>
      <div className="mt-4 md:mt-0">
        <Link href={`/jobs/${job.id}`} className="inline-block border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:border-[#800000] hover:text-[#800000] transition-colors">
          View Job
        </Link>
      </div>
    </div>
  )
}
