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
            <h3 className="font-bold mb-2">1. Use License</h3>
            <p className="text-justify">
              Permission is granted to temporarily download one copy of the materials (information or software) on LET Review Hub for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-justify">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the site</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. Disclaimer</h3>
            <p className="text-justify">
              The materials on LET Review Hub are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. Limitations</h3>
            <p className="text-justify">
              In no event shall LET Review Hub or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the site.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. Accuracy of Materials</h3>
            <p className="text-justify">
              The materials appearing on LET Review Hub could include technical, typographical, or photographic errors. We do not warrant that any of the materials on the site are accurate, complete, or current.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">5. Modifications</h3>
            <p className="text-justify">
              LET Review Hub may revise these terms of service for the site at any time without notice. By using this site, you are agreeing to be bound by the then current version of these terms of service.
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
            <h3 className="font-bold mb-2">1. Information We Collect</h3>
            <p className="text-justify">
              We collect information you provide directly to us, such as when you create an account, including your name, email address, school ID, and password. We may also collect information about your use of our service, including your review type preference and target exam date.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">2. How We Use Your Information</h3>
            <p className="text-justify">
              We use the information we collect to provide, maintain, and improve our service, to send you technical notices and support messages, and to respond to your comments and questions. We use your information to personalize your experience and provide content relevant to your selected review type.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">3. Data Security</h3>
            <p className="text-justify">
              We implement appropriate technical and organizational measures designed to protect personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is completely secure.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">4. Information Sharing</h3>
            <p className="text-justify">
              We do not sell, trade, or rent your personal identification information to others. We may share aggregated demographic information with our business partners, but this cannot be used to identify you personally.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">5. Your Rights</h3>
            <p className="text-justify">
              You have the right to access, update, or delete your personal information at any time by logging into your account or contacting us. We will respond to your request within 30 days.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">6. Changes to This Policy</h3>
            <p className="text-justify">
              We reserve the right to modify this privacy policy at any time. We will notify you of any changes by updating the "Last Updated" date of this Privacy Policy. Your continued use of the service following the posting of revised Privacy Policy means that you accept and agree to the changes.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
