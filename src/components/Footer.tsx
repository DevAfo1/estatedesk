import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setOpenLegalModal, setCurrentUserRole, setActiveTab } = useApp();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Corporate Bio */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                EstateDesk
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Multi-role real estate management SaaS and verified property marketplace engineered for Nigerian landlords, estate surveyors, facility teams, artisans, and tenants with multi-currency international support.
            </p>
            <div className="pt-1 flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
              <a
                href="mailto:support@estatedesk.ng"
                className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@estatedesk.ng</span>
              </a>
              <a
                href="tel:+2348031234567"
                className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+234 803 123 4567 (Lagos) / +44 20 7946 0912 (London)</span>
              </a>
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Plot 14 Alexander Avenue, Old Ikoyi, Lagos</span>
              </div>
            </div>
          </div>

          {/* Quick Platform Portals */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Ecosystem Portals
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Verified Property Marketplace
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentUserRole('landlord');
                    setActiveTab('dashboard');
                  }}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Landlord Isolated Portfolio
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentUserRole('agent');
                    setActiveTab('kyc');
                  }}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Agent ESVABON Accreditation
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentUserRole('artisan');
                    setActiveTab('maintenance');
                  }}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Artisan Work Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentUserRole('super_admin');
                    setActiveTab('super_admin');
                  }}
                  className="hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Super Admin Pricing & Moderation
                </button>
              </li>
            </ul>
          </div>

          {/* Compliance & Legal Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Compliance & Transparency
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button
                  onClick={() => setOpenLegalModal('transparency')}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline text-left"
                >
                  Platform & Integration Disclosure
                </button>
              </li>
              <li>
                <button
                  onClick={() => setOpenLegalModal('privacy')}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Privacy Policy (NDPA & GDPR)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setOpenLegalModal('terms')}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Terms & Legal Template Disclaimer
                </button>
              </li>
              <li>
                <button
                  onClick={() => setOpenLegalModal('refund')}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Refund & Deposit Escrow Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setOpenLegalModal('cookie')}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Cookie Policy & Local Storage
                </button>
              </li>
              <li>
                <button
                  onClick={() => setOpenLegalModal('dmca')}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  $6 Designated DMCA Agent Notice
                </button>
              </li>
              <li>
                <button
                  onClick={() => setOpenLegalModal('business')}
                  className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-left"
                >
                  Corporate Details (RC #1849204)
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 EstateDesk Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span>LASRERA Reg: LAS/EST/2021/0491</span>
            <span aria-hidden="true">·</span>
            <span>WCAG 2.1 AA Aligned</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
