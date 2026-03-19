import { useState, useEffect } from 'react';
import { useTheme } from '../providers/ThemeProvider';
import { useNavigate } from 'react-router-dom';

export function StudyGuidesPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLightMode = theme === 'light';

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
    </div>
  );
}
