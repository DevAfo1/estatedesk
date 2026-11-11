import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export const AgeGateModal: React.FC = () => {
  const { hasAgeConsent, setHasAgeConsent } = useApp();
  const [birthYear, setBirthYear] = useState('1992');
  const [errorMessage, setErrorMessage] = useState('');

  if (hasAgeConsent) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const currentYear = 2026;
    const yearNum = parseInt(birthYear, 10);
    if (!yearNum || currentYear - yearNum < 18) {
      setErrorMessage('You must be at least 18 years of age to legally execute Nigerian and international real estate tenancy agreements.');
      return;
    }
    setHasAgeConsent(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleVerify}
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Age Verification Gate
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tenancy deeds, biometric facial verification, and escrow leases are legally binding contracts reserved for individuals aged 18 and older.
          </p>
        </div>

        <div className="text-left text-xs space-y-1">
          <label className="block font-semibold text-slate-700 dark:text-slate-300">
            Birth Year
          </label>
          <input
            type="number"
            min="1920"
            max="2026"
            value={birthYear}
            onChange={(e) => {
              setBirthYear(e.target.value);
              setErrorMessage('');
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
          />
        </div>

        {errorMessage && (
          <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
        )}

        <button
          type="submit"
          className="w-full py-2.5 px-4 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors shadow-xs"
        >
          Verify 18+ Legal Age & Continue
        </button>
      </form>
    </div>
  );
};
