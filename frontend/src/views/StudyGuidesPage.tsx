import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useNavigate } from 'react-router-dom';

interface GuideModalData {
  title: string;
  slides: Array<{
    type: 'image' | 'content';
    image?: string;
    heading?: string;
    content?: string;
  }>;
}

export function StudyGuidesPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLightMode = theme === 'light';
  const [selectedGuide, setSelectedGuide] = useState<GuideModalData | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const getGuideModalData = (guideName: string): GuideModalData => {
    const modalContent: Record<string, GuideModalData> = {
      'General Education Fundamentals': {
        title: 'General Education Fundamentals',
        slides: [
          {
            type: 'image',
            image: 'https://cdn.builder.io/api/v1/image/assets%2F0628b4d8acdd434d9317f96069ddf2de%2F015f382331944efd899b2d08bb2dd5af?format=webp&width=800&height=1200'
          },
          {
            type: 'content',
            heading: 'Overview',
            content: 'General Education in the Philippines focuses on foundational knowledge and skills essential for all educators. This includes comprehension of Filipino history, cultural values, and contemporary educational philosophies.'
          },
          {
            type: 'content',
            heading: 'Core Concepts',
            content: 'Key areas include: Filipino nationalism, constitutional awareness, environmental science, ethics and values education, and digital literacy for the 21st century.'
          },
          {
            type: 'content',
            heading: 'Preparation Tips',
            content: 'Focus on understanding the Philippine Constitution, historical events, and cultural context. Review key principles in values education and their application in modern society.'
          }
        ]
      },
      'Professional Education Overview': {
        title: 'Professional Education Overview',
        slides: [
          {
            type: 'image',
            image: 'https://cdn.builder.io/api/v1/image/assets%2F0628b4d8acdd434d9317f96069ddf2de%2F015f382331944efd899b2d08bb2dd5af?format=webp&width=800&height=1200'
          },
          {
            type: 'content',
            heading: 'Purpose',
            content: 'Professional Education equips teachers with pedagogical knowledge, understanding of learning theories, classroom management strategies, and assessment methodologies.'
          },
          {
            type: 'content',
            heading: 'Key Components',
            content: 'Includes child development, learning theories (Piaget, Vygotsky, Bloom), teaching methods, classroom management, and educational assessment techniques.'
          },
          {
            type: 'content',
            heading: 'Study Focus',
            content: 'Master learning outcomes, different teaching approaches, student assessment strategies, and implementation of the DepEd curriculum framework.'
          }
        ]
      }
    };

    return modalContent[guideName] || {
      title: guideName,
      slides: [
        {
          type: 'image',
          image: 'https://cdn.builder.io/api/v1/image/assets%2F0628b4d8acdd434d9317f96069ddf2de%2F015f382331944efd899b2d08bb2dd5af?format=webp&width=800&height=1200'
        },
        {
          type: 'content',
          heading: 'Learning Objectives',
          content: 'This guide provides comprehensive coverage of key concepts and practical strategies for LET exam preparation.'
        },
        {
          type: 'content',
          heading: 'Main Topics',
          content: 'Explore in-depth content covering all essential areas tested in the LET examination.'
        }
      ]
    };
  };

  const studyGuideCategories = [
    {
      id: 'content-knowledge',
      title: 'Content Knowledge Guides',
      icon: '📖',
      description: 'In-depth guides covering all LET exam topics including General Education and Professional Education subjects',
      guides: [
        'General Education Fundamentals',
        'Professional Education Overview',
        'Subject Matter Expertise',
        'Pedagogy and Teaching Methods',
        'Educational Psychology',
        'Curriculum Development'
      ]
    },
    {
      id: 'exam-strategies',
      title: 'Exam Strategy Guides',
      icon: '🎯',
      description: 'Proven strategies and techniques for tackling different question types and time management',
      guides: [
        'Multiple Choice Strategy',
        'Time Management Techniques',
        'Stress Management During Exam',
        'Test-Taking Tips and Tricks',
        'Common Pitfalls to Avoid',
        'Last-Minute Preparation Guide'
      ]
    },
    {
      id: 'subject-review',
      title: 'Subject Review Guides',
      icon: '📚',
      description: 'Comprehensive reviews of all LET examination subjects with key concepts and practice questions',
      guides: [
        'English Language and Communication',
        'Mathematics Fundamentals',
        'Science and Technology',
        'Filipino and Philippine Government',
        'Social Studies and Values Education',
        'Subject-Specific Deep Dives'
      ]
    },
    {
      id: 'study-skills',
      title: 'Study Skills and Techniques',
      icon: '🧠',
      description: 'Develop effective study habits, note-taking methods, and learning techniques',
      guides: [
        'Effective Note-Taking Methods',
        'Memory Improvement Techniques',
        'Active Learning Strategies',
        'Study Schedule Planning',
        'Building Study Groups',
        'Managing Test Anxiety'
      ]
    },
    {
      id: 'resource-guides',
      title: 'Resource and Reference Guides',
      icon: '🔍',
      description: 'Curated lists of helpful resources, references, and tools for LET preparation',
      guides: [
        'Recommended Books and Textbooks',
        'Online Learning Platforms',
        'Free Educational Resources',
        'Official PRC Guidelines',
        'Past Exam Question Collections',
        'Glossary of Key Terms'
      ]
    },
    {
      id: 'success-stories',
      title: 'Success Stories and Tips',
      icon: '⭐',
      description: 'Real stories from successful LET passers and their preparation advice',
      guides: [
        'How I Passed the LET',
        'Study Plans from Top Performers',
        'Overcoming Learning Challenges',
        'Balancing Work and Study',
        'Cultural and Language Considerations',
        'Teacher-Specific Preparation Tips'
      ]
    }
  ];

  return (
    <div className={`transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-b from-green-50 via-white to-slate-50'
        : 'bg-[#051b15]'
    }`}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className={`text-4xl font-black mb-3 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            📖 Study Guides
          </h1>
          <p className={`text-lg ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Comprehensive guides covering all types of LET exam preparation for Filipino educators
          </p>
        </div>



        {/* Study Guides Grid */}
        <div className="space-y-8">
          {studyGuideCategories.map((category) => (
            <div key={category.id}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-4xl">{category.icon}</span>
                <div>
                  <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                    {category.title}
                  </h2>
                  <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.guides.map((guide, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedGuide(getGuideModalData(guide));
                      setCurrentSlide(0);
                    }}
                    className={`rounded-xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer ${
                      isLightMode
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <h3 className={`font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {guide}
                    </h3>
                    <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                      Access comprehensive guide and resources
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className={`mt-16 rounded-2xl p-8 backdrop-blur-xl border ${
          isLightMode
            ? 'bg-white border-slate-200'
            : 'bg-slate-800/40 border-slate-700'
        }`}>
          <h2 className={`text-2xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            ✨ How to Use These Guides
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className={`font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                1. Select Your Guides
              </h3>
              <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Choose guides based on your weak areas and learning style preferences
              </p>
            </div>
            <div>
              <h3 className={`font-semibold mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                2. Follow the Path
              </h3>
              <p className={`text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                Study systematically and track your progress as you master each topic
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      {selectedGuide && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 transition-opacity"
            onClick={() => setSelectedGuide(null)}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className={`relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl ${
                isLightMode ? 'bg-white' : 'bg-slate-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                className={`px-6 py-4 border-b flex items-center justify-between ${
                  isLightMode
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <h2 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                  {selectedGuide.title}
                </h2>
                <button
                  onClick={() => setSelectedGuide(null)}
                  className={`text-2xl leading-none transition hover:scale-110 ${
                    isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>

              {/* Slide Content */}
              <div className="relative w-full bg-black min-h-96 flex items-center justify-center overflow-hidden">
                {selectedGuide.slides[currentSlide].type === 'image' ? (
                  <img
                    src={selectedGuide.slides[currentSlide].image}
                    alt="Guide slide"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className={`w-full h-full p-8 flex flex-col justify-center ${
                    isLightMode ? 'bg-slate-50' : 'bg-slate-800'
                  }`}>
                    <h3 className={`text-2xl font-bold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                      {selectedGuide.slides[currentSlide].heading}
                    </h3>
                    <p className={`text-base leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
                      {selectedGuide.slides[currentSlide].content}
                    </p>
                  </div>
                )}
              </div>

              {/* Slide Navigation */}
              <div className={`px-6 py-4 border-t flex items-center justify-between ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-slate-800 border-slate-700'
              }`}>
                <button
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    currentSlide === 0
                      ? isLightMode
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : isLightMode
                      ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  ← Previous
                </button>

                <div className={`text-sm font-medium ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  Slide {currentSlide + 1} of {selectedGuide.slides.length}
                </div>

                <button
                  onClick={() => setCurrentSlide(Math.min(selectedGuide.slides.length - 1, currentSlide + 1))}
                  disabled={currentSlide === selectedGuide.slides.length - 1}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    currentSlide === selectedGuide.slides.length - 1
                      ? isLightMode
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : isLightMode
                      ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                      : 'bg-slate-700 text-white hover:bg-slate-600'
                  }`}
                >
                  Next →
                </button>
              </div>

              {/* Slide Indicators */}
              <div className={`px-6 py-3 flex justify-center gap-2 ${
                isLightMode ? 'bg-slate-50' : 'bg-slate-800'
              }`}>
                {selectedGuide.slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2 h-2 rounded-full transition ${
                      idx === currentSlide
                        ? isLightMode
                          ? 'bg-slate-900'
                          : 'bg-white'
                        : isLightMode
                        ? 'bg-slate-300'
                        : 'bg-slate-600'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
