import {
  AccessGrant,
  AccessPermissionScope,
  BillingCycle,
  CouponCode,
  CurrencyCode,
  CurrencyConfig,
  InvoiceReceipt,
  PlanTierId,
  Property,
  RenovationTicket,
  SubscriptionPlanConfig,
  TenancyRecord,
  User,
} from '../types/index.ts';

/**
 * 1. Dynamic Subscription Pricing Calculator
 * Uses configurable plan catalog (no hardcoded pricing in UI components).
 */
export function calculateSubscriptionPrice(
  plan: SubscriptionPlanConfig,
  cycle: BillingCycle,
  coupon?: CouponCode | null
): {
  baseAmountNGN: number;
  cycleDiscountPercent: number;
  couponDiscountPercent: number;
  finalAmountNGN: number;
  effectiveMonthlyNGN: number;
} {
  if (plan.id === 'free' || plan.monthlyPriceNGN === 0) {
    return {
      baseAmountNGN: 0,
      cycleDiscountPercent: 0,
      couponDiscountPercent: 0,
      finalAmountNGN: 0,
      effectiveMonthlyNGN: 0,
    };
  }

  let baseAmountNGN = plan.monthlyPriceNGN;
  let cycleDiscountPercent = 0;

  if (cycle === 'weekly') {
    baseAmountNGN = plan.weeklyPriceNGN ?? Math.round(plan.monthlyPriceNGN * 0.3);
  } else if (cycle === 'quarterly') {
    baseAmountNGN = plan.monthlyPriceNGN * 3;
    cycleDiscountPercent = plan.quarterlyDiscountPercent;
  } else if (cycle === 'annual') {
    baseAmountNGN = plan.monthlyPriceNGN * 12;
    cycleDiscountPercent = plan.annualDiscountPercent;
  }

  const afterCycle = Math.round(baseAmountNGN * (1 - cycleDiscountPercent / 100));

  const validCoupon =
    coupon && coupon.active && coupon.appliesTo.includes(plan.id) ? coupon.discountPercent : 0;

  const finalAmountNGN = Math.max(0, Math.round(afterCycle * (1 - validCoupon / 100)));

  const monthsEquivalent =
    cycle === 'annual' ? 12 : cycle === 'quarterly' ? 3 : cycle === 'weekly' ? 0.25 : 1;

  return {
    baseAmountNGN,
    cycleDiscountPercent,
    couponDiscountPercent: validCoupon,
    finalAmountNGN,
    effectiveMonthlyNGN: Math.round(finalAmountNGN / monthsEquivalent),
  };
}

/**
 * 2. Subscription Entitlement & Historical Record Preservation Guard
 * Expired plans restrict adding new units or premium tools but NEVER delete or hide historical records.
 */
export function evaluatePlanEntitlement(
  user: Pick<User, 'role' | 'subscriptionTier' | 'subscriptionStatus'>,
  planCatalog: SubscriptionPlanConfig[],
  currentPropertyCount: number,
  currentUnitCount: number
): {
  canAddProperty: boolean;
  canAddUnit: boolean;
  premiumAutomationAllowed: boolean;
  historicalRecordsPreserved: boolean;
  reason?: string;
} {
  if (user.role === 'tenant' || user.role === 'artisan' || user.role === 'super_admin') {
    return {
      canAddProperty: user.role === 'super_admin',
      canAddUnit: user.role === 'super_admin',
      premiumAutomationAllowed: user.role === 'super_admin',
      historicalRecordsPreserved: true,
    };
  }

  // Expired subscription falls back to free limits while preserving all historical data
  const effectiveTier: PlanTierId =
    user.subscriptionStatus === 'expired' ? 'free' : user.subscriptionTier;

  const plan =
    planCatalog.find((p) => p.id === effectiveTier) ||
    planCatalog.find((p) => p.id === 'free')!;

  const canAddProperty =
    plan.maxProperties === -1 || currentPropertyCount < plan.maxProperties;
  const canAddUnit = plan.maxUnits === -1 || currentUnitCount < plan.maxUnits;
  const premiumAutomationAllowed =
    user.subscriptionStatus !== 'expired' && effectiveTier !== 'free';

  let reason: string | undefined;
  if (user.subscriptionStatus === 'expired') {
    reason =
      'Subscription expired: historical records remain intact and readable, while premium automation and capacity expansion are paused until renewal.';
  } else if (!canAddUnit) {
    reason = `${plan.name} limit reached (${plan.maxUnits} units). Upgrade your plan to add more units.`;
  }

  return {
    canAddProperty,
    canAddUnit,
    premiumAutomationAllowed,
    historicalRecordsPreserved: true,
    reason,
  };
}

/**
 * 3. Multi-Currency Minor-Unit Safe Formatter & Grouping (ISO 4217)
 * Never silently mixes currencies into one unlabelled sum.
 */
export function toMinorUnits(majorAmount: number, factor: number = 100): number {
  return Math.round((Number(majorAmount) || 0) * factor);
}

export function fromMinorUnits(minorUnits: number, factor: number = 100): number {
  return Math.round(minorUnits) / factor;
}

export function formatCurrencyAmount(
  amountMajor: number,
  currencyCode: CurrencyCode,
  currencies: CurrencyConfig[]
): string {
  const cfg = currencies.find((c) => c.code === currencyCode);
  const symbol = cfg?.symbol || `${currencyCode} `;
  const formatted = Math.round(amountMajor).toLocaleString('en-US');
  return `${symbol}${formatted}`;
}

export interface CurrencyGroupSummary {
  currency: CurrencyCode;
  confirmedTotal: number;
  pendingVerificationTotal: number;
  unpaidTotal: number;
}

export function summarizeFinancialsByCurrency(
  docs: InvoiceReceipt[]
): CurrencyGroupSummary[] {
  const map = new Map<CurrencyCode, CurrencyGroupSummary>();

  for (const doc of docs) {
    const existing = map.get(doc.currency) || {
      currency: doc.currency,
      confirmedTotal: 0,
      pendingVerificationTotal: 0,
      unpaidTotal: 0,
    };

    const isVerified =
      doc.verificationStatus === 'verified_gateway' ||
      doc.verificationStatus === 'verified_bank_transfer' ||
      doc.verificationStatus === 'verified_cash';

    if (isVerified && doc.status === 'paid') {
      existing.confirmedTotal += doc.totalAmount;
    } else if (
      doc.verificationStatus === 'unverified_screenshot' ||
      doc.verificationStatus === 'pending_reconciliation' ||
      doc.status === 'pending_verification'
    ) {
      existing.pendingVerificationTotal += doc.totalAmount;
    } else if (doc.status === 'unpaid' || doc.status === 'overdue') {
      existing.unpaidTotal += doc.totalAmount;
    }

    map.set(doc.currency, existing);
  }

  return Array.from(map.values());
}

/**
 * 4. Strict Payment Verification Rules
 * Screenshots alone NEVER mark rent as paid or unlock confirmed receipts.
 */
export function evaluatePaymentVerification(
  doc: Pick<InvoiceReceipt, 'verificationStatus' | 'status' | 'paymentReference'>
): {
  isConfirmedPaid: boolean;
  canIssueOfficialReceipt: boolean;
  includeInConfirmedRevenue: boolean;
  badgeLabel: string;
} {
  const confirmed =
    doc.verificationStatus === 'verified_gateway' ||
    doc.verificationStatus === 'verified_bank_transfer' ||
    doc.verificationStatus === 'verified_cash';

  if (confirmed && doc.status === 'paid') {
    return {
      isConfirmedPaid: true,
      canIssueOfficialReceipt: true,
      includeInConfirmedRevenue: true,
      badgeLabel:
        doc.verificationStatus === 'verified_gateway'
          ? 'Verified (Gateway)'
          : doc.verificationStatus === 'verified_bank_transfer'
          ? 'Verified (Bank Transfer)'
          : 'Verified (Authorized Cash)',
    };
  }

  if (doc.verificationStatus === 'unverified_screenshot') {
    return {
      isConfirmedPaid: false,
      canIssueOfficialReceipt: false,
      includeInConfirmedRevenue: false,
      badgeLabel: 'Pending — Screenshot Submitted (Unverified)',
    };
  }

  if (doc.verificationStatus === 'pending_reconciliation') {
    return {
      isConfirmedPaid: false,
      canIssueOfficialReceipt: false,
      includeInConfirmedRevenue: false,
      badgeLabel: 'Pending Bank Reconciliation',
    };
  }

  if (doc.verificationStatus === 'refunded') {
    return {
      isConfirmedPaid: false,
      canIssueOfficialReceipt: false,
      includeInConfirmedRevenue: false,
      badgeLabel: 'Refunded',
    };
  }

  return {
    isConfirmedPaid: false,
    canIssueOfficialReceipt: false,
    includeInConfirmedRevenue: false,
    badgeLabel: 'Unpaid / Awaiting Remittance',
  };
}

/**
 * 5. Delegated Access Grant & Landlord Isolation Evaluator
 * Checks active window, custom scheduled revocation timestamp, emergency revocation, and permission scope.
 */
export function isAccessGrantActive(
  grant: AccessGrant,
  nowIso: string = new Date().toISOString()
): boolean {
  if (grant.status !== 'active' || grant.revokedAt) {
    return false;
  }
  const nowMs = new Date(nowIso).getTime();
  const startMs = new Date(grant.startDate).getTime();
  if (!Number.isNaN(startMs) && nowMs < startMs) {
    return false;
  }
  if (grant.scheduledRevocationAt) {
    const revMs = new Date(grant.scheduledRevocationAt).getTime();
    if (!Number.isNaN(revMs) && nowMs >= revMs) {
      return false;
    }
  }
  return true;
}

export function canUserAccessProperty(
  user: User,
  property: Property,
  accessGrants: AccessGrant[],
  requiredPermission?: AccessPermissionScope,
  nowIso: string = new Date().toISOString()
): boolean {
  if (user.role === 'super_admin') return true;
  if (user.role === 'artisan') return false; // Artisans never browse property portfolios
  if (user.role === 'landlord') {
    // Strict landlord isolation: Landlord A cannot view Landlord B's properties
    return property.landlordId === user.id;
  }
  if (user.role === 'tenant') {
    return user.assignedPropertyIds.includes(property.id);
  }

  // Agents & Facility Managers must hold an active delegated access grant for that specific property
  const grant = accessGrants.find(
    (g) =>
      g.granteeUserId === user.id &&
      g.propertyId === property.id &&
      isAccessGrantActive(g, nowIso)
  );
  if (!grant) return false;
  if (requiredPermission) {
    return grant.permissions.includes(requiredPermission);
  }
  return true;
}

/**
 * 6. Apartment-Specific Private Chat & Artisan Isolation Guards
 */
export function canAccessUnitChat(
  user: User,
  property: Property,
  unitId: string,
  tenancies: TenancyRecord[],
  accessGrants: AccessGrant[],
  nowIso: string = new Date().toISOString()
): boolean {
  if (user.role === 'artisan') return false;
  if (user.role === 'super_admin') return true;
  if (user.role === 'landlord') return property.landlordId === user.id;

  if (user.role === 'tenant') {
    // Must hold an active (non-expired, non-terminated) tenancy on that specific unit
    return tenancies.some(
      (t) =>
        t.unitId === unitId &&
        t.tenantId === user.id &&
        t.status === 'active'
    );
  }

  return canUserAccessProperty(user, property, accessGrants, 'moderate_chat', nowIso);
}

export function canArtisanViewTicket(user: User, ticket: RenovationTicket): boolean {
  if (user.role === 'artisan') {
    return ticket.assignedArtisanId === user.id;
  }
  return true;
}

/**
 * 7. Configurable Rent Reminder Milestone Matcher & Deduplicator
 */
export function matchReminderMilestone(
  daysRemaining: number,
  intervalsDays: number[],
  includeOverdue: boolean
): string | null {
  if (daysRemaining < 0) {
    return includeOverdue ? 'overdue' : null;
  }
  const sorted = [...intervalsDays].sort((a, b) => a - b);
  for (const threshold of sorted) {
    if (daysRemaining <= threshold) {
      return `${threshold}d`;
    }
  }
  return null;
}
