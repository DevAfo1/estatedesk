import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Cookie,
  X,
  CheckCircle2,
  Building2,
  AlertCircle,
} from 'lucide-react';

export const LegalComplianceModals: React.FC = () => {
  const {
    cookieConsentGiven,
    setCookieConsentGiven,
    openLegalModal,
    setOpenLegalModal,
  } = useApp();

  const [unsubscribeEmail, setUnsubscribeEmail] = useState('');
  const [unsubscribeSuccess, setUnsubscribeSuccess] = useState(false);

  const handleUnsubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unsubscribeEmail) return;
    setUnsubscribeSuccess(true);
    setTimeout(() => {
      setUnsubscribeSuccess(false);
      setOpenLegalModal(null);
    }, 2500);
  };

  return (
    <>
      {!cookieConsentGiven && (
        <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Cookie className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">
                  Cookie & Privacy Governance (NDPA 2023 & GDPR)
                </p>
                <p className="text-slate-500 dark:text-slate-400 max-w-3xl">
                  EstateDesk uses strictly necessary browser storage for session role state, portfolio persistence, and security lockouts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-xs">
              <button
                onClick={() => setOpenLegalModal('cookie')}
                className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
              >
                Cookie Policy
              </button>
              <button
                onClick={() => setCookieConsentGiven(true)}
                className="px-4 py-2 min-h-[40px] font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors"
              >
                Accept Essential Cookies
              </button>
            </div>
          </div>
        </div>
      )}

      {openLegalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  EstateDesk Legal & Compliance Registry
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {openLegalModal === 'transparency' && 'Platform & Third-Party Integration Transparency'}
                  {openLegalModal === 'privacy' && 'Privacy Policy & Data Protection (NDPA 2023)'}
                  {openLegalModal === 'terms' && 'Terms, Conditions & Legal Template Disclaimer'}
                  {openLegalModal === 'refund' && 'Refund & Caution Deposit Escrow Policy'}
                  {openLegalModal === 'cookie' && 'Cookie Policy & Browser Storage'}
                  {openLegalModal === 'dmca' && '$6 Designated DMCA Statutory Filing Notice'}
                  {openLegalModal === 'unsubscribe' && 'Communication & Unsubscribe Preferences'}
                  {openLegalModal === 'business' && 'Corporate & Business Identification Details'}
                </h2>
              </div>
              <button
                onClick={() => setOpenLegalModal(null)}
                aria-label="Close legal modal"
                className="p-2 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
              {openLegalModal === 'transparency' && (
                <>
                  <div className="p-3.5 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>
                      <strong>Environment Disclosure:</strong> This interactive web application implements all EstateDesk domain logic, RBAC isolation, pricing engines, payment verification state machines, and UI workflows in the browser. External server/third-party integrations listed below are simulated in this frontend environment.
                    </p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Implemented & Tested in App:</strong> Multi-currency NGN/USD/GBP/EUR calculation & ledger isolation, Super Admin live pricing/quota editor + version log, Landlord isolation + access grant emergency/scheduled revocation, Screenshot hold vs verified payment state machine, 14-step maintenance + artisan isolation, 5 separated KYC track state, and responsive web UI.</li>
                    <li><strong>Simulated / Requires Backend Integration for Production:</strong> Server-side PostgreSQL/Redis database & JWT/Argon2 endpoints, live Paystack/Flutterwave/Stripe webhooks, live SMS/WhatsApp provider dispatch, third-party NIMC/BVN/CAC API calls, native iOS/Android binaries, and formal Nigerian legal counsel review of tenancy templates.</li>
                  </ul>
                </>
              )}

              {openLegalModal === 'privacy' && (
                <>
                  <p>
                    EstateDesk Technologies Ltd processes user data in alignment with the Nigeria Data Protection Act (NDPA 2023) and GDPR data minimization principles.
                  </p>
                  <p>
                    Sensitive KYC documents (NIN slips, title deeds, CAC filings) remain isolated inside private compliance vaults and are never exposed on the public Property Marketplace.
                  </p>
                </>
              )}

              {openLegalModal === 'terms' && (
                <>
                  <p>
                    These terms govern the use of EstateDesk by Landlords, Tenants, Estate Agents, Facility Managers, Artisans, and Administrators.
                  </p>
                  <p className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                    <strong>Legal Disclaimer:</strong> Tenancy agreement drafts and e-signature workflows provided in EstateDesk are operational templates only, do not constitute legal advice, and require review by qualified Nigerian legal counsel prior to binding legal reliance.
                  </p>
                </>
              )}

              {openLegalModal === 'refund' && (
                <>
                  <p>
                    Subscription billing fees are disclosed transparently alongside gateway charges before checkout. Caution deposits are tracked separately from platform subscription billing and reconciled against move-out inspection logs.
                  </p>
                </>
              )}

              {openLegalModal === 'cookie' && (
                <>
                  <p>
                    EstateDesk stores session role previews, unit records, and cookie acceptance flags locally in browser storage (`estatedesk_v2_*`).
                  </p>
                </>
              )}

              {openLegalModal === 'dmca' && (
                <>
                  <p className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                    <strong>Designated $6 DMCA Notice Requirement:</strong> Notices of claimed copyright infringement (17 U.S.C. § 512(c)) regarding property photography or descriptions must be sent to our designated agent.
                  </p>
                  <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white">Designated DMCA Agent:</p>
                    <p>EstateDesk Legal & IP Compliance Desk</p>
                    <p>Plot 14 Alexander Avenue, Old Ikoyi, Lagos 101233, Nigeria</p>
                    <p>Email: <a href="mailto:support@estatedesk.ng" className="underline font-semibold">support@estatedesk.ng</a></p>
                  </div>
                </>
              )}

              {openLegalModal === 'unsubscribe' && (
                <form onSubmit={handleUnsubscribe} className="space-y-3">
                  <p>Manage email and notification opt-outs for marketing communications.</p>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email..."
                    value={unsubscribeEmail}
                    onChange={(e) => setUnsubscribeEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                  />
                  {unsubscribeSuccess && (
                    <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Preferences saved.</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  >
                    Confirm Unsubscribe
                  </button>
                </form>
              )}

              {openLegalModal === 'business' && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-slate-900 dark:text-white" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      EstateDesk Technologies Ltd
                    </h3>
                  </div>
                  <p>CAC Registration: <strong>RC #1849204</strong></p>
                  <p>LASRERA License: <strong>LAS/EST/2021/0491</strong></p>
                  <p>Headquarters: Plot 14 Alexander Avenue, Old Ikoyi, Lagos, Nigeria</p>
                  <p>Email: <a href="mailto:support@estatedesk.ng" className="font-semibold underline">support@estatedesk.ng</a></p>
                  <p>Telephone: <a href="tel:+2348031234567" className="font-semibold underline">+234 803 123 4567</a></p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setOpenLegalModal(null)}
                className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
