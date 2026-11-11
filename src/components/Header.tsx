import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { UserRole } from '../types/index.ts';
import {
  Building2,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Lock,
  UserCircle2,
  ShieldAlert,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    setCurrentUserRole,
    activeTab,
    setActiveTab,
    isMobileFrameMode,
    setIsMobileFrameMode,
    isDarkMode,
    toggleDarkMode,
    logoutUser,
    lockoutState,
    rentExpirationAlerts,
    renovationTickets,
    setIsAuthModalOpen,
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const urgentAlertsCount = rentExpirationAlerts.filter((a) => a.isUrgent).length;
  const activeTicketsCount = renovationTickets.filter((t) =>
    currentUser.role === 'artisan'
      ? t.assignedArtisanId === currentUser.id && t.status !== 'completed'
      : t.status !== 'completed'
  ).length;

  const roles: { role: UserRole; label: string; badge: string }[] = [
    { role: 'landlord', label: 'Chief Dr. Afolayan', badge: 'Landlord' },
    { role: 'agent', label: 'Kingsley Okafor, ESV', badge: 'Agent' },
    { role: 'facility_manager', label: 'Engr. Musa Ibrahim', badge: 'Facility Mgr' },
    { role: 'tenant', label: 'Sarah Ade Johnson', badge: 'Tenant' },
    { role: 'artisan', label: 'Tunde Balogun', badge: 'Artisan' },
    { role: 'super_admin', label: 'Adaobi Nwosu', badge: 'Super Admin' },
  ];

  const getNavLinks = () => {
    if (currentUser.role === 'artisan') {
      return [
        { id: 'maintenance', label: `Assigned Work Orders${activeTicketsCount > 0 ? ` (${activeTicketsCount})` : ''}` },
        { id: 'marketplace', label: 'Marketplace' },
        { id: 'kyc', label: 'Vendor KYC' },
        { id: 'profile', label: 'Profile & Privacy' },
      ];
    }
    if (currentUser.role === 'super_admin') {
      return [
        { id: 'super_admin', label: 'Admin Console' },
        { id: 'dashboard', label: 'Overview' },
        { id: 'marketplace', label: 'Marketplace' },
        { id: 'subscription', label: 'Plans & Quotas' },
        { id: 'security', label: 'Security & Audit' },
        { id: 'kyc', label: 'KYC Registry' },
      ];
    }
    return [
      { id: 'dashboard', label: 'Overview' },
      { id: 'marketplace', label: 'Marketplace' },
      { id: 'properties', label: 'Properties' },
      { id: 'rent_engine', label: `Rent Alerts${urgentAlertsCount > 0 ? ` (${urgentAlertsCount})` : ''}` },
      { id: 'financials', label: 'Payments' },
      { id: 'tenancy', label: 'E-Sign' },
      { id: 'maintenance', label: `Maintenance${activeTicketsCount > 0 ? ` (${activeTicketsCount})` : ''}` },
      { id: 'chat', label: 'Chats' },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          {/* Zone 1: Clean single-line Brand Wordmark */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => setActiveTab(currentUser.role === 'artisan' ? 'maintenance' : currentUser.role === 'super_admin' ? 'super_admin' : 'dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none min-h-[40px]"
              aria-label="EstateDesk Home"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                EstateDesk
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          {!isMobileFrameMode && (
            <nav className="hidden xl:flex items-center gap-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {navLinks.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => setActiveTab(link.id)}
                    className={`whitespace-nowrap transition-colors py-2 px-1 border-b-2 ${
                      isActive
                        ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-bold'
                        : 'border-transparent hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {link.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Zone 3: Interactive Actions (Viewport Toggle, Dark Mode, Role Switcher) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsMobileFrameMode((prev) => !prev)}
              title={isMobileFrameMode ? 'Switch to Full Desktop View' : 'Preview Mobile Device Frame (390×844)'}
              aria-label="Toggle mobile device frame preview"
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMobileFrameMode ? (
                <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={toggleDarkMode}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle dark mode"
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* 6-Role Quick Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xs"
                aria-expanded={roleMenuOpen}
                aria-label="Switch Role Session"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-md object-cover border border-slate-300 dark:border-slate-600"
                />
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[100px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Role & Access Simulation
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Inspect strict RBAC across all 6 ecosystem roles
                    </p>
                  </div>
                  <div className="py-1 space-y-0.5">
                    {roles.map((r) => (
                      <button
                        key={r.role}
                        onClick={() => {
                          setCurrentUserRole(r.role);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                          currentUser.role === r.role
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate">{r.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ml-2 shrink-0 ${
                            currentUser.role === r.role
                              ? 'bg-white/20 text-white dark:bg-slate-900/15 dark:text-slate-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {r.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-0.5">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <UserCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      Profile & Visibility Controls
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('kyc');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      5-Track KYC Verification
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('subscription');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      Plan & Quotas ({currentUser.subscriptionTier.toUpperCase()})
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('security');
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Security & Audit Monitor
                    </button>
                    <button
                      onClick={() => {
                        setIsAuthModalOpen(true);
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Sign In / Register (18+)
                    </button>
                    <button
                      onClick={() => {
                        logoutUser();
                        setRoleMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Reset / Sign Out Session
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="xl:hidden p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 py-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  setActiveTab(link.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-between ${
                  activeTab === link.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{link.label}</span>
              </button>
            ))}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 px-3">
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setMobileNavOpen(false);
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white py-1"
              >
                Profile & Privacy
              </button>
              <button
                onClick={() => {
                  setActiveTab('subscription');
                  setMobileNavOpen(false);
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white py-1"
              >
                Plans & Quotas
              </button>
              <button
                onClick={() => {
                  setActiveTab('security');
                  setMobileNavOpen(false);
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white py-1"
              >
                Security Logs
              </button>
            </div>
          </div>
        )}
      </div>

      {lockoutState.isLocked && (
        <div className="bg-red-600 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5" />
          <span>
            Security Lockout Active: Account locked for {lockoutState.remainingSeconds}s after 5 failed attempts.
          </span>
        </div>
      )}
    </header>
  );
};
