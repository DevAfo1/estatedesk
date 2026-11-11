import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { calculateSubscriptionPrice, evaluatePlanEntitlement } from '../utils/estateDeskLogic.ts';
import { BillingCycle, PlanTierId } from '../types/index.ts';
import {
  Check,
  Zap,
  ShieldCheck,
  Tag,
  AlertCircle,
  Clock,
  Building2,
} from 'lucide-react';

export const SubscriptionView: React.FC = () => {
  const {
    currentUser,
    planCatalog,
    coupons,
    upgradeSubscription,
    simulateSubscriptionExpiryToggle,
    usageMetrics,
    subscriptionInvoices,
    requestEnterpriseAgreement,
    properties,
    units,
  } = useApp();

  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(currentUser.billingCycle || 'annual');
  const [couponInput, setCouponInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Enterprise inquiry form
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState(currentUser.email);
  const [unitVol, setUnitVol] = useState(180);
  const [whiteLabel, setWhiteLabel] = useState(true);

  const activeCoupon = couponInput
    ? coupons.find((c) => c.code.toUpperCase() === couponInput.trim().toUpperCase() && c.active)
    : null;

  const currentPlan = planCatalog.find((p) => p.id === currentUser.subscriptionTier) || planCatalog[0];
  const entitlement = evaluatePlanEntitlement(currentUser, planCatalog, properties.length, units.length);

  const handlePlanSwitch = (tierId: PlanTierId) => {
    const res = upgradeSubscription(tierId, selectedCycle, couponInput.trim() || undefined);
    setStatusMessage({ type: res.success ? 'ok' : 'err', text: res.message });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleEnterpriseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    requestEnterpriseAgreement({
      organizationName: orgName,
      contactEmail: orgEmail,
      unitVolume: Number(unitVol),
      customAnnualFeeNGN: Number(unitVol) * 3200,
      currency: 'NGN',
      whiteLabelEnabled: whiteLabel,
      apiAccessEnabled: true,
      multiBranchCount: 3,
      slaUptimePercent: 99.9,
    });
    setStatusMessage({
      type: 'ok',
      text: `Custom Enterprise quote created for ${orgName} (${unitVol} units). Routed to Super Admin Enterprise Desk.`,
    });
    setOrgName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Zap className="w-4 h-4" />
            <span>Dynamic Commercial Plans, Quotas & Billing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            EstateDesk Subscription Plans & Usage Allowances
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Independent per-account licensing. Tenants access essential tenancy & unit chat tools free; artisans access assigned work orders free.
          </p>
        </div>

        <button
          onClick={simulateSubscriptionExpiryToggle}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors self-start sm:self-auto ${
            currentUser.subscriptionStatus === 'expired'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
          }`}
        >
          {currentUser.subscriptionStatus === 'expired'
            ? 'Restore Active Subscription'
            : 'Simulate Plan Expiry (Records Preserved)'}
        </button>
      </div>

      {/* Expiry Preservation Notice */}
      {currentUser.subscriptionStatus === 'expired' && (
        <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-950 dark:text-amber-100 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Subscription Expired — All Historical Records Preserved</p>
            <p className="mt-0.5 text-amber-800 dark:text-amber-200">{entitlement.reason}</p>
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium ${
            statusMessage.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Billing Cycle & Coupon Controls */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 mr-2">Billing Cycle:</span>
          {(['weekly', 'monthly', 'quarterly', 'annual'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setSelectedCycle(cycle)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                selectedCycle === cycle
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cycle}
              {cycle === 'annual' ? ' (Save 20%)' : cycle === 'quarterly' ? ' (Save 10%+)' : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Tag className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value)}
            placeholder="Promo code (e.g. LAUNCH20)"
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono uppercase w-48"
          />
          {activeCoupon && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              -{activeCoupon.discountPercent}% applied
            </span>
          )}
        </div>
      </div>

      {/* 4 Public Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {planCatalog.map((plan) => {
          const isCurrent = currentUser.subscriptionTier === plan.id && currentUser.subscriptionStatus !== 'expired';
          const pricing = calculateSubscriptionPrice(plan, selectedCycle, activeCoupon);
          const weeklyDisabled = selectedCycle === 'weekly' && !plan.weeklyEnabled && plan.id !== 'free';

          return (
            <div
              key={plan.id}
              className={`rounded-xl p-5 flex flex-col justify-between space-y-5 bg-white dark:bg-slate-900 ${
                isCurrent
                  ? 'border-2 border-slate-900 dark:border-white shadow-sm'
                  : 'border border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{plan.name}</h2>
                  {isCurrent && (
                    <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                      ₦{pricing.finalAmountNGN.toLocaleString()}
                    </span>
                    <span className="text-xs text-slate-500">/{selectedCycle}</span>
                  </div>
                  {plan.monthlyPriceNGN > 0 && selectedCycle !== 'monthly' && (
                    <p className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                      Effective ₦{pricing.effectiveMonthlyNGN.toLocaleString()}/mo · Version {plan.pricingVersion}
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{plan.tagline}</p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="font-mono text-[11px] font-bold text-slate-900 dark:text-white">
                    {plan.maxProperties === -1 ? 'Unlimited' : plan.maxProperties} Properties · {plan.maxUnits} Units
                  </div>
                  {plan.features.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handlePlanSwitch(plan.id)}
                disabled={isCurrent || weeklyDisabled}
                className={`w-full py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors ${
                  isCurrent || weeklyDisabled
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                }`}
              >
                {weeklyDisabled
                  ? 'Weekly Disabled on Plan'
                  : isCurrent
                  ? 'Current Plan'
                  : `Select ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Usage Allowances, Fee Transparency & Custom Enterprise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Monthly Usage Quotas & Transparent Operational Costs
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono tabular-nums">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[11px] font-sans text-slate-500">SMS Reminders</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {usageMetrics.smsUsed} / {currentPlan.quotas.smsCreditsMonthly}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[11px] font-sans text-slate-500">WhatsApp Alerts</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {usageMetrics.whatsappUsed} / {currentPlan.quotas.whatsappCreditsMonthly}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[11px] font-sans text-slate-500">KYC Verifications</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {usageMetrics.kycChecksUsed} / {currentPlan.quotas.kycChecksMonthly}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[11px] font-sans text-slate-500">Document Storage</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {usageMetrics.storageUsedGb} / {currentPlan.quotas.storageGb} GB
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[11px] font-sans text-slate-500">E-Signatures</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {usageMetrics.eSignaturesUsed} / {currentPlan.quotas.eSignaturesMonthly}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[11px] font-sans text-slate-500">Staff Seats</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {usageMetrics.extraStaffSeatsUsed + 1} / {currentPlan.quotas.staffSeats}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Payment Gateway & Overage Fee Disclosure</p>
            <p>Local NGN Gateway Fee: 1.5% + ₦100 (capped at ₦2,000 per local transfer; international USD/GBP cards 3.9% + $0.30). Over-quota SMS ₦6/msg, WhatsApp ₦18/msg, KYC check ₦650.</p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <p className="font-bold text-slate-900 dark:text-white">Subscription Invoices ({subscriptionInvoices.length})</p>
            {subscriptionInvoices.slice(0, 3).map((inv) => (
              <div key={inv.id} className="flex justify-between text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                <span>{inv.invoiceNumber} · {inv.planName}</span>
                <span>₦{inv.amount.toLocaleString()} ({inv.status})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Enterprise Agreement (>100 units) */}
        <form onSubmit={handleEnterpriseSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Custom Enterprise Agreement (&gt;100 Units, White-Label & API)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            For institutional estates, real estate funds, and multi-branch firms managing above 100 units requiring bespoke SLAs, dedicated API access, or white-label branding.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Organization / Firm Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Victoria Island Estates Plc"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Unit Volume (&gt;100)</label>
              <input
                type="number"
                min={101}
                value={unitVol}
                onChange={(e) => setUnitVol(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={whiteLabel}
              onChange={(e) => setWhiteLabel(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span>Include white-label tenant portal & API webhooks</span>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            Request Custom Enterprise Proposal
          </button>
        </form>
      </div>
    </div>
  );
};
