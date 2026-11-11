import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  formatCurrencyAmount,
  summarizeFinancialsByCurrency,
  canArtisanViewTicket,
} from '../utils/estateDeskLogic.ts';
import {
  Building2,
  Wrench,
  FileText,
  CreditCard,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  Clock,
  ArrowUpRight,
  Store,
  ShieldAlert,
  AlertCircle,
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const {
    currentUser,
    visibleProperties,
    units,
    rentExpirationAlerts,
    renovationTickets,
    setActiveTab,
    invoices,
    currencies,
    marketplaceListings,
    isMobileFrameMode,
  } = useApp();

  const visiblePropertyIds = new Set(visibleProperties.map((p) => p.id));
  const scopedUnits = units.filter((u) => visiblePropertyIds.has(u.propertyId));
  const scopedInvoices = invoices.filter((i) => visiblePropertyIds.has(i.propertyId));
  const scopedTickets = renovationTickets.filter((t) =>
    currentUser.role === 'artisan'
      ? canArtisanViewTicket(currentUser, t)
      : currentUser.role === 'super_admin' || visiblePropertyIds.has(t.propertyId)
  );
  const scopedAlerts = rentExpirationAlerts.filter(
    (a) => currentUser.role === 'super_admin' || visiblePropertyIds.has(a.propertyId)
  );

  const totalUnits = visibleProperties.reduce((acc, p) => acc + p.totalUnits, 0) || scopedUnits.length;
  const occupiedUnits = visibleProperties.reduce((acc, p) => acc + p.occupiedUnits, 0);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const urgentRentAlerts = scopedAlerts.filter((a) => a.isUrgent);
  const openTickets = scopedTickets.filter((t) => t.status !== 'completed');
  const currencySummaries = summarizeFinancialsByCurrency(scopedInvoices);
  const pendingScreenshotsCount = scopedInvoices.filter(
    (i) => i.verificationStatus === 'unverified_screenshot'
  ).length;
  const publishedListingsCount = marketplaceListings.filter(
    (m) => m.moderationStatus === 'published'
  ).length;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-white min-h-[250px] flex flex-col justify-end p-6 sm:p-8">
        <img
          src="/src/assets/images/hero_afolux_court_1793969242921.jpg"
          alt="EstateDesk managed luxury residential complex"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent" />

        <div className="relative z-10 max-w-3xl space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-400">
            <span>EstateDesk Prop-Tech & Verified Marketplace</span>
            <span aria-hidden="true">·</span>
            <span>Session: {currentUser.role.replace('_', ' ').toUpperCase()}</span>
            <span aria-hidden="true">·</span>
            <span>Plan: {currentUser.subscriptionTier.toUpperCase()}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white text-balance">
            Welcome, {currentUser.name}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
            {currentUser.role === 'landlord' &&
              `Isolated Landlord Portfolio (${visibleProperties.length} properties). Multi-currency rent ledgers, delegated agent permissions, and verified receipt issuance.`}
            {currentUser.role === 'agent' &&
              'Licensed Estate Surveyor workspace: delegated property access, ESVABON accreditation, verified Marketplace listings, and tenancy execution.'}
            {currentUser.role === 'tenant' &&
              'Resident Workspace: access your unit-specific private chat, upload payment transfer proofs, sign leases, and track repair requests.'}
            {currentUser.role === 'facility_manager' &&
              'Operations & Triage Console: move-in/out inspections, 14-step maintenance dispatch, artisan quotation approvals, and utility tracking.'}
            {currentUser.role === 'artisan' &&
              'Restricted Artisan Portal: strictly scoped to your assigned repair work orders, cost quote submissions, and before/after proof photos.'}
            {currentUser.role === 'super_admin' &&
              'Platform Super Admin Command: live subscription pricing & quota controls, 5-track KYC moderation, Marketplace moderation, and unit economics.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            {currentUser.role === 'artisan' ? (
              <button
                onClick={() => setActiveTab('maintenance')}
                className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                Open Assigned Work Orders ({openTickets.length})
              </button>
            ) : currentUser.role === 'tenant' ? (
              <>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  Report Repair
                </button>
                <button
                  onClick={() => setActiveTab('tenancy')}
                  className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  View & Sign Lease
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Unit Chat
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('financials')}
                  className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Invoices & Verification
                </button>
                <button
                  onClick={() => setActiveTab('rent_engine')}
                  className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Rent Reminders ({urgentRentAlerts.length})
                </button>
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5"
                >
                  <Store className="w-3.5 h-3.5" />
                  Public Marketplace ({publishedListingsCount})
                </button>
                {currentUser.role === 'super_admin' && (
                  <button
                    onClick={() => setActiveTab('super_admin')}
                    className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Super Admin Console
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>{currentUser.role === 'artisan' ? 'Assigned Repairs' : 'Scoped Portfolio Units'}</span>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {currentUser.role === 'artisan' ? scopedTickets.length : totalUnits}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {currentUser.role === 'artisan' ? 'work orders' : `across ${visibleProperties.length} properties`}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            {currentUser.role === 'artisan' ? (
              <span>Strict portfolio isolation active</span>
            ) : (
              <>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                  {occupancyRate}%
                </span>
                <span>Occupancy ({occupiedUnits} occupied)</span>
              </>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Rent Expiration Alerts</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {currentUser.role === 'artisan' ? '—' : urgentRentAlerts.length}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              {currentUser.role === 'artisan' ? 'restricted' : 'urgent action'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Milestones: 90d, 60d, 30d, 14d, 7d, 0d</span>
          </div>
        </div>

        {/* Multi-Currency Receivables KPI (Separated per currency, never mixed) */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Confirmed vs Unpaid (By Currency)</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 space-y-1">
            {currentUser.role === 'artisan' ? (
              <span className="text-xs text-slate-400">Tenant ledgers restricted for artisans</span>
            ) : currencySummaries.length === 0 ? (
              <span className="text-xs text-slate-400">No invoices in scope</span>
            ) : (
              currencySummaries.map((sum) => (
                <div key={sum.currency} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{sum.currency}</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {formatCurrencyAmount(sum.confirmedTotal, sum.currency, currencies)}{' '}
                    <span className="text-[10px] font-normal text-slate-400">paid</span>
                  </span>
                </div>
              ))
            )}
          </div>
          {pendingScreenshotsCount > 0 && currentUser.role !== 'artisan' && (
            <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{pendingScreenshotsCount} unverified screenshot(s) held</span>
            </div>
          )}
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Maintenance Pipeline</span>
            <Wrench className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {openTickets.length}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">active work orders</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>14-step quote & proof verification</span>
          </div>
        </div>
      </div>

      {/* 2-Column Split */}
      <div className={`grid gap-6 ${isMobileFrameMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        <div className={`${isMobileFrameMode ? '' : 'lg:col-span-2'} space-y-6`}>
          {currentUser.role !== 'artisan' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Automated Rent Expiration Engine
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Multi-currency lease alerts and configurable Africa/Lagos reminder schedules
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('rent_engine')}
                  className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
                >
                  Configure alerts <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {scopedAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.unitId} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {alert.unitNumber}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {alert.propertyName}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {alert.tenantName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>Lease Ends: {alert.leaseEndDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatCurrencyAmount(alert.rentAmount, alert.currency, currencies)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-xs font-semibold font-mono ${
                          alert.daysRemaining < 0
                            ? 'text-red-600 dark:text-red-400'
                            : alert.daysRemaining <= 7
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {alert.daysRemaining < 0
                          ? `${Math.abs(alert.daysRemaining)}d Overdue`
                          : `${alert.daysRemaining}d left`}
                      </span>
                      <button
                        onClick={() => setActiveTab('rent_engine')}
                        className="px-2.5 py-1.5 min-h-[36px] text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        Send Terms
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance Tickets Overview */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {currentUser.role === 'artisan' ? 'Your Assigned Work Orders' : 'Maintenance & Artisan Dispatch'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Photo evidence, artisan quotation approval, and before/after completion logs
                </p>
              </div>
              <button
                onClick={() => setActiveTab('maintenance')}
                className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
              >
                Open workflow <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {scopedTickets.slice(0, 3).map((tkt) => (
                <div
                  key={tkt.id}
                  className="p-3.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {tkt.title}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {tkt.unitNumber}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                      {tkt.description}
                    </p>
                    <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                      <span>Stage: <strong className="text-slate-700 dark:text-slate-200">{tkt.stage.replace(/_/g, ' ')}</strong></span>
                      {tkt.assignedArtisanName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Artisan: {tkt.assignedArtisanName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {tkt.photoUrls[0] && (
                    <img
                      src={tkt.photoUrls[0]}
                      alt="Repair inspection evidence"
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {currentUser.role !== 'artisan' && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Scoped Properties ({visibleProperties.length})
                </h2>
                <button
                  onClick={() => setActiveTab('properties')}
                  className="text-xs font-semibold text-slate-900 dark:text-white hover:underline"
                >
                  Directory
                </button>
              </div>

              <div className="space-y-4">
                {visibleProperties.map((prop) => (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => setActiveTab('properties')}
                    className="w-full text-left group rounded-lg border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                  >
                    <img
                      src={prop.image}
                      alt={prop.name}
                      className="w-full h-28 object-cover"
                    />
                    <div className="p-3 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {prop.name}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          {prop.currency}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {prop.address}, {prop.city}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                        <span>{prop.occupiedUnits}/{prop.totalUnits} Units Occupied</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {Math.round((prop.occupiedUnits / prop.totalUnits) * 100)}%
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>RBAC, Payment Verification & KYC</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Landlord portfolios are strictly isolated; transfer screenshots remain held in Unverified status until gateway or bank reconciliation confirmation.
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                onClick={() => setActiveTab('security')}
                className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
              >
                Audit Logs <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setActiveTab('kyc')}
                className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
              >
                5-Track KYC <ChevronRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className="text-xs font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
              >
                Privacy Controls <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
