import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isLightMode = theme === 'light';
  const [scrollY, setScrollY] = useState(0);
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      const newVisible = new Set(visibleSections);
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          newVisible.add(entry.target.id);
        } else {
          newVisible.delete(entry.target.id);
        }
      });
      setVisibleSections(newVisible);
    }, observerOptions);

    Object.values(sectionRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [visibleSections]);

  const features = [
    {
      icon: '→',
      title: 'Evidence-Based Learning',
      description: 'Content aligned with PRC standards and modern pedagogical approaches for effective preparation'
    },
    {
      icon: '◆',
      title: 'Adaptive Learning Paths',
      description: 'Intelligent systems that identify knowledge gaps and customize study recommendations in real-time'
    },
    {
      icon: '◈',
      title: 'Community Support',
      description: 'Collaborative environment where educators connect, share insights, and support each other'
    },
    {
      icon: '+',
      title: 'Quality Assurance',
      description: 'Rigorous content review and continuous improvement based on student feedback'
    },
    {
      icon: '◉',
      title: 'Accessible Education',
      description: 'Optimized platform ensuring all aspiring teachers have equal access to quality materials'
    },
    {
      icon: '▲',
      title: 'Performance Analytics',
      description: 'Real-time progress tracking and insights to monitor improvement and build confidence'
    }
  ];

  const values = [
    {
      title: 'Empowerment',
      description: 'We believe every aspiring teacher deserves access to quality preparation resources regardless of background or location'
    },
    {
      title: 'Excellence',
      description: 'We maintain the highest standards of educational content and continuously improve our platform based on real outcomes'
    },
    {
      title: 'Collaboration',
      description: 'We foster a supportive community where educators learn together and contribute to each other\'s success'
    },
    {
      title: 'Innovation',
      description: 'We leverage technology to make teacher preparation more efficient, effective, and accessible for all learners'
    }
  ];

  const buildingBlocks = [
    {
      number: '01',
      title: 'Comprehensive Content',
      description: 'Curated by education experts and aligned with the latest PRC standards and curriculum frameworks'
    },
    {
      number: '02',
      title: 'Intelligent Assessment',
      description: 'Advanced analytics identify learning patterns and recommend personalized study strategies for optimal preparation'
    },
    {
      number: '03',
      title: 'Supportive Community',
      description: 'Connect with peers, share experiences, and benefit from collective knowledge of aspiring educators'
    },
    {
      number: '04',
      title: 'Progress Tracking',
      description: 'Real-time insights into your performance help you focus efforts where they matter most'
    }
  ];

  return (
    <div className={`${isLightMode ? 'bg-slate-50' : 'bg-slate-950'} transition-colors duration-200 overflow-x-hidden`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${
        isLightMode
          ? 'bg-white/80 border-b border-slate-200'
          : 'bg-slate-900/80 border-b border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex justify-between items-center">
          <div className={`text-lg sm:text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            EduHub
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className={`px-2.5 sm:px-3 py-1.5 rounded text-sm transition-colors duration-300 ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {isLightMode ? '◐' : '◑'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Parallax */}
      <section
        id="hero"
        ref={(el) => { if (el) sectionRefs.current.hero = el; }}
        className={`relative overflow-hidden px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-10 flex items-center ${
          isLightMode
            ? 'bg-white'
            : 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950'
        }`}
        style={{ minHeight: 'calc(100vh - 56px)' }}
      >
        {/* Parallax background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute -top-32 -right-32 w-64 h-64 sm:w-80 sm:h-80 ${
              isLightMode ? 'bg-blue-200/30' : 'bg-blue-600/15'
            } rounded-full blur-3xl animate-blob`}
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
          <div
            className={`absolute -bottom-32 -left-32 w-64 h-64 sm:w-80 sm:h-80 ${
              isLightMode ? 'bg-indigo-200/30' : 'bg-indigo-700/15'
            } rounded-full blur-3xl animate-blob animation-delay-2000`}
            style={{ transform: `translateY(${scrollY * -0.2}px)` }}
          />
          <div
            className={`absolute top-1/2 left-1/2 w-80 h-80 ${
              isLightMode ? 'bg-purple-200/20' : 'bg-purple-600/10'
            } rounded-full blur-3xl animate-blob animation-delay-4000`}
            style={{ transform: `translate(calc(-50% + ${scrollY * 0.1}px), -50%)` }}
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
          <div className="mb-2.5 inline-block animate-fade-in">
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-500 ${
              isLightMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-blue-500/20 text-blue-300'
            }`}>
              Empowering Aspiring Educators
            </span>
          </div>

          <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 leading-tight animate-fade-in-delay-1 ${
            isLightMode ? 'text-slate-900' : 'text-white'
          }`}>
            Quality Teacher Preparation,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-600 bg-clip-text text-transparent">
              Accessible to All
            </span>
          </h1>

          <p className={`text-sm sm:text-base mb-4 max-w-2xl mx-auto leading-relaxed animate-fade-in-delay-2 ${
            isLightMode ? 'text-slate-600' : 'text-slate-300'
          }`}>
            Comprehensive platform helping aspiring teachers succeed in licensure examinations and build confident, effective teaching careers.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4 animate-fade-in-delay-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm sm:text-base hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300"
            >
              Start Your Journey →
            </button>
            <button
              className={`px-6 sm:px-7 py-2.5 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all duration-300 border-2 ${
                isLightMode
                  ? 'border-slate-300 text-slate-900 hover:bg-slate-100'
                  : 'border-slate-700 text-white hover:bg-slate-800'
              }`}
            >
              Learn More
            </button>
          </div>

          <div className={`text-xs animate-fade-in-delay-4 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            ✓ Free access • ✓ Comprehensive resources • ✓ Expert guidance
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section
        id="mission"
        ref={(el) => { if (el) sectionRefs.current.mission = el; }}
        className={`relative px-4 sm:px-6 lg:px-8 py-8 sm:py-10 ${
          isLightMode ? 'bg-slate-50' : 'bg-slate-900'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 transition-all duration-500 ${
              visibleSections.has('mission') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            } ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Our Core Values
            </h2>
            <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed transition-all duration-500 delay-100 ${
              visibleSections.has('mission') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            } ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
              We remove barriers in teacher education by providing accessible, high-quality resources that empower aspiring educators
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 lg:gap-5">
            {values.map((value, idx) => (
              <div
                key={idx}
                className={`p-5 sm:p-6 rounded-xl border transition-all duration-500 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                  isLightMode
                    ? 'bg-white border-slate-200 hover:shadow-slate-300/40'
                    : 'bg-slate-800/50 border-slate-700 hover:shadow-slate-900/40'
                } ${visibleSections.has('mission') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 mb-3" />
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {value.title}
                </h3>
                <p className={`text-sm sm:text-base leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Built It Section */}
      <section
        id="building-blocks"
        ref={(el) => { if (el) sectionRefs.current['building-blocks'] = el; }}
        className={`relative px-4 sm:px-6 lg:px-8 py-8 sm:py-10 ${
          isLightMode ? 'bg-white' : 'bg-slate-950'
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 transition-all duration-500 ${
              visibleSections.has('building-blocks') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            } ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Our Platform Features
            </h2>
            <p className={`text-sm sm:text-base max-w-2xl mx-auto transition-all duration-500 delay-100 ${
              visibleSections.has('building-blocks') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            } ${isLightMode ? 'text-slate-600' : 'text-slate-300'}`}>
              Thoughtfully designed with educators in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 lg:gap-5">
            {buildingBlocks.map((block, idx) => (
              <div
                key={idx}
                className={`flex gap-3 sm:gap-4 p-5 sm:p-6 rounded-xl border transition-all duration-500 hover:shadow-lg ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200 hover:shadow-slate-300/40'
                    : 'bg-slate-900/50 border-slate-800 hover:shadow-slate-900/40 hover:bg-slate-900/70'
                } ${visibleSections.has('building-blocks') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center font-bold text-base sm:text-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white`}>
                  {block.number}
                </div>
                <div>
                  <h3 className={`text-base sm:text-lg font-bold mb-1 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {block.title}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {block.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        ref={(el) => { if (el) sectionRefs.current.features = el; }}
        className={`px-4 sm:px-6 lg:px-8 py-8 sm:py-10 ${
          isLightMode
            ? 'bg-slate-50'
            : 'bg-gradient-to-b from-slate-900 to-slate-950'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 transition-all duration-500 ${
              visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            } ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Why Choose EduHub
            </h2>
            <p className={`text-sm sm:text-base max-w-2xl mx-auto transition-all duration-500 delay-100 ${
              visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            } ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              A platform built by educators, for educators
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`group rounded-lg p-5 sm:p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg cursor-pointer border backdrop-blur-sm ${
                  isLightMode
                    ? 'bg-white border-slate-200 hover:shadow-lg hover:shadow-slate-300/40'
                    : 'bg-slate-800/30 border-slate-700 hover:shadow-lg hover:shadow-slate-900/40 hover:bg-slate-800/50'
                } ${visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                <div className="text-3xl sm:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300 w-8">
                  {feature.icon}
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed text-xs sm:text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Was Built Section */}
      <section
        id="why-built"
        ref={(el) => { if (el) sectionRefs.current['why-built'] = el; }}
        className={`px-4 sm:px-6 lg:px-8 py-8 sm:py-10 ${
          isLightMode ? 'bg-white' : 'bg-slate-900'
        }`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-7">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 transition-all duration-500 ${
              visibleSections.has('why-built') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            } ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              Why We Built This
            </h2>
          </div>

          <div className={`space-y-4 transition-all duration-500 ${
            isLightMode ? '' : ''
          } ${visibleSections.has('why-built') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className={`rounded-lg p-5 sm:p-6 border ${
              isLightMode
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-800/50 border-slate-700'
            }`}>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>The Problem</h3>
              <p className={`text-sm sm:text-base leading-relaxed ${
                isLightMode ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Thousands of aspiring teachers face fragmented resources, outdated materials, and lack of structured guidance. Many deserving educators encounter barriers not from lack of ability, but from lack of access to quality preparation materials and expert guidance.
              </p>
            </div>

            <div className={`rounded-lg p-5 sm:p-6 border ${
              isLightMode
                ? 'bg-blue-50 border-blue-200'
                : 'bg-blue-900/20 border-blue-700/30'
            }`}>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-blue-900' : 'text-blue-200'}`}>Our Solution</h3>
              <p className={`text-sm sm:text-base leading-relaxed ${
                isLightMode ? 'text-blue-800' : 'text-blue-100'
              }`}>
                EduHub democratizes teacher preparation by providing comprehensive, expert-aligned resources accessible to every aspiring educator. Regardless of location or economic background, our platform offers the tools, guidance, and community support needed to succeed.
              </p>
            </div>

            <div className={`rounded-lg p-5 sm:p-6 border ${
              isLightMode
                ? 'bg-indigo-50 border-indigo-200'
                : 'bg-indigo-900/20 border-indigo-700/30'
            }`}>
              <h3 className={`text-lg font-bold mb-2 ${isLightMode ? 'text-indigo-900' : 'text-indigo-200'}`}>Our Commitment</h3>
              <p className={`text-sm sm:text-base leading-relaxed ${
                isLightMode ? 'text-indigo-800' : 'text-indigo-100'
              }`}>
                We continuously improve and evolve based on real educator experiences and examination outcomes. Together, we're building a stronger, more inclusive teaching profession with higher success rates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        ref={(el) => { if (el) sectionRefs.current.cta = el; }}
        className={`relative overflow-hidden px-4 sm:px-6 lg:px-8 py-6 sm:py-8 ${
          isLightMode
            ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600'
            : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700'
        }`}
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-32 -right-32 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-blob"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-blob animation-delay-2000"
            style={{ transform: `translateY(${scrollY * -0.15}px)` }}
          />
        </div>

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2 transition-all duration-500 ${
            visibleSections.has('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            Ready to Begin?
          </h2>
          <p className={`text-xs sm:text-sm text-white/90 mb-4 transition-all duration-500 delay-100 ${
            visibleSections.has('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            Join thousands of educators preparing for success with comprehensive resources and community support.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 sm:px-7 py-2.5 sm:py-3 rounded-lg bg-white text-indigo-600 font-bold text-sm sm:text-base hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-delay-3"
          >
            Start Free Today →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t ${
        isLightMode
          ? 'bg-slate-50 border-slate-200'
          : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 mb-5">
            <div>
              <div className={`text-base sm:text-lg font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                EduHub
              </div>
              <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Empowering educators with quality preparation and community support.
              </p>
            </div>
            <div>
              <h4 className={`font-bold mb-3 text-xs sm:text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                PLATFORM
              </h4>
              <ul className={`space-y-1.5 text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <li><a href="#features" className="hover:text-blue-500 transition">Features</a></li>
                <li><a href="#mission" className="hover:text-blue-500 transition">Mission</a></li>
                <li><a href="#building-blocks" className="hover:text-blue-500 transition">Platform</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-bold mb-3 text-xs sm:text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                RESOURCES
              </h4>
              <ul className={`space-y-1.5 text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <li><a href="#" className="hover:text-blue-500 transition">Blog</a></li>
                <li><a href="#" className="hover:text-blue-500 transition">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-500 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-bold mb-3 text-xs sm:text-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                LEGAL
              </h4>
              <ul className={`space-y-1.5 text-xs ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <li><a href="#" className="hover:text-blue-500 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-500 transition">Terms</a></li>
                <li><button onClick={() => setShowContactSupport(true)} className="hover:text-blue-500 transition cursor-pointer">Support</button></li>
              </ul>
            </div>
          </div>

          <div className={`text-center text-xs py-3 border-t ${
            isLightMode ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
          }`}>
            <p>© 2024 EduHub. Empowering educators. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Contact Support Modal */}
      {showContactSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className={`rounded-xl p-5 sm:p-6 max-w-sm w-full border transition-all duration-300 animate-scale-in ${
            isLightMode
              ? 'bg-white border-slate-200'
              : 'bg-slate-900 border-slate-700'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-base sm:text-lg font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Contact Support
              </h3>
              <button
                onClick={() => setShowContactSupport(false)}
                className={`text-lg transition hover:scale-110 ${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className={`p-3 rounded-lg transition-all hover:shadow-md ${isLightMode ? 'bg-slate-100 hover:bg-slate-200' : 'bg-slate-800 hover:bg-slate-700'}`}>
                <p className={`text-xs font-semibold mb-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Phone
                </p>
                <p className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  0987654231
                </p>
              </div>

              <div className={`p-3 rounded-lg transition-all hover:shadow-md ${isLightMode ? 'bg-slate-100 hover:bg-slate-200' : 'bg-slate-800 hover:bg-slate-700'}`}>
                <p className={`text-xs font-semibold mb-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Hotline
                </p>
                <p className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  456 5732
                </p>
              </div>

              <div className={`p-3 rounded-lg transition-all hover:shadow-md ${isLightMode ? 'bg-slate-100 hover:bg-slate-200' : 'bg-slate-800 hover:bg-slate-700'}`}>
                <p className={`text-xs font-semibold mb-0.5 ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Email
                </p>
                <p className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  admin.cvsu.edu.ph
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowContactSupport(false)}
              className="w-full mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold text-xs sm:text-sm hover:shadow-lg hover:shadow-blue-500/40 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-fade-in-delay-1 {
          animation: fade-in 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.4s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay-3 {
          animation: fade-in 0.6s ease-out 0.6s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay-4 {
          animation: fade-in 0.6s ease-out 0.8s forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @media (max-width: 640px) {
          .animate-fade-in-delay-1,
          .animate-fade-in-delay-2,
          .animate-fade-in-delay-3,
          .animate-fade-in-delay-4 {
            animation-delay: 0s;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
