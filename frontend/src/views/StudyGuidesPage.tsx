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
            content: 'General Education tests your foundational knowledge across various academic disciplines. It\'s not about being an expert in everything, but rather having a well-rounded understanding of basic concepts that every educated person should know. This ensures teachers can communicate effectively with students, answer their questions, and connect different subjects together. Think of it as building a strong foundation before constructing a building. Without it, everything else falls apart.'
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
            content: 'When you know your subject deeply, you teach better. You can answer unexpected student questions. You can connect your subject to real-world situations. You can see how concepts link together. You can explain things in multiple ways when students don\'t understand. Students can tell when you really know your subject versus when you\'re just reading from a book. Deep knowledge also helps you design better activities and assessments. Most importantly, your enthusiasm for the subject becomes contagious and students want to learn it.'
          },
          {
            type: 'content',
            heading: 'For Language Teachers',
            content: 'If you teach English or Filipino, you need expertise in literature, grammar, vocabulary, writing, speaking, and listening. You should read widely and understand different literary genres. You should know the rules of grammar and be able to explain why they exist. You should help students become excellent communicators in both written and spoken forms. You should understand how languages work and how people acquire language skills. This deep knowledge allows you to teach languages as a tool for communication, not just rules to memorize.'
          },
          {
            type: 'content',
            heading: 'For Math and Science Teachers',
            content: 'If you teach Mathematics or Science, you need to understand concepts deeply and know how they apply in the real world. In Math, understand that formulas aren\'t just rules but come from logical reasoning. In Science, understand that scientific knowledge comes from observation and experimentation. You should be able to explain why a formula works, why a scientific principle is true, and how these concepts apply to everyday situations. You should understand the history of how these fields developed. This helps you make abstract concepts concrete and interesting for students.'
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
      'Multiple Choice Strategy': {
        title: 'Multiple Choice Mastery',
        slides: [
          {
            type: 'content',
            heading: 'Multiple Choice Mastery',
            content: 'Since the LET is entirely objective, your ability to navigate distractors is key. Multiple choice questions test not just what you know, but how well you can identify the best answer among plausible options. Mastering this skill can significantly improve your score. In fact, test construction experts design incorrect answer choices (distractors) to appeal to common misconceptions or to test careless reading. Understanding the psychology behind these questions puts you at a major advantage. When you know how test makers think, you can spot their tricks and avoid the traps they set.'
          },
          {
            type: 'content',
            heading: 'The Power of Elimination',
            content: 'Cross out options that are clearly incorrect or contain "absolute" words like Always, Never, Only, Must, or Every. These extreme words rarely appear in correct answers because education and teaching are nuanced fields with exceptions. By eliminating 1-2 obviously wrong answers, you improve your odds on the remaining choices. Example: "Students will NEVER learn effectively if they don\'t..." is likely wrong because there are always exceptions. Instead, look for moderate language like "Students generally learn better when...", "Most effective teachers...", or "In most cases...". This moderate language reflects educational reality better.'
          },
          {
            type: 'content',
            heading: 'Identify the Distractor',
            content: 'Be wary of "plausible but incorrect" options that look like the right answer but don\'t quite fit the specific context of the question. These distractors are carefully constructed to catch students who haven\'t read carefully or who are rushing. Read the question stem multiple times if needed. Example: A question might ask "Which assessment method is BEST for evaluating student growth over time?" Option A says "Multiple choice tests" which ARE assessments, but they\'re not best for showing growth over time. Option B says "Portfolios showing student work samples" which directly addresses growth over time. The distractor (A) is true but doesn\'t answer the specific question asked.'
          },
          {
            type: 'content',
            heading: 'Grammatical Alignment',
            content: 'Ensure the answer you choose grammatically matches the stem of the question. For example, if the question asks "Which of the following is..." look for an answer that is a noun or noun phrase. If it asks "How should a teacher...", look for verbs or action phrases. This technique alone can eliminate 25% of options without even knowing the content. Example: If a question asks "The primary purpose of formative assessment is to..." the correct answer must be a complete phrase that follows logically like "identify areas where students need additional support" not "multiple choice tests" (which doesn\'t fit grammatically). Pay attention to whether the blank requires a noun, verb, adjective, or complete phrase.'
          },
          {
            type: 'content',
            heading: 'The Umbrella Rule',
            content: 'If two or more options seem correct, look for the "umbrella" answer—the choice that is broad enough to include the other correct points within it. The most comprehensive and inclusive answer is typically correct. Example: Question asks "What should a teacher do to create an inclusive classroom?" Options: A) Use visuals for English language learners, B) Provide extra time for students with disabilities, C) Use differentiated instruction to meet diverse learner needs, D) Have students sit together in groups. Answer C is the umbrella because differentiated instruction encompasses both A and B plus many other strategies. The umbrella answer is the principle or concept that covers all the specific strategies. Look for answers that are broader in scope when multiple options seem correct.'
          }
        ]
      },
      'Time Management Techniques': {
        title: 'Strategic Time Management',
        slides: [
          {
            type: 'content',
            heading: 'Strategic Time Management',
            content: 'The LET is a marathon, not a sprint. You have a set number of hours to finish hundreds of questions across different subject areas. How you allocate your time can be just as important as knowing the content. Effective time management prevents you from getting stuck on difficult questions while missing easy ones later. Many students fail not because they don\'t know the answers, but because they run out of time. By using proven time management strategies, you maximize the number of questions you answer correctly. Remember: five correct easy answers are better than two correct hard answers. Speed is less important than strategic thinking about which questions to tackle when.'
          },
          {
            type: 'content',
            heading: 'The Three-Pass Method',
            content: 'First Pass (Speed Round): Answer all easy questions you know instantly. Skip the ones that require deep thought. Don\'t read slowly or double-check. If you know it, shade it and move on. This builds confidence and secures quick points fast. Second Pass (Reflection Round): Go back to the "maybe" questions and dedicate more time to analyze them carefully. This is when you can use elimination strategies and think through options. Third Pass (Challenge Round): Tackle the difficult or math-heavy problems with your remaining time. You\'ll be fresher because you already have many correct answers. Example: In a 200-question test, you might answer 80 easy questions in first pass (30 minutes), 60 medium questions in second pass (40 minutes), leaving 60 minutes for 60 difficult questions.'
          },
          {
            type: 'content',
            heading: 'The 1-Minute Rule',
            content: 'If you haven\'t made progress on a question within 60 seconds, mark it and move on. Never let one difficult question "steal" time from five easy ones later in the test. You can return to it during the third pass if time permits. Spending 5 minutes on one hard question means missing 3-4 easier questions. Example: You encounter a complex math problem about statistics. You read it, try to set it up, but get confused. Rather than spending another 3 minutes trying different approaches, take 5 more seconds to make an educated guess, mark it for review, and move to the next question. You\'ll probably pick up 2-3 easy questions in that same 5 minutes. The math of it is clear: missing one hard question is better than missing multiple easy ones.'
          },
          {
            type: 'content',
            heading: 'How to Answer Situational Questions',
            content: 'Situational questions describe a classroom scenario and ask how you would respond. These test your judgment and professional ethics, not just content knowledge. Read the situation carefully and look for the key details—what exactly is the problem? Is it a behavior issue, a learning issue, or an emotional issue? Identify the specific problem or challenge before looking at options. Then evaluate each option based on best teaching practices, professional standards, and student welfare. Example: A situational question describes a student who is always late to class and has started failing. Options might include: A) Give the student detention, B) Call the student\'s parents to understand why they\'re late, C) Recommend the student transfer to another class, D) Fail the student. The best answer usually involves understanding the root cause (B) rather than punishment or avoidance.'
          },
          {
            type: 'content',
            heading: 'Situational Questions Strategy',
            content: 'Eliminate answers that are unprofessional, harmful to students, or violate teaching ethics. Watch for options that seem to solve the immediate problem but create bigger issues. The correct answer usually involves communication, proper protocols, and considering the student\'s perspective. When in doubt, choose the response that is most respectful and supportive of student development. Example: A student cheats on a test. Bad answers: "Publicly embarrass them", "Give them an F without investigating", "Ignore it". Good answer: "Have a private conversation to understand why, contact parents, follow school protocol, offer support or tutoring". The best answer shows the teacher as a professional who is firm but fair, and who wants to help the student improve rather than just punish them.'
          }
        ]
      },
      'Stress Management During Exam': {
        title: 'Stress Management & Mental Focus',
        slides: [
          {
            type: 'content',
            heading: 'Stress Management & Mental Focus',
            content: 'Your state of mind directly affects your recall ability. Test anxiety can cause you to forget information you actually know or misread questions. Neuroscience shows that anxiety activates the amygdala (your fear center) and reduces activity in the prefrontal cortex (your thinking center). This means when you\'re anxious, your brain literally cannot think as clearly. Learning stress management techniques is just as important as studying the content. Many test takers fail not because they don\'t know the material, but because anxiety prevented them from accessing what they knew. The good news is that these techniques are proven to work and take only seconds to apply during the exam.'
          },
          {
            type: 'content',
            heading: 'Box Breathing Technique',
            content: 'If you feel panic rising, use the 4-4-4-4 technique: Inhale slowly for 4 seconds, hold your breath for 4 seconds, exhale slowly for 4 seconds, hold empty for 4 seconds. Repeat 5-10 times. This technique activates your parasympathetic nervous system and calms your body\'s stress response. It\'s quick enough to use during the exam without losing much time. Why it works: Your body cannot be in fight-or-flight mode and relaxation mode simultaneously. Deep breathing forces your nervous system into relaxation. Example: You\'re on question 47 and panic starts building. Take 20 seconds for box breathing (about 5 cycles). Your heart rate will slow, your mind will clear, and you can return to the question with fresh perspective. This is far better than trying to push through panic.'
          },
          {
            type: 'content',
            heading: 'Positive Visualization',
            content: 'Before the exam starts, spend two minutes visualizing yourself calmly answering questions and shading the final circle successfully. Imagine yourself confident and focused. Visualization prepares your brain for success and reduces anxiety by making the experience feel familiar. Create a detailed mental movie: See yourself walking into the testing room, opening the test booklet, reading questions clearly, making good choices confidently, and handing in your completed test with satisfaction. Athletes use visualization before competitions because it\'s scientifically proven to improve performance. Your brain doesn\'t distinguish between vivid imagination and real experience, so this primes your brain for success.'
          },
          {
            type: 'content',
            heading: 'Managing Test Anxiety During the Day',
            content: 'During the lunch break, avoid discussing answers with others. It only increases anxiety for the second half of the day. Instead, take a walk outside, eat a balanced meal with protein and carbs, and mentally prepare for the afternoon session. If you\'re worried you got something wrong in the morning session, remember that one or two questions won\'t determine your pass or fail. The LET typically requires around 60-70% to pass, so you have a buffer. Example scenario: You finish the morning portion and worried you got 10-15 questions wrong. That\'s probably fine if the test has 100 morning questions—you\'re still at 85-90%. Instead of spiraling in anxiety, focus on fresh performance in the afternoon portion. What you do now affects your afternoon performance, not past performance.'
          },
          {
            type: 'content',
            heading: 'Mental Reset Strategies',
            content: 'If you encounter a difficult question, take a breath, mark it, and move on. Don\'t let frustration build. Remember that everyone finds some questions difficult. Your goal is to answer as many as you can correctly, not to answer every single one. Maintaining a calm, focused mindset throughout the exam is crucial. Think of it like a video game with multiple levels—you don\'t have to beat every single enemy (question) on the first level (first pass). Some enemies are harder than others. Your strategy is to beat the easy enemies quickly, then come back for the harder ones. The same applies here. If you spend 5 minutes on one question and feel frustrated, you\'re losing both time and mental clarity. A strategic retreat (moving on) is a victory, not a defeat.'
          }
        ]
      },
      'Test Taking Tips and Tricks': {
        title: 'Test Taking Tips and Tricks',
        slides: [
          {
            type: 'content',
            heading: 'Common Test-Taking Strategies',
            content: 'Beyond content knowledge, smart test-taking strategies can boost your score by up to 5-10 points. These techniques help you work more efficiently, avoid careless mistakes, and improve your odds on questions where you\'re unsure. Professional test takers know that the difference between a 75 score and an 80 score often comes from technique, not from knowing more content. These are practical tricks that you can implement immediately during your exam. They require no additional studying, just smart execution.'
          },
          {
            type: 'content',
            heading: 'Reading the Question Carefully',
            content: 'Read the entire question stem before looking at the options. Understand what is being asked. Is it asking for the best answer or asking what is NOT true? Pay special attention to negations like NOT, EXCEPT, LEAST, or DOESN\'T. Highlight or circle these words in your test booklet so you don\'t miss them. Reread the question if the options seem confusing. Example: "Which of the following is NOT a characteristic of effective teaching?" If you miss the word NOT, you\'ll choose an answer that IS a characteristic when you should choose one that ISN\'T. This is one of the most common mistakes. Slow down on the question stem, speed up on the options.'
          },
          {
            type: 'content',
            heading: 'Cover the Options While Reading',
            content: 'When you first read a question, cover the options with your hand or a piece of paper. Try to answer the question in your own words before looking at the choices. This prevents the options from biasing your thinking and helps you think more clearly about what the answer should be. Example: Question asks "What is the primary purpose of formative assessment?" Without looking at options, you might think "to see where students are struggling so you can help them improve." Then look at options. If option B is "to identify learning gaps and provide feedback for improvement," you recognize it matches your thinking. If option A is "to assign grades," you know it\'s wrong. This strategy stops you from being led astray by clever distractors.'
          },
          {
            type: 'content',
            heading: 'Pattern Recognition',
            content: 'While avoiding overreliance on patterns, it\'s worth noting that in well-constructed tests, answer choices are fairly evenly distributed. If you\'ve answered many questions with "A" in a row, it\'s somewhat more likely the next right answer is B, C, or D. However, never select an answer just because of patterns. Always choose based on content. Use this only as a tiebreaker when genuinely unsure. Example: You\'re torn between options C and D. You recently chose C for the last 3 questions. The pattern suggests D might be next, but only consider this if you truly cannot decide between them on content. If option C is clearly better, choose C regardless of pattern.'
          },
          {
            type: 'content',
            heading: 'Mark and Review Strategy',
            content: 'Mark questionable answers as you go using a pencil mark in your test booklet, but only return to them if time permits. Keep a mental note or physical mark of questions you found tricky. After finishing all questions, if you have time remaining, review only the marked ones, not all questions. This focused review is more efficient than checking all answers. Example: You mark questions 23, 45, 67, and 89 as uncertain. If you finish the entire test with 10 minutes left, reviewing only these 4 questions is smart. Reviewing all 200 questions would waste time. This strategy ensures you maximize improvements using remaining time efficiently.'
          }
        ]
      },
      'Common Pitfalls to Avoid': {
        title: 'Common Pitfalls to Avoid',
        slides: [
          {
            type: 'content',
            heading: 'Common Pitfalls to Avoid',
            content: 'Many students lose points not because they don\'t know the content, but because they fall into predictable traps. Research shows that 20-30% of test failures are due to careless mistakes rather than lack of knowledge. Being aware of these pitfalls can help you avoid unnecessary mistakes and possibly boost your score by 3-5 points. These are the most common errors made by test takers, and knowing about them gives you an advantage.'
          },
          {
            type: 'content',
            heading: 'Misreading the NOT',
            content: 'Many students miss questions because they overlook words like EXCEPT, NOT, DOESN\'T, or LEAST. These negation words completely change what the question is asking. When you see these words, circle them or highlight them in your test booklet right away. Practice identifying negation words in your prep so they jump out at you during the test. Example: Question asks "Which of the following is NOT a benefit of cooperative learning?" If you miss the word NOT, you might choose "Promotes teamwork" which IS a benefit, when the question wants you to choose something that is NOT a benefit. This single word error costs you the entire question. Make a habit: whenever you see NOT, EXCEPT, EXCEPT, or LEAST—physically mark it in your booklet.'
          },
          {
            type: 'content',
            heading: 'Shading Errors',
            content: 'Always double-check that the number on your answer sheet matches the number in your test booklet. Shading the wrong circle for the right answer loses you the point. This error is surprisingly common when people get tired or rush. Periodically check that your answer sheet is synchronized with your test booklet number—perhaps every 20 questions. Example: You knew the answer to question 45 perfectly, but you shaded it in the number 46 circle on your answer sheet. Your knowledge didn\'t matter. The machine scored it wrong. This is 100% avoidable with periodic checks. Take 5 seconds every 20 questions to verify synchronization. It\'s better to be safe than sorry.'
          },
          {
            type: 'content',
            heading: 'Overthinking and Changing Answers',
            content: 'Often, your first instinct is correct. Research in test psychology shows that changing answers is correct only about 20-30% of the time. Most people change correct answers to incorrect ones. Avoid changing your answers unless you have found a definitive reason to do so. Only change an answer if you: (1) realize you misread the question, (2) suddenly remember relevant information, or (3) catch a logical error in your reasoning. Example: You answer question 30 with option B based on your first reading. Later, you second-guess and think maybe option C is better. When you change it, you move from correct to incorrect. This happens more often than change being an improvement. Trust your preparation and your first thoughtful answer.'
          },
          {
            type: 'content',
            heading: 'Mental Traps to Avoid',
            content: 'Don\'t fall for options that contain true statements but don\'t answer the specific question asked. Don\'t choose answers just because they match similar topics you studied. Don\'t assume the longest or shortest answer is correct. Read carefully and think critically about each option. Example trap: Question asks "What is the BEST way to teach reading comprehension to struggling readers?" Option A says "Reading is important for student success" (true, but doesn\'t answer HOW to teach). Option B says "Use guided reading with explicit comprehension strategies" (answers the question). Many students pick A because it\'s true, missing that B actually answers the question asked. Another trap: If you just studied metacognition, and a question appears about student learning, don\'t immediately jump to the metacognition answer unless it truly fits. Stay focused on what the question actually asks.'
          }
        ]
      },
      'Last Minute Preparation Guide': {
        title: 'Last Minute Preparation',
        slides: [
          {
            type: 'content',
            heading: 'Last Minute Preparation (Final 48 Hours)',
            content: 'What you do in the final two days before the exam can significantly impact your performance. The focus shifts from learning new content to reinforcing what you know and preparing mentally and logistically. Many test takers waste these crucial final days by either cramming new material (which backfires) or by doing nothing and increasing anxiety. There\'s a sweet spot: maintain what you\'ve learned, reduce anxiety, and prepare yourself mentally for success. Think of it like an athlete preparing for a big game. The training is done. Now it\'s about rest, mental focus, and logistics.'
          },
          {
            type: 'content',
            heading: 'The No-New-Info Rule',
            content: 'Stop trying to learn complex new concepts 48 hours before the test. Instead, review your summarized notes and mnemonics that you\'ve already mastered. Your brain needs consolidation time, not new information. Trying to learn new concepts 48 hours before creates anxiety and interferes with retrieval of information you already know. Focus on active recall—test yourself, don\'t just reread notes. Review the most important concepts and high-frequency topics. Example: If you haven\'t fully learned Bloom\'s Taxonomy by 48 hours before, don\'t start then. Instead, review the version you studied 2 weeks ago. Quick refresher of known material boosts confidence. New complex material creates panic and cognitive overload.'
          },
          {
            type: 'content',
            heading: 'Logistics Preparation',
            content: 'Prepare your NOA (Notice of Admission), pencils (No. 2 with erasers), black ballpen, and valid government-issued ID the night before. Check that your pencils have sharp points and functioning erasers. Know the exact location of the test venue and plan your route including travel time and potential traffic. Check exam start time and arrive 30 minutes early to settle in and avoid stress. Have everything you need so you can focus entirely on the exam rather than worrying about materials. Example checklist: NOA ✓, 2-3 No. 2 pencils ✓, Black ballpen ✓, Valid ID ✓, Directions to venue ✓, Transportation plan ✓, Approved items only (no phones, calculators, etc.). Don\'t discover problems on exam day.'
          },
          {
            type: 'content',
            heading: 'Physical Prime: Rest and Nutrition',
            content: 'Prioritize 7-8 hours of sleep the night before the exam. This is not negotiable. A fatigued brain cannot process logic as effectively as a rested one. Sleep deprivation causes a 15-20% decline in cognitive performance. On exam day, eat a healthy, balanced breakfast with protein, complex carbs, and healthy fats. Examples: Eggs with whole grain toast, oatmeal with nuts and fruit, or rice with viand. Avoid sugary breakfasts that cause energy crashes mid-test. Avoid heavy foods that might make you sluggish. Stay hydrated—drink water before and during the exam (if permitted). Your physical state directly impacts your cognitive performance. Athletes know this; so should test takers.'
          },
          {
            type: 'content',
            heading: 'Mental Preparation',
            content: 'Review your study notes one final time the morning of the exam, but keep it light—maybe 15-20 minutes maximum. Avoid cramming or reviewing difficult material you struggled with. Instead, build confidence by reviewing topics you\'re strong in. Spend time visualizing success. Take deep breaths and use box breathing if needed. Remember that you\'ve prepared. Trust your preparation. Example morning routine: Wake up, eat healthy breakfast, review 2-3 favorite strong topics for 15 minutes, visualize success for 5 minutes, arrive at venue 30 minutes early, take a few deep breaths. This is NOT the time to learn new material or panic about what you don\'t know. You are confident, prepared, and ready to show what you know.'
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
      },
      'English Language and Communication': {
        title: 'English Language and Communication',
        slides: [
          {
            type: 'content',
            heading: 'English Language and Communication Overview',
            content: 'English Language and Communication is about more than just grammar rules. It\'s about effective communication—how humans transfer meaning from one mind to another through written and spoken words. Why does this matter? Teachers need to communicate clearly with diverse learners. You need to explain complex concepts, answer student questions, give feedback, and inspire critical thinking. If you cannot communicate clearly and effectively, even your best lesson plans fail. The LET tests whether you understand language structure, communication theory, and how to teach these skills effectively to students. This section covers grammar, vocabulary, reading comprehension, writing, speaking, listening, and communication theory.'
          },
          {
            type: 'content',
            heading: 'Grammar and Sentence Structure',
            content: 'Grammar is the system of rules that governs language. Why it matters: Grammar ensures clarity. A misplaced modifier or incorrect pronoun reference can completely change meaning. Example: "I saw the man with the telescope" could mean you used a telescope to see the man, or the man had a telescope. As a teacher, you must understand grammar deeply enough to explain WHY rules exist, not just state them. Key concepts: Parts of speech (nouns, verbs, adjectives, etc.), sentence structure (subject-verb agreement, parallel structure, dangling modifiers), verb tenses (simple, perfect, progressive, perfect progressive across past, present, future), and punctuation rules. Tip: Grammar isn\'t just memorization—it\'s about understanding how language components work together. When teaching, show students how breaking a rule creates confusion. Example: "The students runs" is wrong not because it\'s a rule, but because singular verb with plural subject creates mismatch.'
          },
          {
            type: 'content',
            heading: 'Vocabulary Development and Word Choice',
            content: 'Vocabulary is the foundation of communication. Why it matters: Knowing words allows precise expression. Without rich vocabulary, people resort to vague words like "good," "bad," "thing." This limits thinking and communication. Students with larger vocabularies score higher on all academic measures. Key concepts: Word families (root words, prefixes, suffixes—understanding "run," "runner," "running," "rerun"), synonyms vs. nuance (big, large, huge, enormous all mean size but carry different weights), context clues for unknown words, and academic vocabulary (words used in academic contexts that differ from conversational English). Tip: Rather than memorizing word lists, understand how words relate and build from common roots. Example: Root "dict" means speak—so "dictate," "dictation," "dictionary," "verdict," "prediction," "contradiction" all relate to speaking or saying. Building these family connections helps retention far more than isolated memorization.'
          },
          {
            type: 'content',
            heading: 'Reading Comprehension Strategies',
            content: 'Reading comprehension means extracting and understanding meaning from text. Why it matters: Teachers must understand what they read to teach it. You must interpret texts, extract main ideas, recognize author\'s purpose and tone, and identify how evidence supports claims. Key concepts: Main idea vs. supporting details, explicit information (stated directly) vs. implicit information (reading between the lines), author\'s purpose (to persuade, inform, entertain, explain), tone and mood, fact vs. opinion, and inference (using evidence and prior knowledge to conclude). Tip: Active reading techniques work better than passive rereading. Before reading, preview the text—look at titles, headings, first and last sentences. While reading, ask yourself "What is the main point?" After reading, summarize without looking back. Example: Reading a passage about photosynthesis. Main idea: Plants convert light energy to chemical energy. Supporting detail: This happens in chloroplasts. Purpose: To explain a biological process. Once you identify these elements, you truly understand the text and can teach it.'
          },
          {
            type: 'content',
            heading: 'Writing and Composition',
            content: 'Writing is expressing ideas in organized, clear, purposeful ways. Why it matters: Writing clarifies thinking. Fuzzy thinking produces fuzzy writing. Teachers must write clear lesson plans, evaluations, feedback, and correspondence. Key concepts: Writing process (prewriting, drafting, revising, editing, publishing), essay structure (introduction with thesis, body paragraphs with evidence, conclusion), paragraph unity (all sentences support one main idea), coherence (ideas connect logically), and diction (word choice appropriate to purpose and audience). Tip: Good writing is rewriting. First drafts are never final. Teach students that writing is a process. Example: Writing a lesson objective. Weak: "Students will learn about cells." Strong: "Students will identify the structure and function of cell organelles and explain how they work together." The strong version is clear about what students will actually do, what they\'ll learn, and at what level. This clarity comes through revision.'
          },
          {
            type: 'content',
            heading: 'Speaking and Listening Skills',
            content: 'Speaking and listening are communication skills essential for teachers and students. Why it matters: Verbal communication dominates classroom interaction. Teachers spend 70% of class time talking and listening. The quality of your oral communication directly impacts learning. Key concepts: Clear pronunciation and articulation (students must understand you), pacing and intonation (avoiding monotone, using pauses for emphasis), active listening (hearing and understanding others), asking clarifying questions, and adapting communication for audience. Tip: Effective speaking requires planning but sounding natural. When you prepare what to say, you can then deliver it with confidence and flexibility. Listen actively—this means eye contact, nodding, asking follow-up questions, and showing genuine interest. Example: A student says "I don\'t understand fractions." Weak response: "Yes you do, pay attention." Strong response: "Tell me what\'s confusing about fractions. Is it the concept, the notation, or the operations?" This active listening and follow-up helps you diagnose and address the actual problem.'
          },
          {
            type: 'content',
            heading: 'Communication Theory and Perspectives',
            content: 'Communication theory explains how language and communication work. Why it matters: Understanding theory makes you a better communicator and teacher. Key theories: Linguistic theory (how language is structured), pragmatics (how context affects meaning—the same word means different things in different situations), sociolinguistics (how social factors affect language use—formal vs. casual speech), and discourse analysis (how language creates meaning beyond individual words). Tip: Remember that communication is context-dependent. The same phrase "That\'s interesting" can mean genuine interest or dismissal depending on tone, context, and relationship. Understanding this nuance makes you a better communicator. Example: A student says "I\'m fine." In casual conversation, this is just a greeting response. In counseling, "I\'m fine" might mask deeper emotional issues. The teacher who understands communication theory recognizes these nuances and responds appropriately. This is why communication theory matters beyond just grammar and vocabulary.'
          }
        ]
      },
      'Mathematics Fundamentals': {
        title: 'Mathematics Fundamentals',
        slides: [
          {
            type: 'content',
            heading: 'Mathematics Fundamentals Overview',
            content: 'Mathematics is not just about getting the right answer. It\'s about understanding HOW and WHY solutions work. This distinction is crucial for teachers. A calculator can give you an answer, but it can\'t help you understand why 2+2=4 or what multiplication actually means conceptually. The LET tests whether you understand mathematics deeply—not just how to solve problems, but how to explain mathematical thinking to students. Why does this matter? Students learn better from teachers who understand the "why" behind procedures. When you can explain that division is the inverse of multiplication, or that fractions represent parts of a whole, students grasp concepts rather than just memorizing procedures. This section covers number systems, operations, algebraic thinking, geometric reasoning, measurement, data and statistics, and mathematical problem-solving.'
          },
          {
            type: 'content',
            heading: 'Number Systems and Place Value',
            content: 'Number systems form the foundation of all mathematics. Why it matters: Without understanding place value, operations don\'t make sense. Many students struggle with multi-digit operations because they don\'t grasp place value. Key concepts: Decimal place value (ones, tens, hundreds, thousands, etc.), understanding that 24 means 2 tens and 4 ones, not just "twenty-four," fractions as parts of a whole and as division, decimals as fractional parts with denominator 10/100/1000, and negative numbers representing quantities less than zero. Tip: Use concrete manipulatives to teach place value. Don\'t just tell students "this is the tens place"—show them with base-10 blocks or money. Let them physically combine 10 ones into 1 ten. This concrete understanding transfers to abstract thinking. Example: Teaching why 0.5 = 1/2. Concrete: Show a candy bar divided in half. Each half is 0.5 of the whole. Then show it as a fraction: 1 out of 2 parts. When students see these represent the same amount, they understand equivalence deeply, not just as a conversion rule to memorize.'
          },
          {
            type: 'content',
            heading: 'Operations and Problem-Solving',
            content: 'Operations (addition, subtraction, multiplication, division) are mathematical tools for solving real-world problems. Why it matters: Many students memorize procedures without understanding when to use them. Why is 4 × 3 the same as 3 × 4? Because multiplication is repeated addition—4 groups of 3 equals 12, and 3 groups of 4 also equals 12. Key concepts: Addition as combining quantities, subtraction as removing or comparing, multiplication as repeated addition or arrays, division as sharing or grouping, and order of operations (PEMDAS/BODMAS). Tip: Always connect operations to real contexts. When teaching multiplication, don\'t just do 7 × 5. Ask "If I have 7 bags with 5 apples in each, how many apples total?" Then show with a visual array. When students can visualize and contextualize operations, they understand them fundamentally. Example: Teaching division. Instead of just "12 ÷ 3 = 4," ask both questions: "If I have 12 cookies divided equally into 3 groups, how many in each group?" (sharing) and "If I have 12 cookies and put 3 in each bag, how many bags?" (grouping). Both are division but represent different situations.'
          },
          {
            type: 'content',
            heading: 'Algebraic Thinking and Variables',
            content: 'Algebra is generalized arithmetic. Why it matters: Algebra allows us to solve problems with unknown quantities and find patterns. Many students see algebra as abstract and meaningless. Teachers who understand algebra\'s purpose can make it concrete. Key concepts: Variables as unknowns (the "x" we solve for), variables as placeholders in formulas (like A = length × width where different numbers can replace variables), patterns and sequences (finding the rule that generates a sequence), and equations as balance statements (what you do to one side, you must do to the other). Tip: Start algebraic thinking in elementary contexts before formal algebra. Ask "I\'m thinking of a number. I add 5 and get 12. What\'s my number?" This is algebraic thinking. Gradually move toward formal notation. Example: Teaching equations. Show a balance scale. Put 5 pounds on left side and 8 pounds on right. It\'s unbalanced. Add 3 pounds to the left—now balanced at 8 = 8. This concrete model makes the abstract rule "what you do to one side, do to the other" make perfect sense.'
          },
          {
            type: 'content',
            heading: 'Geometry and Spatial Reasoning',
            content: 'Geometry is the study of shapes, space, and spatial relationships. Why it matters: Geometry develops visualization skills crucial for understanding the world. It connects mathematics to real structures and design. Key concepts: Properties of 2D shapes (triangles, quadrilaterals, circles—knowing that all triangles have 3 sides but different shapes), properties of 3D shapes (cubes, spheres, pyramids), area and perimeter (understanding the difference—perimeter is the distance around, area is the space inside), volume (3D equivalent of area), and transformations (rotations, reflections, translations). Tip: Use physical models and visualization. Don\'t just describe a shape—show it, have students build it, trace it. Real-world examples make geometry concrete. Example: Teaching area vs. perimeter. If you have a garden: perimeter is the length of fence needed to border it; area is the amount of soil needed to fill it. They\'re different measurements for different purposes. Students who only memorize formulas might calculate both correctly but not understand what they calculated or why.'
          },
          {
            type: 'content',
            heading: 'Measurement and Units',
            content: 'Measurement is applying numbers to real-world quantities. Why it matters: Measurement connects abstract mathematics to practical reality. Students need to understand that measurements are approximations, not always exact. Key concepts: Standard units (meters, kilometers, grams, kilograms, liters for metric; inches, feet, miles, pounds, gallons for customary), choosing appropriate units (you measure room length in meters, not millimeters), unit conversion (understanding that 1 kilometer = 1000 meters), and estimation (a reasonable guess before measuring). Tip: Have students measure real objects, not just textbook problems. Measuring their classmate\'s height, the classroom length, or ingredients for a recipe makes measurement meaningful. Start with informal units—hand spans, footsteps—before formal units. Example: Teaching unit conversion. Rather than "1 kilometer = 1000 meters, just memorize it," ask "If one meter is about the height of a tall person, how many people lying head-to-toe would span a kilometer?" This makes 1000 meters conceptually understandable—it\'s a very long distance, composed of 1000 human-height units.'
          },
          {
            type: 'content',
            heading: 'Data, Statistics, and Probability',
            content: 'Data and statistics help us understand patterns in numbers. Why it matters: In an information-rich world, understanding data is essential. Teachers and students encounter statistics constantly—test scores, weather data, population statistics. Understanding data prevents misinterpretation and manipulation. Key concepts: Mean (average), median (middle value), mode (most frequent), range (difference between highest and lowest), data visualization (graphs, charts, plots), probability (likelihood of an event occurring), and the difference between correlation (two things change together) and causation (one causes the other). Tip: Always question data sources and methods. Is the sample representative? Could bias affect results? Example of correlation vs. causation: Ice cream sales and swimming pool deaths increase together in summer. Does ice cream cause pool deaths? No—warm weather causes both. This distinction is crucial for critical thinking. Example with probability: When teaching probability, actually do experiments. Flip coins, roll dice, draw from bags. Let students see that theoretical probability (what should happen) and experimental probability (what actually happened) often differ slightly.'
          }
        ]
      },
      'Science and Technology': {
        title: 'Science and Technology',
        slides: [
          {
            type: 'content',
            heading: 'Science and Technology Overview',
            content: 'Science is a process of asking questions, making observations, testing hypotheses, and refining understanding based on evidence. Why it matters: Science isn\'t just facts to memorize—it\'s a way of thinking about the world. The LET doesn\'t just test whether you know that photosynthesis is how plants make food. It tests whether you understand HOW we know this, WHY it works, and how to help students discover scientific truths rather than just accept them. This section covers the nature of science itself (how scientists think), life science (biology), physical science (physics and chemistry), Earth science, and how science connects to real-world technology. The fundamental principle: science is about understanding through observation, experimentation, and evidence-based reasoning.'
          },
          {
            type: 'content',
            heading: 'The Nature of Science and Scientific Method',
            content: 'The scientific method is how we develop reliable knowledge. Why it matters: Understanding the method prevents pseudoscience and superstition. The process: Ask a question, gather background information, form a hypothesis (educated guess), test through experiment, analyze results, and draw conclusions. Crucially, "failed" experiments teach us—negative results are as valuable as positive ones. Key concepts: Variables (independent variable you change, dependent variable you measure, control variables you keep constant), experimental design (how to fairly test ideas), observation vs. inference (what you see vs. what it means), and the role of evidence. Tip: Science is about evidence, not opinion. "I think..." must be backed by "because the evidence shows..." Example: Teaching photosynthesis. Rather than lecture, set up an experiment. Put a plant in the dark—it will weaken. Put one in light—it thrives. Hypothesize WHY. Conclude that light enables something plants need. This discovery approach makes the concept stick far better than memorization. Students learn that science is about figuring things out, not just accepting facts.'
          },
          {
            type: 'content',
            heading: 'Life Science: Biology and Living Systems',
            content: 'Life science explores living organisms and how they function. Why it matters: Understanding biology helps us understand ourselves and make informed decisions about health, environment, and medicine. Key concepts: Cell theory (cells are the basic unit of life), organization (cells → tissues → organs → systems → organisms), photosynthesis (how plants convert light energy into chemical energy), respiration (how organisms release energy from food), reproduction (how organisms create offspring), inheritance (how traits pass to offspring through genes), evolution (how populations change over generations through natural selection), ecology (how organisms interact with each other and environment). Tip: Connect biology to students\' lives. Don\'t just teach cells abstractly—help students understand their own cells, digestion, immunity, reproduction, and health. Example: Teaching inheritance. Rather than Punnett squares alone, ask "Why do you look like your parents?" Discuss how traits like eye color, height, and hair texture come from genetic instructions passed from parents. Then use Punnett squares to predict outcomes. Students understand WHY before using the tool.'
          },
          {
            type: 'content',
            heading: 'Physical Science: Forces, Energy, and Matter',
            content: 'Physical science explores matter, energy, forces, and motion. Why it matters: Understanding physics explains everyday phenomena—why objects fall, how electricity works, why mirrors reflect. Key concepts: Matter (anything with mass and volume), states of matter (solid, liquid, gas), and how they change, energy (ability to do work, forms include kinetic, potential, heat, light, electrical), conservation of energy (energy changes form but isn\'t created or destroyed), forces (pushes and pulls), Newton\'s laws (inertia, force causes acceleration, every action has equal/opposite reaction), waves (light and sound as waves), electricity and magnetism. Tip: Physics is everywhere. Use daily examples—cars accelerating (force causing acceleration), light bending through water (refraction), rolling objects slowing down (friction). Make abstract concepts tangible. Example: Teaching energy conservation. Show a roller coaster: at the top, potential energy is high, kinetic is low. As it descends, potential converts to kinetic—the car speeds up. At the bottom, kinetic is maximum. This visualization makes "energy transforms but doesn\'t disappear" concrete and memorable.'
          },
          {
            type: 'content',
            heading: 'Earth Science: Geology, Meteorology, and Astronomy',
            content: 'Earth science explores our planet and the cosmos. Why it matters: Understanding Earth science informs environmental decision-making and connects us to the larger universe. Key concepts: Plate tectonics (Earth\'s crust moves on plates, causing earthquakes and mountain building), rocks and minerals (different composition and properties), weather and climate (differences, factors affecting each, climate change), water cycle (evaporation, condensation, precipitation, collection), solar system (planets, moons, asteroids), and stars and galaxies (our place in the universe). Tip: Use models, maps, and real-world examples. Show how Earth\'s features form through geological processes. Connect weather to students\' experiences—why does monsoon season bring rain? Example: Teaching plate tectonics. Explain that Earth\'s crust isn\'t one solid shell but broken pieces that move. Where plates collide, mountains form (Himalayas) or earthquakes happen. Where they separate, rift valleys form. This explains Earth\'s dramatic features. Then discuss implications: earthquake preparedness in plate boundaries, volcanic activity, tsunami risk. This makes plate tectonics relevant, not abstract.'
          },
          {
            type: 'content',
            heading: 'Ecology and Environmental Science',
            content: 'Ecology is the study of organisms and their relationships with each other and the environment. Why it matters: Understanding ecology is crucial for environmental literacy and addressing climate change, pollution, and extinction. Key concepts: Ecosystems (communities of organisms in environments), food chains and webs (energy flow from producers to consumers), biodiversity (variety of species and genetic diversity), succession (how communities change over time), population dynamics (growth, carrying capacity, limiting factors), and human impact (pollution, deforestation, climate change, sustainable practices). Tip: Use local examples. What ecosystems exist near your school? What are local environmental problems? Make ecology immediate and relevant. Example: Teaching food chains. Start with a local example. Plants get energy from sun. Herbivores eat plants. Predators eat herbivores. When the predator dies, decomposers break it down, returning nutrients to soil for plants. This cycle shows how all organisms depend on each other and the sun. Disrupting any part affects the whole.'
          },
          {
            type: 'content',
            heading: 'Science and Technology Integration',
            content: 'Technology is applied science—using scientific knowledge to solve practical problems. Why it matters: Understanding how technology works and its implications is essential in a technology-driven world. Key concepts: Technology cycle (identifying problems, designing solutions, building prototypes, testing, improving), biotechnology (genetic engineering, medicine), information technology (computers, data), renewable vs. nonrenewable resources, sustainable technology, and ethical considerations (environmental impact, equity, safety). Tip: Discuss technology critically. Technology solves problems but creates new ones. Computers increase efficiency but generate e-waste. Fertilizers increase crop yields but pollute water. Help students think about benefits AND costs. Example: Teaching renewable energy. Solar panels harness energy from the sun (applying science of photons and electricity). Wind turbines use physics of air pressure. Dams use gravitational potential energy. Compare to fossil fuels—they release ancient carbon, warming climate. Understanding the science behind renewable energy shows why alternatives matter and how they work.'
          }
        ]
      },
      'Filipino and Philippine Government': {
        title: 'Filipino and Philippine Government',
        slides: [
          {
            type: 'content',
            heading: 'Filipino Language and Communication',
            content: 'Filipino language education isn\'t just teaching grammar and vocabulary. It\'s cultivating communication skills in your national language and preserving cultural heritage. Why it matters: Filipino connects Filipinos to their identity and heritage. It\'s the language of everyday life, literature, and national unity. The LET tests whether you can teach Filipino effectively—understanding its structure, teaching literature and composition, and helping students appreciate the language\'s beauty and power. Key concepts: Filipino grammar (verbs with multiple aspects reflecting when actions occur, affixes showing relationships, construction and word order), oral tradition (speeches, storytelling, poetry), written communication (essays, letters, creative writing), and literature (understanding meaning, cultural context, and appreciation). Tip: Connect language to real life. Don\'t just teach grammar rules in isolation. Analyze real Filipino texts—news articles, poems, songs—and discuss how language choices create meaning and emotion. Example: The poem "Sa Aking Kabata" by José Rizal isn\'t just words to memorize but a reflection on patriotism and ambition. Discussing its meaning helps students understand how literature expresses ideas and values. Appreciation comes from understanding, not memorization.'
          },
          {
            type: 'content',
            heading: 'Philippine History and Culture',
            content: 'Philippine history isn\'t just dates and names—it\'s the story of how our nation developed. Why it matters: Understanding history helps us understand present challenges and make better future decisions. History also builds national pride and cultural awareness. Key concepts: Pre-colonial Philippines (organized societies before Spanish arrival, trade networks, diverse groups like Ilocano, Visayan, Tagalog, Mindanaoan peoples), colonial period (Spanish influence 300+ years—government structure, religion, education, language), American period (modernization, English language, democratic ideals), Japanese occupation (WWII impact), independence period (post-WWII nation-building), and contemporary Philippines (democracy evolution, social challenges). Tip: Move beyond memorization of dates. Discuss WHY events happened and their consequences. Example: Spanish colonization. Rather than just "Spain colonized Philippines in 1565," ask WHY—economic motives, religious missions. What were consequences—new government structure, mestiza culture blending Spanish and Filipino elements, Roman Catholicism, Spanish language influence? This causal thinking helps students understand history as interconnected, not isolated events. Understanding Philippine culture—arts, music, values, diversity—is part of this. A culture‐aware teacher helps students appreciate their heritage.'
          },
          {
            type: 'content',
            heading: 'Philippine Government Structure',
            content: 'The Philippine government has three branches, like many democracies, but with unique Philippine characteristics. Why it matters: Understanding government helps students become informed citizens who understand their rights and responsibilities. Key concepts: Executive branch (President as head of state and government, cabinet members heading departments), Legislative branch (Senate with 24 senators, House of Representatives with representatives from districts), Judicial branch (Supreme Court, lower courts, interpreting laws), the Constitution as supreme law, and separation of powers with checks and balances. Additional important elements: local government (barangays, municipalities, provinces, regions with elected officials), political parties, and elections. Tip: Make government concrete and relevant. Don\'t just memorize structure—understand how it functions. How does a bill become law? Where do you report local problems? What services does government provide? Example: Teaching how bills become laws. A representative identifies a problem—unsafe working conditions in factories. They propose a bill improving safety standards. It goes to committee for review. It\'s debated in the House. If passed, it goes to Senate, where it\'s debated and voted. If both pass it, President signs it into law. This process shows democracy in action, not as abstract concept but as mechanism for solving real problems.'
          },
          {
            type: 'content',
            heading: 'The Philippine Constitution',
            content: 'The Constitution is the supreme law establishing government structure and protecting citizens\' rights. Why it matters: The Constitution protects freedom and justice. Understanding your rights means you can claim them. Understanding obligations means you can fulfill responsibilities. Key concepts: The 1987 Constitution (current) established democratic government and personal freedoms, basic rights (freedom of speech, assembly, religion, due process), citizenship (duties and rights), the Bill of Rights (amendments protecting individuals from government overreach), and amendments that have updated the Constitution. Major constitutional provisions: the Declaration of Principles and State Policies (government\'s commitment to social justice, education, environmental protection, etc.), the system of government (presidential vs. parliamentary—Philippines is presidential), federalism debates, and anti-corruption measures. Tip: Connect constitutional principles to real situations. Example: Teaching freedom of speech. It protects your right to criticize government, but with limits—you cannot incite violence. Why the limits? Balancing individual freedom with public safety. Real example: A journalist criticizing government corruption is protected by freedom of speech. But defamation (publishing false harmful statements) is NOT protected. Understanding this nuance—freedoms have limits protecting others—develops sophisticated thinking about rights and responsibilities.'
          },
          {
            type: 'content',
            heading: 'Civic Virtues and Citizenship',
            content: 'Being a citizen isn\'t just having a passport—it\'s having responsibilities to society. Why it matters: Teachers model and cultivate citizenship. Students learn civic virtue from how teachers treat them and model behavior. Key concepts: Responsibilities (following laws, respecting others, paying taxes, voting, serving in jury or military if applicable), virtues (honesty, integrity, respect, compassion, service to community), respect for diversity (Philippines is multiethnic, multireligious, multilingual—this diversity must be honored, not suppressed), and active participation in democracy (voting, community involvement, advocacy). Tip: Model civic virtue daily. Be honest, respectful, and fair with students. Involve students in decisions about classroom rules and conflicts. Teach them that democracy requires participation, not just voting. Example: A student breaks a classroom rule. Rather than just punishing, use it as a teaching moment. Discuss why the rule exists (fairness, safety, respect), how breaking it affects others, what consequences are fair, and how to make amends. This process teaches civic reasoning and responsibility better than punishment alone.'
          },
          {
            type: 'content',
            heading: 'Current Issues and Social Movements',
            content: 'Contemporary Philippines faces ongoing challenges and debates. Why it matters: Understanding current issues helps students become engaged citizens addressing real problems. Key issues: Poverty and inequality (Manila vs. provinces, urban vs. rural, widening gap), education access (not all children attend school, quality varies widely), healthcare (high costs preventing treatment, rural healthcare shortage), environment (pollution, mining impacts, climate change, deforestation), corruption (government officials misusing power and public funds), peace and order (crime, drug abuse, terrorism threats, Mindanao conflict), West Philippine Sea disputes (territorial conflicts with other nations), SOGIE equality (LGBTQ+ discrimination and rights), and women\'s rights (gender-based violence, wage gaps, reproductive health). Tip: Present issues fairly, not propagandistically. Help students understand different perspectives. Example: The West Philippine Sea dispute. Philippines claims certain waters as exclusive economic zone. China claims them too. This creates tension—fishing rights, oil, territorial sovereignty. Rather than stating one side is right, help students understand both nations\' perspectives, historical claims, international law, and why resolution matters. This develops critical thinking about complex geopolitical issues.'
          }
        ]
      },
      'Social Studies and Values Education': {
        title: 'Social Studies and Values Education',
        slides: [
          {
            type: 'content',
            heading: 'Social Studies Overview',
            content: 'Social Studies is the integrated study of humans in societies—history, geography, economics, sociology, psychology, and anthropology. Why it matters: Social Studies helps students understand human behavior, cultural diversity, economic systems, and social organization. Teachers who understand these disciplines can help students comprehend the complex world. Key concepts: Societies vary widely in government, economics, culture, and values. No single "right way" exists—understanding differences builds tolerance. Social studies isn\'t just facts but frameworks for understanding. It asks: How do humans organize? What values do different cultures hold? How do economies work? What causes social change? This section covers geography, economics, sociology, cultural anthropology, and values education integrated throughout.'
          },
          {
            type: 'content',
            heading: 'Geography and Spatial Understanding',
            content: 'Geography is the study of Earth\'s physical features and human societies distributed across space. Why it matters: Geography explains why places are different and how humans adapt to environments. Geography shapes culture—coastal societies differ from landlocked ones; tropical regions differ from arctic. Key concepts: Physical geography (landforms, climate, natural resources, ecosystems), human geography (population distribution, cultural regions, economic activities), maps and spatial thinking (understanding locations, directions, scales, map projections), globalization (increasing interconnection worldwide), and human-environment interaction (how humans shape and are shaped by environments). Tip: Use maps actively. Don\'t just memorize capitals—understand why cities develop where they do (trade routes, harbors, fertile valleys). Example: Why is Manila on the coast? Access to trade, defense, food from ocean. Why do Filipino settlements scatter across archipelago? Geography forced development of maritime trade. Understanding geography explains so much about Philippine development and structure. Help students see place not as random, but shaped by geography, history, and human decision.'
          },
          {
            type: 'content',
            heading: 'Economics and Resource Allocation',
            content: 'Economics is how humans allocate scarce resources—time, money, natural resources. Why it matters: Economic literacy helps students make personal financial decisions and understand societal issues like poverty and inequality. Key concepts: Basic economic systems (capitalism emphasizing private ownership and markets, socialism emphasizing collective ownership, mixed systems combining both), supply and demand (prices reflect availability and desire), labor and wages (how workers and employers interact), trade and specialization (countries trade what they produce efficiently for what they don\'t), poverty and inequality (unequal distribution of resources and opportunities), and development (how countries advance economically). Tip: Use real-world examples. How does your school budget work? Why does gasoline price vary? What\'s minimum wage and why? Example: Teaching supply and demand. If mangoes are abundant this season, price drops because supply is high. If mangoes become scarce next season, price rises. Buyers want cheap mangoes, but scarcity drives prices up. Understanding this natural mechanism helps students understand pricing, inflation, and market forces better than abstract definitions.'
          },
          {
            type: 'content',
            heading: 'Culture, Society, and Diversity',
            content: 'Culture is the shared beliefs, values, practices, and artifacts of groups. Why it matters: Understanding culture builds respect and empathy across differences. Philippines has extreme cultural diversity—over 100 ethnic groups, different religions, regions with distinct traditions. Teachers must acknowledge and celebrate this diversity. Key concepts: Culture (learned, shared, adaptive), cultural elements (language, beliefs, practices, art, symbols), enculturation (learning your culture), socialization (becoming a member of society), cultural change (cultures evolve through time and contact with other cultures), ethnocentrism (believing your culture is superior—something to overcome), cultural relativism (understanding cultures on their own terms), and pluralism (respecting multiple cultures coexisting). Tip: Include diverse literature, histories, and examples from different Philippine cultures. Help students understand that different doesn\'t mean inferior—just different. Example: In some Filipino cultures, extended families live together and make decisions collectively. In some Western cultures, nuclear families are emphasized and individual choice is primary. Neither is right or wrong—they reflect different values about family, community, and individuality. Understanding these differences without judgment builds intercultural competence.'
          },
          {
            type: 'content',
            heading: 'Values Education and Character Development',
            content: 'Values are principles guiding what people consider important and how they should act. Why it matters: Values shape behavior. Teaching values isn\'t about imposing your values, but helping students clarify their own and understand society\'s shared values. Key Filipino values: Pakikipagkapwa-tao (shared humanity, empathy), Pagkakaisa (unity), Integridad (integrity, honesty), Malasakit (care, concern for others), Diligence, Respect. Universal values: justice, compassion, honesty, courage. Tip: Don\'t just lecture about values. Use stories, real situations, and discussions. Help students grapple with moral dilemmas and develop reasoning skills. Example: Moral dilemma—A friend asks you to lie to cover for them. Values in conflict: loyalty to friend vs. honesty. Discuss: What are consequences of lying? Is lying ever justified? What would a person of integrity do? This isn\'t about giving the "right answer" but developing moral reasoning. Students need practice thinking through ethical situations, not just learning rules.'
          },
          {
            type: 'content',
            heading: 'Social Issues and Civic Engagement',
            content: 'Social issues are problems affecting communities that often require collective solutions. Why it matters: Helping students understand and address social issues develops engaged citizenship and problem-solving skills. Major Philippine social issues: Poverty and inequality, education access, healthcare, human rights (especially for marginalized groups), environmental degradation, peace and reconciliation in conflict areas, disability inclusion, gender equality, child welfare, and labor rights. Tip: Don\'t present issues as overwhelming and hopeless. Show both problems AND solutions—organizations and individuals working on these issues. Inspire action. Example: Addressing youth unemployment. Problem: Many young people cannot find jobs. Why? Economic slowdown, limited opportunities, skill mismatch. Solutions: Skills training programs, entrepreneurship support, creating more jobs. Have students identify local examples of unemployment and propose solutions. Maybe they connect students with internships or teach skills. This transforms abstract issue into concrete action, developing agency and hope.'
          }
        ]
      },
      'Subject-Specific Deep Dives': {
        title: 'Subject-Specific Deep Dives',
        slides: [
          {
            type: 'content',
            heading: 'Subject-Specific Deep Dives',
            content: 'The LET tests broad knowledge across multiple subjects, but also sometimes includes advanced questions in specific areas. This guide provides deeper exploration of key topics that frequently appear in LET exams. Rather than surface-level understanding, deep dives develop the expert knowledge that allows you to answer nuanced questions and teach effectively. This section covers advanced topics in language, mathematics, science, and social studies. The principle: for each subject, understand not just WHAT is true, but WHY it\'s true and HOW we know it\'s true. This depth transforms test-taking from memorization to application of understanding.'
          },
          {
            type: 'content',
            heading: 'Advanced Literary Analysis and Interpretation',
            content: 'Literature isn\'t just stories—it\'s a medium humans use to explore meaning, emotion, identity, and society. Why it matters: Teachers who understand literature deeply can help students appreciate its power and develop critical thinking. Advanced concepts: Literary devices (metaphor, simile, imagery, symbolism—understanding not just what they are but how they create meaning), narrative structure (plot, character development, point of view and how it affects perception, unreliable narrators), themes (universal ideas literature explores), literary movements (Romanticism emphasized emotion; Realism focused on actual life; Modernism questioned traditional forms; Postmodernism questioned meaning itself), and cultural context (understanding how author\'s time and background shape their work). Tip: Move beyond plot summary. Discuss what literature MEANS. What does the author suggest about human nature through characters\' choices? How does setting reflect internal struggle? What social issues does the work address? Example: "The Great Gatsby" isn\'t just a story of love and wealth. It\'s a critique of American materialism and the illusion of self-invention. Daisy symbolizes wealth\'s allure. The green light symbolizes unattainable dreams. Discussing these deeper meanings develops literary literacy and empathy with human complexity.'
          },
          {
            type: 'content',
            heading: 'Advanced Mathematical Reasoning',
            content: 'Beyond basic operations lies mathematical thinking—recognizing patterns, making conjectures, proving claims rigorously. Why it matters: Advanced mathematical thinking develops problem-solving abilities applicable beyond math. Key concepts: Functions (relationships between inputs and outputs, understanding linear vs. nonlinear, rate of change), sequences and series (patterns in numbers, sums of sequences), basic combinatorics (counting arrangements and combinations without listing all), logic and proof (starting from known truths, reasoning to conclusions), and mathematical modeling (using equations to represent real situations). Tip: Teach problem-solving strategies. When facing an unfamiliar problem, can you break it into smaller parts? Try simpler versions first? Draw a diagram? Look for patterns? These meta-cognitive strategies matter more than knowing specific formulas. Example: Suppose you have a chessboard and place 1 grain of rice on the first square, 2 on the second, 4 on the third (doubling each time). How much rice total? Rather than multiply numbers, recognize the pattern: each square has 2 times previous, a geometric sequence. Use the geometric series formula. This recognition of pattern and application of formula is advanced reasoning, not just calculation.'
          },
          {
            type: 'content',
            heading: 'Advanced Biological Concepts',
            content: 'Beyond learning biology facts lies understanding biology\'s fundamental principles and cutting-edge developments. Why it matters: Biology evolves as we discover new things. Teachers who understand how biological knowledge develops stay current and help students think scientifically. Key advanced concepts: Molecular biology (DNA, genes, protein synthesis, genetic expression), evolution mechanisms (natural selection, genetic drift, mutation as sources of variation), ecology modeling (population growth curves, predator-prey relationships, ecosystem stability), biotechnology applications (genetic engineering, CRISPR gene editing, personalized medicine), and conservation biology (protecting biodiversity and ecosystems). Tip: Help students understand biology isn\'t fixed dogma but active science. Scientists still discover new species, new diseases, new treatments. Show current research and debates. Example: CRISPR gene editing allows editing disease-causing genes. But it raises ethical questions: Should we edit human germline (changes passed to offspring)? Who gets access? Could it increase inequality? Discussing these questions develops ethical scientific thinking, not just knowledge of technology.'
          },
          {
            type: 'content',
            heading: 'Advanced Historical and Social Analysis',
            content: 'Beyond memorizing facts, historians ask HOW we know history, WHOSE perspectives are included, and how history shapes present. Why it matters: This analytical approach develops critical thinking about claims, evidence, and narrative. Key concepts: Primary vs. secondary sources (direct evidence vs. interpretations of evidence), historiography (how historians\' own time periods shape their interpretations), bias and perspective (recognizing that historical accounts aren\'t objective), causation vs. correlation (asking what really caused events), and counterfactual thinking (what if history went differently?). Tip: Use source analysis with students. Read historical documents and analyze them critically. Who wrote this? When? For what purpose? How might bias affect what they reported? What else might they have left out? Example: Teaching Spanish colonization, students read both Spanish colonial accounts AND Filipino oral traditions and indigenous perspectives. Spanish accounts emphasize "civilizing" and "Christianizing." Indigenous perspectives emphasize cultural loss, exploitation, and resistance. Both are true—they\'re different perspectives. Advanced historical thinking includes ALL perspectives. This develops sophisticated understanding of how power shapes narratives and how multiple truths can coexist.'
          },
          {
            type: 'content',
            heading: 'Interdisciplinary Connections and Systems Thinking',
            content: 'Advanced learning recognizes that subjects aren\'t isolated—they interconnect. Why it matters: Real-world problems require interdisciplinary thinking. Climate change involves physics, biology, chemistry, economics, policy, and ethics. Teachers who see interdisciplinary connections help students develop sophisticated thinking. Key concepts: Systems thinking (understanding how parts interact in complex wholes), feedback loops (changes affect other things which feed back), emergence (complex properties arising from simpler interactions), and scale (phenomena look different at different scales). Tip: Explicitly make connections. When teaching photosynthesis, discuss how it supports food chains (biology), affects oxygen levels (chemistry), impacts climate through carbon cycles (physics and environmental science), and has economic implications through agriculture. Example: Discussing plastic pollution requires understanding chemistry (what plastics are), biology (effects on marine life), ecology (bioaccumulation in food chains), economics (cheap alternative to other materials, external costs), policy (regulations), and values (our responsibility to environment). These connections show students that knowledge integrates—specialists in one field must understand others to solve complex problems.'
          }
        ]
      },
      'Effective Note-Taking Methods': {
        title: 'Effective Note-Taking Methods',
        slides: [
          {
            type: 'content',
            heading: 'Effective Note-Taking Methods',
            content: 'Note-taking is the bridge between hearing information and storing it in your brain. Many students take notes ineffectively—writing word-for-word what teachers say, which is too slow and prevents active thinking. Good note-taking requires a system that captures key information while engaging your brain in understanding and organizing. Why it matters: Research shows that students who take good notes score 20-30% higher than those who don\'t. Note-taking serves two purposes: (1) externalizing information (getting it out of your head and onto paper) so your working memory isn\'t overloaded, and (2) engaging your brain in processing, which builds memory. The act of deciding what\'s important and how to organize it strengthens understanding. This section covers different note-taking systems, each with strengths for different situations.'
          },
          {
            type: 'content',
            heading: 'The Cornell Note-Taking System',
            content: 'The Cornell system divides your page into three sections: notes (right side, 2/3 of page), cues (left side, 1/3 of page), and summary (bottom). During class: Write notes on the right side, focusing on main ideas and key points, not word-for-word transcription. Later (same day if possible): Add cues on the left—these are questions your notes answer or keywords that trigger memory. Then write a summary at the bottom in your own words. Why it works: The visual organization helps your brain process information. Writing cues forces you to think about what\'s important. The summary forces you to synthesize—a powerful learning technique. Tip: Don\'t try to create perfect Cornell notes during class—too slow. Take rough notes, then organize them later. Example: In a lesson about photosynthesis. Notes section: "Plants convert light energy to chemical energy through photosynthesis, which occurs in chloroplasts. Light reactions occur in thylakoids; dark reactions occur in stroma. Photosynthesis requires light, water, chlorophyll, and carbon dioxide, producing glucose and oxygen." Cues section: "Where does photosynthesis occur? What\'s the role of chlorophyll? Why do we need photosynthesis?" Summary: "Photosynthesis is how plants capture energy from sunlight and store it as glucose, releasing oxygen as a byproduct."'
          },
          {
            type: 'content',
            heading: 'Outline and Mind-Map Methods',
            content: 'Outlines organize information hierarchically—main topics, subtopics, details. Mind maps organize information visually around a central idea. Why outlines work: They force you to organize information logically, showing relationships between ideas. Outlines work well for sequential information like historical events or step-by-step procedures. Example outline for lesson on Philippine Government: I. Executive Branch A. President 1. Head of state 2. Head of government B. Cabinet C. Appointed officials II. Legislative Branch A. Senate B. House of Representatives III. Judicial Branch Why mind maps work: They work well for brainstorming and showing how many ideas connect to a central concept. Our brains are naturally associative—one idea triggers related ideas. Mind maps match this. Useful for showing relationships and seeing the "big picture." Example: Central concept "Photosynthesis" with branches to "inputs" (light, water, CO2), "location" (chloroplasts, thylakoids, stroma), "outputs" (glucose, oxygen), "why it matters" (energy, food, oxygen). Tip: Use both methods. Outlines for structured information, mind maps for exploring connections. Combination often works best.'
          },
          {
            type: 'content',
            heading: 'Abbreviations and Symbol Systems',
            content: 'Good note-takers develop shortcuts so they can write fast without sacrificing clarity. Why it matters: Typing or writing too slowly means missing information or being so focused on transcription that you don\'t think about meaning. Common abbreviations: w/ (with), b/c (because), → (leads to, causes), ↑ (increases), ↓ (decreases), ∴ (therefore), vs. (versus), esp. (especially), info (information), govt (government), qty (quantity). Symbols: & (and), = (equals), > (greater than), < (less than), $ (money/economic), # (number), + (plus/positive), - (minus/negative). Subject-specific shortcuts: bio: photo (photosynthesis), bio: resp (biological respiration), psych: cognit (cognitive), hist: col (colonial). Tip: Develop a personal system and be consistent. Your notes must be readable to you later. Example: "Students can develop abstract thinking through Piaget\'s theory, esp. in formal operational stage. This → ability to think hypothetically, w/ flexible reasoning abt multiple perspectives." Compare to: "Piaget theory says students get abstract thinking in formal operational stage which means they can think hypothetically with flexible reasoning about multiple perspectives." Second version took more time but conveys same information. First version is faster.'
          },
          {
            type: 'content',
            heading: 'Digital vs. Handwritten Notes',
            content: 'Research suggests that handwriting notes by hand leads to better learning than typing on laptops. Why? Handwriting is slower, forcing you to process information and synthesize rather than transcribe. Typing is so fast that many people default to transcription without thinking. However, typing has advantages: faster for some people, easy to search later, easy to organize and revise. Strategy: Handwrite during learning (lectures, reading) when the goal is understanding. Type when capturing information that you\'ll organize later (research, reference material). Digital tools that work well: Google Docs or OneNote for organizing notes by topic; Notion for creating a "second brain" linking related notes; Anki for digital flashcards. Handwritten tools: lined notebooks for linear notes, grid notebooks for mind maps and sketches, color-coded pens to highlight important concepts. Tip: Whatever system you choose, use it consistently. Don\'t switch methods halfway through preparation. Example: Handwrite notes during class to engage brain. That evening, type them up in Cornell format or outline, which gives a second pass for reinforcement and organization. This hybrid approach combines handwriting\'s learning benefits with digital organization\'s advantages.'
          },
          {
            type: 'content',
            heading: 'What to Write and What to Skip',
            content: 'Novice note-takers struggle deciding what\'s important. Too many notes means you\'re transcribing and not thinking. Too few means missing key information. How to decide: Write main ideas and concepts, not details. Write definitions of new terms. Write examples that illustrate concepts. Skip: Full sentences from textbooks (paraphrase instead), repetition (if the teacher says something twice, write it once), teacher\'s personal stories unless they illustrate a concept, obvious information you already know. Questions to ask: "Will I need this to understand a test question?" "Does this support a main concept?" If yes, include it. If no, skip it. Tip: During a lecture about learning theories, write "Behaviorism: learn through rewards/punishments and repetition (Pavlov, Skinner)." Skip "Behaviorism has been around for many years" unless it\'s relevant to understanding why behaviorism matters. Example test question might be "Which theorist believed learning happens through rewards and punishments?" Your notes containing that connection will help you answer. Notes about "how long behaviorism has existed" won\'t help.'
          }
        ]
      },
      'Memory Improvement Techniques': {
        title: 'Memory Improvement Techniques',
        slides: [
          {
            type: 'content',
            heading: 'Memory Improvement Techniques',
            content: 'Memory isn\'t like a video recorder capturing everything. It\'s selective and constructive. Understanding how memory works helps you study more effectively. Why it matters: The LET tests information you studied weeks or months ago. Forgetting is normal—the brain prunes information it considers unimportant. Research shows that without reinforcement, we forget 50% of information within one day and 70% within one week (the "forgetting curve"). But with proper techniques, you can retain information far longer. The key principle: repetition with spacing and variety. Simply rereading isn\'t very effective. Active recall (retrieving information from memory) and elaboration (connecting information to what you know) are far more powerful. This section covers evidence-based techniques for remembering information long-term.'
          },
          {
            type: 'content',
            heading: 'Spaced Repetition and the Forgetting Curve',
            content: 'Spaced repetition means reviewing information at increasing intervals. Why it works: When you learn something, your memory decays over time. Reviewing before you completely forget refreshes your memory and resets the decay. With each review, the decay rate slows. Optimal review schedule: First review within 1 day, second within 3 days, third within 1 week, fourth within 2 weeks, fifth within 1 month. After that, the information is generally retained well. Digital tools that implement spaced repetition: Anki (flashcard app that schedules reviews based on difficulty), Quizlet (has spaced repetition feature), SuperMemory, RemNote. Tip: Start spaced repetition early. If you only review the night before the exam, information will be in short-term memory but won\'t transfer to long-term storage. Example: You learn about Bloom\'s Taxonomy on Monday. Tuesday, review it (write the levels from memory). Thursday, explain it to a study group. Following Tuesday, create practice questions about it. Following week, apply it by analyzing exam questions using Bloom\'s levels. This spacing and variety strengthens retention far more than cramming Monday night before Wednesday exam.'
          },
          {
            type: 'content',
            heading: 'Mnemonics and Memory Devices',
            content: 'Mnemonics are memory aids helping you remember information through association, visualization, and clever devices. Why they work: Mnemonics connect abstract information to concrete, meaningful associations. Your brain is excellent at remembering stories, images, and sequences. Mnemonics leverage these strengths. Types of mnemonics: Acronyms (PEMDAS for order of operations, SOAR for reading comprehension—Survey, Question, Read, Recite, Review), acrostics (Every Good Boy Does Fine for music notes: E-G-B-D-F), method of loci (associating information with physical locations), chunking (grouping information into meaningful units), and visualization (creating vivid mental images). Examples: To remember Maslow\'s hierarchy of needs from bottom to top: Physiological, Safety, Love/Belonging, Esteem, Self-actualization = "Please Stay Loving Everyone Steadily" or just remembering "pyramid from body needs to spirit." For the water cycle order: Evaporation, Condensation, Precipitation, Collection = "Every Child Participates in Collection" or remembering "water rises, cools, falls, gathers." Tip: Create personal mnemonics that are meaningful to YOU. Your own associations will be stronger than memorized general mnemonics. Example: Learning 12 principles of lesson planning. Rather than memorizing a list, create a story: "In an Engaging Classroom, I Assess, Plan, and Develop effective Content. I manage the learning environment, Inspire students, and Reflect on my teaching." This story connects principles logically and is more memorable than a list.'
          },
          {
            type: 'content',
            heading: 'Elaboration and Connecting to Prior Knowledge',
            content: 'Elaboration means connecting new information to information you already know. Why it works: Your brain stores information in interconnected networks. The more connections you create, the more retrieval paths exist. Retrieving information strengthens those neural pathways. Strategy 1 (Relating to prior knowledge): When learning something new, ask "What does this remind me of?" "How does this connect to what I already know?" Example: Learning about climate change, connect to ecology (ecosystems), physics (heat and energy), chemistry (greenhouse gases), economics (costs and benefits of solutions). Strategy 2 (Teaching others): Explaining information to someone else forces elaboration. You must organize your thoughts, identify key points, and answer questions. This deep processing strengthens memory. Strategy 3 (Creating examples): Generate your own examples of concepts. Instead of memorizing "formative assessment is checking understanding during learning," create example: "I give students a quick quiz midway through a lesson to check understanding. If many struggle with one concept, I reteach it. This is formative assessment." Strategy 4 (Asking Why, How, and What-if questions): "Why does this work?" "How is this different from...?" "What if we changed this variable?" asking these questions deepens understanding and memory. Example: Learning about constructivism (students build understanding through experience). Connect to prior knowledge: "Isn\'t that how I learned to ride a bike—not from instruction but from trying until I figured it out?" Create example: "In my classroom, I\'d present a problem—how to measure an irregular shape—and let students experiment with solutions rather than teaching a formula." This elaboration makes constructivism memorable and applicable.'
          },
          {
            type: 'content',
            heading: 'Active Recall and Testing Effect',
            content: 'The testing effect is the finding that retrieving information from memory strengthens that memory far more than simply studying information. Why it works: When you take a test or quiz, you\'re retrieving information—exactly what you\'ll need to do on the LET. This practice transfer. Additionally, retrieval strengthens neural pathways more than passive review does. Strategy 1 (Self-quizzing): After studying material, close your notes and try to recall key points. Write them down. Check for accuracy. Try to recall harder items multiple times. Strategy 2 (Practice tests): Take practice exams under conditions similar to real exams—timed, quiet, no notes. Analyze mistakes and review that material. Strategy 3 (Teach-back): Explain material to someone else (real or imaginary). This forced retrieval and elaboration. Strategy 4 (Create questions): As you study, generate questions about the material. "What would a test question about this look like?" Then answer your own questions. Tip: Difficulty matters. Easy retrieval doesn\'t strengthen memory as much as effortful retrieval. If recalling something is hard, that\'s good—your brain is working harder and strengthening pathways. Example: Don\'t just reread notes about multiple choice strategy (passive). Instead, close your notes and try to remember: What are the steps of elimination strategy? What\'s the umbrella rule? What absolute words should raise red flags? This effortful retrieval is far more effective than rereading.'
          },
          {
            type: 'content',
            heading: 'Sleep and Lifestyle Factors',
            content: 'Memory isn\'t just about study techniques—it depends on sleep, exercise, nutrition, and stress. Why it matters: During sleep, the brain consolidates memories—transferring information from working memory to long-term storage. Without adequate sleep, memories don\'t consolidate properly, and you forget more. Exercise increases blood flow to the brain and promotes neuroplasticity (brain\'s ability to form new connections). Nutrition affects neurotransmitters crucial for memory. Sleep recommendations: 7-9 hours per night, especially during heavy studying. Poor sleep impairs memory, attention, and reasoning—you become less efficient at everything. Exercise recommendations: 150 minutes moderate exercise per week or 75 minutes vigorous exercise. Even a 20-minute walk improves memory. Exercise before studying is particularly helpful. Nutrition for memory: Adequate protein (neurons need amino acids), omega-3 fatty acids (found in fish, walnuts, flaxseed—crucial for brain health), antioxidants (berries, dark chocolate), and staying hydrated (dehydration impairs cognition). Stress management: Chronic stress impairs hippocampus (memory center). Use relaxation techniques—meditation, deep breathing, exercise—regularly, not just before exams. Example: You study hard Monday-Wednesday. If you get only 5 hours sleep Tuesday and Wednesday nights, your memory consolidation suffers. The information never fully transfers to long-term storage. You\'ll forget more after the exam than someone who studied less but slept 8 hours. Sleeping well is as important as studying hard.'
          }
        ]
      },
      'Active Learning Strategies': {
        title: 'Active Learning Strategies',
        slides: [
          {
            type: 'content',
            heading: 'Active Learning Strategies',
            content: 'Active learning means engaging your brain with material—asking questions, applying concepts, solving problems, discussing ideas. Passive learning—reading, listening, rereading—is less effective. Why it matters: When your brain is passive, engagement is low. When actively engaged, your brain strengthens neural connections through processing. Research shows active learners retain 70-90% of information, while passive learners retain only 5-10%. Active learning is the difference between superficial understanding and deep mastery. The LET doesn\'t just test whether you can recognize facts. It tests whether you can apply knowledge to new situations and understand why concepts work. This requires active learning during preparation. This section covers specific active learning strategies you can use while studying.'
          },
          {
            type: 'content',
            heading: 'The Feynman Technique and Teaching Back',
            content: 'The Feynman Technique (named after physicist Richard Feynman) uses teaching as learning. The process: (1) Choose a concept you want to learn. (2) Explain it in simple language as if teaching a child. (3) Identify gaps in your explanation—places where you can\'t explain clearly. (4) Review source material to fill those gaps. (5) Refine your explanation using simpler language. Why it works: If you can\'t explain something simply, you don\'t truly understand it. Teaching forces you to process information deeply, organize it logically, and identify what you don\'t know. This is far more effective than rereading. Example: Learning about formative assessment. Your explanation: "Formative assessment is checking students\' understanding during learning so you can adjust teaching." But then you realize: "Wait, how is this different from summative assessment?" "What are specific examples?" "Why is it called formative?" These questions reveal what you don\'t fully understand. You review material, learning that formative comes "from form/shape" (shaping learning), while summative is "sum/final" (summarizing learning). Now your explanation is deeper and more memorable. Tip: Teach a friend, family member, or even an imaginary classroom. Teaching someone else forces clarity. If you can\'t explain clearly, you have work to do.'
          },
          {
            type: 'content',
            heading: 'Problem-Based and Case-Based Learning',
            content: 'Problem-based learning means learning through solving realistic problems. Why it works: Your brain is designed to solve problems. Learning through problems engages motivation and makes learning meaningful. Rather than learning abstract concepts, you learn them in context where they apply. Strategy: Find or create realistic problems in your subject area. Example in education: A real problem—"A student consistently fails tests but participates in class and says they study. How would you identify and address their actual problem?" Using this problem, you might learn about: assessment methods (standardized tests don\'t measure all learning), study techniques (their study method might be ineffective), learning differences (they might have undiagnosed dyslexia), test anxiety, or other factors. In mathematics: A real problem—"You\'re building a garden with budget constraints. You have 100 feet of fencing and $500 budget. Seeds cost $10 per packet and cover 10 square feet. Fence costs $5 per foot. How do you maximize garden area within budget?" This problem requires understanding optimization, area, costs—real applications of math. Tip: After learning a concept abstractly, immediately create a problem requiring that concept. Force yourself to apply it. Example: After learning Piaget\'s stages of development, create a problem: "A teacher shows concrete operations students an abstract algebra problem. Why do they struggle? What teaching approach would work better?" This requires applying Piaget\'s theory to a real classroom situation.'
          },
          {
            type: 'content',
            heading: 'Elaborative Interrogation and Asking Why',
            content: 'Elaborative interrogation means asking questions about material as you learn it. Why it works: Questions prompt you to think more deeply about relationships and reasons. Rather than passively accepting information, you actively seek understanding. Types of questions: "Why is this true?" "How does this connect to what I already know?" "What would happen if...?" "How could I apply this?" "What\'s an example?" "Why is this important?" Example: Learning about the scientific method. Instead of accepting it as "the way scientists do research," ask: Why do scientists use this method rather than just making guesses? (Because controlled testing reveals what actually causes results, not coincidence or bias). What would happen without the scientific method? (False beliefs, ineffective treatments, wasted resources). How does this apply to classroom teaching? (Formative assessment is scientific method applied to learning—testing hypotheses about what helps students learn). These questions create deep understanding far beyond memorization. Tip: As you read or listen, generate your own questions. Don\'t wait for teachers to provide all questions. Example: Reading about classroom management. Instead of passively absorbing techniques, ask: Why does clear expectations reduce misbehavior? (Because students know what\'s expected, reducing confusion and frustration). Which technique would work best in my future classroom? (Depends on age, context, school culture). What\'s missing from these techniques? (Maybe they don\'t address root causes—why students misbehave). This questioning deepens understanding.'
          },
          {
            type: 'content',
            heading: 'Concept Mapping and Visual Organization',
            content: 'Concept mapping means creating visual diagrams showing how ideas relate. Why it works: Visual representations help organize complex information. Your brain processes visual information rapidly and stores spatial relationships well. Concept maps show relationships that lists or paragraphs can\'t show as clearly. How to create: (1) Identify main concepts. (2) Arrange them spatially—related concepts near each other. (3) Draw lines connecting concepts. (4) Label connections explaining relationships. Example in biology: Central concept "Photosynthesis" with branches to: Inputs (light, water, CO2), Location (chloroplast, thylakoid, stroma), Outputs (glucose, oxygen), Energy transformation, Relationships (provides food for plants, provides oxygen for animals). Lines show "requires," "produces," "occurs in," "depends on." This visual representation shows how photosynthesis is interconnected with multiple concepts. You could add another layer—connections between photosynthesis and cellular respiration, energy flow in ecosystems, etc. Tip: Start simple with main concepts, then add details and connections. First concept map might have 5 concepts. Later, add 20 concepts showing deeper relationships. Example in social studies: Concept map of Philippine government with Executive, Legislative, Judicial branches, showing their functions, how they check each other, how citizens interact with each branch. This visual shows governmental structure far better than listing facts.'
          },
          {
            type: 'content',
            heading: 'Debate, Discussion, and Perspective-Taking',
            content: 'Active learning through discussion means talking through ideas, considering multiple perspectives, and defending positions. Why it works: Discussion forces you to articulate thinking, listen to other perspectives, and refine your understanding through questioning. It\'s far more engaging than passive learning. Perspective-taking requires deep processing of material. Strategy 1 (Structured debate): Take a controversial issue. Research both sides. Prepare arguments and evidence. Debate with a study partner. Even though you win or lose doesn\'t matter—the process of understanding both sides deeply matters. Example: Debate topic: "Should schools teach intelligent design alongside evolution?" Research position 1: Scientific evidence, nature of science, educational standards. Research position 2: Religious freedom, questioning authority, multiple perspectives. Understanding both deeply, you develop sophisticated thinking about science, religion, education, and evidence. Strategy 2 (Socratic dialogue): Have a partner ask you questions about material while you explain. They ask follow-up questions, challenging your thinking. This develops depth. Strategy 3 (Collaborative learning): Study with others, explaining concepts to each other. Everyone\'s thinking is improved through discussion. Tip: Discussion is most effective when respectful and focused on ideas, not personalities. Example: Instead of "Your opinion is wrong," try "I see it differently because... What evidence supports your position?" This approach maintains respect while developing thinking.'
          }
        ]
      },
      'Study Schedule Planning': {
        title: 'Study Schedule Planning',
        slides: [
          {
            type: 'content',
            heading: 'Study Schedule Planning',
            content: 'Without a study plan, preparation is haphazard. You might study easy topics repeatedly while avoiding hard ones. You might cram at the last minute rather than spacing study over time. A good study schedule ensures you cover all material, use time efficiently, and build knowledge progressively. Why it matters: LET requires covering massive amounts of material. Without planning, you\'ll feel overwhelmed. A schedule breaks preparation into manageable pieces and keeps you on track. Research shows that students with study plans score higher than those without, even if total study hours are similar. The schedule provides accountability—you can see if you\'re on pace to finish preparation before the exam. This section covers how to create an effective study schedule for LET preparation.'
          },
          {
            type: 'content',
            heading: 'Assessing Time Available and Setting Goals',
            content: 'First step: Calculate realistic study hours available. How much time until the LET? Subtract necessary activities—sleep (8 hours/day), work, classes, eating, basic responsibilities. What remains is available study time. Be honest about how much you can realistically study. Example: LET is 12 weeks away. You work full-time (8 hours) and sleep (8 hours). That leaves 8 hours per day. Can you realistically study 4 hours per day plus weekends? Some days you\'ll be too tired or have obligations. Plan conservatively. Maybe you can realistically study 3 hours on weekdays, 5-6 hours on weekends. That\'s roughly 3 × 5 + 2 × 5.5 = 26 hours per week. Over 12 weeks, that\'s 312 hours total. Next, set goals. LET passing score is typically 60-70%. Your goal should be higher—maybe 75-80%—because reaching high score gives buffer. Example goal: "I will score 75+ on the LET by passing all six content areas (General Education 75+, Professional Education 75+, Subject Matter Expertise 75+) with consistent practice." Break into sub-goals: "Complete General Education content review by week 4," "Complete practice exams by week 10," "Refine weak areas by week 12." This hierarchy of goals—overall goal, subject goals, weekly goals—provides direction and accountability.'
          },
          {
            type: 'content',
            heading: 'Designing Your Weekly Schedule',
            content: 'Create a weekly schedule template. Map out: (1) Work/class/sleep commitments (these are fixed). (2) Study blocks (when and how long you\'ll study). (3) Rest/relaxation (necessary for wellbeing). Be realistic. Don\'t schedule 6 hours study per day when you\'re exhausted at work. Tired studying is ineffective studying. Example weekly schedule for someone with 26 study hours available: Weekdays (Mon-Fri): Study 3 hours—maybe 1 hour morning before work (if possible), 2 hours after work. Weekends (Sat-Sun): 5-6 hours per day, spread throughout day with breaks. Vary study locations—library, home, coffee shop—to keep fresh. Vary study types—lectures one session, practice problems next, quizzes third. Monotony reduces engagement. Specificity matters. Don\'t write "study" at 7pm. Write "study General Education: Philippine history (11 slides) using Cornell notes, then create practice questions." Specific plans are more likely to happen than vague intentions. Example: Mon 7-8pm: Review Educational Psychology slides 1-3, create mind map. Mon 8-9pm: Practice test-taking strategies with 10 practice questions. This specificity guides your study and helps you track progress.'
          },
          {
            type: 'content',
            heading: 'Organizing by Subject and Difficulty',
            content: 'Good schedules allocate more time to harder subjects. Don\'t spend equal time on everything. Assess yourself: Which subjects are strongest? Which are weakest? Example assessment: Strong areas (less time needed): General Education Fundamentals (you\'re well-rounded), Pedagogy (you have classroom experience). Medium areas (moderate time): Mathematics, Science (some topics strong, some weak). Weak areas (more time needed): Subject Matter Expertise in specific content areas. Allocation example: 26 hours available per week, 12 weeks = 312 total hours. Professional Education (Pedagogy, Psychology, Curriculum): 40% = 125 hours. General Education: 30% = 93 hours. Subject Matter Expertise: 30% = 93 hours. But within Subject Matter Expertise, allocate by weakness: If English is strong, fewer hours. If Science is weak, more hours. Also, front-load harder subjects. Study hardest material early when mind is fresh, not right before exam when anxiety is high. Example: Week 1-3: Focus on hardest subjects. Week 4-8: Cover medium subjects. Week 9-10: Review medium and hard subjects, light review of easy subjects. Week 11-12: Practice exams and targeted review. This prevents the situation where you start easy subjects and never have time for hard ones.'
          },
          {
            type: 'content',
            heading: 'Progressive Study Plan: Progression Through Topics',
            content: 'Don\'t try to study everything at once. Use a progressive approach: (1) Exposure phase—quickly go through all material, getting overview. (2) Deep study phase—study each topic carefully. (3) Integration phase—see how topics connect. (4) Practice phase—take practice exams and targeted review. Example progression for 12 weeks: Weeks 1-2 (Exposure): Quickly go through all major topics (General Education, Professional Education, Subject Matter Expertise). Create a mind map of all major concepts. Goal: Know what exists, not expertise yet. Weeks 3-7 (Deep Study): Study each subject area thoroughly. Use active learning strategies. Goal: Understand concepts, not just memorize. Weeks 8-9 (Integration): Connect topics across subjects. See how philosophy concepts relate to pedagogy, how math concepts relate to science. Goal: Sophisticated understanding of interconnections. Weeks 10-11 (Practice): Take full-length practice exams. Analyze mistakes. Target review on weak areas. Goal: Test-taking skills and confidence. Week 12 (Final Review): Light review of hardest topics. Mental and physical preparation. Goal: Confidence and readiness. This progression prevents cramming and ensures retention. Material studied in week 3 will be reviewed and practiced many times before exam.'
          },
          {
            type: 'content',
            heading: 'Tracking Progress and Adjusting',
            content: 'A schedule isn\'t fixed—adjust it based on progress. Weekly, assess: Did I complete this week\'s goals? If yes, move forward. If no, understand why. Was the schedule unrealistic? Were you unwell? Distracted? Did unexpected obligations arise? Adjust accordingly. Don\'t abandon the schedule if you miss one session. Adjust expectations. If you planned 3 hours/day but realistically do 2 hours/day, adjust the end-date or coverage. Don\'t pretend you\'re on track when you\'re not. Face reality and adjust. Tracking methods: (1) Simple checklist—check off completed study sessions. (2) Progress chart—track quiz scores. Are they improving? (3) Topic checklist—check off completed topics. By week 4, have you completed General Education? If not, you\'re behind and need to adjust. Example: You planned to complete General Education by week 4. By mid-week-3, you\'re only halfway through. Options: (a) Extend General Education to week 5, compress other subjects. (b) Accept that you won\'t master General Education before moving on—continue and review it later. (c) Increase study hours if possible. Make conscious choices rather than just falling behind without knowing it.'
          }
        ]
      },
      'Building Study Groups': {
        title: 'Building Study Groups',
        slides: [
          {
            type: 'content',
            heading: 'Building Study Groups',
            content: 'Studying alone has advantages—you control pace, material, and environment. But studying with others has powerful benefits: (1) Social accountability—you\'re more likely to follow through on study plans when others depend on you. (2) Different perspectives—others see material differently, explaining things in ways that click for you. (3) Active learning—explaining to others and hearing their explanations deepens understanding. (4) Emotional support—preparing for a major exam is stressful; study groups provide encouragement. (5) Motivation—studying with motivated people increases your motivation. Why it matters: Research shows that study groups increase achievement by 15-25% compared to solitary studying, IF the group is well-organized. Poorly organized groups waste time with socializing and off-topic discussion. This section covers how to build effective study groups.'
          },
          {
            type: 'content',
            heading: 'Selecting Good Study Partners',
            content: 'Group composition matters. Select people who: (1) Are serious about passing the LET. You don\'t want someone just going through motions. (2) Have similar or complementary knowledge areas. If everyone\'s weak in math, the group won\'t help. But if you have math strength and someone else has science strength, you help each other. (3) Are reliable—they show up on time and prepared, as promised. Flaky members waste everyone\'s time. (4) Communicate respectfully. You\'ll have disagreements about concepts. Groups that can discuss disagreements respectfully learn better than groups that avoid disagreement or become hostile. (5) Have compatible schedules. Finding a time everyone can study is crucial. Group size: 3-5 people is ideal. Pairs (2 people) can work but lack diversity of perspective. Groups larger than 5 often have scheduling problems and become inefficient—some people sit silent. How to form: Ask classmates or colleagues preparing for LET. "Are you interested in a study group?" Or post in online communities for LET takers. Be selective—interview potential members. "What\'s your study style?" "How often can you meet?" "What\'s your biggest challenge in preparation?" Look for good fit. Example: You\'re strongest in English and Social Studies, weakest in Mathematics and Science. A good partner would be someone strong in Math/Science. Together, you cover more ground. You teach English/Social Studies; they teach Math/Science. Everyone benefits.'
          },
          {
            type: 'content',
            heading: 'Establishing Group Norms and Structure',
            content: 'Before starting, establish norms. Discuss: (1) Meeting frequency and duration. How often? 2x per week? 1x weekly? How long? 2 hours? More? (2) Location. Your home? Library? Coffee shop? (3) Preparation. Should members come prepared with specific topics studied beforehand? Or will you study together from scratch? (4) Participation. Everyone should contribute. How will you ensure balanced participation rather than one person dominating? (5) Use of phones/devices. Are phones allowed? (Most groups ban them to reduce distraction.) (6) Handling conflict. What if someone isn\'t pulling their weight? How will you address it respectfully? Structure each meeting: (1) Opening (5 minutes): What are we covering today? (2) Individual mini-teaches (30-40 minutes): Each person teaches a topic they studied. Others listen and ask questions. (3) Q&A and discussion (20-30 minutes): Clarify confusing points. Discuss different perspectives. (4) Practice problems or quiz together (15-20 minutes): Solve practice questions together. (5) Closing (5 minutes): Summarize, assign topics for next meeting. Example agenda: Week 3 meeting: Sam teaches Bloom\'s Taxonomy (15 min), Maria teaches Piaget\'s stages (15 min), Discussion (20 min), Practice 5 questions on Educational Psychology (10 min), Assign next week\'s topics. This structure keeps meeting focused and ensures everyone participates.'
          },
          {
            type: 'content',
            heading: 'Effective Group Study Techniques',
            content: 'How to actually study together effectively: Technique 1 (Teach-back): Member A teaches topic to other members. Others take notes and ask clarifying questions. Then Member B teaches a different topic. Everyone learns from each other\'s teaching and questioning. Technique 2 (Jigsaw): Divide material among members. Each person becomes "expert" on their topic by studying deeply. Then experts teach others. Example: Chapter on Learning Theories divided into: Person 1 (Behaviorism), Person 2 (Cognitivism), Person 3 (Constructivism), Person 4 (Socio-cultural). Each person deeply studies their theory, finds examples, understands criticisms. Group meeting: Each person teaches their theory. In 30 minutes, all four theories covered well from four different perspectives. Technique 3 (Question generation and answering): Together, generate possible exam questions on topics studied. Write them down. Quiz each other. Discuss answers. This combines active learning with collaborative learning. Technique 4 (Concept mapping together): Take a topic (like "Assessment in Education") and collaboratively create a concept map on a large paper or digital whiteboard. Everyone adds ideas, connections, examples. This visual process engages everyone and shows relationships. Tip: Rotate roles. Sometimes you teach, sometimes you listen. Sometimes you\'re the skeptic asking hard questions, sometimes you\'re explaining carefully. This variety keeps everyone engaged.'
          },
          {
            type: 'content',
            heading: 'Managing Group Challenges',
            content: 'Common study group problems and solutions: Problem: One person dominates discussion. Solution: Establish participation norms—each person gets equal time. Use a timer if needed. Facilitator (rotate this role) ensures balanced participation. Problem: Someone isn\'t prepared. Solution: Discuss this privately and respectfully. "I noticed you weren\'t prepared last week. Is everything okay? If you can\'t commit right now, we understand." Either person commits to preparing or leaves group. Problem: Group gossips instead of studying. Solution: Stay focused on agenda. Redirect. "Let\'s get back to the topic." Have a designated start time and stick to it. Problem: Group too large and chaotic. Solution: Split into smaller groups or establish stricter structure. Problem: Group members have very different knowledge levels. Solution: This can be good (teaching opportunity) or bad (slower students feel behind). Structure helps—advanced students teach peers, which deepens their understanding. Slower students learn from peers, which is sometimes more effective than teachers. Problem: Meetings become less frequent as exam approaches and stress increases. Solution: Anticipate this. Schedule critical meetings (weeks 8-10, close to exam) well in advance. Commit to them. These final weeks are crucial. Tip: Address problems quickly and respectfully. A well-functioning study group is a huge advantage. A dysfunctional one wastes time. If group isn\'t working after a few weeks, either address problems or leave and find a different group.'
          },
          {
            type: 'content',
            heading: 'Virtual Study Groups and Online Communities',
            content: 'Not everyone can meet in person regularly. Virtual study groups work well using: Video conferencing (Zoom, Google Meet, Microsoft Teams) for real-time video meetings. Screen sharing allows viewing study materials together. Chat/messaging (Discord, WhatsApp, Telegram) for asynchronous communication—asking questions, sharing resources, quick clarifications. Shared documents (Google Docs, Notion, SharePoint) for collaborative note-taking and resource compilation. Online forums (Reddit communities for LET takers, Facebook groups, specialized forums) for connecting with larger LET community, sharing strategies, asking questions. Advantages of online: Flexibility—people in different time zones can participate asynchronously. No travel time. Can refer back to chat history. Access to larger community. Disadvantages: Less personal connection. Easier to be distracted by other things when not face-to-face. Technical issues sometimes interfere. Strategy: Combination approach often works best. Have scheduled video meetings for active learning and connection. Use asynchronous communication for questions and resource sharing. Example: Monday 7pm: Live video meeting for teaching and Q&A (1 hour). Anytime: Post questions in Discord and others answer asynchronously. Thursday: Create shared Google Doc tracking everyone\'s progress on topics. This combination gives structure of in-person groups with flexibility of virtual.'
          }
        ]
      },
      'Managing Test Anxiety': {
        title: 'Managing Test Anxiety',
        slides: [
          {
            type: 'content',
            heading: 'Managing Test Anxiety',
            content: 'Test anxiety is a very real phenomenon affecting many students. It\'s not laziness or lack of preparation. Some anxiety is normal and even helpful—it activates focus and energy. But excessive anxiety impairs performance by: (1) Activating worry thoughts that consume working memory, leaving less capacity for thinking about exam questions. (2) Activating the amygdala (fear center) and suppressing the prefrontal cortex (thinking center). (3) Causing physical symptoms—tight chest, headaches, nausea, shaking—that distract you. (4) Causing test avoidance—students put off studying or avoid the exam entirely because anxiety is so uncomfortable. Why it matters: Even prepared, knowledgeable students might fail exams due to anxiety. Managing anxiety isn\'t weakness—it\'s using evidence-based techniques to optimize performance. Cognitive-behavioral approaches work best—identifying anxious thoughts, challenging them, and using coping strategies. This section covers anxiety management strategies.'
          },
          {
            type: 'content',
            heading: 'Understanding the Anxiety Cycle',
            content: 'Anxiety creates a self-perpetuating cycle: Worry thought ("I\'ll fail") → Physical anxiety response (accelerated heart rate, sweating) → Avoidance (procrastinate studying, skip practice exams) → Lack of preparation → Increased anxiety → Cycle continues. Breaking the cycle requires intervention. How worry maintains anxiety: You have a worry thought: "I\'ll fail the LET." Your body responds with anxiety symptoms (because your brain thinks there\'s danger). You interpret the anxiety as evidence the worry is true: "My anxiety proves I\'ll fail." This reinforce the worry. You avoid studying to escape anxiety (short-term relief). But avoidance prevents the habituation and mastery that would actually reduce anxiety. Long-term, avoidance worsens anxiety. Breaking the cycle: Challenge the worry thought. "I\'ve prepared for months. I\'ve passed practice exams. My worry isn\'t based in reality; it\'s anxiety talking." Lean into the anxiety rather than avoiding. Practice exams are uncomfortable, but they reduce exam-day anxiety because you\'re familiar with the experience. Prepare well so you have evidence you can do this. Evidence-based preparation is the strongest anxiety reducer. Example: Instead of "I\'ll fail," remind yourself: "I\'ve studied all content. I\'ve taken 10 practice exams, averaging 72%. The passing score is 70%. I can pass." This reality-based thinking reduces anxiety more than positive affirmations without evidence.'
          },
          {
            type: 'content',
            heading: 'Cognitive Techniques: Challenging Anxious Thoughts',
            content: 'Cognitive techniques work by identifying anxious thoughts and challenging them logically. When you notice worry: PAUSE. Name the thought: "I\'m having the thought that I\'ll fail." (Not "I will fail" but "I\'m having a thought about failure.") This creates distance between you and the thought. Ask: Is this thought based on evidence? "I\'ve prepared extensively. I\'ve scored well on practice exams. Evidence suggests I can pass." Generate alternative thoughts: Instead of "I\'ll fail," try "I\'ve prepared well, and I\'ll do my best. Whatever happens, I\'ll learn from it." Mindfulness: Notice anxious thoughts without judgment, like clouds passing in the sky. Don\'t fight them (fighting increases focus on them). Observe them and let them pass. Example anxious thoughts and challenges: Thought: "If I fail, my life is over." Challenge: "Failure would be disappointing, but not life-ending. People retake exams. I\'d learn where to improve and try again." Thought: "Everyone else is better prepared than me." Challenge: "I\'m comparing my preparation to others\' exteriors, which is unfair. I don\'t actually know their preparation. But I know mine, and it\'s solid." Thought: "I\'m too anxious; I can\'t think clearly." Challenge: "Some anxiety is normal. It doesn\'t prevent thinking. I\'ve thought clearly with anxiety before."'
          },
          {
            type: 'content',
            heading: 'Physical Anxiety Management Techniques',
            content: 'Anxiety has physical components. Managing the body helps manage the mind. Technique 1 (Controlled breathing): Box breathing: Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 5-10 times. Engages parasympathetic nervous system (calm response). 4-7-8 breathing: Inhale 4s, hold 7s, exhale 8s. The longer exhale signals safety to your body. Use whenever you feel anxiety rising. Technique 2 (Progressive muscle relaxation): Tense each muscle group for 5 seconds, then release. Start with toes, work up to head. Notice the contrast between tension and relaxation. Regular practice before exam day helps. During exam, quickly scan your body for tension and consciously relax. Technique 3 (Movement): Physical exercise reduces anxiety. A 15-20 minute walk before studying or before the exam significantly reduces anxiety. Exercise burns off stress hormones and engages your body\'s natural calm response. Technique 4 (Grounding techniques): When anxiety feels overwhelming, use 5-4-3-2-1: Notice 5 things you see, 4 things you touch, 3 things you hear, 2 things you smell, 1 thing you taste. This brings attention to present moment, away from anxious thoughts about the future. Technique 5 (Meditation): Consistent meditation (even 10 minutes daily) reduces baseline anxiety. During meditation, sit quietly, focus on breath, and when mind wanders (it will), gently return attention to breath. This trains the ability to redirect attention—useful for exams when you want to focus on exam questions, not anxiety. Example: The night before exam, take a 20-minute walk (exercise reduces anxiety). That evening, practice box breathing (5 cycles). Do 10 minutes of meditation. This physical preparation calms your nervous system before the big day.'
          },
          {
            type: 'content',
            heading: 'Building Confidence Through Preparation and Practice',
            content: 'The strongest anxiety reducer is knowing you\'re prepared. Confidence comes from evidence, not false positive thinking. How to build it: Take practice exams under real conditions (timed, quiet, no notes). Analyze mistakes carefully—what did you miss and why? For each mistake, identify the concept you need to strengthen and study it. Over time, mistakes decrease. You develop evidence: "I can do this." Build this evidence systematically. Track your scores on practice exams: Exam 1: 65%. Exam 2: 68%. Exam 3: 72%. Exam 4: 74%. This progression shows improvement and builds confidence. Set small achievable goals. Instead of "I\'ll score 80%," set "I\'ll review all of Biology by Wednesday." Achieving small goals builds momentum and confidence. Visualize success specifically. Not vague "I\'ll do well," but specific: "I\'ll read the first question carefully, identify key concepts, eliminate wrong answers systematically, and select the best remaining answer. I\'ll feel calm and focused." This mental practice combined with actual practice is powerful. Affirmations work best if they\'re believable and based on evidence. Rather than "I\'m an amazing test-taker" (probably not true), try "I\'ve prepared thoroughly and I can apply what I\'ve learned to these exam questions." This is credible and confidence-building. Example: You\'re anxious about math section. Instead of avoiding it, directly address it. Study math intensively for 2 weeks. Take 5 practice exams focused on math questions. Score tracking: 55%, 62%, 68%, 72%, 75%. Obvious improvement! Now you have evidence: "I\'ve improved 20 points through focused studying. Math section is my strength now." Anxiety decreases because confidence increases.'
          },
          {
            type: 'content',
            heading: 'Healthy Habits and Prevention',
            content: 'Preventing anxiety is easier than managing it during an exam. Lifestyle factors matter: Sleep: 7-9 hours nightly. Sleep deprivation increases anxiety and impairs thinking. If you\'re sleep-deprived, your brain is already stressed. Exercise: 150+ minutes weekly. Exercise is as effective as medication for anxiety. It gives your body an outlet for stress hormones. Nutrition: Regular, balanced meals. Hypoglycemia (low blood sugar) increases anxiety. Caffeine: Limit during study and especially 24 hours before exam. Caffeine amplifies anxiety. Reduce it gradually to avoid headaches. Social connection: Spend time with friends and family. Isolation increases anxiety. Social support is protective. Limiting uncertainty: Know exactly where the exam is, what to bring, what the schedule is. Uncertainty breeds anxiety. Having details nailed down reduces this. Time management: Rushing increases anxiety. With adequate study time and good planning, you feel more in control. Acceptance: Some anxiety is normal and even helpful—it keeps you focused. Rather than trying to eliminate anxiety entirely, accept that you\'ll feel nervous and perform anyway. Athletes feel nervous before competition; that doesn\'t prevent excellent performance. Example pre-exam week: Mon-Fri: Regular sleep (8h), exercise (20-30m), healthy meals, light review. Weekend: Continue exercise and sleep. Sun evening: Lay out materials, confirm location and time. Mentally visualize success. Tuesday exam: Morning—sleep well, eat breakfast, exercise 20 minutes, arrive early. This preparation-and-prevention approach prevents anxiety from spiking on exam day.'
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
        'Test Taking Tips and Tricks',
        'Common Pitfalls to Avoid',
        'Last Minute Preparation Guide'
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
