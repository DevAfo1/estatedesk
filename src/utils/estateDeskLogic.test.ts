import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSubscriptionPrice,
  evaluatePlanEntitlement,
  formatCurrencyAmount,
  summarizeFinancialsByCurrency,
  evaluatePaymentVerification,
  isAccessGrantActive,
  canUserAccessProperty,
  canAccessUnitChat,
  canArtisanViewTicket,
  matchReminderMilestone,
} from './estateDeskLogic.ts';
import {
  AccessGrant,
  CouponCode,
  CurrencyConfig,
  InvoiceReceipt,
  Property,
  RenovationTicket,
  SubscriptionPlanConfig,
  TenancyRecord,
  User,
} from '../types/index.ts';

const SAMPLE_PLANS: SubscriptionPlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Starter',
    monthlyPriceNGN: 0,
    weeklyEnabled: false,
    quarterlyDiscountPercent: 0,
    annualDiscountPercent: 20,
    maxProperties: 1,
    maxUnits: 3,
    features: [],
    quotas: { smsCreditsMonthly: 10, whatsappCreditsMonthly: 0, kycChecksMonthly: 1, eSignaturesMonthly: 2, storageGb: 1, staffSeats: 1 },
    pricingVersion: 'v1.0',
    updatedAt: '2026-11-01',
  },
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Growing landlords',
    monthlyPriceNGN: 2000,
    weeklyPriceNGN: 600,
    weeklyEnabled: true,
    quarterlyDiscountPercent: 10,
    annualDiscountPercent: 20,
    maxProperties: 5,
    maxUnits: 10,
    features: [],
    quotas: { smsCreditsMonthly: 100, whatsappCreditsMonthly: 50, kycChecksMonthly: 5, eSignaturesMonthly: 15, storageGb: 10, staffSeats: 2 },
    pricingVersion: 'v1.0',
    updatedAt: '2026-11-01',
  },
];

const SAMPLE_CURRENCIES: CurrencyConfig[] = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', minorUnitFactor: 100, fxRateToNGN: 1, fxUpdatedAt: '2026-11-11' },
  { code: 'USD', symbol: '$', name: 'US Dollar', minorUnitFactor: 100, fxRateToNGN: 1620, fxUpdatedAt: '2026-11-11' },
];

test('calculateSubscriptionPrice applies dynamic annual 20% discount and coupon correctly', () => {
  const basic = SAMPLE_PLANS[1];
  const annual = calculateSubscriptionPrice(basic, 'annual', null);
  assert.equal(annual.baseAmountNGN, 24000);
  assert.equal(annual.finalAmountNGN, 19200); // 20% annual discount -> ₦19,200

  const coupon: CouponCode = {
    code: 'LAUNCH10',
    discountPercent: 10,
    appliesTo: ['basic'],
    expiresAt: '2027-01-01',
    active: true,
    redemptions: 0,
  };
  const withCoupon = calculateSubscriptionPrice(basic, 'annual', coupon);
  assert.equal(withCoupon.finalAmountNGN, 17280);
});

test('evaluatePlanEntitlement preserves historical records when subscription expires', () => {
  const expiredLandlord = {
    role: 'landlord' as const,
    subscriptionTier: 'basic' as const,
    subscriptionStatus: 'expired' as const,
  };
  const res = evaluatePlanEntitlement(expiredLandlord, SAMPLE_PLANS, 2, 8);
  assert.equal(res.historicalRecordsPreserved, true);
  assert.equal(res.canAddUnit, false);
  assert.equal(res.premiumAutomationAllowed, false);
  assert.ok(res.reason && res.reason.includes('historical records remain intact'));
});

test('summarizeFinancialsByCurrency separates currencies without silent mixing', () => {
  const docs: Partial<InvoiceReceipt>[] = [
    { currency: 'NGN', totalAmount: 5000000, status: 'paid', verificationStatus: 'verified_bank_transfer' },
    { currency: 'NGN', totalAmount: 2000000, status: 'pending_verification', verificationStatus: 'unverified_screenshot' },
    { currency: 'USD', totalAmount: 4500, status: 'paid', verificationStatus: 'verified_gateway' },
  ];
  const summary = summarizeFinancialsByCurrency(docs as InvoiceReceipt[]);
  assert.equal(summary.length, 2);
  const ngn = summary.find((s) => s.currency === 'NGN')!;
  const usd = summary.find((s) => s.currency === 'USD')!;
  assert.equal(ngn.confirmedTotal, 5000000);
  assert.equal(ngn.pendingVerificationTotal, 2000000);
  assert.equal(usd.confirmedTotal, 4500);
  assert.equal(formatCurrencyAmount(usd.confirmedTotal, 'USD', SAMPLE_CURRENCIES), '$4,500');
});

test('evaluatePaymentVerification blocks screenshots from counting as paid or issuing receipts', () => {
  const screenshotDoc = evaluatePaymentVerification({
    verificationStatus: 'unverified_screenshot',
    status: 'pending_verification',
  });
  assert.equal(screenshotDoc.isConfirmedPaid, false);
  assert.equal(screenshotDoc.canIssueOfficialReceipt, false);
  assert.equal(screenshotDoc.includeInConfirmedRevenue, false);

  const bankVerified = evaluatePaymentVerification({
    verificationStatus: 'verified_bank_transfer',
    status: 'paid',
  });
  assert.equal(bankVerified.isConfirmedPaid, true);
  assert.equal(bankVerified.canIssueOfficialReceipt, true);
  assert.equal(bankVerified.includeInConfirmedRevenue, true);
});

test('isAccessGrantActive respects custom scheduled revocation and emergency revocation', () => {
  const grant: AccessGrant = {
    id: 'g1',
    landlordId: 'l1',
    granteeUserId: 'a1',
    granteeName: 'Agent',
    granteeRole: 'agent',
    propertyId: 'p1',
    unitIds: [],
    permissions: ['view_units'],
    startDate: '2026-11-01T00:00:00Z',
    scheduledRevocationAt: '2026-11-15T12:00:00Z',
    status: 'active',
  };
  assert.equal(isAccessGrantActive(grant, '2026-11-10T09:00:00Z'), true);
  assert.equal(isAccessGrantActive(grant, '2026-11-15T12:00:01Z'), false);

  const emergencyRevoked: AccessGrant = {
    ...grant,
    status: 'emergency_revoked',
    revokedAt: '2026-11-10T10:00:00Z',
  };
  assert.equal(isAccessGrantActive(emergencyRevoked, '2026-11-10T11:00:00Z'), false);
});

test('Strict landlord isolation and artisan ticket isolation are enforced', () => {
  const landlordA = { id: 'usr_landlord_1', role: 'landlord', assignedPropertyIds: ['prop_1'] } as User;
  const agentA = { id: 'usr_agent_1', role: 'agent', assignedPropertyIds: ['prop_1'] } as User;
  const propOfLandlordB = { id: 'prop_b', landlordId: 'usr_landlord_99' } as Property;
  const grantOnPropA: AccessGrant[] = [
    {
      id: 'g1',
      landlordId: 'usr_landlord_1',
      granteeUserId: 'usr_agent_1',
      granteeName: 'Agent',
      granteeRole: 'agent',
      propertyId: 'prop_1',
      unitIds: [],
      permissions: ['view_units', 'moderate_chat'],
      startDate: '2026-01-01T00:00:00Z',
      status: 'active',
    },
  ];
  assert.equal(canUserAccessProperty(landlordA, propOfLandlordB, grantOnPropA), false);
  assert.equal(canUserAccessProperty(agentA, propOfLandlordB, grantOnPropA), false);

  const artisan = { id: 'usr_artisan_1', role: 'artisan' } as User;
  assert.equal(canArtisanViewTicket(artisan, { id: 't1', assignedArtisanId: 'usr_artisan_1' } as RenovationTicket), true);
  assert.equal(canArtisanViewTicket(artisan, { id: 't2', assignedArtisanId: 'usr_artisan_99' } as RenovationTicket), false);
});

test('canAccessUnitChat grants access only to active unit tenants, owner, and granted managers', () => {
  const prop = { id: 'prop_1', landlordId: 'usr_landlord_1' } as Property;
  const currentTenant = { id: 'usr_tenant_1', role: 'tenant' } as User;
  const formerTenant = { id: 'usr_tenant_old', role: 'tenant' } as User;
  const tenancies: TenancyRecord[] = [
    { id: 'ten_1', unitId: 'unit_101', propertyId: 'prop_1', landlordId: 'usr_landlord_1', tenantId: 'usr_tenant_1', status: 'active' } as TenancyRecord,
    { id: 'ten_0', unitId: 'unit_101', propertyId: 'prop_1', landlordId: 'usr_landlord_1', tenantId: 'usr_tenant_old', status: 'expired' } as TenancyRecord,
  ];
  assert.equal(canAccessUnitChat(currentTenant, prop, 'unit_101', tenancies, []), true);
  assert.equal(canAccessUnitChat(currentTenant, prop, 'unit_102', tenancies, []), false);
  assert.equal(canAccessUnitChat(formerTenant, prop, 'unit_101', tenancies, []), false);
});

test('matchReminderMilestone matches configurable intervals and overdue cleanly', () => {
  const intervals = [90, 60, 30, 14, 7, 0];
  assert.equal(matchReminderMilestone(-3, intervals, true), 'overdue');
  assert.equal(matchReminderMilestone(0, intervals, true), '0d');
  assert.equal(matchReminderMilestone(5, intervals, true), '7d');
  assert.equal(matchReminderMilestone(28, intervals, true), '30d');
  assert.equal(matchReminderMilestone(75, intervals, true), '90d');
  assert.equal(matchReminderMilestone(120, intervals, true), null);
});
