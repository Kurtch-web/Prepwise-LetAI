import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isLightMode = theme === 'light';

  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [isLearnMoreModalOpen, setIsLearnMoreModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('how-it-helps'); // Initialize activeTab with 'how-it-helps'
  const [platformInfoModal, setPlatformInfoModal] = useState<null | {
    title: string;
    description: string;
    primaryActionLabel: string;
    primaryAction: () => void;
  }>(null);

  // Navbar state on scroll + Intersection Observer for reveal animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Intersection Observer for scroll-triggered animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, entry.target.id]));
          } else {
            setVisibleSections((prev) => {
              const newSet = new Set(prev);
              newSet.delete(entry.target.id);
              return newSet;
            });
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all sections with animation
    ['highlights', 'core-values', 'features-section', 'why-prepwise', 'cta'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const isVisible = (id: string) => visibleSections.has(id);

  const highlights = [
    {
      title: 'School-ready resources',
      desc: 'Structured review materials designed for educator preparation.'
    },
    {
      title: 'Teacher-focused content',
      desc: 'Coverage for core LET domains with practical study guidance.'
    },
    {
      title: 'Flexible study workflow',
      desc: 'Use quizzes, flashcards, and video lessons at your own pace.'
    }
  ];

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3a7 7 0 0 0-7 7v1a7 7 0 0 0 14 0v-1a7 7 0 0 0-7-7Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 21h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9 10h.01M12 10h.01M15 10h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ),
      title: 'AI-Powered Learning',
      desc: 'Get detailed explanations and insights for every question, empowering you to learn from your mistakes and improve your understanding.',
      badgeClassName: 'bg-gradient-to-br from-emerald-500 to-green-500'
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 6a2 2 0 0 1 2-2h9l5 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path d="M14 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 13h8M8 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      title: 'Diagnostic Assessments',
      desc: 'Pinpoint weak areas early and focus your review time where it matters.',
      badgeClassName: 'bg-gradient-to-br from-emerald-500 to-teal-500'
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3a7 7 0 0 0-7 7v1a7 7 0 0 0 14 0v-1a7 7 0 0 0-7-7Z"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 21h8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9 10h.01M12 10h.01M15 10h.01"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ),
      title: 'Spaced Repetition',
      desc: 'Build long-term recall with a smart flashcard schedule tailored to you.',
      badgeClassName: 'bg-gradient-to-br from-teal-500 to-emerald-500'
    },
    {
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 8a5 5 0 1 1 10 0c0 2-1 3-2 4s-2 2-2 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M12 19h.01" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ),
      title: 'Question Bank',
      desc: 'PRC-aligned items organized by topic for systematic mastery.',
      badgeClassName: 'bg-gradient-to-br from-green-500 to-emerald-600'
    }
  ];

  return (
    <div className={`${isLightMode ? 'bg-gradient-to-b from-emerald-50/60 via-teal-50/40 to-green-50/50' : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'} min-h-screen overflow-x-hidden`}>
      {/* Parallax Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 20 ? `backdrop-blur-xl border-b ${isLightMode ? 'bg-emerald-50/85 border-emerald-200/60' : 'bg-slate-950/70 border-slate-800/60'}` : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border ${isLightMode ? 'bg-emerald-50/80 border-emerald-200 shadow-sm' : 'bg-slate-900/50 border-emerald-500/30'}`}>
                <span className="absolute w-4 h-4 rounded-full bg-emerald-400/90 -left-1 top-1" />
                <span className="absolute w-3 h-3 rounded-full bg-green-500/80 right-1 bottom-1" />
                <svg className={`w-5 h-5 relative z-10 ${isLightMode ? 'text-emerald-700' : 'text-emerald-300'}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h5l2-4 3 8 2-4h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className={`text-2xl lg:text-3xl font-display font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                PrepWise
              </span>
            </div>
            <div className="flex items-center gap-3 lg:gap-4">
              <button
                className={`px-6 py-3 rounded-2xl font-semibold text-base transition-all duration-200 ${
                  isLightMode
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-white text-slate-900 hover:bg-slate-200'
                }`}
                onClick={() => navigate('/dashboard')}
              >
                Get started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Animated Gradient + Floating Elements */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 parallax-bg" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
          <div className={`absolute inset-0 ${isLightMode ? 'bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.10),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(34,197,94,0.10),transparent_45%)]' : 'bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(34,197,94,0.16),transparent_45%)]'}`} />
          <div className="absolute -top-10 left-6 w-32 h-32 rounded-full bg-emerald-200/50 dark:bg-emerald-500/10 blur-2xl" />
          <div className="absolute top-24 right-10 w-24 h-24 rounded-full bg-green-200/60 dark:bg-green-500/10 blur-2xl" />
          <div className="absolute bottom-8 left-1/3 w-40 h-40 rounded-full bg-teal-200/40 dark:bg-teal-500/10 blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-14 items-center">
            <div className="lg:col-span-6 text-center lg:text-left">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md shadow-sm mb-7 animate-fade-in-up ${isLightMode ? 'border-emerald-200/70 bg-emerald-50/70' : 'border-slate-700/60 bg-slate-900/40'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Empowering aspiring educators</span>
              </div>
              <h1 className={`font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] font-black mb-5 animate-fade-in-up ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Quality Teacher Preparation,
                <span className="block bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Accessible to All</span>
              </h1>
              <p className={`text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 animate-slide-left ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>
                Free school platform helping aspiring teachers succeed in licensure examinations and build confidence for their teaching careers.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-stretch sm:items-center mb-8 animate-fade-in-up">
                <button
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-lg rounded-2xl shadow-lg hover:from-emerald-600 hover:to-green-600 transition-colors"
                  onClick={() => navigate('/dashboard')}
                >
                  Start Your Journey
                </button>
                <button
                  className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 border ${
                    isLightMode
                      ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900 hover:bg-emerald-50'
                      : 'bg-slate-950/40 border-slate-800 text-white hover:bg-slate-950/60'
                  }`}
                  onClick={() => setIsLearnMoreModalOpen(true)}
                >
                  Learn More
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/80" />
                  Free for schools
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600/80" />
                  Comprehensive resources
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400/80" />
                  Expert guidance
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className={`relative overflow-hidden rounded-4xl p-7 md:p-8 shadow-2xl border backdrop-blur-xl ${isLightMode ? 'border-emerald-100/80 bg-emerald-50/70' : 'border-slate-800/60 bg-slate-950/40'}`}>
                <div className="absolute -top-8 -right-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="absolute -bottom-12 left-10 w-56 h-56 rounded-full bg-green-500/10 blur-2xl" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-4 mb-8">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Study preview</p>
                      <p className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Your dashboard</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isLightMode ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/15 text-emerald-50'}`}>Quick start</span>
                  </div>

                  <div className="space-y-4">
                    {[{ label: 'Today’s lesson', value: 'Professional Education' }, { label: 'Next activity', value: 'Practice quiz' }, { label: 'Video lesson', value: 'Classroom Management Essentials' }].map((row, idx) => (
                      <div key={row.label} className={`rounded-3xl p-5 border transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up ${isLightMode ? 'bg-emerald-50/60 border-emerald-100/80 hover:bg-emerald-50/90' : 'bg-slate-950/30 border-slate-800/60 hover:bg-slate-900/50'}`} style={{animationDelay: `${idx * 0.08}s`}}>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{row.label}</p>
                        <p className={`mt-1 text-base font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{row.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {['Quizzes', 'Flashcards', 'Video'].map((pill, idx) => (
                      <div key={pill} className={`text-center py-2 rounded-2xl text-xs font-bold border transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up ${isLightMode ? 'bg-emerald-50/80 border-emerald-100/80 text-emerald-900 hover:bg-emerald-50' : 'bg-slate-950/30 border-slate-800/60 text-slate-200 hover:bg-slate-900/50'}`} style={{animationDelay: `${0.2 + idx * 0.08}s`}}>
                        {pill}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School Highlights - Staggered Floating Cards */}
      <section id="highlights" className="relative py-20 overflow-hidden">
        {/* Parallax floating blobs */}
        <div className="absolute inset-0 pointer-events-none" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-emerald-200/30 dark:bg-emerald-500/10 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-teal-200/30 dark:bg-teal-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-6 items-stretch">
            {highlights.map((item, i) => (
              <div key={i} 
                className={`flex-1 rounded-3xl p-8 border transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] scroll-reveal ${isVisible('highlights') ? 'visible' : ''} ${isLightMode ? 'bg-emerald-50/70 border-emerald-200/80 shadow-lg hover:shadow-xl' : 'bg-slate-950/50 border-slate-700/60 hover:bg-slate-900/60'} stagger-${i + 1}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isLightMode ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white' : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'}`}>
                  <span className="text-2xl font-bold">{i + 1}</span>
                </div>
                <p className={`text-xl font-bold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{item.title}</p>
                <p className={`text-base leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values - Diagonal Overlapping Layout */}
      <section id="core-values" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ transform: `translateY(${scrollY * -0.08}px)` }}>
          <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-green-200/20 dark:bg-green-500/10 blur-3xl -translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`text-center mb-16 scroll-reveal-scale ${isVisible('core-values') ? 'visible' : ''}`}>
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${isLightMode ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-900/30 text-emerald-300'}`}>What We Stand For</span>
            <h2 className={`font-display text-4xl md:text-5xl font-black ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Our Core Values
            </h2>
            <p className={`mt-4 text-base md:text-lg max-w-2xl mx-auto ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              A learning platform designed to support aspiring educators with clarity, consistency, and care.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Empowerment', desc: 'Enabling learners with resources and guidance.', icon: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5' },
              { title: 'Excellence', desc: 'Clear content and consistent practice routines.', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
              { title: 'Collaboration', desc: 'Community-supported learning and sharing.', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
              { title: 'Innovation', desc: 'Modern tools that simplify review workflows.', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-13h2v6h-2zm0 8h2v2h-2' }
            ].map((card, i) => (
              <div key={card.title} 
                className={`relative group rounded-3xl p-8 border transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl scroll-reveal ${isVisible('core-values') ? 'visible' : ''} ${isLightMode ? 'bg-white/80 border-emerald-100/80 shadow-lg' : 'bg-slate-950/60 border-slate-700/60'} stagger-${i + 1}`}
                style={{ transform: `translateY(${i % 2 === 0 ? -8 : 8}px)` }}>
                <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 ${isLightMode ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg' : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white'}`}>
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={card.icon} />
                  </svg>
                </div>
                <div className="pt-8">
                  <p className={`text-xl font-bold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{card.title}</p>
                  <p className={`text-base leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{card.desc}</p>
                </div>
                <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl transition-all duration-500 group-hover:h-2 ${isLightMode ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-emerald-500 to-green-600'}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Alternating Zigzag Layout */}
      <section id="features-section" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-100/40 dark:from-emerald-900/10 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className={`flex items-end justify-between mb-16 scroll-reveal-scale ${isVisible('features-section') ? 'visible' : ''}`}>
            <div>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${isLightMode ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-900/30 text-emerald-300'}`}>Platform</span>
              <h2 className={`font-display text-4xl md:text-5xl font-black leading-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Our Platform Features
              </h2>
            </div>
            <p className={`hidden md:block text-lg max-w-md ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Comprehensive platform helping aspiring teachers succeed.
            </p>
          </div>

          <div className="space-y-8">
            {features.map((feature, idx) => (
              <div key={feature.title} 
                className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 group scroll-reveal ${isVisible('features-section') ? 'visible' : ''} ${idx % 2 === 0 ? 'scroll-reveal-left' : 'scroll-reveal-right'} stagger-${idx + 1}`}>
                <div className={`flex-1 w-full rounded-3xl p-8 border transition-all duration-500 hover:shadow-2xl ${isLightMode ? 'bg-white/90 border-emerald-100/80 shadow-lg' : 'bg-slate-950/50 border-slate-700/60'}`}>
                  <div className="flex items-start gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 ${feature.badgeClassName}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{feature.title}</h3>
                      <p className={`text-base leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{feature.desc}</p>
                    </div>
                  </div>
                </div>
                <div className={`w-full md:w-48 h-32 rounded-2xl border flex items-center justify-center transition-all duration-500 group-hover:scale-105 ${isLightMode ? 'bg-emerald-50/50 border-emerald-200/60' : 'bg-slate-900/30 border-slate-700/40'}`}>
                  <div className={`w-12 h-12 ${isLightMode ? 'text-emerald-600' : 'text-emerald-400'}`}>
                    {feature.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose PrepWise - Masonry with Parallax */}
      <section id="why-prepwise" className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-teal-200/20 dark:bg-teal-500/10 blur-3xl" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
          <div className="absolute bottom-40 right-10 w-64 h-64 rounded-full bg-green-200/20 dark:bg-green-500/10 blur-3xl" style={{ transform: `translateY(${scrollY * -0.1}px)` }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            {/* Left sticky header */}
            <div className={`lg:w-1/3 lg:sticky lg:top-32 scroll-reveal ${isVisible('why-prepwise') ? 'visible' : ''}`}>
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 ${isLightMode ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-900/30 text-emerald-300'}`}>Why Us</span>
              <h2 className={`font-display text-4xl md:text-5xl font-black mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Why Choose PrepWise
              </h2>
              <p className={`text-base md:text-lg mb-8 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                A modern review platform designed around clarity and consistency.
              </p>
              <div className={`hidden lg:block w-full h-px ${isLightMode ? 'bg-gradient-to-r from-emerald-300 to-transparent' : 'bg-gradient-to-r from-emerald-700 to-transparent'}`} />
            </div>

            {/* Right scrolling cards - Masonry style */}
            <div className="lg:w-2/3 grid sm:grid-cols-2 gap-6">
              {[
                { title: 'Evidence-based learning', desc: 'Practice with purpose using focused and repeatable routines.', color: 'from-emerald-400 to-teal-500' },
                { title: 'Adaptive learning paths', desc: 'Stay organized with topic-based review and saved items.', color: 'from-green-400 to-emerald-500' },
                { title: 'Community support', desc: 'Supportive learning environment with guided materials.', color: 'from-teal-400 to-green-500' },
                { title: 'Quality assurance', desc: 'Questions and content designed to match exam preparation needs.', color: 'from-emerald-500 to-green-600' },
                { title: 'Accessible education', desc: 'Designed for learners on any device, anywhere.', color: 'from-green-500 to-teal-500' },
                { title: 'Performance insights', desc: 'Track what you\'ve practiced and what to review next.', color: 'from-teal-500 to-emerald-500' }
              ].map((item, i) => (
                <div key={item.title} 
                  className={`group relative rounded-3xl p-6 border transition-all duration-500 hover:-translate-y-2 hover:shadow-xl scroll-reveal ${isVisible('why-prepwise') ? 'visible' : ''} ${isLightMode ? 'bg-white/80 border-emerald-100/80 shadow-lg' : 'bg-slate-950/50 border-slate-700/60'} stagger-${i + 1}`}
                  style={{ 
                    transform: isVisible('why-prepwise') ? `translateY(${i % 2 === 0 ? 0 : 24}px)` : undefined,
                    marginTop: i < 2 ? 0 : undefined
                  }}>
                  <div className={`absolute top-0 left-6 w-12 h-1 rounded-b-lg bg-gradient-to-r ${item.color}`} />
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12l5 5L20 6" />
                    </svg>
                  </div>
                  <p className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{item.title}</p>
                  <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-16 relative">
        <div className={`absolute inset-0 ${isLightMode ? 'bg-gradient-to-r from-emerald-100/50 via-emerald-50/70 to-green-100/50' : 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800'}`}></div>
        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className={`p-10 md:p-12 rounded-4xl backdrop-blur-2xl border scroll-reveal-scale ${isVisible('cta') ? 'visible' : ''} ${isLightMode ? 'bg-emerald-50/70 border-emerald-100/80 shadow-xl' : 'bg-slate-950/30 border-slate-700/40'}`}>
            <h2 className={`font-display text-4xl md:text-5xl font-black mb-4 ${isLightMode ? 'text-slate-900' : 'text-white drop-shadow-2xl'}`}>
              Ready to Ace Your LET?
            </h2>
            <p className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${isLightMode ? 'text-slate-600' : 'text-slate-200 font-light drop-shadow-lg'}`}>
              Start a structured review routine today.
            </p>
            <div className="flex flex-col lg:flex-row gap-4 justify-center">
              <button 
                className={`px-10 py-4 font-bold text-lg rounded-3xl shadow-lg transition-all duration-300 hover:scale-105 ${isLightMode ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-200'}`}
                onClick={() => navigate('/dashboard')}
              >
                Start now
              </button>
              <button
                className={`px-10 py-4 border font-bold text-lg rounded-3xl transition-all duration-300 hover:scale-105 ${isLightMode ? 'border-emerald-200/80 bg-emerald-50/70 text-emerald-900 hover:bg-emerald-50' : 'border-white/40 bg-transparent text-white hover:bg-white/10'}`}
                onClick={() => navigate('/signup')}
              >
                Create account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${isLightMode ? 'bg-emerald-50/70 text-slate-900 border-t border-emerald-100/80' : 'bg-gradient-to-r from-slate-900 to-slate-800 text-white'} py-14 relative overflow-hidden`}>
        <div className={`absolute inset-0 ${isLightMode ? 'opacity-40' : 'opacity-20'}`}>
          <div className={`absolute top-20 left-10 w-40 h-40 rounded-full blur-3xl animate-float ${isLightMode ? 'bg-emerald-100' : 'bg-white/10'}`}></div>
          <div className={`absolute bottom-20 right-20 w-32 h-32 rounded-full blur-2xl animate-float ${isLightMode ? 'bg-emerald-200/60' : 'bg-emerald-500/15'}`} style={{animationDelay: '1s'}}></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <span className="text-2xl font-display font-bold">E</span>
                </div>
                <span className="text-3xl font-display font-bold">PrepWise</span>
              </div>
              <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'} leading-relaxed mb-8 max-w-md`}>
                PRC-aligned LET preparation platform. Built to support aspiring educators with structured practice.
              </p>
              <div className="flex space-x-4">
                <a href="#" className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 ${isLightMode ? 'bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-700' : 'bg-slate-800/50 hover:bg-slate-700 text-slate-300'}`} aria-label="Facebook">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v3H7v3h3v6h3v-6h3l1-3h-4V9c0-.6.4-1 1-1Z"
                      fill="currentColor"
                    />
                  </svg>
                </a>
                <a href="#" className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 ${isLightMode ? 'bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-700' : 'bg-slate-800/50 hover:bg-slate-700 text-slate-300'}`} aria-label="Mobile App">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </a>
                <a href="#" className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 ${isLightMode ? 'bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-700' : 'bg-slate-800/50 hover:bg-slate-700 text-slate-300'}`} aria-label="Email">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="2" />
                    <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-display text-2xl font-bold mb-8">Platform</h4>
              <ul className={`space-y-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <li>
                  <button
                    type="button"
                    className="hover:text-emerald-500 transition-colors"
                    onClick={() =>
                      setPlatformInfoModal({
                        title: 'Practice Quizzes',
                        description:
                          'Use practice quizzes to build familiarity with LET-style questions, improve accuracy, and strengthen topic recall through repeated practice.',
                        primaryActionLabel: 'Go to Quizzes',
                        primaryAction: () => navigate('/quiz'),
                      })
                    }
                  >
                    Practice Quizzes
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-emerald-500 transition-colors"
                    onClick={() =>
                      setPlatformInfoModal({
                        title: 'Diagnostic Tests',
                        description:
                          'Start with a diagnostic test to assess your current level and identify weak areas, so you can focus your review on what matters most.',
                        primaryActionLabel: 'Go to Quizzes',
                        primaryAction: () => navigate('/quiz'),
                      })
                    }
                  >
                    Diagnostic Tests
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="hover:text-emerald-500 transition-colors"
                    onClick={() =>
                      setPlatformInfoModal({
                        title: 'Flashcards',
                        description:
                          'Flashcards help you memorize key concepts and definitions using quick review sessions and spaced repetition for better long-term retention.',
                        primaryActionLabel: 'Go to Flashcards',
                        primaryAction: () => navigate('/materials/flashcards'),
                      })
                    }
                  >
                    Flashcards
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-2xl font-bold mb-8">Study Quote</h4>
              <div className={`rounded-2xl border p-6 ${isLightMode ? 'bg-white/60 border-emerald-200/70' : 'bg-slate-800/40 border-slate-700/60'}`}>
                <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'} text-lg leading-relaxed`}>
                  “Live as if you were to die tomorrow. Learn as if you were to live forever.”
                </p>
                <p className={`${isLightMode ? 'text-slate-500' : 'text-slate-400'} mt-4 font-semibold`}>
                  — Mahatma Gandhi
                </p>
              </div>
            </div>
          </div>
          <div className={`border-t ${isLightMode ? 'border-emerald-200/60 text-slate-500' : 'border-slate-800 text-slate-500'} pt-8 text-center text-base`}>
            2026 PrepWise. Empowering future educators. All rights reserved.
          </div>
        </div>
      </footer>

      {platformInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPlatformInfoModal(null)}>
          <div className={`rounded-2xl w-full max-w-xl overflow-hidden ${isLightMode ? 'bg-white' : 'bg-slate-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-6 border-b ${isLightMode ? 'border-slate-200' : 'border-slate-700'}`}>
              <h2 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{platformInfoModal.title}</h2>
              <button onClick={() => setPlatformInfoModal(null)} className={`text-3xl leading-none ${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>×</button>
            </div>
            <div className="p-6">
              <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'} leading-relaxed`}>{platformInfoModal.description}</p>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  className={`flex-1 px-5 py-3 rounded-xl font-bold transition-all ${isLightMode ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                  onClick={() => setPlatformInfoModal(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="flex-1 px-5 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 transition-all"
                  onClick={() => {
                    const action = platformInfoModal.primaryAction;
                    setPlatformInfoModal(null);
                    action();
                  }}
                >
                  {platformInfoModal.primaryActionLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Learn More Modal */}
      {isLearnMoreModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsLearnMoreModalOpen(false)}>
          <div className={`rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col ${isLightMode ? 'bg-white' : 'bg-slate-800'}`} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${isLightMode ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200' : 'bg-gradient-to-r from-emerald-900/20 to-green-900/20 border-emerald-800'}`}>
              <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>How PrepWise Helps You Succeed</h2>
              <button onClick={() => setIsLearnMoreModalOpen(false)} className={`text-3xl leading-none ${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}>×</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-6">
                <div className={`p-6 rounded-xl border ${isLightMode ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-900/20 border-emerald-800'}`}>
                  <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-emerald-900' : 'text-emerald-100'}`}>🎯 Personalized Learning Paths</h3>
                  <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>Our AI-powered system adapts to your learning style and pace. Get customized quizzes, practice tests, and study recommendations based on your weak areas.</p>
                </div>

                <div className={`p-6 rounded-xl border ${isLightMode ? 'bg-blue-50 border-blue-200' : 'bg-blue-900/20 border-blue-800'}`}>
                  <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-blue-900' : 'text-blue-100'}`}>📊 Real-Time Progress Tracking</h3>
                  <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>Monitor your improvement with detailed analytics. See which topics you've mastered and which need more focus. Track your performance trends over time.</p>
                </div>

                <div className={`p-6 rounded-xl border ${isLightMode ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/20 border-purple-800'}`}>
                  <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-purple-900' : 'text-purple-100'}`}>🎓 PRC-Aligned Content</h3>
                  <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>All materials are aligned with the latest PRC LET standards. Practice with questions that match the actual exam format and difficulty level.</p>
                </div>

                <div className={`p-6 rounded-xl border ${isLightMode ? 'bg-orange-50 border-orange-200' : 'bg-orange-900/20 border-orange-800'}`}>
                  <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-orange-900' : 'text-orange-100'}`}>🎬 Video Lessons & Explanations</h3>
                  <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>Learn from expert instructors through comprehensive video lessons. Each topic includes clear explanations and worked examples to deepen your understanding.</p>
                </div>

                <div className={`p-6 rounded-xl border ${isLightMode ? 'bg-pink-50 border-pink-200' : 'bg-pink-900/20 border-pink-800'}`}>
                  <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-pink-900' : 'text-pink-100'}`}>💪 Spaced Repetition System</h3>
                  <p className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>Our smart flashcard system uses spaced repetition to maximize retention. Review material at optimal intervals to build long-term memory.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
