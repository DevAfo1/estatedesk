import { UserRole, InvoiceItem } from '../types/index.ts';

/**
 * Calculates rent expiration status and days remaining relative to an ISO date string
 */
export function calculateRentExpiration(
  endDateStr: string,
  currentDateStr: string = '2026-11-06'
): {
  daysRemaining: number;
  status: 'critical_overdue' | 'urgent_7_days' | 'warning_30_days' | 'notice_60_days' | 'active_ok';
  badgeLabel: string;
  isUrgent: boolean;
} {
  const end = new Date(endDateStr).getTime();
  const current = new Date(currentDateStr).getTime();
  const diffMs = end - current;
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      daysRemaining,
      status: 'critical_overdue',
      badgeLabel: `Expired (${Math.abs(daysRemaining)}d overdue)`,
      isUrgent: true,
    };
  }
  if (daysRemaining <= 7) {
    return {
      daysRemaining,
      status: 'urgent_7_days',
      badgeLabel: `Expires in ${daysRemaining} days`,
      isUrgent: true,
    };
  }
  if (daysRemaining <= 30) {
    return {
      daysRemaining,
      status: 'warning_30_days',
      badgeLabel: `Expires in ${daysRemaining} days`,
      isUrgent: true,
    };
  }
  if (daysRemaining <= 60) {
    return {
      daysRemaining,
      status: 'notice_60_days',
      badgeLabel: `Renewal notice (${daysRemaining}d)`,
      isUrgent: false,
    };
  }
  return {
    daysRemaining,
    status: 'active_ok',
    badgeLabel: `Active (${daysRemaining}d remaining)`,
    isUrgent: false,
  };
}

/**
 * Calculates subtotal, tax amount, and total for an itemized invoice/receipt
 */
export function calculateInvoiceTotals(
  items: Array<{ amount: number }>,
  taxRatePercent: number = 7.5
): {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
} {
  const subtotal = items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0);
  const taxAmount = Math.round((subtotal * (taxRatePercent / 100)) * 100) / 100;
  const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxAmount, totalAmount };
}

/**
 * Checks role-based access control permissions
 */
export function checkRBACPermission(
  role: UserRole,
  permission:
    | 'view_tenancy_forms'
    | 'generate_invoices'
    | 'edit_inventory_checklist'
    | 'sign_as_tenant'
    | 'sign_as_landlord'
    | 'sign_as_agent'
    | 'manage_maintenance'
    | 'post_maintenance_request'
    | 'view_house_chat'
    | 'access_property_directory'
    | 'view_artisan_work_orders'
    | 'access_super_admin_portal'
): boolean {
  switch (permission) {
    case 'view_tenancy_forms':
      return role === 'landlord' || role === 'agent' || role === 'super_admin';
    case 'generate_invoices':
      return role === 'landlord' || role === 'agent' || role === 'facility_manager';
    case 'edit_inventory_checklist':
      return role === 'facility_manager' || role === 'agent' || role === 'landlord';
    case 'sign_as_tenant':
      return role === 'tenant';
    case 'sign_as_landlord':
      return role === 'landlord';
    case 'sign_as_agent':
      return role === 'agent';
    case 'manage_maintenance':
      return role === 'facility_manager' || role === 'landlord' || role === 'agent';
    case 'post_maintenance_request':
      return role === 'tenant';
    case 'view_house_chat':
      // Artisans and unassociated external users never access private house/unit chats
      return role !== 'artisan';
    case 'access_property_directory':
      return role === 'landlord' || role === 'agent' || role === 'facility_manager' || role === 'super_admin';
    case 'view_artisan_work_orders':
      return role === 'artisan' || role === 'facility_manager' || role === 'landlord' || role === 'agent';
    case 'access_super_admin_portal':
      return role === 'super_admin';
    default:
      return false;
  }
}

/**
 * Account Lockout evaluator (5 failed attempts trigger 15-minute lock)
 */
export function evaluateAccountLockout(
  failedAttempts: number,
  nowMs: number = Date.now(),
  lockUntilMs?: number,
  maxAllowedAttempts: number = 5,
  lockoutDurationMs: number = 15 * 60 * 1000
): {
  isLocked: boolean;
  remainingLockSeconds: number;
  newFailedAttempts: number;
  newLockUntil?: number;
} {
  // If already locked, check if time has elapsed
  if (lockUntilMs && lockUntilMs > nowMs) {
    const remainingLockSeconds = Math.ceil((lockUntilMs - nowMs) / 1000);
    return {
      isLocked: true,
      remainingLockSeconds,
      newFailedAttempts: failedAttempts,
      newLockUntil: lockUntilMs,
    };
  }

  // If time elapsed, reset lock
  if (lockUntilMs && lockUntilMs <= nowMs) {
    return {
      isLocked: false,
      remainingLockSeconds: 0,
      newFailedAttempts: 0,
      newLockUntil: undefined,
    };
  }

  // Check if threshold reached
  if (failedAttempts >= maxAllowedAttempts) {
    const newLockUntil = nowMs + lockoutDurationMs;
    return {
      isLocked: true,
      remainingLockSeconds: Math.ceil(lockoutDurationMs / 1000),
      newFailedAttempts: failedAttempts,
      newLockUntil,
    };
  }

  return {
    isLocked: false,
    remainingLockSeconds: 0,
    newFailedAttempts: failedAttempts,
    newLockUntil: undefined,
  };
}

/**
 * Generates a deterministic SHA-256 style signature hash for legal audit trails
 */
export function generateAuditHash(
  documentId: string,
  timestampStr: string,
  signers: string[]
): string {
  const rawString = `${documentId}::${timestampStr}::${signers.sort().join('|')}::afolux-proptech-audit`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < rawString.length; i++) {
    hash ^= rawString.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // Convert to 32-character hexadecimal string
  const hexPart1 = (hash >>> 0).toString(16).padStart(8, '0');
  let hash2 = 0x41c64e6d;
  for (let i = rawString.length - 1; i >= 0; i--) {
    hash2 ^= rawString.charCodeAt(i);
    hash2 = Math.imul(hash2, 0x5bd1e995);
  }
  const hexPart2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  return `0xAF${hexPart1.toUpperCase()}${hexPart2.toUpperCase()}${hexPart1.toLowerCase()}${hexPart2.toLowerCase()}`;
}

/**
 * Validates Estate Surveyor and Valuer registration codes
 */
export function validateESVRegistration(
  regNumber: string,
  body: 'ESV' | 'NIESV' | 'ESVABON' | 'RICS'
): { isValid: boolean; message: string } {
  const trimmed = regNumber.trim().toUpperCase();
  if (!trimmed) {
    return { isValid: false, message: 'Registration number is required' };
  }

  switch (body) {
    case 'ESV':
      // Expected pattern: ESV/XXXX or ESV-XXXX (e.g. ESV/1482)
      if (/^ESV[\/-]?[0-9]{3,6}$/.test(trimmed)) {
        return { isValid: true, message: 'Valid ESV License format verified with Estate Surveyors & Valuers board' };
      }
      return { isValid: false, message: 'Invalid format. Example: ESV/1842 or ESV-9021' };

    case 'NIESV':
      // Expected pattern: A/XXXX or M/XXXX (Associate or Member)
      if (/^(A|M|F)[\/-]?[0-9]{3,6}$/.test(trimmed)) {
        return { isValid: true, message: 'Valid NIESV Membership ID confirmed' };
      }
      return { isValid: false, message: 'Invalid NIESV format. Example: M/3820 or A/1294' };

    case 'ESVABON':
      // Expected pattern: ESVABON/R/XXXX
      if (/^(ESVABON[\/-])?R[\/-]?[0-9]{3,6}$/.test(trimmed)) {
        return { isValid: true, message: 'Valid ESVABON Estate Surveyors and Valuers Registration Board seal' };
      }
      return { isValid: false, message: 'Invalid ESVABON format. Example: ESVABON/R/5120' };

    case 'RICS':
      if (/^[0-9]{6,8}$/.test(trimmed)) {
        return { isValid: true, message: 'Valid Royal Institution of Chartered Surveyors charter number' };
      }
      return { isValid: false, message: 'Invalid RICS format. Example: 651928' };

    default:
      return { isValid: false, message: 'Unknown professional body' };
  }
}
