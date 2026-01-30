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
    <div className="font-inter text-gray-800 bg-[#FCFCFD]">
      {/* Hero Section */}
      <section className="relative h-[600px] overflow-hidden bg-gray-900 border-b-4 border-[#DAA520]">
        {sliderImages.length > 0 ? (
          <>
            {sliderImages.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />

                {/* Image Placeholder */}
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-600 font-mono text-sm tracking-widest uppercase">Display Image: {slide.imageUrl}</span>
                </div>

                <div className="absolute inset-0 z-20 container mx-auto px-4 flex flex-col justify-center">
                  <div className="max-w-2xl animate-fadeInUp">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg font-serif">
                      {slide.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-100 mb-8 font-light leading-relaxed drop-shadow-md border-l-4 border-[#DAA520] pl-6 py-2 bg-black/10 backdrop-blur-sm rounded-r-lg">
                      Fostering a lifelong connection between the Institute and its Alumni.
                    </p>
                    <div className="flex gap-4 pt-4">
                      <Link href="/register" className="bg-[#DAA520] text-[#1a1a1a] px-8 py-3.5 rounded text-sm uppercase tracking-wider font-bold hover:bg-white hover:text-[#800000] transition-all shadow-lg transform hover:-translate-y-1">
                        Join Community
                      </Link>
                      <Link href="/alumni-directory" className="border-2 border-white text-white px-8 py-3.5 rounded text-sm uppercase tracking-wider font-bold hover:bg-white hover:text-[#1a1a1a] transition-all shadow-lg">
                        Search Directory
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="absolute inset-0 bg-[#800000] flex items-center justify-center relative z-0">
            <div className="text-white text-center">
              <h1 className="text-5xl font-bold mb-4 font-serif">Welcome to VJIT Alumni Association</h1>
              <p className="text-xl opacity-90">Connecting Excellence</p>
            </div>
          </div>
        )}

        {/* Slider Controls */}
        <div className="absolute bottom-8 right-8 z-30 flex gap-2">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 transition-all duration-300 rounded-full ${index === currentSlide ? 'bg-[#DAA520] w-8' : 'bg-white/50 w-4 hover:bg-white'}`}
            />
          ))}
        </div>
      </section>

      <section className="relative z-30 -mt-20 container mx-auto px-4 mb-20">
        <div className="bg-white rounded shadow-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100 border-t-4 border-[#1e293b]">
          <StatItem value={stats.totalAlumni} label="Alumni" icon="img:grad_cap" />
          <StatItem value={stats.totalStudents} label="Students" icon="img:book" />
          <StatItem value={stats.totalEvents} label="Events" icon="img:calendar" />
          <StatItem value={stats.activeJobs} label="Opportunities" icon="img:briefcase" isLast />
        </div>
      </section>

      {/* Welcome & President's Message */}
      <section className="container mx-auto px-4 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-block border-b-2 border-[#DAA520] pb-1 mb-2">
              <span className="text-[#1e293b] font-bold text-sm tracking-widest uppercase">From the President's Desk</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif leading-tight">
              Strengthening Bonds,<br />Building Future.
            </h2>
            <div className="prose prose-lg text-gray-600">
              <p>
                "The VJIT Alumni Association acts as a bridge between the illustrious alumni and their alma mater. We take immense pride in the achievements of our graduates who are making their mark across the globe."
              </p>
              <p>
                We invite you to be an active part of this vibrant community. Your engagement helps current students aspire for greatness and keeps the VJIT spirit alive.
              </p>
            </div>
            <div className="pt-4 flex gap-4">
              <Link href="/about" className="text-[#1e293b] font-bold border-b border-[#1e293b] hover:text-[#DAA520] hover:border-[#DAA520] transition-colors pb-1">
                Read Full Message &rarr;
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-[#DAA520]/10 rounded-lg transform rotate-2"></div>
            <div className="relative bg-white p-2 shadow-xl rounded-lg transform -rotate-1">
              {/* Placeholder for Video or Image */}
              <div className="aspect-video bg-gray-200 rounded flex items-center justify-center relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span className="text-[#DAA520] text-3xl ml-1">▶</span>
                </div>
              </div>
              <div className="p-4 text-center">
                <p className="font-serif italic text-gray-500">"Alumni are the true ambassadors of VJIT."</p>
                <p className="text-xs font-bold text-[#1e293b] mt-2 uppercase">- President, VJITAA</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="bg-gray-50 py-20 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-[#1e293b] font-bold text-sm tracking-widest uppercase mb-2 block">Updates</span>
            <h2 className="text-3xl font-bold text-gray-900 font-serif">Latest from Campus</h2>
            <div className="w-16 h-1 bg-[#DAA520] mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Events Column */}
            <div className="bg-white p-8 rounded shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-[#DAA520]">📅</span> Upcoming Events
                </h3>
                <Link href="/events" className="text-xs font-bold text-gray-400 hover:text-[#1e293b]">VIEW ALL</Link>
              </div>
              <div className="space-y-6">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => (
                    <div key={event.id} className="group cursor-pointer">
                      <div className="flex gap-4">
                        <div className="bg-gray-100 rounded p-2 text-center min-w-[60px]">
                          <span className="block text-xs font-bold text-gray-500 uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                          <span className="block text-xl font-bold text-[#1e293b]">{new Date(event.date).getDate()}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 group-hover:text-[#DAA520] transition-colors leading-tight mb-1">{event.title}</h4>
                          <p className="text-xs text-gray-500">{event.time} @ {event.venue}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No upcoming events.</p>
                )}
              </div>
            </div>

            {/* News/Notices Column */}
            <div className="bg-white p-8 rounded shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-[#DAA520]">📢</span> News & Notices
                </h3>
                <Link href="#" className="text-xs font-bold text-gray-400 hover:text-[#1e293b]">VIEW ALL</Link>
              </div>
              <div className="space-y-6">
                {notices.length > 0 ? (
                  notices.slice(0, 3).map(notice => (
                    <div key={notice.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-[#DAA520] bg-[#DAA520]/10 px-2 py-0.5 rounded uppercase">{notice.type || 'General'}</span>
                        <span className="text-[10px] text-gray-400">{notice.date}</span>
                      </div>
                      <h4 className="font-medium text-gray-800 hover:text-[#DAA520] cursor-pointer transition-colors leading-snug">{notice.title}</h4>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No recent notices.</p>
                )}
              </div>
            </div>

            {/* Spotlight/Jobs Column */}
            <div className="bg-white p-8 rounded shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-[#DAA520]">💼</span> Career
                </h3>
                <Link href="/jobs" className="text-xs font-bold text-gray-400 hover:text-[#1e293b]">VIEW ALL</Link>
              </div>

              <div className="space-y-6">
                {recentJobs.length > 0 ? (
                  recentJobs.map(job => (
                    <div key={job.id} className="flex gap-4 items-start group">
                      <div className="w-10 h-10 bg-gray-50 rounded border border-gray-100 flex items-center justify-center text-gray-400 text-lg">
                        🏢
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 group-hover:text-[#DAA520] transition-colors leading-tight">{job.title}</h4>
                        <p className="text-xs text-gray-500 mb-1">{job.company}</p>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">{job.type}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No active job listings.</p>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <Link href="/dashboard/alumni" className="block w-full text-center bg-gray-50 text-gray-600 py-2 rounded text-sm font-bold hover:bg-[#1e293b] hover:text-white transition-all">
                  Post a Job
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Band */}
      <section className="bg-[#1e293b] py-16 relative overflow-hidden font-sans border-t border-gray-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#DAA520]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 font-serif">Stay Connected to VJIT</h2>
          <p className="text-gray-200 mb-8 max-w-xl mx-auto text-lg">
            Update your contact information, share your achievements, and mentor the next generation.
          </p>
          <div className="flex justify-center gap-6">
            <Link href="/login" className="bg-white text-[#1e293b] !text-[#1e293b] px-8 py-3 rounded font-bold hover:bg-gray-100 shadow-lg transition-transform hover:-translate-y-1">
              Login to Portal
            </Link>
            <Link href="/register" className="bg-[#DAA520] text-[#1e293b] !text-[#1e293b] px-8 py-3 rounded font-bold hover:bg-[#b8860b] hover:text-white transition-transform hover:-translate-y-1 shadow-lg">
              Register as Alumni
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatItem({ value, label, icon, isLast }: { value: number; label: string; icon: string; isLast?: boolean }) {
  // Icons mapping for simplicity
  const icons: { [key: string]: string } = {
    'img:grad_cap': '🎓',
    'img:book': '📚',
    'img:calendar': '📅',
    'img:briefcase': '💼'
  };

  return (
    <div className={`text-center py-2 ${!isLast ? '' : ''} group`}>
      <div className="text-4xl mb-3 text-[#E0E0E0] group-hover:text-[#DAA520] transition-colors">{icons[icon]}</div>
      <div className="text-4xl font-bold text-gray-800 mb-1">{value}+</div>
      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}
