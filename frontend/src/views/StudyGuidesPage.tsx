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
            type: 'content',
            heading: 'What is General Education?',
            content: 'General Education tests your foundational knowledge across various academic disciplines. It\'s not about being an expert in everything, but rather having a well-rounded understanding of basic concepts that every educated person should know. This ensures teachers can communicate effectively with students, answer their questions, and connect different subjects together. Think of it as building a strong foundation before constructing a building—without it, everything else falls apart.'
          },
          {
            type: 'content',
            heading: 'Why Does It Matter for Teachers?',
            content: 'As a teacher, you\'ll encounter students asking questions across many subjects. A student in your class might ask about history, science, or current events. General Education ensures you have enough knowledge to guide them properly. It also helps you understand the bigger picture of how different subjects relate to each other, making you a more effective educator who can inspire and guide students beyond just one specific subject area.'
          },
          {
            type: 'content',
            heading: 'English and Filipino Language Skills',
            content: 'This covers proper use of grammar, building your vocabulary, and understanding what you read. Grammar includes sentence structure, correct verb tenses, and punctuation. Vocabulary means knowing many words and their meanings. Reading comprehension means understanding the main ideas, details, and purpose of texts. You need these skills in both English and Filipino because the LET exam tests both languages. Practice identifying common grammar mistakes, learning new words daily, and reading various materials like news, books, and articles to improve comprehension.'
          },
          {
            type: 'content',
            heading: 'Mathematics for Teaching',
            content: 'Mathematics isn\'t just about getting the right answer. It\'s about understanding how and why things work. This section covers arithmetic (adding, subtracting, multiplying, dividing), algebra (using letters like X to solve problems), and geometry (shapes, measurements, angles). You need to understand these concepts deeply so you can explain them simply to students. Practice solving word problems, understanding what formulas mean, and thinking logically about mathematical situations. Many teaching concepts actually use these mathematical principles.'
          },
          {
            type: 'content',
            heading: 'Science Understanding the Natural World',
            content: 'Science explores how our world works. Physical Science covers matter, energy, forces, and motion like why objects fall or how electricity works. Biological Science covers living things including how plants and animals survive, how our bodies work, and how organisms interact. Environmental Science covers ecosystems, pollution, climate, and sustainability. Don\'t just memorize facts. Understand the concepts. For example, don\'t just memorize photosynthesis. Understand why plants need sunlight and how they convert it to energy. This helps you explain science in interesting ways to students.'
          },
          {
            type: 'content',
            heading: 'Social Sciences History Government and Society',
            content: 'This area covers Philippine history from pre-colonial times to present, the Philippine Constitution which is the basic laws that govern the country, and current events. You need to understand why historical events happened, not just when. For the Constitution, know the basic structure of government including Executive, Legislative, and Judicial branches, your rights as a citizen, and basic laws. Current events means staying informed about what\'s happening in the world. Read news regularly. Teachers need this knowledge to help students understand their country, their rights, and their role in society.'
          },
          {
            type: 'content',
            heading: 'Information Technology and Digital Skills',
            content: 'Information Technology means understanding how computers and the internet work. Basic computer literacy includes knowing how to use a computer, navigate the internet, use email, and create documents. Digital Safety means protecting yourself online and knowing about scams, password safety, and privacy. As a modern teacher, you need these skills to use educational technology in class, communicate with students and parents online, and teach students about safe internet use. The LET tests whether you understand basic computer concepts and can recognize online safety threats.'
          }
        ]
      },
      'Subject Matter Expertise': {
        title: 'Subject Matter Expertise',
        slides: [
          {
            type: 'content',
            heading: 'What is Subject Matter Expertise?',
            content: 'Subject Matter Expertise is deep knowledge of the subjects you teach. If you teach English, you need to understand literature, grammar, and communication deeply. If you teach Science, you need to know scientific concepts and how they work. If you teach Mathematics, you need to understand not just how to solve problems but why the methods work. This is different from General Education which gives you basic knowledge of many subjects. Subject Matter Expertise means becoming an expert in your specific teaching field.'
          },
          {
            type: 'content',
            heading: 'Why Deep Knowledge Matters',
            content: 'When you know your subject deeply, you teach better. You can answer unexpected student questions. You can connect your subject to real-world situations. You can see how concepts link together. You can explain things in multiple ways when students don\\\'t understand. Students can tell when you really know your subject versus when you\\\'re just reading from a book. Deep knowledge also helps you design better activities and assessments. Most importantly, your enthusiasm for the subject becomes contagious and students want to learn it.'
          },
          {
            type: 'content',
            heading: 'For Language Teachers',
            content: 'If you teach English or Filipino, you need expertise in literature, grammar, vocabulary, writing, speaking, and listening. You should read widely and understand different literary genres. You should know the rules of grammar and be able to explain why they exist. You should help students become excellent communicators in both written and spoken forms. You should understand how languages work and how people acquire language skills. This deep knowledge allows you to teach languages as a tool for communication, not just rules to memorize.'
          },
          {
            type: 'content',
            heading: 'For Math and Science Teachers',
            content: 'If you teach Mathematics or Science, you need to understand concepts deeply and know how they apply in the real world. In Math, understand that formulas aren\\\'t just rules but come from logical reasoning. In Science, understand that scientific knowledge comes from observation and experimentation. You should be able to explain why a formula works, why a scientific principle is true, and how these concepts apply to everyday situations. You should understand the history of how these fields developed. This helps you make abstract concepts concrete and interesting for students.'
          },
          {
            type: 'content',
            heading: 'For Social Studies Teachers',
            content: 'If you teach Social Studies, History, Geography, or Civics, you need expertise in understanding societies, cultures, and how people interact. You should understand Philippine history deeply and see how past events shape the present. You should understand how governments work and what rights and responsibilities citizens have. You should understand different cultures and respect diversity. You should help students think critically about social issues and become informed citizens. This expertise helps you teach students not just to pass tests but to become thoughtful, engaged members of society.'
          },
          {
            type: 'content',
            heading: 'Building Your Expertise',
            content: 'Subject Matter Expertise develops over time. Continue learning throughout your teaching career. Read books, take courses, attend workshops in your subject area. Learn about current developments in your field. Visit museums, laboratories, historical sites, or other places related to your subject. Talk to experts in your field. Join professional organizations for teachers in your subject. Stay curious and passionate about what you teach. Your continuous learning becomes a model for students about the importance of lifelong learning.'
          },
          {
            type: 'content',
            heading: 'Why It is Tested on the LET',
            content: 'The LET tests Subject Matter Expertise to ensure you know your subject well enough to teach it effectively. You might be asked about specific concepts, applications, or deeper understanding of content. The test checks not just that you memorized information but that you truly understand your subject. This ensures that teachers in the Philippines have the expertise needed to prepare students well. Subject Matter Expertise combined with Professional Education creates effective teachers who inspire students to love learning.'
          }
        ]
      },
      'Professional Education Overview': {
        title: 'Professional Education Overview',
        slides: [
          {
            type: 'content',
            heading: 'What is Professional Education?',
            content: 'Professional Education focuses on the science of being a teacher. It covers the legal, ethical, and theoretical frameworks that guide the teaching profession. Unlike General Education which tests your knowledge of different subjects, Professional Education tests whether you understand how to teach those subjects and what it means to be a professional educator in the Philippines.'
          },
          {
            type: 'content',
            heading: 'The Teaching Profession',
            content: 'This covers the history of the Philippine educational system, the ethics of teaching, and the Magna Carta for Public School Teachers which outlines your rights and responsibilities. You need to understand that teaching isn\'t just a job, it\'s a profession with a code of ethics. Teachers are expected to be role models for students and their communities. Know the professional standards and the laws that protect teachers and students in Philippine schools.'
          },
          {
            type: 'content',
            heading: 'Social Dimensions of Education',
            content: 'This explores how schools function within society. It includes understanding the relationship between school and society, how to communicate across different cultures and backgrounds, and the importance of peace education. As a teacher, you\'ll work with students from diverse backgrounds. You need to understand intercultural communication and how to create an inclusive classroom that promotes peace and understanding among students with different beliefs and experiences.'
          },
          {
            type: 'content',
            heading: 'Field Study and Practice Teaching',
            content: 'This is where theory meets reality. Field Study means observing real classrooms and learning how experienced teachers work. Practice Teaching means you actually teach a lesson in a real classroom under supervision. This section tests whether you understand how to apply educational theories in actual classroom settings with real students. You\'ll need to understand classroom dynamics, student behavior, and how to adapt your teaching based on student responses.'
          },
          {
            type: 'content',
            heading: 'Why Professional Education Matters',
            content: 'Professional Education ensures that you don\'t just know content, but know how to teach it effectively. It covers the legal and ethical responsibilities you have as a teacher. It prepares you for real classroom challenges. Understanding professional education helps you make informed decisions about student learning, classroom management, and your role in shaping the future of your students.'
          }
        ]
      },
      'Pedagogy and Teaching Methods': {
        title: 'Pedagogy and Teaching Methods',
        slides: [
          {
            type: 'content',
            heading: 'What is Pedagogy?',
            content: 'Pedagogy is simply the art and science of teaching. If General Education is about what to teach and Professional Education is about being a teacher, then Pedagogy is about how to teach effectively. Pedagogy addresses the strategies, methods, and techniques you use to help students learn. It\'s not enough to know your subject. You need to know how to present it in ways that different students can understand and learn from.'
          },
          {
            type: 'content',
            heading: 'Teaching Strategies for Learning',
            content: 'Different students learn in different ways. Differentiated instruction means adjusting your teaching for students with different learning levels, abilities, and styles. Inquiry-based learning means students ask questions and discover answers themselves rather than you just telling them. The 5E model includes Engage (get student interest), Explore (let them investigate), Explain (provide the concept), Elaborate (extend the learning), and Evaluate (check understanding). Good teachers use a variety of strategies depending on what they\'re teaching and who they\'re teaching.'
          },
          {
            type: 'content',
            heading: 'Classroom Management Techniques',
            content: 'Classroom management is about creating an environment where learning can happen. It\'s not just about discipline or keeping students quiet. It includes establishing clear rules and expectations, creating a positive learning environment where students feel safe and respected, managing your time effectively so lessons flow well, and handling student behavior in ways that teach rather than punish. Good classroom management prevents behavior problems before they start and addresses them constructively when they occur.'
          },
          {
            type: 'content',
            heading: 'Assessment of Student Learning',
            content: 'Assessment means checking whether students have learned what you taught. Traditional assessments include tests and quizzes. Authentic assessments include projects, presentations, and real-world tasks. You need to understand different grading systems and how to interpret test scores. This includes understanding statistical data like mean (average), standard deviation (how spread out scores are), and quartiles (dividing scores into groups). Assessment helps you know if your teaching is working and where students need more help.'
          },
          {
            type: 'content',
            heading: 'Connecting Assessment to Instruction',
            content: 'Good teachers use assessment not just to give grades, but to improve their teaching. You assess students before teaching to know what they already know. You assess during teaching to check understanding and adjust. You assess after teaching to know if learning happened. This is called formative and summative assessment. Understanding assessment helps you make better decisions about what to teach next and how to help struggling students.'
          }
        ]
      },
      'Educational Psychology': {
        title: 'Educational Psychology',
        slides: [
          {
            type: 'content',
            heading: 'What is Educational Psychology?',
            content: 'Educational Psychology is the study of how people learn. It combines psychology with education. Understanding your students goes beyond just understanding the subject you teach. You need to understand how students think, how they grow, what motivates them, and how they process information. The better you understand your students as learners, the better you can teach them. This is one of the most important areas for becoming an effective teacher.'
          },
          {
            type: 'content',
            heading: 'Learner Development',
            content: 'Students develop in three ways. Physical development includes growth of the body and brain. Cognitive development means how their thinking abilities change as they age. Socio-emotional development includes how they develop emotionally, how they interact with peers, and how they form relationships. As a teacher, you need to understand what physical, cognitive, and emotional abilities students have at different ages. A teaching method that works for high school students won\'t work for elementary students because they develop differently.'
          },
          {
            type: 'content',
            heading: 'Learning Theories in Practice',
            content: 'Different theories explain how people learn. Behaviorism says people learn through rewards and punishments, repetition, and practice. Cognitivism focuses on how people think and process information. Piaget said children think differently at different ages and must move through stages of thinking. Constructivism says people build their own understanding through experience. Vygotsky talked about how social interaction and culture affect learning. No single theory is completely right. Good teachers use ideas from all these theories depending on what and who they\'re teaching.'
          },
          {
            type: 'content',
            heading: 'Zone of Proximal Development',
            content: 'This comes from Vygotsky. It\'s the gap between what a student can do alone and what they can do with help. For example, a child might not be able to read a complex book alone, but can understand it if an adult reads it with them and explains. As a teacher, your job is to provide just enough help so students can do things they couldn\'t do alone. This is called scaffolding. Over time, students need less help as they become independent. Understanding ZPD helps you know when to challenge students and when to provide support.'
          },
          {
            type: 'content',
            heading: 'Motivation and Student Needs',
            content: 'Understanding what motivates students is crucial. Intrinsic motivation means students want to learn because they find it interesting or important. Extrinsic motivation means students learn for grades, rewards, or to avoid punishment. Maslow\'s Hierarchy of Needs explains that students have basic needs (food, safety) before they can focus on learning. If a student is hungry or feels unsafe, they won\'t learn well no matter how good your lesson is. Good teachers create classrooms where students feel safe, respected, and motivated to learn for their own reasons, not just for grades.'
          }
        ]
      },
      'Curriculum Development': {
        title: 'Curriculum Development',
        slides: [
          {
            type: 'content',
            heading: 'What is Curriculum?',
            content: 'Curriculum is everything students learn in school. It\'s not just textbooks and lessons. It includes what you plan to teach, how you teach it, the materials you use, and even what students learn through interactions with each other. Curriculum Development is the process of planning, designing, implementing, and then evaluating what students learn. Good curriculum aligns with national standards but also responds to local community needs. It\'s constantly being improved based on how well it works.'
          },
          {
            type: 'content',
            heading: 'Curriculum Models',
            content: 'There are different ways to organize curriculum. A linear model moves step by step through content from basic to complex. A cyclical model revisits topics at deeper levels each time. A dynamic model adjusts based on student needs and current events. The Philippine Department of Education uses the K-12 Program which is structured as a spiral curriculum where students return to topics year after year but understand them more deeply each time. Understanding these models helps you see how individual lessons fit into the bigger picture of student learning.'
          },
          {
            type: 'content',
            heading: 'Phases of Curriculum Work',
            content: 'Curriculum Planning means deciding what students should learn and why. Curriculum Design means creating the actual learning experiences, lessons, and assessments. Curriculum Implementation means actually teaching using the designed curriculum. Curriculum Evaluation means checking if the curriculum worked and if students learned. You don\'t just teach lessons that someone else planned. You participate in all these phases. As a teacher, you help implement the national curriculum but also adapt it for your specific students and community.'
          },
          {
            type: 'content',
            heading: 'National Standards and Local Context',
            content: 'The Philippines has national standards for what all students should know. The K-12 Program provides these standards. However, curriculum isn\'t one-size-fits-all. You need to align with national standards while also responding to your local community\'s needs. If you teach in a fishing community, you might include lessons about ocean ecology and fishing practices. If you teach in an urban area, you might include lessons about city life and technology. Good teachers balance national requirements with local relevance.'
          },
          {
            type: 'content',
            heading: 'Why Curriculum Development Matters',
            content: 'Understanding curriculum development helps you be more than just a teacher who follows a textbook. You become a professional who can evaluate what students need to learn, design meaningful learning experiences, and assess whether learning actually happened. This knowledge helps you make decisions about what to emphasize, what to skip, and how to make learning relevant and engaging for your particular students in your particular community.'
          }
        ]
      }
    };

    return modalContent[guideName] || {
      title: guideName,
      slides: [
        {
          type: 'content',
          heading: 'Guide Overview',
          content: 'This comprehensive guide provides in-depth coverage of essential concepts and practical strategies for LET exam preparation. Study the material carefully and take notes on key points.'
        },
        {
          type: 'content',
          heading: 'Key Focus Areas',
          content: 'This guide covers important topics that are commonly tested in the LET examination. Understanding these concepts will help you prepare effectively and boost your confidence during the exam.'
        },
        {
          type: 'content',
          heading: 'How to Use This Guide',
          content: 'Read through each section carefully, take notes, and review regularly. Don\\\'t just memorize information. Try to understand the concepts so you can explain them to others. This deeper understanding will help you answer exam questions correctly.'
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
                      Click to explore detailed lessons and study materials
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
