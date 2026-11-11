import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Property,
  Unit,
  InitialInventoryChecklist,
  TenancyForm,
  InvoiceReceipt,
  RenovationTicket,
  HouseChatMessage,
  SecurityAuditEntry,
  RentExpirationAlert,
  LegalSignature,
  CurrencyConfig,
  CurrencyCode,
  SubscriptionPlanConfig,
  PlanTierId,
  BillingCycle,
  PricingVersionEntry,
  CouponCode,
  EnterpriseAgreement,
  SubscriptionInvoiceRecord,
  UsageMetrics,
  AccessGrant,
  AccessPermissionScope,
  TenancyRecord,
  RentReminderRule,
  ReminderDeliveryLog,
  MarketplaceListing,
  MarketplaceModerationStatus,
  InspectionBooking,
  ProfileVisibilitySettings,
  UserKYCTracks,
  KYCStatus,
  ArtisanQuote,
  WorkOrderStage,
} from '../types/index.ts';
import {
  INITIAL_USERS,
  INITIAL_PROPERTIES,
  INITIAL_UNITS,
  INITIAL_INVENTORY,
  INITIAL_INVENTORY_HISTORY,
  INITIAL_TENANCY_FORMS,
  INITIAL_INVOICES,
  INITIAL_RENOVATION_TICKETS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_AUDIT_LOGS,
  INITIAL_CURRENCIES,
  INITIAL_PLANS,
  INITIAL_PRICING_HISTORY,
  INITIAL_COUPONS,
  INITIAL_ENTERPRISE_AGREEMENTS,
  INITIAL_SUBSCRIPTION_INVOICES,
  INITIAL_USAGE_METRICS,
  INITIAL_ACCESS_GRANTS,
  INITIAL_TENANCIES,
  INITIAL_REMINDER_RULE,
  INITIAL_REMINDER_LOGS,
  INITIAL_MARKETPLACE_LISTINGS,
  INITIAL_INSPECTION_BOOKINGS,
} from '../data/mockData.ts';
import {
  calculateRentExpiration,
  evaluateAccountLockout,
  generateAuditHash,
} from '../utils/proptechLogic.ts';
import {
  canUserAccessProperty,
  calculateSubscriptionPrice,
  matchReminderMilestone,
} from '../utils/estateDeskLogic.ts';

interface AppContextType {
  currentUser: User;
  allUsers: User[];
  setCurrentUserRole: (role: UserRole) => void;
  loginUser: (email: string, pass: string) => { success: boolean; error?: string };
  signupUser: (name: string, email: string, role: UserRole, phone: string) => { success: boolean; error?: string };
  logoutUser: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  lockoutState: { isLocked: boolean; remainingSeconds: number; attempts: number };
  resetLockout: () => void;

  // Navigation & UI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  isMobileFrameMode: boolean;
  setIsMobileFrameMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Multi-Currency
  currencies: CurrencyConfig[];
  addCurrency: (currency: CurrencyConfig) => void;

  // Properties, Units & Historical Tenancies
  properties: Property[];
  visibleProperties: Property[];
  units: Unit[];
  addUnit: (unit: Omit<Unit, 'id'>) => { success: boolean; error?: string };
  updateUnitStatus: (unitId: string, status: Unit['status']) => void;
  tenancies: TenancyRecord[];
  createTenancyOnboarding: (record: Omit<TenancyRecord, 'id'>) => void;
  terminateTenancy: (tenancyId: string) => void;

  // Delegated Access Grants
  accessGrants: AccessGrant[];
  createAccessGrant: (grant: Omit<AccessGrant, 'id' | 'status'>) => void;
  revokeAccessGrantImmediately: (grantId: string, reason?: string) => void;

  // Inventory Checklists
  inventoryChecklists: Record<string, InitialInventoryChecklist>;
  inventoryHistory: InitialInventoryChecklist[];
  updateInventoryItem: (unitId: string, itemId: string, condition: 'excellent' | 'good' | 'fair' | 'damaged', checked: boolean, notes: string) => void;
  signOffInventory: (unitId: string, inspectorName: string) => void;
  logInspectionRecord: (record: Omit<InitialInventoryChecklist, 'id'>) => void;

  // Tenancy Forms & E-Sign
  tenancyForms: TenancyForm[];
  createTenancyForm: (form: Omit<TenancyForm, 'id' | 'signatures' | 'status' | 'templateVersion'>) => void;
  signTenancyAgreement: (formId: string, signature: LegalSignature) => void;

  // Invoices, Receipts & Payment Verification
  invoices: InvoiceReceipt[];
  createInvoiceReceipt: (doc: Omit<InvoiceReceipt, 'id' | 'docNumber'>) => void;
  submitPaymentScreenshot: (docId: string, paymentRef: string, method: InvoiceReceipt['paymentMethod']) => void;
  verifyPaymentConfirmation: (docId: string, method: 'verified_gateway' | 'verified_bank_transfer' | 'verified_cash', reference: string) => void;

  // Maintenance & 14-Step Artisan Workflow
  renovationTickets: RenovationTicket[];
  createRenovationTicket: (ticket: Omit<RenovationTicket, 'id' | 'reportedAt' | 'status' | 'stage'>) => void;
  updateRenovationStage: (
    ticketId: string,
    stage: WorkOrderStage,
    notes?: string,
    cost?: number,
    artisanId?: string,
    beforePhoto?: string,
    afterPhoto?: string
  ) => void;
  submitArtisanQuote: (ticketId: string, quote: Omit<ArtisanQuote, 'submittedAt'>) => void;
  approveArtisanQuote: (ticketId: string) => void;

  // Unit & Building Chat
  chatMessages: HouseChatMessage[];
  sendMessage: (propertyId: string, text: string, unitId?: string, isAdminNotice?: boolean) => void;
  reportChatMessage: (messageId: string, reason: string) => void;

  // Rent Expiration & Configurable Reminders
  rentExpirationAlerts: RentExpirationAlert[];
  reminderRule: RentReminderRule;
  updateReminderRule: (rule: RentReminderRule) => void;
  reminderLogs: ReminderDeliveryLog[];
  sendRenewalTermsAlert: (unitId: string) => void;

  // KYC 5-Track & Profile Privacy
  updateUserKYC: (userId: string, kycData: Partial<NonNullable<User['kycData']>>, newStatus?: KYCStatus) => void;
  updateUserKYCTrack: (userId: string, track: keyof UserKYCTracks, status: KYCStatus, docName?: string, notes?: string) => void;
  updateProfileVisibility: (visibility: ProfileVisibilitySettings, bio?: string, companyName?: string) => void;

  // Dynamic Subscriptions, Coupons, Enterprise & Usage Quotas (Super Admin configurable)
  planCatalog: SubscriptionPlanConfig[];
  pricingHistory: PricingVersionEntry[];
  updatePlanConfig: (planId: PlanTierId, updates: Partial<SubscriptionPlanConfig>, notes: string) => void;
  coupons: CouponCode[];
  createCoupon: (coupon: Omit<CouponCode, 'redemptions'>) => void;
  toggleCoupon: (code: string) => void;
  enterpriseAgreements: EnterpriseAgreement[];
  requestEnterpriseAgreement: (req: Omit<EnterpriseAgreement, 'id' | 'createdAt' | 'status'>) => void;
  subscriptionInvoices: SubscriptionInvoiceRecord[];
  usageMetrics: UsageMetrics;
  upgradeSubscription: (tier: PlanTierId, cycle?: BillingCycle, couponCode?: string) => { success: boolean; message: string };
  simulateSubscriptionExpiryToggle: () => void;

  // Public Marketplace & Moderation
  marketplaceListings: MarketplaceListing[];
  inspectionBookings: InspectionBooking[];
  createMarketplaceListing: (listing: Omit<MarketplaceListing, 'id' | 'viewsCount' | 'leadsCount' | 'reportedCount' | 'createdAt' | 'moderationStatus'>) => void;
  moderateMarketplaceListing: (listingId: string, status: MarketplaceModerationStatus) => void;
  reportMarketplaceListing: (listingId: string, reason: string) => void;
  bookListingInspection: (booking: Omit<InspectionBooking, 'id' | 'createdAt' | 'status'>) => void;

  // Security Audit
  auditLogs: SecurityAuditEntry[];
  addAuditLog: (event: SecurityAuditEntry['event'], details: string) => void;

  // Compliance
  hasAgeConsent: boolean;
  setHasAgeConsent: (val: boolean) => void;
  cookieConsentGiven: boolean;
  setCookieConsentGiven: (val: boolean) => void;
  openLegalModal: string | null;
  setOpenLegalModal: (page: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_VERSION = 'estatedesk_v2_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_VERSION}users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => allUsers[0]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('prop_1');
  const [isMobileFrameMode, setIsMobileFrameMode] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Compliance & Modals
  const [hasAgeConsent, setHasAgeConsent] = useState<boolean>(true);
  const [cookieConsentGiven, setCookieConsentGiven] = useState<boolean>(() => {
    return localStorage.getItem(`${STORAGE_VERSION}cookies_accepted`) === 'true';
  });
  const [openLegalModal, setOpenLegalModal] = useState<string | null>(null);

  // Security Lockout
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockUntil, setLockUntil] = useState<number | undefined>(undefined);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);

  // Multi-currency & Commercial Catalog
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>(INITIAL_CURRENCIES);
  const [planCatalog, setPlanCatalog] = useState<SubscriptionPlanConfig[]>(INITIAL_PLANS);
  const [pricingHistory, setPricingHistory] = useState<PricingVersionEntry[]>(INITIAL_PRICING_HISTORY);
  const [coupons, setCoupons] = useState<CouponCode[]>(INITIAL_COUPONS);
  const [enterpriseAgreements, setEnterpriseAgreements] = useState<EnterpriseAgreement[]>(INITIAL_ENTERPRISE_AGREEMENTS);
  const [subscriptionInvoices, setSubscriptionInvoices] = useState<SubscriptionInvoiceRecord[]>(INITIAL_SUBSCRIPTION_INVOICES);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics>(INITIAL_USAGE_METRICS);

  // Core Entities
  const [properties] = useState<Property[]>(INITIAL_PROPERTIES);
  const [units, setUnits] = useState<Unit[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_VERSION}units`);
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });
  const [tenancies, setTenancies] = useState<TenancyRecord[]>(INITIAL_TENANCIES);
  const [accessGrants, setAccessGrants] = useState<AccessGrant[]>(INITIAL_ACCESS_GRANTS);
  const [inventoryChecklists, setInventoryChecklists] = useState<Record<string, InitialInventoryChecklist>>({
    unit_101: INITIAL_INVENTORY,
  });
  const [inventoryHistory, setInventoryHistory] = useState<InitialInventoryChecklist[]>(INITIAL_INVENTORY_HISTORY);
  const [tenancyForms, setTenancyForms] = useState<TenancyForm[]>(INITIAL_TENANCY_FORMS);
  const [invoices, setInvoices] = useState<InvoiceReceipt[]>(INITIAL_INVOICES);
  const [renovationTickets, setRenovationTickets] = useState<RenovationTicket[]>(INITIAL_RENOVATION_TICKETS);
  const [chatMessages, setChatMessages] = useState<HouseChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [reminderRule, setReminderRule] = useState<RentReminderRule>(INITIAL_REMINDER_RULE);
  const [reminderLogs, setReminderLogs] = useState<ReminderDeliveryLog[]>(INITIAL_REMINDER_LOGS);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>(INITIAL_MARKETPLACE_LISTINGS);
  const [inspectionBookings, setInspectionBookings] = useState<InspectionBooking[]>(INITIAL_INSPECTION_BOOKINGS);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [renewalSentSet, setRenewalSentSet] = useState<Set<string>>(new Set(['unit_102']));

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (!lockUntil) {
      setLockoutTimer(0);
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      if (lockUntil <= now) {
        setLockUntil(undefined);
        setFailedAttempts(0);
        setLockoutTimer(0);
        clearInterval(interval);
      } else {
        setLockoutTimer(Math.ceil((lockUntil - now) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockUntil]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_VERSION}users`, JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_VERSION}units`, JSON.stringify(units));
  }, [units]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const addAuditLog = (event: SecurityAuditEntry['event'], details: string) => {
    const newEntry: SecurityAuditEntry = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: `${new Date().toISOString().slice(0, 19).replace('T', ' ')} WAT`,
      event,
      userEmail: currentUser.email,
      ipAddress: '102.89.33.14 (Lagos, NG)',
      details,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Landlord-isolated & grant-evaluated property visibility
  const visibleProperties = properties.filter((p) =>
    canUserAccessProperty(currentUser, p, accessGrants)
  );

  // Keep selectedPropertyId valid when role changes
  useEffect(() => {
    if (currentUser.role === 'artisan') {
      if (activeTab !== 'maintenance' && activeTab !== 'dashboard' && activeTab !== 'marketplace' && activeTab !== 'kyc' && activeTab !== 'profile') {
        setActiveTab('maintenance');
      }
      return;
    }
    if (currentUser.role === 'super_admin' && activeTab === 'dashboard') {
      // Super admin defaults smoothly or can browse all portals
    }
    if (visibleProperties.length > 0 && !visibleProperties.some((p) => p.id === selectedPropertyId)) {
      setSelectedPropertyId(visibleProperties[0].id);
    }
  }, [currentUser.id, currentUser.role]);

  const setCurrentUserRole = (role: UserRole) => {
    const targetUser = allUsers.find((u) => u.role === role) || allUsers[0];
    setCurrentUser(targetUser);
    if (role === 'artisan') {
      setActiveTab('maintenance');
    } else if (role === 'super_admin') {
      setActiveTab('super_admin');
    } else if (activeTab === 'super_admin') {
      setActiveTab('dashboard');
    }
    addAuditLog('login_success', `Switched role preview session to ${role.toUpperCase()} (${targetUser.name})`);
  };

  const loginUser = (email: string, pass: string): { success: boolean; error?: string } => {
    const lockCheck = evaluateAccountLockout(failedAttempts, Date.now(), lockUntil);
    if (lockCheck.isLocked) {
      return {
        success: false,
        error: `Account locked due to 5 failed attempts. Retry in ${lockCheck.remainingLockSeconds}s.`,
      };
    }

    const found = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found && pass.length >= 6) {
      setFailedAttempts(0);
      setLockUntil(undefined);
      setCurrentUser(found);
      addAuditLog('login_success', `User ${email} authenticated via simulated JWT session.`);
      return { success: true };
    } else {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      const evalLock = evaluateAccountLockout(nextFailures, Date.now(), undefined, 5);
      if (evalLock.isLocked) {
        setLockUntil(evalLock.newLockUntil);
        addAuditLog('account_locked', `Account ${email} locked for 15 minutes after 5 failed authentication attempts.`);
        return {
          success: false,
          error: `Account locked! Too many failed attempts. Cool-down activated for 15 minutes.`,
        };
      }
      addAuditLog('login_failed', `Failed sign-in attempt (${nextFailures}/5) for ${email}.`);
      return {
        success: false,
        error: `Invalid credentials. (${5 - nextFailures} attempts remaining before lockout)`,
      };
    }
  };

  const logoutUser = () => {
    addAuditLog('login_success', `User ${currentUser.email} ended active session.`);
    setCurrentUser(allUsers[0]);
    setActiveTab('dashboard');
  };

  const signupUser = (
    name: string,
    email: string,
    role: UserRole,
    phone: string
  ): { success: boolean; error?: string } => {
    if (allUsers.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email address already exists.' };
    }
    const newUser: User = {
      id: `usr_${role}_${Date.now()}`,
      name,
      email,
      role,
      phone,
      avatar: '/src/assets/images/avatar_tenant_sarah_1794388812955.jpg',
      subscriptionTier: 'free',
      billingCycle: 'monthly',
      subscriptionStatus: 'active',
      kycStatus: 'pending',
      kycTracks: {
        identity: { status: 'pending' },
        propertyOwnership: { status: 'not_started' },
        professionalQualification: { status: 'not_started' },
        businessRegistration: { status: 'not_started' },
        artisanVendor: { status: role === 'artisan' ? 'pending' : 'not_started' },
      },
      assignedPropertyIds: [],
      profileVisibility: {
        phoneVisibility: 'authorized_contacts',
        emailVisibility: 'private',
        bioVisibility: 'public',
        certificationsVisibility: 'public',
        portfolioCountVisibility: 'private',
      },
      failedLoginAttempts: 0,
      isLocked: false,
      kycData: { facialVerified: false },
    };
    setAllUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    addAuditLog('login_success', `New ${role.toUpperCase()} account registered for ${name} (${email}).`);
    return { success: true };
  };

  const resetLockout = () => {
    setFailedAttempts(0);
    setLockUntil(undefined);
    setLockoutTimer(0);
  };

  const addCurrency = (currency: CurrencyConfig) => {
    setCurrencies((prev) => {
      if (prev.some((c) => c.code === currency.code)) {
        return prev.map((c) => (c.code === currency.code ? currency : c));
      }
      return [...prev, currency];
    });
    addAuditLog('plan_updated', `Added/updated currency ${currency.code} (${currency.symbol}, 1 ${currency.code} = ₦${currency.fxRateToNGN}).`);
  };

  const addUnit = (unitData: Omit<Unit, 'id'>): { success: boolean; error?: string } => {
    const plan = planCatalog.find((p) => p.id === (currentUser.subscriptionStatus === 'expired' ? 'free' : currentUser.subscriptionTier));
    const ownedCount = units.filter((u) => {
      const p = properties.find((pr) => pr.id === u.propertyId);
      return p && (currentUser.role === 'super_admin' || p.landlordId === currentUser.id || canUserAccessProperty(currentUser, p, accessGrants));
    }).length;

    if (plan && plan.maxUnits !== -1 && ownedCount >= plan.maxUnits && currentUser.role !== 'super_admin') {
      return {
        success: false,
        error: `${plan.name} plan ceiling (${plan.maxUnits} units) reached. Existing historical records remain safe; upgrade to expand capacity.`,
      };
    }

    const newUnit: Unit = { ...unitData, id: `unit_${Date.now()}` };
    setUnits((prev) => [newUnit, ...prev]);
    addAuditLog('receipt_generated', `Registered unit ${newUnit.unitNumber} under Property ${newUnit.propertyId}`);
    return { success: true };
  };

  const updateUnitStatus = (unitId: string, status: Unit['status']) => {
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, status } : u)));
  };

  const createTenancyOnboarding = (record: Omit<TenancyRecord, 'id'>) => {
    const newRec: TenancyRecord = { ...record, id: `ten_${Date.now()}` };
    setTenancies((prev) => [newRec, ...prev]);
    if (record.status === 'active') {
      setUnits((prev) =>
        prev.map((u) =>
          u.id === record.unitId
            ? {
                ...u,
                status: 'occupied',
                tenantId: record.tenantId,
                leaseStartDate: record.startDate,
                leaseEndDate: record.endDate,
                rentAmount: record.rentAmount,
                serviceCharge: record.serviceCharge,
                currency: record.currency,
              }
            : u
        )
      );
    }
    addAuditLog('lease_signed', `New tenancy record created for ${record.tenantName} on Unit ${record.unitId} via ${record.onboardingMethod}.`);
  };

  const terminateTenancy = (tenancyId: string) => {
    const target = tenancies.find((t) => t.id === tenancyId);
    setTenancies((prev) =>
      prev.map((t) =>
        t.id === tenancyId
          ? { ...t, status: 'terminated', terminatedAt: new Date().toISOString().split('T')[0] }
          : t
      )
    );
    if (target) {
      setUnits((prev) =>
        prev.map((u) =>
          u.id === target.unitId ? { ...u, status: 'vacant', tenantId: undefined } : u
        )
      );
      addAuditLog('lease_signed', `Tenancy ${tenancyId} terminated; historical record preserved and active unit chat access revoked.`);
    }
  };

  const createAccessGrant = (grant: Omit<AccessGrant, 'id' | 'status'>) => {
    const newGrant: AccessGrant = { ...grant, id: `grant_${Date.now()}`, status: 'active' };
    setAccessGrants((prev) => [newGrant, ...prev]);
    addAuditLog(
      'access_granted',
      `Delegated ${grant.permissions.join(', ')} on property ${grant.propertyId} to ${grant.granteeName}${
        grant.scheduledRevocationAt ? ` (auto-revokes ${grant.scheduledRevocationAt})` : ''
      }.`
    );
  };

  const revokeAccessGrantImmediately = (grantId: string, reason: string = 'Immediate emergency revocation by Landlord') => {
    setAccessGrants((prev) =>
      prev.map((g) =>
        g.id === grantId
          ? {
              ...g,
              status: 'emergency_revoked',
              revokedAt: new Date().toISOString(),
              revocationReason: reason,
            }
          : g
      )
    );
    addAuditLog('access_revoked', `Emergency revocation executed for Access Grant ${grantId}: ${reason}`);
  };

  const updateInventoryItem = (
    unitId: string,
    itemId: string,
    condition: 'excellent' | 'good' | 'fair' | 'damaged',
    checked: boolean,
    notes: string
  ) => {
    setInventoryChecklists((prev) => {
      const existing = prev[unitId] || { ...INITIAL_INVENTORY, id: `inv_${unitId}`, unitId };
      const updatedItems = existing.items.map((it) =>
        it.id === itemId ? { ...it, condition, checked, notes } : it
      );
      return { ...prev, [unitId]: { ...existing, items: updatedItems } };
    });
  };

  const signOffInventory = (unitId: string, inspectorName: string) => {
    setInventoryChecklists((prev) => {
      const existing = prev[unitId] || { ...INITIAL_INVENTORY, id: `inv_${unitId}`, unitId };
      const signed: InitialInventoryChecklist = {
        ...existing,
        inspectorName,
        tenantSignOff: true,
        signedAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} WAT`,
      };
      setInventoryHistory((h) => [signed, ...h.filter((item) => item.id !== signed.id)]);
      return { ...prev, [unitId]: signed };
    });
    addAuditLog('lease_signed', `Inventory inspection signed off for Unit ${unitId} by ${inspectorName}`);
  };

  const logInspectionRecord = (record: Omit<InitialInventoryChecklist, 'id'>) => {
    const newRec: InitialInventoryChecklist = { ...record, id: `inv_${Date.now()}` };
    setInventoryHistory((prev) => [newRec, ...prev]);
    addAuditLog('lease_signed', `Logged ${record.inspectionType.toUpperCase()} inspection for Unit ${record.unitId}`);
  };

  const createTenancyForm = (formData: Omit<TenancyForm, 'id' | 'signatures' | 'status' | 'templateVersion'>) => {
    const newForm: TenancyForm = {
      ...formData,
      id: `form_${Date.now()}`,
      templateVersion: 'NG-LAS-2026.2 (Draft Template — Pending Legal Review)',
      status: 'ready_for_signing',
      signatures: {},
      legalHash: generateAuditHash(`FORM-${Date.now()}`, new Date().toISOString(), [formData.landlordId, formData.tenantId]),
    };
    setTenancyForms((prev) => [newForm, ...prev]);
    addAuditLog('lease_signed', `New tenancy draft created for ${formData.tenantFullName} (Unit ${formData.unitId})`);
  };

  const signTenancyAgreement = (formId: string, signature: LegalSignature) => {
    setTenancyForms((prev) =>
      prev.map((f) => {
        if (f.id !== formId) return f;
        const updatedSignatures = { ...f.signatures, [signature.role]: signature };
        const isComplete = !!(updatedSignatures.landlord && updatedSignatures.agent && updatedSignatures.tenant);
        return {
          ...f,
          signatures: updatedSignatures,
          status: isComplete ? 'completed' : 'ready_for_signing',
          legalHash: generateAuditHash(formId, new Date().toISOString(), Object.keys(updatedSignatures)),
        };
      })
    );
    setUsageMetrics((m) => ({ ...m, eSignaturesUsed: m.eSignaturesUsed + 1 }));
    addAuditLog('lease_signed', `E-Signature attached by ${signature.name} (${signature.role}) on Contract ${formId}`);
  };

  const createInvoiceReceipt = (doc: Omit<InvoiceReceipt, 'id' | 'docNumber'>) => {
    const prefix = doc.type === 'invoice' ? 'ED-INV' : 'ED-RCP';
    const num = Math.floor(1000 + Math.random() * 9000);
    const newDoc: InvoiceReceipt = {
      ...doc,
      id: `${doc.type}_${Date.now()}`,
      docNumber: `${prefix}-2026-${num}`,
    };
    setInvoices((prev) => [newDoc, ...prev]);
    addAuditLog('receipt_generated', `Issued ${doc.type.toUpperCase()} ${newDoc.docNumber} (${doc.currency} ${doc.totalAmount.toLocaleString()})`);
  };

  const submitPaymentScreenshot = (docId: string, paymentRef: string, method: InvoiceReceipt['paymentMethod']) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === docId
          ? {
              ...inv,
              paymentMethod: method,
              paymentReference: paymentRef,
              screenshotUrl: '/src/assets/images/repair_plumbing_evidence_1794388815904.jpg',
              verificationStatus: 'unverified_screenshot',
              status: 'pending_verification',
              watermarkText: 'UNVERIFIED — SCREENSHOT PENDING',
            }
          : inv
      )
    );
    addAuditLog('receipt_generated', `Payment screenshot submitted for ${docId} (Ref: ${paymentRef}). Held in Pending Verification until bank/gateway confirmation.`);
  };

  const verifyPaymentConfirmation = (
    docId: string,
    method: 'verified_gateway' | 'verified_bank_transfer' | 'verified_cash',
    reference: string
  ) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === docId
          ? {
              ...inv,
              type: 'receipt',
              verificationStatus: method,
              paymentReference: reference || inv.paymentReference || `REF-${Date.now()}`,
              verifiedBy: currentUser.name,
              verifiedAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} WAT`,
              paidDate: new Date().toISOString().split('T')[0],
              status: 'paid',
              watermarkText: 'VERIFIED & PAID',
            }
          : inv
      )
    );
    addAuditLog('payment_verified', `Authorized ${method} confirmation for ${docId} by ${currentUser.name} (Ref: ${reference}). Official receipt unlocked.`);
  };

  const createRenovationTicket = (ticket: Omit<RenovationTicket, 'id' | 'reportedAt' | 'status' | 'stage'>) => {
    const newTicket: RenovationTicket = {
      ...ticket,
      id: `tkt_${Date.now()}`,
      reportedAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} WAT`,
      stage: 'reported',
      status: 'reported',
      assignedManagerId: 'usr_facility_1',
      assignedManagerName: 'Engr. Musa Ibrahim',
    };
    setRenovationTickets((prev) => [newTicket, ...prev]);
    addAuditLog('receipt_generated', `Maintenance issue logged for ${ticket.unitNumber} (${ticket.category.toUpperCase()})`);
  };

  const updateRenovationStage = (
    ticketId: string,
    stage: WorkOrderStage,
    notes?: string,
    cost?: number,
    artisanId?: string,
    beforePhoto?: string,
    afterPhoto?: string
  ) => {
    const artisan = artisanId ? allUsers.find((u) => u.id === artisanId) : undefined;
    const statusMap: Record<WorkOrderStage, RenovationTicket['status']> = {
      reported: 'reported',
      manager_reviewed: 'reported',
      approved: 'assigned',
      rejected: 'completed',
      work_order_created: 'assigned',
      artisan_assigned: 'assigned',
      quote_submitted: 'assigned',
      quote_approved: 'in_progress',
      in_progress: 'in_progress',
      before_after_uploaded: 'in_progress',
      work_reviewed: 'in_progress',
      completed: 'completed',
    };

    setRenovationTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              stage,
              status: statusMap[stage],
              resolutionNotes: notes ?? t.resolutionNotes,
              estimatedCost: cost ?? t.estimatedCost,
              assignedArtisanId: artisan ? artisan.id : t.assignedArtisanId,
              assignedArtisanName: artisan ? artisan.name : t.assignedArtisanName,
              beforePhotoUrl: beforePhoto ?? t.beforePhotoUrl,
              afterPhotoUrl: afterPhoto ?? t.afterPhotoUrl,
              completionProofPhoto: afterPhoto ?? t.completionProofPhoto,
            }
          : t
      )
    );
    addAuditLog('receipt_generated', `Work order ${ticketId} moved to stage ${stage.toUpperCase()}`);
  };

  const submitArtisanQuote = (ticketId: string, quote: Omit<ArtisanQuote, 'submittedAt'>) => {
    setRenovationTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              stage: 'quote_submitted',
              status: 'assigned',
              estimatedCost: quote.totalAmount,
              quote: {
                ...quote,
                submittedAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} WAT`,
              },
            }
          : t
      )
    );
    addAuditLog('receipt_generated', `Artisan ${quote.artisanName} submitted quote (${quote.currency} ${quote.totalAmount.toLocaleString()}) for ticket ${ticketId}`);
  };

  const approveArtisanQuote = (ticketId: string) => {
    setRenovationTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId && t.quote
          ? {
              ...t,
              stage: 'quote_approved',
              status: 'in_progress',
              quote: {
                ...t.quote,
                approvedBy: currentUser.name,
                approvedAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} WAT`,
              },
            }
          : t
      )
    );
    addAuditLog('receipt_generated', `Artisan quote approved by ${currentUser.name} for work order ${ticketId}`);
  };

  const sendMessage = (propertyId: string, text: string, unitId?: string, isAdminNotice: boolean = false) => {
    const newMsg: HouseChatMessage = {
      id: `msg_${Date.now()}`,
      propertyId,
      unitId,
      channelScope: unitId ? 'unit_private' : 'building_announcement',
      senderId: currentUser.id,
      senderName: `${currentUser.name} (${currentUser.role.replace('_', ' ')})`,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAdminNotice,
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const reportChatMessage = (messageId: string, reason: string) => {
    setChatMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, reported: true, reportReason: reason } : m))
    );
    addAuditLog('listing_moderated', `Chat message ${messageId} flagged for moderation: ${reason}`);
  };

  const rentExpirationAlerts: RentExpirationAlert[] = units
    .filter((u) => u.leaseEndDate && u.status === 'occupied')
    .map((u) => {
      const prop = properties.find((p) => p.id === u.propertyId);
      const tenant = allUsers.find((usr) => usr.id === u.tenantId);
      const activeTenancy = tenancies.find((t) => t.unitId === u.id && t.status === 'active');
      const { daysRemaining, status, isUrgent } = calculateRentExpiration(u.leaseEndDate!);

      return {
        unitId: u.id,
        propertyId: u.propertyId,
        propertyName: prop?.name || 'EstateDesk Property',
        unitNumber: u.unitNumber,
        tenantName: tenant?.name || activeTenancy?.tenantName || 'Occupied Tenant',
        tenantEmail: tenant?.email || activeTenancy?.tenantEmail || 'tenant@estatedesk.ng',
        tenantPhone: tenant?.phone || activeTenancy?.tenantPhone || '+234 800 000 0000',
        currency: u.currency,
        rentAmount: u.rentAmount,
        leaseEndDate: u.leaseEndDate!,
        daysRemaining,
        status: (daysRemaining <= 90 && status === 'active_ok' ? 'notice_90_days' : status) as RentExpirationAlert['status'],
        isUrgent,
        renewalSent: renewalSentSet.has(u.id),
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const updateReminderRule = (rule: RentReminderRule) => {
    setReminderRule(rule);
    addAuditLog('plan_updated', `Updated rent reminder schedule: [${rule.intervalsDays.join('d, ')}d] (${rule.timezone})`);
  };

  const sendRenewalTermsAlert = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    const prop = properties.find((p) => p.id === unit?.propertyId);
    const alert = rentExpirationAlerts.find((a) => a.unitId === unitId);
    const milestone = alert
      ? matchReminderMilestone(alert.daysRemaining, reminderRule.intervalsDays, reminderRule.includeOverdue) || 'Manual'
      : 'Manual';

    // Deduplicate same unit + milestone log if already sent today
    const activeChannels: string[] = [];
    if (reminderRule.channels.inApp) activeChannels.push('In-App');
    if (reminderRule.channels.email) activeChannels.push('Email');
    if (reminderRule.channels.push) activeChannels.push('Push');
    if (reminderRule.channels.whatsapp) activeChannels.push('WhatsApp (Simulated)');
    if (reminderRule.channels.sms) activeChannels.push('SMS (Simulated)');

    setRenewalSentSet((prev) => new Set([...prev, unitId]));
    setReminderLogs((prev) => [
      {
        id: `rem_${Date.now()}`,
        unitId,
        unitNumber: unit?.unitNumber || unitId,
        propertyName: prop?.name || 'Property',
        milestoneLabel: milestone,
        channels: activeChannels,
        recipientSummary: `${alert?.tenantName || 'Tenant'} + Landlord + Agent`,
        dispatchedAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} WAT`,
        timezone: reminderRule.timezone,
        status: 'delivered_in_app',
      },
      ...prev,
    ]);
    setUsageMetrics((m) => ({
      ...m,
      whatsappUsed: reminderRule.channels.whatsapp ? m.whatsappUsed + 1 : m.whatsappUsed,
      smsUsed: reminderRule.channels.sms ? m.smsUsed + 1 : m.smsUsed,
      emailSent: reminderRule.channels.email ? m.emailSent + 1 : m.emailSent,
    }));
    addAuditLog('receipt_generated', `Dispatched renewal reminder (${milestone}) for ${unit?.unitNumber || unitId}`);
  };

  const updateUserKYC = (userId: string, kycData: Partial<NonNullable<User['kycData']>>, newStatus?: KYCStatus) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const updated: User = {
          ...u,
          kycData: { ...u.kycData, ...kycData },
          kycStatus: newStatus || u.kycStatus,
          kycTracks: {
            ...u.kycTracks,
            identity: kycData.facialVerified
              ? { ...u.kycTracks.identity, status: newStatus || 'in_review', reviewedAt: new Date().toISOString().split('T')[0] }
              : u.kycTracks.identity,
            professionalQualification: kycData.registrationNumber
              ? {
                  ...u.kycTracks.professionalQualification,
                  status: newStatus || 'in_review',
                  referenceId: kycData.registrationNumber,
                  documentName: `${kycData.professionalBody} Accreditation`,
                }
              : u.kycTracks.professionalQualification,
            propertyOwnership: kycData.propertyOwnershipCallback?.scheduled
              ? {
                  ...u.kycTracks.propertyOwnership,
                  status: 'in_review',
                  submittedAt: new Date().toISOString().split('T')[0],
                  documentName: 'Ownership Deed & Callback Scheduled',
                }
              : u.kycTracks.propertyOwnership,
          },
        };
        if (currentUser.id === userId) setCurrentUser(updated);
        return updated;
      })
    );
    setUsageMetrics((m) => ({ ...m, kycChecksUsed: m.kycChecksUsed + 1 }));
    addAuditLog('kyc_submitted', `KYC metadata updated for user ${userId}`);
  };

  const updateUserKYCTrack = (
    userId: string,
    track: keyof UserKYCTracks,
    status: KYCStatus,
    docName?: string,
    notes?: string
  ) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const nextTracks: UserKYCTracks = {
          ...u.kycTracks,
          [track]: {
            ...u.kycTracks[track],
            status,
            documentName: docName ?? u.kycTracks[track].documentName,
            reviewerNotes: notes ?? u.kycTracks[track].reviewerNotes,
            reviewedAt: new Date().toISOString().split('T')[0],
          },
        };
        const updated: User = {
          ...u,
          kycTracks: nextTracks,
          kycStatus: nextTracks.identity.status === 'verified' ? 'verified' : status,
        };
        if (currentUser.id === userId) setCurrentUser(updated);
        return updated;
      })
    );
    addAuditLog('kyc_reviewed', `KYC track "${track}" for ${userId} set to ${status.toUpperCase()} by ${currentUser.name}`);
  };

  const updateProfileVisibility = (visibility: ProfileVisibilitySettings, bio?: string, companyName?: string) => {
    const updated: User = {
      ...currentUser,
      profileVisibility: visibility,
      bio: bio ?? currentUser.bio,
      companyName: companyName ?? currentUser.companyName,
    };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  const updatePlanConfig = (planId: PlanTierId, updates: Partial<SubscriptionPlanConfig>, notes: string) => {
    const nextVersion = `v2026.${pricingHistory.length + 12}`;
    setPlanCatalog((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, ...updates, pricingVersion: nextVersion, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    const existing = planCatalog.find((p) => p.id === planId);
    setPricingHistory((prev) => [
      {
        version: nextVersion,
        planId,
        monthlyPriceNGN: updates.monthlyPriceNGN ?? existing?.monthlyPriceNGN ?? 0,
        annualDiscountPercent: updates.annualDiscountPercent ?? existing?.annualDiscountPercent ?? 20,
        maxUnits: updates.maxUnits ?? existing?.maxUnits ?? 0,
        changedBy: currentUser.name,
        changedAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} WAT`,
        notes: notes || 'Pricing / limit configuration adjusted by Super Admin.',
      },
      ...prev,
    ]);
    addAuditLog('plan_updated', `Plan ${planId.toUpperCase()} updated (${nextVersion}): ${notes}`);
  };

  const createCoupon = (coupon: Omit<CouponCode, 'redemptions'>) => {
    setCoupons((prev) => [{ ...coupon, code: coupon.code.toUpperCase(), redemptions: 0 }, ...prev]);
    addAuditLog('plan_updated', `Created promotional coupon ${coupon.code.toUpperCase()} (${coupon.discountPercent}% off)`);
  };

  const toggleCoupon = (code: string) => {
    setCoupons((prev) => prev.map((c) => (c.code === code ? { ...c, active: !c.active } : c)));
  };

  const requestEnterpriseAgreement = (req: Omit<EnterpriseAgreement, 'id' | 'createdAt' | 'status'>) => {
    const newEnt: EnterpriseAgreement = {
      ...req,
      id: `ent_${Date.now()}`,
      status: 'quoted',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setEnterpriseAgreements((prev) => [newEnt, ...prev]);
    addAuditLog('plan_updated', `Custom Enterprise agreement proposal created for ${req.organizationName} (${req.unitVolume} units)`);
  };

  const upgradeSubscription = (
    tier: PlanTierId,
    cycle: BillingCycle = 'monthly',
    couponCode?: string
  ): { success: boolean; message: string } => {
    const plan = planCatalog.find((p) => p.id === tier);
    if (!plan) return { success: false, message: 'Plan not found.' };

    const matchedCoupon = couponCode
      ? coupons.find((c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active)
      : null;
    if (couponCode && !matchedCoupon) {
      return { success: false, message: `Coupon "${couponCode}" is invalid or inactive.` };
    }

    const pricing = calculateSubscriptionPrice(plan, cycle, matchedCoupon);
    const updated: User = {
      ...currentUser,
      subscriptionTier: tier,
      billingCycle: cycle,
      subscriptionStatus: 'active',
      subscriptionRenewsAt: cycle === 'annual' ? '2027-11-11' : '2026-12-11',
    };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));

    if (pricing.finalAmountNGN > 0) {
      setSubscriptionInvoices((prev) => [
        {
          id: `sub_${Date.now()}`,
          invoiceNumber: `ED-SUB-2026-${Math.floor(1000 + Math.random() * 8999)}`,
          planId: tier,
          planName: `${plan.name} (${cycle})`,
          billingCycle: cycle,
          currency: 'NGN',
          amount: pricing.finalAmountNGN,
          couponApplied: matchedCoupon?.code,
          gatewayFeePercent: 1.5,
          gatewayFeeFixed: 100,
          status: 'paid',
          issuedAt: new Date().toISOString().split('T')[0],
          periodEnd: updated.subscriptionRenewsAt || '2026-12-11',
        },
        ...prev,
      ]);
    }
    addAuditLog('plan_updated', `Account upgraded/changed to ${plan.name} (${cycle}) — ₦${pricing.finalAmountNGN.toLocaleString()}`);
    return {
      success: true,
      message: `Switched to ${plan.name} (${cycle}) at ₦${pricing.finalAmountNGN.toLocaleString()}.`,
    };
  };

  const simulateSubscriptionExpiryToggle = () => {
    const nextStatus = currentUser.subscriptionStatus === 'expired' ? 'active' : 'expired';
    const updated: User = { ...currentUser, subscriptionStatus: nextStatus };
    setCurrentUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    addAuditLog(
      'plan_updated',
      `Simulated subscription state changed to ${nextStatus.toUpperCase()} — all historical properties, tenancies, and receipts preserved.`
    );
  };

  const createMarketplaceListing = (
    listing: Omit<MarketplaceListing, 'id' | 'viewsCount' | 'leadsCount' | 'reportedCount' | 'createdAt' | 'moderationStatus'>
  ) => {
    const newListing: MarketplaceListing = {
      ...listing,
      id: `mkt_${Date.now()}`,
      viewsCount: 0,
      leadsCount: 0,
      reportedCount: 0,
      moderationStatus: 'submitted',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setMarketplaceListings((prev) => [newListing, ...prev]);
    addAuditLog('listing_moderated', `Submitted public Marketplace listing "${listing.title}" for moderation review.`);
  };

  const moderateMarketplaceListing = (listingId: string, status: MarketplaceModerationStatus) => {
    setMarketplaceListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, moderationStatus: status } : l))
    );
    addAuditLog('listing_moderated', `Marketplace listing ${listingId} set to ${status.toUpperCase()}`);
  };

  const reportMarketplaceListing = (listingId: string, reason: string) => {
    setMarketplaceListings((prev) =>
      prev.map((l) =>
        l.id === listingId
          ? { ...l, reportedCount: l.reportedCount + 1, lastReportReason: reason }
          : l
      )
    );
    addAuditLog('listing_moderated', `Listing ${listingId} flagged by user: ${reason}`);
  };

  const bookListingInspection = (booking: Omit<InspectionBooking, 'id' | 'createdAt' | 'status'>) => {
    const newBooking: InspectionBooking = {
      ...booking,
      id: `insp_${Date.now()}`,
      status: 'requested',
      createdAt: `${new Date().toISOString().slice(0, 16).replace('T', ' ')} WAT`,
    };
    setInspectionBookings((prev) => [newBooking, ...prev]);
    setMarketplaceListings((prev) =>
      prev.map((l) => (l.id === booking.listingId ? { ...l, leadsCount: l.leadsCount + 1 } : l))
    );
    addAuditLog('receipt_generated', `Inspection viewing requested by ${booking.prospectName} for "${booking.listingTitle}"`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        setCurrentUserRole,
        loginUser,
        signupUser,
        logoutUser,
        isAuthModalOpen,
        setIsAuthModalOpen,
        lockoutState: {
          isLocked: !!lockUntil && lockUntil > Date.now(),
          remainingSeconds: lockoutTimer,
          attempts: failedAttempts,
        },
        resetLockout,
        activeTab,
        setActiveTab,
        selectedPropertyId,
        setSelectedPropertyId,
        isMobileFrameMode,
        setIsMobileFrameMode,
        isDarkMode,
        toggleDarkMode,
        currencies,
        addCurrency,
        properties,
        visibleProperties,
        units,
        addUnit,
        updateUnitStatus,
        tenancies,
        createTenancyOnboarding,
        terminateTenancy,
        accessGrants,
        createAccessGrant,
        revokeAccessGrantImmediately,
        inventoryChecklists,
        inventoryHistory,
        updateInventoryItem,
        signOffInventory,
        logInspectionRecord,
        tenancyForms,
        createTenancyForm,
        signTenancyAgreement,
        invoices,
        createInvoiceReceipt,
        submitPaymentScreenshot,
        verifyPaymentConfirmation,
        renovationTickets,
        createRenovationTicket,
        updateRenovationStage,
        submitArtisanQuote,
        approveArtisanQuote,
        chatMessages,
        sendMessage,
        reportChatMessage,
        rentExpirationAlerts,
        reminderRule,
        updateReminderRule,
        reminderLogs,
        sendRenewalTermsAlert,
        updateUserKYC,
        updateUserKYCTrack,
        updateProfileVisibility,
        planCatalog,
        pricingHistory,
        updatePlanConfig,
        coupons,
        createCoupon,
        toggleCoupon,
        enterpriseAgreements,
        requestEnterpriseAgreement,
        subscriptionInvoices,
        usageMetrics,
        upgradeSubscription,
        simulateSubscriptionExpiryToggle,
        marketplaceListings,
        inspectionBookings,
        createMarketplaceListing,
        moderateMarketplaceListing,
        reportMarketplaceListing,
        bookListingInspection,
        auditLogs,
        addAuditLog,
        hasAgeConsent,
        setHasAgeConsent,
        cookieConsentGiven,
        setCookieConsentGiven: (val: boolean) => {
          localStorage.setItem(`${STORAGE_VERSION}cookies_accepted`, val ? 'true' : 'false');
          setCookieConsentGiven(val);
        },
        openLegalModal,
        setOpenLegalModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
