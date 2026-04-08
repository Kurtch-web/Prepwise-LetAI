import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';

export function SignUpPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { signup, isLoading } = useAuth();
  const isLightMode = theme === 'light';

  const [formData, setFormData] = useState({
    full_name: '',
    email_or_id: '',
    password: '',
    password_confirm: '',
    review_type: 'GenEd',
    target_exam_date: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    if (!formData.email_or_id.trim()) {
      newErrors.email_or_id = 'Email or School ID is required';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = 'Passwords do not match';
    }

    if (!agreed) {
      newErrors.agreed = 'You must agree to the Terms & Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await signup(
        formData.full_name,
        formData.email_or_id,
        formData.email_or_id,
        formData.password,
        formData.password_confirm,
        formData.review_type,
        formData.target_exam_date || undefined
      );
      navigate('/dashboard');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Sign up failed. Please try again.');
    }
  };

  // Modal Component
  const Modal = ({ title, children, isOpen, onClose }: { title: string; children: React.ReactNode; isOpen: boolean; onClose: () => void }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className={`rounded-2xl max-w-2xl w-full max-h-96 overflow-y-auto ${
          isLightMode
            ? 'bg-white'
            : 'bg-slate-800'
        }`}>
          <div className="sticky top-0 flex items-center justify-between p-6 border-b"
            style={{
              borderColor: isLightMode ? '#e2e8f0' : '#334155'
            }}>
            <h2 className={`text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className={`text-2xl leading-none ${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >
              ×
            </button>
          </div>
          <div className={`p-6 text-sm leading-relaxed ${isLightMode ? 'text-slate-700' : 'text-slate-300'}`}>
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 transition-colors duration-200 ${
      isLightMode
        ? 'bg-gradient-to-br from-green-50 via-blue-50 to-purple-50'
        : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    }`}>
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4">
            <div className={`text-5xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent`}>
              💡
            </div>
          </div>
          <h1 className={`text-3xl font-black mb-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            LET Review Hub
          </h1>
          <p className={`text-base font-medium ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Master your GenEd & ProfEd exams
          </p>
        </div>

        {/* Main Card */}
        <div className={`rounded-3xl p-8 backdrop-blur-xl border transition-all duration-300 ${
          isLightMode
            ? 'bg-white/95 border-slate-200 shadow-xl'
            : 'bg-slate-800/50 border-slate-700 shadow-2xl'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Juan Dela Cruz"
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isLightMode
                    ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                    : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                } outline-none`}
              />
              {errors.full_name && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {errors.full_name}
                </p>
              )}
            </div>

            {/* Email or School ID */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                Email or School ID
              </label>
              <input
                type="text"
                name="email_or_id"
                value={formData.email_or_id}
                onChange={handleChange}
                placeholder="juan@school.edu or 2024-001"
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isLightMode
                    ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                    : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                } outline-none`}
              />
              {errors.email_or_id && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {errors.email_or_id}
                </p>
              )}
            </div>

            {/* Review Type & Target Exam Date in Two Columns */}
            <div className="grid grid-cols-2 gap-4">
              {/* Review Type */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isLightMode ? 'text-slate-900' : 'text-white'
                }`}>
                  Review Type <span className="text-emerald-600 font-bold">*</span>
                </label>
                <select
                  name="review_type"
                  value={formData.review_type}
                  onChange={handleChange}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isLightMode
                      ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                      : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  } outline-none`}
                >
                  <option value="GenEd">📚 GenEd</option>
                  <option value="ProfEd">🎓 ProfEd</option>
                </select>
              </div>

              {/* Target Exam Date */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${
                  isLightMode ? 'text-slate-900' : 'text-white'
                }`}>
                  Target Exam Date
                </label>
                <input
                  type="date"
                  name="target_exam_date"
                  value={formData.target_exam_date}
                  onChange={handleChange}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isLightMode
                      ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                      : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  } outline-none`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 8 characters"
                  className={`w-full rounded-xl px-4 py-3 pr-12 text-sm font-medium transition-all ${
                    isLightMode
                      ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                      : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                  } outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${
                    isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${
                isLightMode ? 'text-slate-900' : 'text-white'
              }`}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`w-full rounded-xl px-4 py-3 pr-12 text-sm font-medium transition-all ${
                    isLightMode
                      ? 'bg-white border border-slate-300 text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400'
                      : 'bg-slate-700/50 border border-slate-600 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500'
                  } outline-none`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-lg ${
                    isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password_confirm && (
                <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {errors.password_confirm}
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className={`rounded-xl p-4 ${
              isLightMode
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-blue-900/20 border border-blue-800'
            }`}>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="agreed"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (e.target.checked && errors.agreed) {
                      setErrors(prev => ({
                        ...prev,
                        agreed: ''
                      }));
                    }
                  }}
                  className="mt-1 w-5 h-5 rounded accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="agreed" className={`text-sm leading-relaxed cursor-pointer font-medium ${
                  isLightMode ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                  >
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
              {errors.agreed && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <span>⚠️</span> {errors.agreed}
                </p>
              )}
            </div>

            {/* Error Message */}
            {submitError && (
              <div className={`rounded-xl p-4 text-sm font-medium ${
                isLightMode
                  ? 'bg-red-50 border border-red-200 text-red-700'
                  : 'bg-red-900/20 border border-red-800 text-red-300'
              }`}>
                <p className="flex items-center gap-2">
                  <span>❌</span> {submitError}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:-translate-y-0 transition-all duration-300"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block animate-spin">⏳</span> Creating Account...
                </span>
              ) : (
                '✨ Create Account'
              )}
            </button>

            {/* Sign In Link */}
            <div className={`text-center text-sm ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                Sign in →
              </Link>
            </div>
          </form>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className={`rounded-2xl p-4 text-center font-medium transition-all hover:shadow-lg ${
            isLightMode
              ? 'bg-blue-50 text-blue-700 border border-blue-100'
              : 'bg-blue-900/30 text-blue-300 border border-blue-800'
          }`}>
            <div className="text-2xl mb-2">📚</div>
            <div className="text-xs font-semibold">2024 Updated</div>
          </div>
          <div className={`rounded-2xl p-4 text-center font-medium transition-all hover:shadow-lg ${
            isLightMode
              ? 'bg-purple-50 text-purple-700 border border-purple-100'
              : 'bg-purple-900/30 text-purple-300 border border-purple-800'
          }`}>
            <div className="text-2xl mb-2">✅</div>
            <div className="text-xs font-semibold">PRC Aligned</div>
          </div>
          <div className={`rounded-2xl p-4 text-center font-medium transition-all hover:shadow-lg ${
            isLightMode
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-green-900/30 text-green-300 border border-green-800'
          }`}>
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-xs font-semibold">Free Access</div>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <Modal
        title="Terms of Service"
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">1. Acceptance of Terms</h3>
            <p className="text-justify">
              By creating an account, accessing the platform, or using any of the learning materials, quizzes, AI diagnostics, analytics, or related features of PREPWISE LET AI, you agree to be bound by these Terms of Service and any future updates we publish. If you do not agree, you may not use the service.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. User Eligibility</h3>
            <p className="text-justify">
              PREPWISE LET AI is intended for LET takers, education students, review center participants, and other individuals who are lawfully using the platform for board exam preparation and study support. You represent that any information you submit is true, current, and belongs to you or that you have permission to provide it.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. Account Responsibility</h3>
            <p className="text-justify">
              You are responsible for maintaining the confidentiality of your login credentials, including your password and any verification codes, and for all activity that occurs under your account. You must immediately notify us if you suspect unauthorized access, account takeover, or misuse of your account.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. Educational Purpose and AI Disclaimer</h3>
            <p className="text-justify">
              The platform provides review materials, practice questions, learning materials, and AI-assisted diagnostics for educational support only. The AI diagnostics, recommendations, scoring estimates, and study insights are not a guarantee that a user will pass the actual LET examination. Results may vary depending on the user’s preparation, performance, and other factors. The platform does not replace formal instruction, official PRC materials, professional judgment, or independent study.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">5. Permitted Use</h3>
            <p className="text-justify">
              You may use the service for personal, lawful, and educational purposes only. You may view, read, practice, and review content made available by the platform, but you may not reproduce, distribute, publicly display, sell, sublicense, or exploit the materials except as explicitly allowed by law or by us in writing.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">6. Prohibited Conduct</h3>
            <p className="text-justify">
              You agree that you will not hack, probe, scan, or bypass security controls; scrape, harvest, or collect data from the platform; attempt to reverse engineer the service; upload malware or harmful code; impersonate another person; use the AI to generate illegal, abusive, harassing, defamatory, hateful, or infringing content; or use the service in any way that violates law, regulation, school policy, or the rights of others.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">7. User Content and Responsibility</h3>
            <p className="text-justify">
              If you submit answers, notes, messages, reports, or other content, you remain responsible for that content. You grant us the limited right to process such content to operate, improve, secure, and support the platform. You must not submit information that you are not allowed to share, including another person’s sensitive information without authorization.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">8. Suspension and Termination</h3>
            <p className="text-justify">
              We may suspend, restrict, or permanently terminate access to any account or content at any time if we believe a user violated these Terms, endangered the platform, abused the AI features, misused data, or engaged in conduct that could harm other users, the service, or our legal and security obligations.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">9. Availability and Changes</h3>
            <p className="text-justify">
              We may change, update, suspend, or discontinue any part of the platform at any time, with or without notice. We may also revise these Terms from time to time. Continued use after changes means you accept the updated Terms.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">10. Governing Law</h3>
            <p className="text-justify">
              These Terms are governed by and interpreted under the laws of the Republic of the Philippines. Any dispute arising from or related to the use of the platform will be resolved under Philippine law, subject to any mandatory legal process that may apply.
            </p>
          </div>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        title="Privacy Policy"
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">1. Our Commitment to the Safety of the Guest&apos;s Data</h3>
            <p className="text-justify">
              We recognize that student records, learning progress, assessment activity, and account details require strong protection. This Privacy Policy explains how we collect, use, store, share, and protect personal data in connection with PREPWISE LET AI, including information that may be considered Sensitive Personal Information under the Data Privacy Act of 2012 (DPA).
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. Personal Information Controller</h3>
            <p className="text-justify">
              The Personal Information Controller (PIC) is the person or team operating PREPWISE LET AI and determining the purposes and means of processing your information. The PIC is responsible for ensuring that the data you provide is handled lawfully, fairly, and transparently, and that the platform only processes what is necessary to deliver educational services, maintain accounts, and improve the learning experience.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. Information We Collect</h3>
            <p className="text-justify">
              We collect the information you provide directly when you register, update your profile, use review features, submit answers, upload videos or files, or contact support. This may include your name, email address, username, password, school or course details, study preferences, assessment history, exam preparation data, and other account-related information. We may also collect usage data such as device information, IP address, timestamps, pages visited, quiz attempts, and activity logs to keep the service secure and functional.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. Sensitive Personal Information</h3>
            <p className="text-justify">
              Because the platform is designed for students and LET review users, some of the information we process may qualify as Sensitive Personal Information or closely related educational data. We only collect and process this information when it is necessary to provide the service and when there is a valid legal basis, including user consent, fulfillment of a user request, legitimate educational purposes, or other grounds allowed by the DPA and applicable regulations. We do not process sensitive data beyond what is needed to operate the platform.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">5. How We Use Information</h3>
            <p className="text-justify">
              We use the information we collect to create and maintain accounts, personalize lessons and quizzes, provide AI diagnostics, track progress, generate reports, prevent abuse, secure the platform, respond to support requests, and improve our services. We may also use data to troubleshoot errors, monitor performance, and ensure that the content and services are delivered correctly across web and mobile browsers.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">6. Third-Party Service Providers and Data Disclosure</h3>
            <p className="text-justify">
              To operate the platform, certain data may be processed by trusted third-party service providers. Our frontend and backend are hosted on Vercel. Our database is stored in Supabase. Video files are stored in R2 Cloud Storage. Video playback and delivery are handled through Bunny CDN. These providers may process data on our behalf strictly to host, store, transmit, cache, or deliver content and to keep the service available. We disclose information to these providers only as necessary for service operation, security, analytics, or legal compliance. Where applicable, we require these providers to protect data using appropriate technical and organizational safeguards.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">7. Data Subject Rights</h3>
            <p className="text-justify">
              Under the DPA, you may exercise the following rights, subject to the conditions and exceptions provided by law: the right to be informed, the right to access, the right to object, the right to erasure or blocking, the right to damages, the right to rectify, the right to file a complaint, and the right to data portability. You may contact us to request access to your data, corrections to inaccurate records, deletion where appropriate, or explanations regarding how your information is handled.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">8. Data Retention</h3>
            <p className="text-justify">
              We keep personal data only for as long as reasonably necessary to deliver the service, comply with legal obligations, resolve disputes, enforce agreements, and maintain security. Unless a longer retention period is required by law or needed for a legitimate operational reason, we generally retain account data and related learning records for up to one year after the user&apos;s last login or account activity. After that period, data is reviewed for deletion, anonymization, or archival as appropriate.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">9. Data Disposal and Deletion</h3>
            <p className="text-justify">
              When data is no longer needed, we dispose of it using permanent deletion methods, including digital shredding, secure database deletion, and removal from active storage systems and connected backups where technically feasible. For stored media and files, we use deletion processes intended to prevent reasonable reconstruction of the data after disposal.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">10. Data Security</h3>
            <p className="text-justify">
              We use administrative, technical, and physical safeguards intended to protect data from unauthorized access, loss, misuse, disclosure, alteration, or destruction. These safeguards may include access controls, authentication, encryption in transit where supported, limited internal access, logging, and monitoring. However, no online system is completely secure, so you should also protect your own account credentials and devices.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">11. DPO and Privacy Contact</h3>
            <p className="text-justify">
              If you have questions, requests, or concerns about how your data is handled, you may contact our Data Protection Officer or privacy contact at support@letreviewhub.edu. Please include enough detail so we can identify your request and respond appropriately.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">12. Changes to This Policy</h3>
            <p className="text-justify">
              We may update this Privacy Policy from time to time to reflect changes in law, our services, or our data handling practices. When we do, we will update the effective date or otherwise provide notice where appropriate. Continued use of the platform after changes means you acknowledge the updated policy.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
