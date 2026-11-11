export type UserRole =
  | 'landlord'
  | 'agent'
  | 'facility_manager'
  | 'tenant'
  | 'artisan'
  | 'super_admin';

export type KYCStatus = 'not_started' | 'pending' | 'in_review' | 'verified' | 'rejected';

export type CurrencyCode = 'NGN' | 'USD' | 'GBP' | 'EUR' | string;

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  minorUnitFactor: number; // e.g., 100 for kobo/cents
  fxRateToNGN: number; // Explicit disclosure rate relative to NGN for portfolio conversion reference
  fxUpdatedAt: string;
}

export type ProfileVisibilityLevel = 'public' | 'authorized_contacts' | 'private';

export interface ProfileVisibilitySettings {
  phoneVisibility: ProfileVisibilityLevel;
  emailVisibility: ProfileVisibilityLevel;
  bioVisibility: ProfileVisibilityLevel;
  certificationsVisibility: ProfileVisibilityLevel;
  portfolioCountVisibility: ProfileVisibilityLevel;
}

export interface KYCTrackRecord {
  status: KYCStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
  documentName?: string;
  referenceId?: string;
}

export interface UserKYCTracks {
  identity: KYCTrackRecord; // NIN, Passport, Driver's License, Biometrics
  propertyOwnership: KYCTrackRecord; // Deed / Governor's Consent / C of O / Callback check
  professionalQualification: KYCTrackRecord; // ESV, NIESV, ESVABON, COREN vs Academic degree
  businessRegistration: KYCTrackRecord; // CAC RC Number, TIN
  artisanVendor: KYCTrackRecord; // Trade certificate, Guarantor, Background verification
}

export type PlanTierId = 'free' | 'basic' | 'professional' | 'portfolio' | 'enterprise';
export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface SubscriptionPlanConfig {
  id: PlanTierId;
  name: string;
  tagline: string;
  monthlyPriceNGN: number; // Major units in NGN (editable by Super Admin)
  weeklyPriceNGN?: number;
  weeklyEnabled: boolean;
  quarterlyDiscountPercent: number;
  annualDiscountPercent: number;
  maxProperties: number; // -1 for unlimited
  maxUnits: number; // -1 for unlimited
  features: string[];
  quotas: {
    smsCreditsMonthly: number;
    whatsappCreditsMonthly: number;
    kycChecksMonthly: number;
    eSignaturesMonthly: number;
    storageGb: number;
    staffSeats: number;
  };
  pricingVersion: string;
  updatedAt: string;
}

export interface PricingVersionEntry {
  version: string;
  planId: PlanTierId;
  monthlyPriceNGN: number;
  annualDiscountPercent: number;
  maxUnits: number;
  changedBy: string;
  changedAt: string;
  notes: string;
}

export interface CouponCode {
  code: string;
  discountPercent: number;
  appliesTo: PlanTierId[];
  expiresAt: string;
  active: boolean;
  redemptions: number;
}

export interface EnterpriseAgreement {
  id: string;
  organizationName: string;
  contactEmail: string;
  unitVolume: number;
  customAnnualFeeNGN: number;
  currency: CurrencyCode;
  whiteLabelEnabled: boolean;
  apiAccessEnabled: boolean;
  multiBranchCount: number;
  slaUptimePercent: number;
  status: 'draft' | 'quoted' | 'active';
  createdAt: string;
}

export interface UsageMetrics {
  smsUsed: number;
  whatsappUsed: number;
  emailSent: number;
  kycChecksUsed: number;
  eSignaturesUsed: number;
  storageUsedGb: number;
  marketplacePromotionsUsed: number;
  apiCallsUsed: number;
  extraStaffSeatsUsed: number;
}

export interface SubscriptionInvoiceRecord {
  id: string;
  invoiceNumber: string;
  planId: PlanTierId;
  planName: string;
  billingCycle: BillingCycle;
  currency: CurrencyCode;
  amount: number;
  couponApplied?: string;
  gatewayFeePercent: number;
  gatewayFeeFixed: number;
  status: 'paid' | 'pending' | 'grace_period';
  issuedAt: string;
  periodEnd: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  bio?: string;
  companyName?: string;
  city?: string;
  kycStatus: KYCStatus;
  kycTracks: UserKYCTracks;
  kycData?: {
    facialVerified?: boolean;
    facialTimestamp?: string;
    idCardUrl?: string;
    degreeUrl?: string;
    professionalBody?: 'ESV' | 'NIESV' | 'ESVABON' | 'RICS';
    registrationNumber?: string;
    propertyDeedUrl?: string;
    propertyOwnershipCallback?: {
      scheduled: boolean;
      callDate?: string;
      callTime?: string;
      notes?: string;
      agentConfirmed?: boolean;
    };
    tradeLicenseUrl?: string;
    artisanTrade?: string;
    yearsExperience?: number;
    biometricAuth?: {
      method: 'face_id' | 'touch_id' | 'webauthn_passkey';
      credentialId: string;
      publicKeyAlgorithm: string;
      authenticatorType: 'platform_tpm' | 'secure_enclave' | 'fido2_token' | 'simulated_biometric';
      verifiedTimestamp: string;
      signatureDigest: string;
      livenessScore: number;
      deviceLabel: string;
    };
  };
  assignedPropertyIds: string[];
  assignedUnitId?: string; // For tenants
  subscriptionTier: PlanTierId;
  billingCycle: BillingCycle;
  subscriptionStatus: 'active' | 'grace_period' | 'expired';
  subscriptionRenewsAt?: string;
  profileVisibility: ProfileVisibilitySettings;
  failedLoginAttempts: number;
  isLocked: boolean;
  lockUntil?: number;
}

export type AccessPermissionScope =
  | 'view_units'
  | 'manage_tenancies'
  | 'issue_invoices'
  | 'verify_payments'
  | 'manage_maintenance'
  | 'moderate_chat'
  | 'publish_marketplace';

export interface AccessGrant {
  id: string;
  landlordId: string;
  granteeUserId: string;
  granteeName: string;
  granteeRole: 'agent' | 'facility_manager';
  propertyId: string;
  unitIds: string[]; // empty array = all units in propertyId
  permissions: AccessPermissionScope[];
  startDate: string;
  scheduledRevocationAt?: string; // ISO timestamp for custom scheduled revocation
  revokedAt?: string; // Populated when emergency revoked or auto-expired
  revocationReason?: string;
  status: 'active' | 'scheduled_revoked' | 'emergency_revoked';
}

export type PropertyCategory = 'residential' | 'commercial' | 'mixed' | 'land_plot' | 'estate';

export interface Property {
  id: string;
  organizationName: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  timezone: string; // e.g., 'Africa/Lagos', 'Europe/London'
  currency: CurrencyCode;
  listingIntent: 'rent' | 'sale' | 'both';
  totalUnits: number;
  occupiedUnits: number;
  image: string;
  type: PropertyCategory;
  landlordId: string;
  agentId: string;
  facilityManagerId: string;
  amenities: string[];
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  currency: CurrencyCode;
  rentAmount: number;
  serviceCharge: number;
  billingCycle: 'yearly' | 'monthly' | 'quarterly';
  tenantId?: string;
  status: 'occupied' | 'vacant' | 'maintenance';
  leaseStartDate?: string;
  leaseEndDate?: string;
  depositAmount: number;
  meterNumber: string;
}

export interface TenancyRecord {
  id: string;
  unitId: string;
  propertyId: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  onboardingMethod: 'invite_link' | 'invite_code' | 'manual';
  inviteCode?: string;
  startDate: string;
  endDate: string;
  currency: CurrencyCode;
  rentAmount: number;
  serviceCharge: number;
  securityDeposit: number;
  outstandingBalance: number;
  paymentSchedule: 'annual' | 'quarterly' | 'monthly';
  status: 'active' | 'expired' | 'terminated' | 'renewed' | 'pending_onboarding';
  terminatedAt?: string;
}

export interface InventoryItem {
  id: string;
  category: 'Living Room' | 'Kitchen' | 'Bedrooms' | 'Bathrooms' | 'Electrical' | 'Plumbing' | 'Keys & Access';
  item: string;
  condition: 'excellent' | 'good' | 'fair' | 'damaged';
  notes: string;
  photoAttached?: boolean;
  checked: boolean;
}

export interface InitialInventoryChecklist {
  id: string;
  unitId: string;
  propertyId: string;
  inspectionType: 'initial' | 'move_in' | 'move_out' | 'routine';
  inspectionDate: string;
  inspectorName: string;
  inspectorRole: UserRole;
  items: InventoryItem[];
  meterReadings: {
    electricityKwh: string;
    waterM3: string;
    generatorHours?: string;
  };
  keysHandedOver: {
    frontDoor: number;
    securityGate: number;
    roomKeys: number;
  };
  damagedSummary?: string;
  tenantSignOff: boolean;
  signedAt?: string;
}

export interface LegalSignature {
  name: string;
  role: UserRole;
  signedAt: string;
  signatureData: string;
  signatureMode?: 'drawn' | 'typed' | 'biometric';
  consentConfirmed?: boolean;
  ipHash: string;
}

export interface TenancyForm {
  id: string;
  propertyId: string;
  unitId: string;
  landlordId: string;
  tenantId: string;
  agentId: string;
  templateVersion: string;
  tenantFullName: string;
  tenantEmail: string;
  tenantPhone: string;
  tenantOccupation: string;
  tenantNextOfKin: string;
  passportPhotoUrl?: string;
  startDate: string;
  endDate: string;
  currency: CurrencyCode;
  rentAmount: number;
  serviceCharge: number;
  legalFee: number;
  cautionDeposit: number;
  specialClauses: string[];
  watermarkText: string;
  customLogoUrl?: string;
  status: 'draft' | 'ready_for_signing' | 'completed';
  signatures: {
    landlord?: LegalSignature;
    agent?: LegalSignature;
    tenant?: LegalSignature;
  };
  legalHash?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'Rent' | 'Service Charge' | 'Legal & Agreement' | 'Caution Deposit' | 'Facility Repair' | 'Utility';
  amount: number;
}

export type PaymentVerificationStatus =
  | 'unpaid'
  | 'unverified_screenshot' // Tenant uploaded transfer slip; NOT confirmed paid
  | 'pending_reconciliation' // Waiting bank statement / gateway webhook match
  | 'verified_gateway' // Confirmed via Paystack/Flutterwave/Stripe reference
  | 'verified_bank_transfer' // Reconciled against bank statement by authorized landlord/agent
  | 'verified_cash' // Authorized manual cash confirmation with audit entry
  | 'refunded';

export interface InvoiceReceipt {
  id: string;
  docNumber: string;
  type: 'invoice' | 'receipt';
  propertyId: string;
  unitId: string;
  landlordId: string;
  tenantId: string;
  tenantName: string;
  rentPeriod?: string;
  currency: CurrencyCode;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod?: 'Paystack Gateway' | 'Flutterwave' | 'Bank Transfer' | 'Card Online' | 'Authorized Cash';
  paymentReference?: string;
  screenshotUrl?: string;
  verificationStatus: PaymentVerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  status: 'unpaid' | 'pending_verification' | 'paid' | 'overdue';
  watermarkText: string;
  customLogoUrl?: string;
  notes: string;
  generatedByRole: UserRole;
}

export type WorkOrderStage =
  | 'reported'
  | 'manager_reviewed'
  | 'approved'
  | 'rejected'
  | 'work_order_created'
  | 'artisan_assigned'
  | 'quote_submitted'
  | 'quote_approved'
  | 'in_progress'
  | 'before_after_uploaded'
  | 'work_reviewed'
  | 'completed';

export interface ArtisanQuote {
  artisanId: string;
  artisanName: string;
  currency: CurrencyCode;
  laborAmount: number;
  materialsAmount: number;
  totalAmount: number;
  estimatedDays: number;
  notes: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface RenovationTicket {
  id: string;
  propertyId: string;
  unitId: string;
  unitNumber: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'structural' | 'hvac' | 'carpentry' | 'appliances' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  photoUrls: string[];
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  stage: WorkOrderStage;
  status: 'reported' | 'assigned' | 'in_progress' | 'completed';
  reportedAt: string;
  assignedManagerId?: string;
  assignedManagerName?: string;
  assignedArtisanId?: string;
  assignedArtisanName?: string;
  quote?: ArtisanQuote;
  currency: CurrencyCode;
  estimatedCost?: number;
  resolutionNotes?: string;
  completionProofPhoto?: string;
  tenantRating?: number;
}

export interface HouseChatMessage {
  id: string;
  propertyId: string;
  unitId?: string; // When set, strictly scoped to that individual unit/apartment private group
  channelScope: 'unit_private' | 'building_announcement';
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  text: string;
  timestamp: string;
  imageUrl?: string;
  isAdminNotice?: boolean;
  reported?: boolean;
  reportReason?: string;
}

export interface RentReminderRule {
  intervalsDays: number[]; // e.g., [90, 60, 30, 14, 7, 0]
  includeOverdue: boolean;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  timezone: string;
}

export interface ReminderDeliveryLog {
  id: string;
  unitId: string;
  unitNumber: string;
  propertyName: string;
  milestoneLabel: string;
  channels: string[];
  recipientSummary: string;
  dispatchedAt: string;
  timezone: string;
  status: 'delivered_in_app' | 'simulated_external';
}

export interface RentExpirationAlert {
  unitId: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  currency: CurrencyCode;
  rentAmount: number;
  leaseEndDate: string;
  daysRemaining: number;
  status: 'critical_overdue' | 'urgent_7_days' | 'warning_30_days' | 'notice_60_days' | 'notice_90_days' | 'active_ok';
  isUrgent: boolean;
  renewalSent: boolean;
}

export type MarketplaceModerationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'published'
  | 'reserved'
  | 'rented'
  | 'sold'
  | 'rejected'
  | 'archived';

export interface MarketplaceListing {
  id: string;
  propertyId?: string;
  ownerUserId: string;
  listerName: string;
  listerRole: 'landlord' | 'agent';
  listerVerifiedIdentity: boolean;
  listerVerifiedProfessional: boolean;
  listerVerifiedOwnership: boolean;
  title: string;
  summary: string;
  category: PropertyCategory;
  intent: 'rent' | 'sale';
  city: string;
  state: string;
  country: string;
  currency: CurrencyCode;
  price: number;
  pricePeriod: 'per year' | 'per month' | 'outright sale';
  bedrooms?: number;
  bathrooms?: number;
  areaLabel: string; // e.g. '2,450 sqft' or '600 sqm plot'
  amenities: string[];
  image: string;
  promoted: boolean;
  moderationStatus: MarketplaceModerationStatus;
  reportedCount: number;
  lastReportReason?: string;
  viewsCount: number;
  leadsCount: number;
  createdAt: string;
}

export interface InspectionBooking {
  id: string;
  listingId: string;
  listingTitle: string;
  prospectName: string;
  prospectEmail: string;
  prospectPhone: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  event:
    | 'login_success'
    | 'login_failed'
    | 'account_locked'
    | 'kyc_submitted'
    | 'kyc_reviewed'
    | 'lease_signed'
    | 'receipt_generated'
    | 'payment_verified'
    | 'access_granted'
    | 'access_revoked'
    | 'plan_updated'
    | 'listing_moderated'
    | 'rate_limit_triggered';
  userEmail: string;
  ipAddress: string;
  details: string;
}
