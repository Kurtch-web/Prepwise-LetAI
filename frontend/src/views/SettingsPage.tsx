import { useEffect, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { api, UpdateProfileRequest, UserProfile } from '../services/api';

const cardShellClasses =
  'rounded-3xl border border-white/10 bg-[#0b111a]/80 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.45)] backdrop-blur-xl';
const accentButtonClasses =
  'rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:border-indigo-400 hover:bg-indigo-500/20';
const inputClasses =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-indigo-400';

const emailStatusBadgeClasses = (verified: boolean) =>
  `inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
    verified
      ? 'bg-emerald-500/20 text-emerald-300'
      : 'bg-amber-500/20 text-amber-300'
  }`;

export function SettingsPage() {
  const { logout, session } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('');
  const [locale, setLocale] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Email verification state
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getProfile(session.token);
        setProfile(res);
        setEmail(res.email ?? '');
        setPhone(res.phoneE164 ?? '');
        setFirstName(res.firstName ?? '');
        setLastName(res.lastName ?? '');
        setDisplayName(res.displayName ?? '');
        setAvatarUrl(res.avatarUrl ?? '');
        setBio(res.bio ?? '');
        setTimezone(res.timezone ?? '');
        setLocale(res.locale ?? '');
        setMarketingOptIn(!!res.marketingOptIn);
      } catch {}
      setLoading(false);
    };
    load();
  }, [session]);

  const saveProfile = async () => {
    if (!session) return;
    setSaving(true);
    setMessage(null);
    const body: UpdateProfileRequest = {
      email: email || null,
      phoneE164: phone || null,
      firstName: firstName || null,
      lastName: lastName || null,
      displayName: displayName || null,
      avatarUrl: avatarUrl || null,
      bio: bio || null,
      timezone: timezone || null,
      locale: locale || null,
      marketingOptIn
    };
    try {
      const res = await api.updateProfile(session.token, body);
      setProfile(res);
      setMessage('Saved');
      if (email && !res.emailVerifiedAt) {
        setShowEmailVerification(true);
        await sendVerificationCode();
      }
    } catch (e: any) {
      setMessage(e.message || 'Failed to save');
    }
    setSaving(false);
  };

  const sendVerificationCode = async () => {
    if (!session || !email) return;
    setSendingCode(true);
    setVerificationMessage(null);
    try {
      await api.requestEmailCode(session.token, email);
      setVerificationMessage('Verification code sent to your email');
      setVerificationCode('');
    } catch (e: any) {
      setVerificationMessage(e.message || 'Failed to send verification code');
    }
    setSendingCode(false);
  };

  const verifyEmailCode = async () => {
    if (!session || !verificationCode) return;
    setVerifyingCode(true);
    setVerificationMessage(null);
    try {
      await api.verifyEmail(session.token, verificationCode);
      setVerificationMessage('Email verified successfully!');
      setVerificationCode('');
      setShowEmailVerification(false);
      const res = await api.getProfile(session.token);
      setProfile(res);
    } catch (e: any) {
      setVerificationMessage(e.message || 'Failed to verify email');
    }
    setVerifyingCode(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid max-w-[880px] gap-3">
        <h1 className="text-4xl font-extrabold text-white md:text-5xl">Settings</h1>
        <p className="max-w-2xl text-lg text-white/70">Manage your session and preferences.</p>
      </div>

      <section className={`${cardShellClasses} space-y-5`}>
        <div className="space-y-1">
          <p className="text-sm text-white/70">Signed in as</p>
          <p className="text-lg font-semibold text-white">{session?.username} ({session?.role})</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 pb-1">
              <label className="block text-sm text-white/70">Email (optional)</label>
              {profile?.email && (
                <div className={emailStatusBadgeClasses(!!profile.emailVerifiedAt)}>
                  <div className={`h-2 w-2 rounded-full ${profile.emailVerifiedAt ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {profile.emailVerifiedAt ? 'Verified' : 'Unverified'}
                </div>
              )}
            </div>
            <input className={inputClasses} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block pb-1 text-sm text-white/70">Phone (optional)</label>
            <input className={inputClasses} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+15551234567" />
          </div>
          <div>
            <label className="block pb-1 text-sm text-white/70">First name</label>
            <input className={inputClasses} value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="block pb-1 text-sm text-white/70">Last name</label>
            <input className={inputClasses} value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block pb-1 text-sm text-white/70">Display name</label>
            <input className={inputClasses} value={displayName} onChange={e => setDisplayName(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="block pb-1 text-sm text-white/70">Avatar URL</label>
            <input className={inputClasses} value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="md:col-span-2">
            <label className="block pb-1 text-sm text-white/70">Bio</label>
            <textarea className={`${inputClasses} min-h-[100px]`} value={bio} onChange={e => setBio(e.target.value)} />
          </div>
          <div>
            <label className="block pb-1 text-sm text-white/70">Timezone</label>
            <input className={inputClasses} value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g. America/Los_Angeles" />
          </div>
          <div>
            <label className="block pb-1 text-sm text-white/70">Locale</label>
            <input className={inputClasses} value={locale} onChange={e => setLocale(e.target.value)} placeholder="e.g. en-US" />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input id="marketing" type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/10" checked={marketingOptIn} onChange={e => setMarketingOptIn(e.target.checked)} />
            <label htmlFor="marketing" className="text-sm text-white/80">Receive product updates and tips</label>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button className={accentButtonClasses} disabled={saving || loading} onClick={saveProfile} type="button">
            {saving ? 'Saving...' : 'Save profile'}
          </button>
          {message ? <span className="text-sm text-white/70">{message}</span> : null}
        </div>
        <div>
          <button className={accentButtonClasses} type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </section>

      {profile?.email && !profile.emailVerifiedAt && (
        <section className={`${cardShellClasses} space-y-5 border-amber-400/50 bg-amber-500/5`}>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Verify your email</h2>
            <p className="text-sm text-white/70">
              Please verify your email address to secure your account. Unverified emails may result in account access restrictions.
            </p>
          </div>

          {showEmailVerification ? (
            <div className="space-y-4">
              <div>
                <label className="block pb-2 text-sm text-white/70">Verification code</label>
                <input
                  className={inputClasses}
                  type="text"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={verifyingCode}
                />
                <p className="mt-1 text-xs text-white/50">Enter the 6-digit code sent to {email}</p>
              </div>

              {verificationMessage && (
                <div
                  className={`rounded-lg px-3 py-2 text-sm ${
                    verificationMessage.includes('success')
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {verificationMessage}
                </div>
              )}

              <div className="flex gap-3">
                <button className={accentButtonClasses} onClick={verifyEmailCode} disabled={verifyingCode || verificationCode.length !== 6} type="button">
                  {verifyingCode ? 'Verifying...' : 'Verify code'}
                </button>
                <button
                  className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/60 transition hover:border-white/20 hover:text-white"
                  onClick={() => setShowEmailVerification(false)}
                  disabled={verifyingCode}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className={accentButtonClasses} onClick={() => setShowEmailVerification(true)} disabled={sendingCode || loading} type="button">
              {sendingCode ? 'Sending...' : 'Send verification code'}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
