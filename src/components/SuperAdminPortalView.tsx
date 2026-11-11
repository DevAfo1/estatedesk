import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { PlanTierId, UserKYCTracks, KYCStatus, MarketplaceModerationStatus } from '../types/index.ts';
import {
  ShieldCheck,
  TrendingUp,
  Sliders,
  Users,
  CheckCircle2,
  XCircle,
  Tag,
  Globe,
  Download,
  Lock,
  Building2,
} from 'lucide-react';

export const SuperAdminPortalView: React.FC = () => {
  const {
    currentUser,
    allUsers,
    planCatalog,
    pricingHistory,
    updatePlanConfig,
    coupons,
    createCoupon,
    toggleCoupon,
    enterpriseAgreements,
    marketplaceListings,
    moderateMarketplaceListing,
    updateUserKYCTrack,
    currencies,
    addCurrency,
    usageMetrics,
    auditLogs,
    properties,
    units,
  } = useApp();

  const [mfaVerified, setMfaVerified] = useState(true);
  const [adminSection, setAdminSection] = useState<'economics' | 'pricing' | 'kyc' | 'marketplace' | 'currencies'>('economics');

  // Plan editor state
  const [editingPlanId, setEditingPlanId] = useState<PlanTierId>('basic');
  const editingPlan = planCatalog.find((p) => p.id === editingPlanId) || planCatalog[1];
  const [priceDraft, setPriceDraft] = useState<number>(editingPlan.monthlyPriceNGN);
  const [annualDiscDraft, setAnnualDiscDraft] = useState<number>(editingPlan.annualDiscountPercent);
  const [maxUnitsDraft, setMaxUnitsDraft] = useState<number>(editingPlan.maxUnits);
  const [changeNote, setChangeNote] = useState<string>('Periodic pricing review');
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Coupon creator
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(15);

  // Currency creator
  const [currCode, setCurrCode] = useState('CAD');
  const [currSymbol, setCurrSymbol] = useState('C$');
  const [currName, setCurrName] = useState('Canadian Dollar');
  const [currFx, setCurrFx] = useState(1180);

  if (currentUser.role !== 'super_admin') {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
        <Lock className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Restricted: Super Admin Portal</h2>
        <p className="text-xs text-slate-500">
          Switch to the Super Admin role in the top bar to inspect commercial pricing administration, KYC queues, marketplace moderation, and unit economics.
        </p>
      </div>
    );
  }

  const handleSelectPlanToEdit = (pid: PlanTierId) => {
    setEditingPlanId(pid);
    const target = planCatalog.find((p) => p.id === pid);
    if (target) {
      setPriceDraft(target.monthlyPriceNGN);
      setAnnualDiscDraft(target.annualDiscountPercent);
      setMaxUnitsDraft(target.maxUnits);
    }
  };

  const handleSavePlanConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlanConfig(
      editingPlanId,
      {
        monthlyPriceNGN: Number(priceDraft),
        annualDiscountPercent: Number(annualDiscDraft),
        maxUnits: Number(maxUnitsDraft),
      },
      changeNote
    );
    setSaveBanner(`Updated ${editingPlanId.toUpperCase()} pricing version (${changeNote}).`);
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    createCoupon({
      code: couponCode.trim().toUpperCase(),
      discountPercent: Number(couponDiscount),
      appliesTo: ['basic', 'professional', 'portfolio'],
      expiresAt: '2027-12-31',
      active: true,
    });
    setCouponCode('');
  };

  const handleAddCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currCode.trim()) return;
    addCurrency({
      code: currCode.trim().toUpperCase(),
      symbol: currSymbol,
      name: currName,
      minorUnitFactor: 100,
      fxRateToNGN: Number(currFx),
      fxUpdatedAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} WAT`,
    });
  };

  const handleExportAnalyticsCSV = () => {
    const rows = [
      ['Metric', 'Value', 'Note'],
      ['Active Paying Accounts (Seed)', '4', 'Portfolio + Professional + Basic + Enterprise'],
      ['Estimated Monthly Recurring Revenue (NGN)', '222000', 'Simulated seed portfolio calculation'],
      ['Estimated Annual Recurring Revenue (NGN)', '2664000', 'Simulated seed portfolio calculation'],
      ['SMS Credits Used', String(usageMetrics.smsUsed), 'Current billing cycle'],
      ['WhatsApp Messages Used', String(usageMetrics.whatsappUsed), 'Current billing cycle'],
      ['Storage Consumed (GB)', String(usageMetrics.storageUsedGb), 'Documents & photos'],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estatedesk-commercial-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dynamic MRR computed cleanly from active seeded catalog + user roles
  const payingUsers = allUsers.filter(
    (u) => (u.role === 'landlord' || u.role === 'agent' || u.role === 'facility_manager') && u.subscriptionTier !== 'free'
  );
  const simulatedMRR = payingUsers.reduce((acc, u) => {
    const plan = planCatalog.find((p) => p.id === u.subscriptionTier);
    return acc + (plan ? plan.monthlyPriceNGN : 0);
  }, 0) + Math.round(enterpriseAgreements.reduce((a, e) => a + e.customAnnualFeeNGN / 12, 0));

  return (
    <div className="space-y-6">
      {/* Header & MFA Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>EstateDesk Platform Owner & Governance Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Super Admin Operations & Commercial Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dynamic subscription configuration, 5-track KYC moderation, marketplace review, currencies, and unit economics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMfaVerified(!mfaVerified)}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            MFA Gate: {mfaVerified ? 'Hardware Key Verified' : 'Locked (Click to Verify)'}
          </button>
          <button
            onClick={handleExportAnalyticsCSV}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto scrollbar-none">
        {[
          { id: 'economics', label: 'Commercial & Unit Economics' },
          { id: 'pricing', label: 'Subscription Pricing & Coupons' },
          { id: 'kyc', label: '5-Track KYC Approvals' },
          { id: 'marketplace', label: 'Marketplace Moderation' },
          { id: 'currencies', label: 'Currencies & System Audit' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setAdminSection(t.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              adminSection === t.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {saveBanner && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
          {saveBanner}
        </div>
      )}

      {adminSection === 'economics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500">Seeded Portfolio MRR (NGN)</p>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                ₦{simulatedMRR.toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">ARR Run-Rate: ₦{(simulatedMRR * 12).toLocaleString()}</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500">Paying Accounts / Properties</p>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                {payingUsers.length} · {properties.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{units.length} active units tracked</p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500">Monthly Comms Usage</p>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                {usageMetrics.smsUsed + usageMetrics.whatsappUsed}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                SMS: {usageMetrics.smsUsed} · WhatsApp: {usageMetrics.whatsappUsed}
              </p>
            </div>
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <p className="text-xs text-slate-500">Storage & KYC Checks</p>
              <p className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white mt-2">
                {usageMetrics.storageUsedGb} GB
              </p>
              <p className="text-[11px] text-slate-400 mt-1">{usageMetrics.kycChecksUsed} KYC checks this cycle</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Unit Economics & Estimated Gross Margin Assumptions by Tier (Editable Model)
            </h2>
            <p className="text-xs text-slate-500">
              Note: Unit costs below represent operational cost estimates (SMS/WhatsApp, KYC API, storage, gateway fees) for internal financial planning rather than audited live gateway settlement data.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4">Monthly Price</th>
                    <th className="py-2 pr-4">Unit Ceiling</th>
                    <th className="py-2 pr-4">Est. Monthly Infra + Comms Cost</th>
                    <th className="py-2 text-right">Est. Gross Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                  {planCatalog.map((p) => {
                    const estCost =
                      p.id === 'free' ? 180 : p.id === 'basic' ? 420 : p.id === 'professional' ? 1450 : 2900;
                    const margin =
                      p.monthlyPriceNGN === 0
                        ? 'Loss-leader (₦-180)'
                        : `${Math.round(((p.monthlyPriceNGN - estCost) / p.monthlyPriceNGN) * 100)}%`;
                    return (
                      <tr key={p.id}>
                        <td className="py-2.5 pr-4 font-sans font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="py-2.5 pr-4">₦{p.monthlyPriceNGN.toLocaleString()}</td>
                        <td className="py-2.5 pr-4">{p.maxUnits} units</td>
                        <td className="py-2.5 pr-4 text-slate-500">₦{estCost.toLocaleString()}</td>
                        <td
                          className={`py-2.5 text-right font-semibold ${
                            p.monthlyPriceNGN === 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {margin}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {adminSection === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dynamic Plan Editor */}
          <form onSubmit={handleSavePlanConfig} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-500" />
                Dynamic Plan Pricing & Quota Editor
              </h2>
              <select
                value={editingPlanId}
                onChange={(e) => handleSelectPlanToEdit(e.target.value as PlanTierId)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                {planCatalog.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Monthly Price (₦)</label>
                <input
                  type="number"
                  value={priceDraft}
                  onChange={(e) => setPriceDraft(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Annual Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={annualDiscDraft}
                  onChange={(e) => setAnnualDiscDraft(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Max Units (-1 unlim)</label>
                <input
                  type="number"
                  value={maxUnitsDraft}
                  onChange={(e) => setMaxUnitsDraft(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold mb-1">Pricing Version Audit Note</label>
              <input
                type="text"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            >
              Publish Pricing Update (Appends Historical Version)
            </button>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Historical Pricing Versions ({pricingHistory.length})</p>
              <div className="max-h-36 overflow-y-auto space-y-1.5 text-[11px]">
                {pricingHistory.map((h, i) => (
                  <div key={i} className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 flex justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold">{h.version}</span> · <span className="uppercase">{h.planId}</span> — ₦{h.monthlyPriceNGN.toLocaleString()}/mo ({h.annualDiscountPercent}% annual)
                      <p className="text-slate-500">{h.notes}</p>
                    </div>
                    <span className="text-slate-400 font-mono shrink-0">{h.changedAt.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* Coupons & Enterprise Agreements */}
          <div className="space-y-6">
            <form onSubmit={handleCreateCoupon} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                Promotional Coupon Codes
              </h2>
              <div className="flex gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Code (e.g. Q4PROMO)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono uppercase"
                />
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={couponDiscount}
                  onChange={(e) => setCouponDiscount(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
                />
                <button type="submit" className="px-4 py-2 font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  Add
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {coupons.map((c) => (
                  <div key={c.code} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{c.code}</span>
                      <span className="text-slate-500 ml-2">{c.discountPercent}% off · Expires {c.expiresAt}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCoupon(c.code)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded border ${
                        c.active
                          ? 'border-emerald-300 text-emerald-700 dark:text-emerald-400'
                          : 'border-slate-300 text-slate-400'
                      }`}
                    >
                      {c.active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                ))}
              </div>
            </form>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Custom Enterprise Agreements (&gt;100 Units)
              </h2>
              {enterpriseAgreements.map((ent) => (
                <div key={ent.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>{ent.organizationName}</span>
                    <span className="font-mono">₦{ent.customAnnualFeeNGN.toLocaleString()}/yr</span>
                  </div>
                  <p className="text-slate-500">
                    {ent.unitVolume} units · {ent.multiBranchCount} branches · SLA {ent.slaUptimePercent}% · {ent.status.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {adminSection === 'kyc' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            5-Track KYC Moderation Queue (Identity · Ownership · Professional · Business · Artisan)
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {allUsers.map((u) => (
              <div key={u.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">
                    {u.name} <span className="text-slate-400 font-normal capitalize">({u.role.replace('_', ' ')})</span>
                  </p>
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 font-mono">
                    <span>ID: {u.kycTracks.identity.status}</span>
                    <span>Owner: {u.kycTracks.propertyOwnership.status}</span>
                    <span>Prof: {u.kycTracks.professionalQualification.status}</span>
                    <span>CAC: {u.kycTracks.businessRegistration.status}</span>
                    <span>Artisan: {u.kycTracks.artisanVendor.status}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      ['identity', 'Approve ID'],
                      ['professionalQualification', 'Approve Prof'],
                      ['propertyOwnership', 'Approve Title'],
                      ['artisanVendor', 'Approve Artisan'],
                    ] as Array<[keyof UserKYCTracks, string]>
                  ).map(([track, label]) => (
                    <button
                      key={track}
                      onClick={() => updateUserKYCTrack(u.id, track, 'verified', undefined, 'Approved by Super Admin')}
                      className="px-2.5 py-1.5 text-[11px] font-semibold rounded border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200"
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    onClick={() => updateUserKYCTrack(u.id, 'identity', 'rejected', undefined, 'Rejected pending clearer document')}
                    className="px-2.5 py-1.5 text-[11px] font-semibold rounded border border-red-200 text-red-600"
                  >
                    Flag / Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminSection === 'marketplace' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Marketplace Moderation & Flagged Listings ({marketplaceListings.length})
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {marketplaceListings.map((l) => (
              <div key={l.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">{l.title}</p>
                  <p className="text-slate-500">
                    {l.listerName} · {l.currency} {l.price.toLocaleString()} · Status: <strong className="uppercase">{l.moderationStatus}</strong>
                    {l.reportedCount > 0 && <span className="text-red-600 ml-2">Flagged ({l.reportedCount}): {l.lastReportReason}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(
                    [
                      ['published', 'Publish'],
                      ['under_review', 'Hold Review'],
                      ['rejected', 'Reject'],
                      ['archived', 'Archive'],
                    ] as Array<[MarketplaceModerationStatus, string]>
                  ).map(([st, label]) => (
                    <button
                      key={st}
                      onClick={() => moderateMarketplaceListing(l.id, st)}
                      className={`px-2.5 py-1.5 text-[11px] font-semibold rounded border ${
                        l.moderationStatus === st
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {adminSection === 'currencies' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleAddCurrency} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-500" />
              ISO 4217 Currency & Explicit FX Disclosure Registry
            </h2>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <input value={currCode} onChange={(e) => setCurrCode(e.target.value)} placeholder="Code" className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono uppercase" />
              <input value={currSymbol} onChange={(e) => setCurrSymbol(e.target.value)} placeholder="Symbol" className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
              <input value={currName} onChange={(e) => setCurrName(e.target.value)} placeholder="Name" className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
              <input type="number" value={currFx} onChange={(e) => setCurrFx(Number(e.target.value))} placeholder="NGN Rate" className="px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono" />
            </div>
            <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              Add / Update Currency Rate
            </button>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {currencies.map((c) => (
                <div key={c.code} className="py-2 flex justify-between font-mono">
                  <span>{c.code} ({c.symbol}) — {c.name}</span>
                  <span>1 {c.code} = ₦{c.fxRateToNGN.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </form>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent System Audit Logs ({auditLogs.length})</h2>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {auditLogs.slice(0, 10).map((a) => (
                <div key={a.id} className="py-2 space-y-0.5">
                  <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                    <span className="uppercase">{a.event.replace('_', ' ')}</span>
                    <span className="font-mono text-[10px] text-slate-400">{a.timestamp}</span>
                  </div>
                  <p className="text-slate-500">{a.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
