import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { RentExpirationAlert } from '../types/index.ts';
import { formatCurrencyAmount } from '../utils/estateDeskLogic.ts';
import {
  Clock,
  Send,
  CheckCircle2,
  CreditCard,
  User,
  Bell,
  SlidersHorizontal,
} from 'lucide-react';

export const RentAlertsEngineView: React.FC = () => {
  const {
    rentExpirationAlerts,
    visibleProperties,
    sendRenewalTermsAlert,
    setActiveTab,
    createInvoiceReceipt,
    currentUser,
    currencies,
    reminderRule,
    updateReminderRule,
    reminderLogs,
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sentSuccessId, setSentSuccessId] = useState<string | null>(null);
  const [showScheduleEditor, setShowScheduleEditor] = useState(false);

  const visiblePropertyIds = new Set(visibleProperties.map((p) => p.id));
  const scopedAlerts = rentExpirationAlerts.filter(
    (a) => currentUser.role === 'super_admin' || visiblePropertyIds.has(a.propertyId)
  );

  const filteredAlerts = scopedAlerts.filter((alert) => {
    if (filterStatus === 'overdue') return alert.daysRemaining < 0;
    if (filterStatus === 'urgent') return alert.daysRemaining >= 0 && alert.daysRemaining <= 7;
    if (filterStatus === 'warning') return alert.daysRemaining > 7 && alert.daysRemaining <= 30;
    if (filterStatus === 'notice') return alert.daysRemaining > 30 && alert.daysRemaining <= 90;
    return true;
  });

  const handleDispatchRenewal = (alert: RentExpirationAlert) => {
    sendRenewalTermsAlert(alert.unitId);
    setSentSuccessId(alert.unitId);
    setTimeout(() => setSentSuccessId(null), 3000);
  };

  const handleGenerateRenewalInvoice = (alert: RentExpirationAlert) => {
    const prop = visibleProperties.find((p) => p.id === alert.propertyId);
    const serviceAmount = Math.round(alert.rentAmount * 0.2);
    const subtotal = alert.rentAmount + serviceAmount;
    const taxAmount = Math.round(subtotal * 0.075);

    createInvoiceReceipt({
      propertyId: alert.propertyId,
      unitId: alert.unitId,
      landlordId: prop?.landlordId || 'usr_landlord_1',
      tenantId: 'usr_tenant_1',
      tenantName: alert.tenantName,
      rentPeriod: `Renewal (${alert.leaseEndDate})`,
      currency: alert.currency,
      type: 'invoice',
      issueDate: '2026-11-11',
      dueDate: alert.leaseEndDate,
      items: [
        {
          id: `itm_${Date.now()}_1`,
          description: `Annual Tenancy Renewal Rent - Unit ${alert.unitNumber}`,
          category: 'Rent',
          amount: alert.rentAmount,
        },
        {
          id: `itm_${Date.now()}_2`,
          description: `Estate Service Charge & Power Backup Levy`,
          category: 'Service Charge',
          amount: serviceAmount,
        },
      ],
      subtotal,
      taxRatePercent: 7.5,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      verificationStatus: 'unpaid',
      status: 'unpaid',
      watermarkText: 'RENEWAL INVOICE',
      notes: `Official renewal assessment dispatched prior to lease termination date ${alert.leaseEndDate}.`,
      generatedByRole: currentUser.role,
    });
    setActiveTab('financials');
  };

  const toggleInterval = (days: number) => {
    const exists = reminderRule.intervalsDays.includes(days);
    const next = exists
      ? reminderRule.intervalsDays.filter((d) => d !== days)
      : [...reminderRule.intervalsDays, days].sort((a, b) => b - a);
    updateReminderRule({ ...reminderRule, intervalsDays: next });
  };

  const allPresetDays = [90, 60, 30, 14, 7, 0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
            <span>Configurable Multi-Channel Reminder Engine ({reminderRule.timezone})</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Rent Expiration & Renewal Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configurable reminder schedule with deduplicated audit logs across in-app, email, push, SMS, and WhatsApp (external providers simulated in demo).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowScheduleEditor((v) => !v)}
          className="px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          {showScheduleEditor ? 'Hide Schedule Rules' : 'Configure Schedule & Channels'}
        </button>
      </div>

      {/* Configurable Rule Builder */}
      {showScheduleEditor && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Reminder Milestones & Dispatch Channels
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="tz-select" className="text-slate-500 font-medium">Timezone:</label>
              <select
                id="tz-select"
                value={reminderRule.timezone}
                onChange={(e) => updateReminderRule({ ...reminderRule, timezone: e.target.value })}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs"
              >
                <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
              Active Trigger Milestones (Days Before Expiry):
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {allPresetDays.map((d) => {
                const active = reminderRule.intervalsDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleInterval(d)}
                    className={`px-3 py-1.5 min-h-[36px] text-xs font-mono font-semibold rounded-md border transition-colors ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {d === 0 ? 'Due Day (0d)' : `${d} Days`}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  updateReminderRule({
                    ...reminderRule,
                    includeOverdue: !reminderRule.includeOverdue,
                  })
                }
                className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-md border transition-colors ${
                  reminderRule.includeOverdue
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                + Overdue Escalation
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
              Notification Channels:
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {(
                [
                  { key: 'inApp', label: 'In-App (Live)' },
                  { key: 'email', label: 'Email (Simulated)' },
                  { key: 'push', label: 'Mobile Push (Simulated)' },
                  { key: 'whatsapp', label: 'WhatsApp (Simulated)' },
                  { key: 'sms', label: 'SMS (Simulated)' },
                ] as const
              ).map((ch) => {
                const enabled = reminderRule.channels[ch.key];
                return (
                  <button
                    key={ch.key}
                    type="button"
                    onClick={() =>
                      updateReminderRule({
                        ...reminderRule,
                        channels: { ...reminderRule.channels, [ch.key]: !enabled },
                      })
                    }
                    className={`px-3 py-1.5 min-h-[36px] rounded-md border font-semibold ${
                      enabled
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto max-w-max">
        {[
          { id: 'all', label: `All (${scopedAlerts.length})` },
          { id: 'overdue', label: 'Overdue' },
          { id: 'urgent', label: '0–7 Days' },
          { id: 'warning', label: '8–30 Days' },
          { id: 'notice', label: '31–90 Days' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
              filterStatus === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alert Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-full p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              No leases match the selected milestone filter.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isOverdue = alert.daysRemaining < 0;
            const isCritical = alert.daysRemaining <= 7;

            return (
              <div
                key={alert.unitId}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {alert.unitNumber}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {alert.propertyName}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs font-bold font-mono tabular-nums ${
                          isOverdue
                            ? 'text-red-600 dark:text-red-400'
                            : isCritical
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {isOverdue
                          ? `${Math.abs(alert.daysRemaining)}d Overdue`
                          : `${alert.daysRemaining}d Left`}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Ends: {alert.leaseEndDate}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{alert.tenantName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <p>Email: {alert.tenantEmail}</p>
                      <p>Phone: {alert.tenantPhone}</p>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Rent ({alert.currency})</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrencyAmount(alert.rentAmount, alert.currency, currencies)}
                    </span>
                  </div>

                  <div className="text-[11px] flex items-center justify-between">
                    <span className="text-slate-500">Notice Packet:</span>
                    {alert.renewalSent || sentSuccessId === alert.unitId ? (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Dispatched
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending Dispatch</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDispatchRenewal(alert)}
                    className="w-full py-2 min-h-[40px] px-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Send Terms
                  </button>

                  <button
                    onClick={() => handleGenerateRenewalInvoice(alert)}
                    className="w-full py-2 min-h-[40px] px-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <CreditCard className="w-3 h-3" />
                    Bill Invoice
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reminder Delivery Log */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-500" />
            Deduplicated Reminder Delivery Log ({reminderLogs.length})
          </h2>
          <span className="text-[11px] font-mono text-slate-400">{reminderRule.timezone}</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {reminderLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {log.unitNumber} · {log.propertyName}{' '}
                  <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                    [{log.milestoneLabel}]
                  </span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Recipients: {log.recipientSummary} · Channels: {log.channels.join(', ')}
                </p>
              </div>
              <span className="font-mono text-[11px] text-slate-400 shrink-0">
                {log.dispatchedAt}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
