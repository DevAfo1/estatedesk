import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { UserRole } from '../types/index.ts';
import {
  Lock,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  X,
  CheckCircle2,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginUser,
    signupUser,
    lockoutState,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [signInEmail, setSignInEmail] = useState('bamidele@estatedesk.ng');
  const [signInPassword, setSignInPassword] = useState('pass123456');

  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('landlord');
  const [ageConsent, setAgeConsent] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = loginUser(signInEmail, signInPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Authentication failed');
    } else {
      setSuccessMessage('Session authenticated successfully. Initializing workspace...');
      setTimeout(() => setIsAuthModalOpen(false), 600);
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!ageConsent) {
      setErrorMessage('Statutory Age Gate: You must confirm you are at least 18 years old.');
      return;
    }
    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    const res = signupUser(fullName, signUpEmail, selectedRole, signUpPhone);
    if (!res.success) {
      setErrorMessage(res.error || 'Registration failed');
    } else {
      setSuccessMessage(`Account created for ${fullName} (${selectedRole.replace('_', ' ').toUpperCase()}). Welcome to EstateDesk!`);
      setTimeout(() => setIsAuthModalOpen(false), 700);
    }
  };

  const quickUsers = [
    { label: 'Landlord', email: 'bamidele@estatedesk.ng', role: 'landlord' as UserRole },
    { label: 'Estate Agent', email: 'kingsley@estatedesk.ng', role: 'agent' as UserRole },
    { label: 'Facility Mgr', email: 'musa@estatedesk.ng', role: 'facility_manager' as UserRole },
    { label: 'Tenant', email: 'sarah.ade@gmail.com', role: 'tenant' as UserRole },
    { label: 'Artisan', email: 'tunde.plumbing@estatedesk.ng', role: 'artisan' as UserRole },
    { label: 'Super Admin', email: 'admin@estatedesk.ng', role: 'super_admin' as UserRole },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>EstateDesk Multi-Role RBAC</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {mode === 'signin' ? 'Account Sign-In' : 'Create EstateDesk Account'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {mode === 'signin'
                ? 'Simulated client-side session authentication with 5-strike lockout.'
                : 'Register as Landlord, Tenant, Estate Agent, Facility Manager, or Artisan.'}
            </p>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            aria-label="Close authentication modal"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-colors ${
              mode === 'signin'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage('');
            }}
            className={`py-2 rounded-lg transition-colors ${
              mode === 'signup'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Register (18+ Gate)
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                />
              </div>
            </div>

            {lockoutState.isLocked && (
              <p className="text-xs text-red-600 font-bold">
                Account locked: {lockoutState.remainingSeconds}s remaining.
              </p>
            )}

            <button
              type="submit"
              disabled={lockoutState.isLocked}
              className="w-full py-2.5 min-h-[40px] px-4 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              Authenticate & Sign In
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Demo Persona Quick Fill (All 6 Roles)
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {quickUsers.map((u) => (
                  <button
                    key={u.role}
                    type="button"
                    onClick={() => {
                      setSignInEmail(u.email);
                      setSignInPassword('pass123456');
                    }}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] text-left truncate text-slate-700 dark:text-slate-300"
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-3.5">
            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Olawale Adeleke"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="+234 803 123 4567"
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Select Platform Role (Super Admin is invite-only)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { role: 'landlord' as UserRole, title: 'Landlord', desc: 'Property owner' },
                  { role: 'tenant' as UserRole, title: 'Tenant', desc: 'Free resident access' },
                  { role: 'agent' as UserRole, title: 'Estate Agent', desc: 'ESV / NIESV / ESVABON' },
                  { role: 'facility_manager' as UserRole, title: 'Facility Mgr', desc: 'Repairs & triage' },
                  { role: 'artisan' as UserRole, title: 'Artisan / Vendor', desc: 'Assigned work orders' },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      selectedRole === item.role
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <p className="text-xs">{item.title}</p>
                    <p className="text-[10px] text-slate-400">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">Create Password</label>
              <input
                type="password"
                required
                placeholder="Min. 6 characters"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
              />
            </div>

            <label className="flex items-start gap-2.5 pt-1 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConsent}
                onChange={(e) => setAgeConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300"
              />
              <span>
                <strong>Statutory Age Gate (18+):</strong> I confirm I am at least 18 years old and eligible to use EstateDesk.
              </span>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 min-h-[40px] px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Complete Registration & Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
