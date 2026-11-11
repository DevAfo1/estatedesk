import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Building2, Home, ArrowLeft, Search, Compass } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  const { setActiveTab } = useApp();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6 max-w-xl mx-auto">
      {/* 404 Visual Icon */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-inner">
          <Building2 className="w-12 h-12 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-mono font-black shadow-md">
          404
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
          Prop-Tech Route Not Located
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Estate Unit or Page Not Found
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          The requested lease ledger, facility record, or tenancy URL does not exist or may have been archived under estate compliance rules.
        </p>
      </div>

      {/* Suggested Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full pt-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left space-y-1 shadow-xs"
        >
          <Home className="w-4 h-4 text-emerald-600" />
          <p className="text-xs font-bold text-slate-900 dark:text-white">Dashboard</p>
          <p className="text-[10px] text-slate-400">Portfolio overview</p>
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left space-y-1 shadow-xs"
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <p className="text-xs font-bold text-slate-900 dark:text-white">Properties</p>
          <p className="text-[10px] text-slate-400">100 unit directory</p>
        </button>

        <button
          onClick={() => setActiveTab('tenancy')}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-left space-y-1 shadow-xs col-span-2 sm:col-span-1"
        >
          <Compass className="w-4 h-4 text-purple-600" />
          <p className="text-xs font-bold text-slate-900 dark:text-white">Tenancy Deeds</p>
          <p className="text-[10px] text-slate-400">E-Sign agreements</p>
        </button>
      </div>

      <button
        onClick={() => setActiveTab('dashboard')}
        className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors flex items-center gap-2 shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Executive Dashboard</span>
      </button>
    </div>
  );
};
