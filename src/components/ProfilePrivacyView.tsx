import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { ProfileVisibilityLevel, ProfileVisibilitySettings } from '../types/index.ts';
import {
  UserCircle2,
  Eye,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Save,
  KeyRound,
} from 'lucide-react';

export const ProfilePrivacyView: React.FC = () => {
  const {
    currentUser,
    updateProfileVisibility,
    visibleProperties,
    accessGrants,
    setActiveTab,
  } = useApp();

  const [bio, setBio] = useState(currentUser.bio || '');
  const [companyName, setCompanyName] = useState(currentUser.companyName || '');
  const [visibility, setVisibility] = useState<ProfileVisibilitySettings>(
    currentUser.profileVisibility || {
      phoneVisibility: 'authorized_contacts',
      emailVisibility: 'private',
      bioVisibility: 'public',
      certificationsVisibility: 'public',
      portfolioCountVisibility: 'private',
    }
  );
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileVisibility(visibility, bio, companyName);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const visibilityOptions: { value: ProfileVisibilityLevel; label: string; desc: string }[] = [
    { value: 'public', label: 'Public Marketplace', desc: 'Visible on public listings & search cards' },
    { value: 'authorized_contacts', label: 'Authorized Contacts', desc: 'Visible only to counterparties in active leases/grants' },
    { value: 'private', label: 'Private (Hidden)', desc: 'Strictly hidden; visible only to self & Super Admin compliance' },
  ];

  const fields: { key: keyof ProfileVisibilitySettings; label: string; sample: string }[] = [
    { key: 'phoneVisibility', label: 'Direct Phone Number', sample: currentUser.phone },
    { key: 'emailVisibility', label: 'Email Address', sample: currentUser.email },
    { key: 'bioVisibility', label: 'Professional Bio & Company', sample: companyName || 'Independent Profile' },
    { key: 'certificationsVisibility', label: 'Accreditation Badges (ESV / Trade)', sample: currentUser.kycData?.professionalBody || 'Verification Badge Only' },
    { key: 'portfolioCountVisibility', label: 'Portfolio Unit Count', sample: `${visibleProperties.length} properties` },
  ];

  const myGrants = accessGrants.filter(
    (g) => g.landlordId === currentUser.id || g.granteeUserId === currentUser.id
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <UserCircle2 className="w-4 h-4" />
          <span>Customizable Profile & Granular Privacy Matrix</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          Profile & Field Visibility Controls
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Control how your contact details, company profile, and credentials appear across the Marketplace and counterparty workspaces. Raw KYC IDs and title deeds are never exposed publicly.
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </h2>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.city || 'Lagos, Nigeria'} · Tier: <span className="font-mono uppercase font-semibold">{currentUser.subscriptionTier}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('kyc')}
          className="px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Manage 5-Track KYC
        </button>
      </div>

      {/* Edit Bio & Visibility Form */}
      <form
        onSubmit={handleSave}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label htmlFor="profile-company" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company / Firm / Practice Name
            </label>
            <input
              id="profile-company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Okafor & Partners ESV"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="profile-bio" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Public Summary Bio
            </label>
            <input
              id="profile-bio"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief professional or resident bio"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-500" />
              Granular Field Visibility Controls
            </h3>
            <span className="text-[11px] text-slate-500">NDPA 2023 Data Minimization</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {fields.map((field) => (
              <div
                key={field.key}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {field.label}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">{field.sample}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {visibilityOptions.map((opt) => {
                    const active = visibility[field.key] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        title={opt.desc}
                        onClick={() =>
                          setVisibility((prev) => ({ ...prev, [field.key]: opt.value }))
                        }
                        className={`px-3 py-1.5 min-h-[36px] text-[11px] font-semibold rounded-md border transition-colors ${
                          active
                            ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensitive Vault Safeguard Notice */}
        <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-2.5 text-xs">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-slate-700 dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">Sensitive KYC Document Isolation:</strong>{' '}
            NIN slips, passports, CAC certificates, and land title deeds remain strictly private inside the compliance vault and are never published to the Marketplace or shown to tenants/artisans.
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedNotice ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Profile & privacy controls saved.
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Changes apply immediately across Marketplace disclosures.</span>
          )}

          <button
            type="submit"
            className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Visibility Preferences
          </button>
        </div>
      </form>

      {/* Active Delegated Access Summary */}
      {myGrants.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-slate-500" />
            Related Property Access Grants ({myGrants.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {myGrants.map((g) => (
              <div key={g.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {g.granteeName} ({g.granteeRole.replace('_', ' ')})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Property ID: {g.propertyId} · Permissions: {g.permissions.join(', ')}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded uppercase ${
                    g.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                  }`}
                >
                  {g.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
