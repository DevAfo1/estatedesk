import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  KeyRound,
  FileText,
  AlertTriangle,
  Server,
  Terminal,
} from 'lucide-react';

export const SecurityLockoutView: React.FC = () => {
  const {
    currentUser,
    loginUser,
    lockoutState,
    resetLockout,
    auditLogs,
  } = useApp();

  const [testEmail, setTestEmail] = useState('intruder@suspicious.com');
  const [testPassword, setTestPassword] = useState('badpassword');
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  const handleSimulateFailedAttempt = () => {
    const res = loginUser(testEmail, testPassword);
    if (!res.success) {
      setLoginMessage(res.error || 'Failed attempt logged.');
    } else {
      setLoginMessage('Signed in!');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
          <Lock className="w-4 h-4" />
          <span>Security Hardening & Account Lockout Engine</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Authentication Lockout & IP Rate Limiting Simulator
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Demonstrates Argon2 password hashing protection, IP rate limits, and automated 5-attempt security lockouts.
        </p>
      </div>

      {/* Lockout Status Widget */}
      <div
        className={`rounded-xl border p-6 space-y-4 shadow-xs ${
          lockoutState.isLocked
            ? 'border-red-300 bg-red-50 dark:bg-red-950/40 dark:border-red-900'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                lockoutState.isLocked
                  ? 'bg-red-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {lockoutState.isLocked ? <Lock className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {lockoutState.isLocked ? 'Account Security Lockout Active' : 'Account Security Status: Normal'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lockoutState.isLocked
                  ? `Temporarily locked due to 5 failed consecutive attempts. Remaining cool-down: ${lockoutState.remainingSeconds}s`
                  : `Failed attempt counter: ${lockoutState.attempts}/5 threshold`}
              </p>
            </div>
          </div>

          {lockoutState.isLocked && (
            <button
              onClick={resetLockout}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Lockout Simulation
            </button>
          )}
        </div>

        {/* Failed Attempt Meter */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
            <span>Consecutive Failed Login Attempts</span>
            <span className="font-mono">{lockoutState.attempts} of 5 strikes</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                lockoutState.attempts >= 5
                  ? 'bg-red-600'
                  : lockoutState.attempts >= 3
                  ? 'bg-amber-500'
                  : 'bg-slate-900 dark:bg-white'
              }`}
              style={{ width: `${Math.min(100, (lockoutState.attempts / 5) * 100)}%` }}
            />
          </div>
        </div>

        {/* Interactive Simulator Controls */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSimulateFailedAttempt}
            disabled={lockoutState.isLocked}
            className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 ${
              lockoutState.isLocked
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Simulate 1 Failed Login Attempt
          </button>

          {loginMessage && (
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {loginMessage}
            </span>
          )}
        </div>
      </div>

      {/* Security Architecture Specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Argon2id Hashing</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Memory-hard hashing parameters (m=65536, t=3, p=4) with per-user salt preventing rainbow-table attacks.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <Server className="w-4 h-4 text-blue-600" />
            <span>IP Rate Limiting</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Sliding-window Redis rate limiter capping authentication calls to 10 requests / 60 seconds per IP block.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
            <Lock className="w-4 h-4 text-purple-600" />
            <span>Token Rotation</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Short-lived JWT access tokens (15m) paired with single-use refresh token rotation in HTTP-only cookies.
          </p>
        </div>
      </div>

      {/* Security Audit Log Stream */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Immutable Security Audit Trail
            </h3>
            <p className="text-xs text-slate-500">
              Audit logs recorded with client IP hash, timestamp, and event parameters
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {auditLogs.length} events logged
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
          {auditLogs.map((entry) => (
            <div key={entry.id} className="py-2.5 flex items-start justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white capitalize">
                    {entry.event.replace('_', ' ')}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500">{entry.userEmail}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-mono text-slate-400 text-[11px]">{entry.ipAddress}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {entry.details}
                </p>
              </div>

              <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                {entry.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
