import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isLightMode = theme === 'light';
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: '🎯',
      title: 'Evidence-Based Learning',
      description: 'Comprehensive content aligned with PRC standards and modern pedagogical approaches for effective learning outcomes'
    },
    {
      icon: '📊',
      title: 'Adaptive Learning Paths',
      description: 'Intelligent assessment systems that identify knowledge gaps and customize study recommendations in real-time'
    },
    {
      icon: '🤝',
      title: 'Community Support',
      description: 'Collaborative environment where aspiring educators connect, share insights, and support each other on their journey'
    },
    {
      icon: '✨',
      title: 'Quality Assurance',
      description: 'Rigorous content review and continuous improvement based on student feedback and examination success metrics'
    },
    {
      icon: '🌍',
      title: 'Accessible Education',
      description: 'Low-bandwidth optimized platform ensuring all aspiring teachers have equal access to quality preparation materials'
    },
    {
      icon: '📈',
      title: 'Performance Analytics',
      description: 'Detailed progress tracking and insights to monitor improvement and build confidence towards examination day'
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
    <div className={`${isLightMode ? 'bg-slate-50' : 'bg-slate-950'} transition-colors duration-200`}>
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md ${
        isLightMode 
          ? 'bg-white/80 border-b border-slate-200' 
          : 'bg-slate-900/80 border-b border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            🎓 EduHub
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`px-4 py-2 rounded-lg transition-colors duration-300 ${
                isLightMode
                  ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {isLightMode ? '🌙' : '☀️'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/40 transition-all duration-300"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`relative overflow-hidden px-4 sm:px-6 lg:px-8 py-20 sm:py-28 md:py-36 ${
        isLightMode
          ? 'bg-white'
          : 'bg-gradient-to-br from-slate-900 to-slate-950'
      }`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute -top-40 -right-40 w-80 h-80 ${
            isLightMode ? 'bg-blue-200/20' : 'bg-blue-600/10'
          } rounded-full blur-3xl animate-blob`} />
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${
            isLightMode ? 'bg-slate-200/20' : 'bg-slate-700/10'
          } rounded-full blur-3xl animate-blob animation-delay-2000`} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="mb-6 inline-block">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              isLightMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-blue-500/20 text-blue-300'
            }`}>
              🌟 Empowering Aspiring Educators
            </span>
          </div>

          <h1 className={`text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-tight ${
            isLightMode ? 'text-slate-900' : 'text-white'
          }`}>
            Quality Teacher Preparation,
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Accessible to All
            </span>
          </h1>

          <p className={`text-xl sm:text-2xl mb-10 max-w-2xl mx-auto ${
            isLightMode ? 'text-slate-600' : 'text-slate-300'
          }`}>
            A comprehensive platform dedicated to helping aspiring teachers succeed in their licensure examination and build confident, effective teaching careers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1 transition-all duration-300"
            >
              Start Your Journey →
            </button>
            <button
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 border-2 ${
                isLightMode
                  ? 'border-slate-300 text-slate-900 hover:bg-slate-100'
                  : 'border-slate-700 text-white hover:bg-slate-800'
              }`}
            >
              Learn Our Story
            </button>
          </div>

          <div className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            ✓ Free access • ✓ Comprehensive resources • ✓ Expert guidance
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={`px-4 sm:px-6 lg:px-8 py-20 sm:py-28 ${
        isLightMode ? 'bg-slate-50' : 'bg-slate-900'
      }`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-extrabold mb-6 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              Our Mission
            </h2>
            <p className={`text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed ${
              isLightMode ? 'text-slate-600' : 'text-slate-300'
            }`}>
              We are dedicated to removing barriers in teacher education by providing accessible, high-quality preparation resources that empower aspiring educators to achieve their full potential and make meaningful contributions to society.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            {values.map((value, idx) => (
              <div
                key={idx}
                className={`p-8 rounded-2xl border ${
                  isLightMode
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <h3 className={`text-2xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {value.title}
                </h3>
                <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Built It Section */}
      <section className={`px-4 sm:px-6 lg:px-8 py-20 sm:py-28 ${
        isLightMode ? 'bg-white' : 'bg-slate-950'
      }`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-extrabold mb-6 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              How We Built It
            </h2>
            <p className={`text-lg sm:text-xl max-w-3xl mx-auto ${
              isLightMode ? 'text-slate-600' : 'text-slate-300'
            }`}>
              Every aspect of our platform is thoughtfully designed with educators in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {buildingBlocks.map((block, idx) => (
              <div key={idx} className="flex gap-6">
                <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-bold text-xl ${
                  isLightMode
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {block.number}
                </div>
                <div>
                  <h3 className={`text-xl font-bold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {block.title}
                  </h3>
                  <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {block.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`px-4 sm:px-6 lg:px-8 py-20 sm:py-28 ${
        isLightMode
          ? 'bg-slate-50'
          : 'bg-gradient-to-b from-slate-900 to-slate-950'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-extrabold mb-4 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              Why Choose Us
            </h2>
            <p className={`text-lg sm:text-xl max-w-2xl mx-auto ${
              isLightMode ? 'text-slate-600' : 'text-slate-400'
            }`}>
              A platform built by educators, for educators
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`group rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer border ${
                  isLightMode
                    ? 'bg-white border-slate-200 hover:shadow-lg hover:shadow-slate-300/40'
                    : 'bg-slate-800/50 border-slate-700 hover:shadow-lg hover:shadow-slate-900/40'
                }`}
              >
                <div className="text-5xl mb-4">
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why It Was Built Section */}
      <section className={`px-4 sm:px-6 lg:px-8 py-20 sm:py-28 ${
        isLightMode ? 'bg-white' : 'bg-slate-900'
      }`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className={`text-4xl sm:text-5xl font-extrabold mb-6 ${
              isLightMode ? 'text-slate-900' : 'text-white'
            }`}>
              Why We Built This
            </h2>
          </div>

          <div className={`rounded-2xl p-8 sm:p-12 border ${
            isLightMode
              ? 'bg-slate-50 border-slate-200'
              : 'bg-slate-800/50 border-slate-700'
          }`}>
            <p className={`text-lg sm:text-xl leading-relaxed mb-6 ${
              isLightMode ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Thousands of aspiring teachers struggle with fragmented resources, outdated materials, and lack of structured guidance in preparing for their licensure examination. We recognized that many deserving educators face barriers not because of lack of ability, but because of lack of access to quality preparation.
            </p>

            <p className={`text-lg sm:text-xl leading-relaxed mb-6 ${
              isLightMode ? 'text-slate-700' : 'text-slate-300'
            }`}>
              We built this platform to democratize teacher preparation—to ensure that every aspiring educator, regardless of location or economic background, has access to comprehensive, expert-aligned resources and community support needed to succeed.
            </p>

            <p className={`text-lg sm:text-xl leading-relaxed ${
              isLightMode ? 'text-slate-700' : 'text-slate-300'
            }`}>
              Our commitment is to continuously improve and evolve based on the real experiences and outcomes of the educators we serve. Together, we're building a stronger, more inclusive teaching profession.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`relative overflow-hidden px-4 sm:px-6 lg:px-8 py-20 sm:py-28 ${
        isLightMode
          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
          : 'bg-gradient-to-r from-blue-600 to-blue-700'
      }`}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-lg sm:text-xl text-white/90 mb-10">
            Join a growing community of aspiring educators committed to excellence and professional growth.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 rounded-xl bg-white text-blue-600 font-bold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
          >
            Start Free Today →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-4 sm:px-6 lg:px-8 py-12 border-t ${
        isLightMode
          ? 'bg-slate-50 border-slate-200'
          : 'bg-slate-950 border-slate-800'
      }`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className={`text-xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                🎓 EduHub
              </div>
              <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Empowering aspiring educators with quality preparation and community support.
              </p>
            </div>
            <div>
              <h4 className={`font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Platform
              </h4>
              <ul className={`space-y-2 text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <li><a href="#" className="hover:text-blue-500 transition">Features</a></li>
                <li><a href="#" className="hover:text-blue-500 transition">About</a></li>
                <li><a href="#" className="hover:text-blue-500 transition">Mission</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Resources
              </h4>
              <ul className={`space-y-2 text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <li><a href="#" className="hover:text-blue-500 transition">Blog</a></li>
                <li><a href="#" className="hover:text-blue-500 transition">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-500 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className={`font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                Legal
              </h4>
              <ul className={`space-y-2 text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                <li><a href="#" className="hover:text-blue-500 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-500 transition">Terms</a></li>
                <li><a href="#" className="hover:text-blue-500 transition">Support</a></li>
              </ul>
            </div>
          </div>

          <div className={`text-center text-sm py-6 border-t ${
            isLightMode ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
          }`}>
            <p>© 2024 EduHub. Committed to empowering educators. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Animation styles */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
