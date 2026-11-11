import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRentExpiration,
  calculateInvoiceTotals,
  checkRBACPermission,
  evaluateAccountLockout,
  generateAuditHash,
  validateESVRegistration,
} from './proptechLogic.ts';

test('calculateRentExpiration handles overdue leases accurately', () => {
  const result = calculateRentExpiration('2026-11-01', '2026-11-06');
  assert.equal(result.status, 'critical_overdue');
  assert.equal(result.isUrgent, true);
  assert.equal(result.daysRemaining, -5);
});

test('calculateRentExpiration handles upcoming 7-day expiration', () => {
  const result = calculateRentExpiration('2026-11-12', '2026-11-06');
  assert.equal(result.status, 'urgent_7_days');
  assert.equal(result.isUrgent, true);
  assert.equal(result.daysRemaining, 6);
});

test('calculateRentExpiration handles 45-day notice window', () => {
  const result = calculateRentExpiration('2026-12-20', '2026-11-06');
  assert.equal(result.status, 'notice_60_days');
  assert.equal(result.isUrgent, false);
});

test('calculateInvoiceTotals computes subtotal, 7.5% VAT, and total correctly', () => {
  const items = [
    { amount: 1500000 }, // Rent
    { amount: 200000 },  // Service charge
    { amount: 100000 },  // Legal fee
  ];
  const { subtotal, taxAmount, totalAmount } = calculateInvoiceTotals(items, 7.5);
  assert.equal(subtotal, 1800000);
  assert.equal(taxAmount, 135000);
  assert.equal(totalAmount, 1935000);
});

test('checkRBACPermission strictly allows only Landlord & Agent for tenancy forms', () => {
  assert.equal(checkRBACPermission('landlord', 'view_tenancy_forms'), true);
  assert.equal(checkRBACPermission('agent', 'view_tenancy_forms'), true);
  assert.equal(checkRBACPermission('tenant', 'view_tenancy_forms'), false);
  assert.equal(checkRBACPermission('facility_manager', 'view_tenancy_forms'), false);
});

test('checkRBACPermission allows tenant to post maintenance and sign lease', () => {
  assert.equal(checkRBACPermission('tenant', 'post_maintenance_request'), true);
  assert.equal(checkRBACPermission('landlord', 'post_maintenance_request'), false);
  assert.equal(checkRBACPermission('tenant', 'sign_as_tenant'), true);
  assert.equal(checkRBACPermission('agent', 'sign_as_tenant'), false);
});

test('evaluateAccountLockout triggers lockout on 5 consecutive failed attempts', () => {
  const now = 1700000000000;
  const result = evaluateAccountLockout(5, now, undefined, 5, 900000);
  assert.equal(result.isLocked, true);
  assert.equal(result.remainingLockSeconds, 900);
  assert.equal(result.newLockUntil, now + 900000);
});

test('generateAuditHash produces deterministic tamper-evident 32-char hex digest', () => {
  const hash1 = generateAuditHash('LEASE-2026-001', '2026-11-06T12:00:00Z', ['landlord_1', 'tenant_4', 'agent_2']);
  const hash2 = generateAuditHash('LEASE-2026-001', '2026-11-06T12:00:00Z', ['tenant_4', 'agent_2', 'landlord_1']);
  assert.equal(hash1, hash2);
  assert.ok(hash1.startsWith('0xAF'));
  assert.ok(hash1.length >= 34);
});

test('validateESVRegistration validates Nigerian and international estate bodies', () => {
  assert.equal(validateESVRegistration('ESV/1842', 'ESV').isValid, true);
  assert.equal(validateESVRegistration('M/4012', 'NIESV').isValid, true);
  assert.equal(validateESVRegistration('ESVABON/R/8831', 'ESVABON').isValid, true);
  assert.equal(validateESVRegistration('INVALID', 'ESV').isValid, false);
});
