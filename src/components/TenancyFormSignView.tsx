import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { CurrencyCode, LegalSignature } from '../types/index.ts';
import { checkRBACPermission } from '../utils/proptechLogic.ts';
import { formatCurrencyAmount } from '../utils/estateDeskLogic.ts';
import { BiometricAuthModal } from './BiometricAuthModal.tsx';
import { BiometricAuthResult, BiometricMethod } from '../utils/webauthnBiometrics.ts';
import {
  FileText,
  PenTool,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Upload,
  Hash,
  AlertCircle,
  Printer,
  ScanFace,
  Fingerprint,
  Type,
} from 'lucide-react';

export const TenancyFormSignView: React.FC = () => {
  const {
    tenancyForms,
    createTenancyForm,
    signTenancyAgreement,
    currentUser,
    visibleProperties,
    units,
    currencies,
    isMobileFrameMode,
  } = useApp();

  const [selectedFormId, setSelectedFormId] = useState<string>(tenancyForms[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'sign' | 'create'>('sign');
  const [signatureMode, setSignatureMode] = useState<'drawn' | 'typed' | 'biometric'>('drawn');
  const [typedSignatureText, setTypedSignatureText] = useState(currentUser.name);
  const [consentConfirmed, setConsentConfirmed] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureHasDrawn, setSignatureHasDrawn] = useState(false);
  const [signerFullName, setSignerFullName] = useState(currentUser.name);

  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricMethod, setBiometricMethod] = useState<BiometricMethod>('face_id');

  // New Tenancy Form fields
  const [newPropertyId, setNewPropertyId] = useState(visibleProperties[0]?.id || 'prop_1');
  const [newUnitId, setNewUnitId] = useState('unit_101');
  const [newCurrency, setNewCurrency] = useState<CurrencyCode>('NGN');
  const [tenantFullName, setTenantFullName] = useState('Sarah Ade Johnson');
  const [tenantEmail, setTenantEmail] = useState('sarah.ade@gmail.com');
  const [tenantPhone, setTenantPhone] = useState('+234 814 555 0192');
  const [tenantOccupation, setTenantOccupation] = useState('Investment Banker');
  const [tenantNextOfKin, setTenantNextOfKin] = useState('Michael Johnson (+234 802 111 2233)');
  const [rentAmount, setRentAmount] = useState(18000000);
  const [serviceCharge, setServiceCharge] = useState(3500000);
  const [legalFee, setLegalFee] = useState(900000);
  const [cautionDeposit, setCautionDeposit] = useState(1800000);
  const [watermarkText, setWatermarkText] = useState('DRAFT TEMPLATE — PENDING LEGAL REVIEW');
  const [passportPhotoUrl, setPassportPhotoUrl] = useState(
    '/src/assets/images/avatar_tenant_sarah_1794388812955.jpg'
  );

  const visiblePropIds = new Set(visibleProperties.map((p) => p.id));
  const scopedForms = tenancyForms.filter(
    (f) => currentUser.role === 'super_admin' || visiblePropIds.has(f.propertyId) || f.tenantId === currentUser.id
  );
  const selectedForm = scopedForms.find((f) => f.id === selectedFormId) || scopedForms[0];

  const canCreateOrEditForms = checkRBACPermission(currentUser.role, 'view_tenancy_forms');

  useEffect(() => {
    setSignerFullName(currentUser.name);
    setTypedSignatureText(currentUser.name);
  }, [currentUser.id, currentUser.name]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f172a';
  }, [activeSubTab, selectedFormId, signatureMode]);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setSignatureHasDrawn(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureHasDrawn(false);
  };

  const handleSaveDrawnSignature = () => {
    if (!selectedForm || !signatureHasDrawn || !canvasRef.current || !consentConfirmed) return;
    const signatureData = canvasRef.current.toDataURL('image/png');
    const legalSig: LegalSignature = {
      name: signerFullName || currentUser.name,
      role: currentUser.role,
      signedAt: new Date().toLocaleString(),
      signatureData,
      signatureMode: 'drawn',
      consentConfirmed,
      ipHash: '102.89.33.14 (Drawn E-Sign Audit)',
    };
    signTenancyAgreement(selectedForm.id, legalSig);
    clearCanvas();
  };

  const handleSaveTypedSignature = () => {
    if (!selectedForm || !typedSignatureText.trim() || !consentConfirmed) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 120;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 120);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'italic 32px Georgia, serif';
      ctx.fillText(typedSignatureText.trim(), 20, 66);
      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.fillText(`Typed Electronic Signature · ${new Date().toISOString().slice(0, 16)}`, 20, 98);
    }
    const signatureData = tempCanvas.toDataURL('image/png');
    signTenancyAgreement(selectedForm.id, {
      name: signerFullName || typedSignatureText.trim(),
      role: currentUser.role,
      signedAt: new Date().toLocaleString(),
      signatureData,
      signatureMode: 'typed',
      consentConfirmed,
      ipHash: '102.89.33.14 (Typed E-Sign Audit)',
    });
  };

  const handleBiometricSignature = (result: BiometricAuthResult) => {
    if (!selectedForm) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 160;
    const ctx = tempCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 400, 160);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 3;
      ctx.strokeRect(6, 6, 388, 148);
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillText(`BIOMETRIC E-SIGNATURE (${result.method.toUpperCase().replace('_', ' ')})`, 16, 28);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px serif';
      ctx.fillText(signerFullName || currentUser.name, 16, 60);
      ctx.fillStyle = '#475569';
      ctx.font = '10px monospace';
      ctx.fillText(`Cred ID: ${result.credentialId.slice(0, 26)}...`, 16, 84);
      ctx.fillText(`Digest: ${result.signatureDigest.slice(0, 32)}...`, 16, 102);
      ctx.fillText(`Liveness: ${result.livenessScore}% · ${result.verifiedTimestamp}`, 16, 120);
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillText('SEALED VIA SIMULATED BIOMETRIC ATTESTATION', 16, 142);
    }

    signTenancyAgreement(selectedForm.id, {
      name: signerFullName || currentUser.name,
      role: currentUser.role,
      signedAt: new Date().toLocaleString(),
      signatureData: tempCanvas.toDataURL('image/png'),
      signatureMode: 'biometric',
      consentConfirmed: true,
      ipHash: `Biometric (${result.method}) · ${result.credentialId.slice(0, 12)}`,
    });
    setIsBiometricModalOpen(false);
  };

  const handleCreateForm = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = visibleProperties.find((p) => p.id === newPropertyId);
    createTenancyForm({
      propertyId: newPropertyId,
      unitId: newUnitId,
      landlordId: prop?.landlordId || currentUser.id,
      tenantId: 'usr_tenant_1',
      agentId: prop?.agentId || 'usr_agent_1',
      tenantFullName,
      tenantEmail,
      tenantPhone,
      tenantOccupation,
      tenantNextOfKin,
      passportPhotoUrl,
      startDate: '2026-12-04',
      endDate: '2027-12-04',
      currency: newCurrency,
      rentAmount: Number(rentAmount),
      serviceCharge: Number(serviceCharge),
      legalFee: Number(legalFee),
      cautionDeposit: Number(cautionDeposit),
      specialClauses: [
        'The Tenant covenants not to assign, sublet, or part with possession of the premises without written consent.',
        'Premises shall be used strictly for residential dwelling purposes.',
        'Quiet enjoyment is guaranteed subject to prompt payment of service charges and estate bylaws.',
      ],
      watermarkText: watermarkText || 'DRAFT TEMPLATE — PENDING LEGAL REVIEW',
    });
    setActiveSubTab('sign');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital Tenancy Agreement & Multi-Party E-Signature</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Tenancy Legal Contracts & E-Signatures
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Supports drawn, typed, and simulated biometric e-signatures with explicit party consent capture and audit hashes.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('sign')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'sign'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Review & E-Sign
          </button>

          {canCreateOrEditForms ? (
            <button
              onClick={() => setActiveSubTab('create')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeSubTab === 'create'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Draft New Form
            </button>
          ) : (
            <span className="px-3 py-1.5 text-xs text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Drafting Restricted
            </span>
          )}
        </div>
      </div>

      {/* Mandatory Legal Disclaimer Banner */}
      <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/20 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Legal Template Disclaimer:</strong> EstateDesk tenancy drafts and electronic signature workflows are operational templates and do not constitute formal legal advice. Before executing binding residential or commercial leases, parties should obtain independent review from qualified Nigerian legal counsel compliant with applicable State Tenancy Laws.
        </div>
      </div>

      {activeSubTab === 'create' && canCreateOrEditForms ? (
        <form
          onSubmit={handleCreateForm}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-xs max-w-4xl"
        >
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Draft Tenancy Agreement & Contract
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Input tenant particulars, passport photo, currency, financial terms, and watermark.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estate Property
              </label>
              <select
                value={newPropertyId}
                onChange={(e) => setNewPropertyId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              >
                {visibleProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Unit
              </label>
              <select
                value={newUnitId}
                onChange={(e) => setNewUnitId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unitNumber} ({u.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contract Currency
              </label>
              <select
                value={newCurrency}
                onChange={(e) => setNewCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tenant Full Legal Name
              </label>
              <input
                type="text"
                required
                value={tenantFullName}
                onChange={(e) => setTenantFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tenant Email
              </label>
              <input
                type="email"
                required
                value={tenantEmail}
                onChange={(e) => setTenantEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tenant Phone
              </label>
              <input
                type="tel"
                required
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Occupation / Employer
              </label>
              <input
                type="text"
                value={tenantOccupation}
                onChange={(e) => setTenantOccupation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Next of Kin & Phone
              </label>
              <input
                type="text"
                value={tenantNextOfKin}
                onChange={(e) => setTenantNextOfKin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom Watermark Text
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Annual Rent ({newCurrency})
              </label>
              <input
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Service Charge
              </label>
              <input
                type="number"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Legal & Stamp Fee
              </label>
              <input
                type="number"
                value={legalFee}
                onChange={(e) => setLegalFee(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Caution Deposit
              </label>
              <input
                type="number"
                value={cautionDeposit}
                onChange={(e) => setCautionDeposit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={passportPhotoUrl}
                alt="Tenant passport preview"
                className="w-14 h-16 rounded-md object-cover border border-slate-300 dark:border-slate-600"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Tenant Verified Passport Photo
                </p>
                <p className="text-[11px] text-slate-500">
                  Self-hosted local asset attached to the lease file.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const photos = [
                  '/src/assets/images/avatar_tenant_sarah_1794388812955.jpg',
                  '/src/assets/images/avatar_agent_kingsley_1793969243422.jpg',
                ];
                setPassportPhotoUrl(photos[(photos.indexOf(passportPhotoUrl) + 1) % photos.length]);
              }}
              className="px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Swap Passport
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubTab('sign')}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            >
              Publish Draft for E-Signature
            </button>
          </div>
        </form>
      ) : (
        <div className={`grid gap-6 ${isMobileFrameMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          <div className={`${isMobileFrameMode ? '' : 'lg:col-span-2'} space-y-4`}>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {scopedForms.map((form) => (
                <button
                  key={form.id}
                  onClick={() => setSelectedFormId(form.id)}
                  className={`px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedForm?.id === form.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{form.tenantFullName} ({form.unitId})</span>
                </button>
              ))}
            </div>

            {selectedForm && (
              <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-10 shadow-xs space-y-6 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden opacity-5 select-none">
                  <span className="text-3xl sm:text-5xl font-black uppercase tracking-widest text-slate-900 dark:text-white transform -rotate-12 whitespace-nowrap">
                    {selectedForm.watermarkText}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      EstateDesk Contract Template · {selectedForm.templateVersion}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      TENANCY DEED & LEASE AGREEMENT
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ref: <span className="font-mono">{selectedForm.id.toUpperCase()}</span>
                    </p>
                  </div>

                  {selectedForm.passportPhotoUrl && (
                    <div className="flex flex-col items-center shrink-0">
                      <img
                        src={selectedForm.passportPhotoUrl}
                        alt={selectedForm.tenantFullName}
                        className="w-16 h-20 rounded object-cover border border-slate-300 dark:border-slate-700"
                      />
                      <span className="text-[10px] text-slate-400 mt-1">Tenant Passport</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">THE LANDLORD</p>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">Chief Dr. Bamidele Afolayan</p>
                    <p className="text-[11px] text-slate-500">Ikoyi & VI Portfolio Trust (EstateDesk Verified)</p>
                    <p className="text-[11px] text-slate-500">Plot 14 Alexander Ave, Old Ikoyi, Lagos</p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">THE TENANT</p>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">{selectedForm.tenantFullName}</p>
                    <p className="text-[11px] text-slate-500">Email: {selectedForm.tenantEmail}</p>
                    <p className="text-[11px] text-slate-500">Phone: {selectedForm.tenantPhone}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    1. Demised Premises & Financial Consideration ({selectedForm.currency})
                  </h3>
                  <p className="leading-relaxed">
                    Term commencing <strong className="font-mono">{selectedForm.startDate}</strong> and expiring{' '}
                    <strong className="font-mono">{selectedForm.endDate}</strong> for Unit{' '}
                    <strong>{selectedForm.unitId}</strong>.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className="p-2.5 rounded border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Annual Rent</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrencyAmount(selectedForm.rentAmount, selectedForm.currency, currencies)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Service Charge</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrencyAmount(selectedForm.serviceCharge, selectedForm.currency, currencies)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Legal & Stamp</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrencyAmount(selectedForm.legalFee, selectedForm.currency, currencies)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Caution Deposit</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatCurrencyAmount(selectedForm.cautionDeposit, selectedForm.currency, currencies)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    2. Covenants & Special Clauses
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                    {selectedForm.specialClauses.map((clause, idx) => (
                      <li key={idx}>{clause}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Tripartite Execution Signatures
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      <span>{selectedForm.legalHash}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['landlord', 'agent', 'tenant'] as const).map((party) => {
                      const sig = selectedForm.signatures[party];
                      const partyLabel =
                        party === 'landlord'
                          ? 'Landlord Sign-off'
                          : party === 'agent'
                          ? 'Estate Agent (ESV)'
                          : 'Tenant Sign-off';
                      const partyName =
                        party === 'landlord'
                          ? 'Chief Dr. B. Afolayan'
                          : party === 'agent'
                          ? 'Kingsley Okafor, ESV'
                          : selectedForm.tenantFullName;
                      return (
                        <div
                          key={party}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between min-h-[140px]"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{partyLabel}</span>
                              {sig && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            </div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{partyName}</p>
                          </div>

                          {sig ? (
                            <div className="space-y-1">
                              <img src={sig.signatureData} alt={`${party} signature`} className="h-10 object-contain mx-auto" />
                              <p className="text-[9px] text-slate-400 text-center font-mono">
                                {sig.signatureMode ? `${sig.signatureMode.toUpperCase()} · ` : ''}{sig.signedAt}
                              </p>
                            </div>
                          ) : (
                            <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-700 rounded text-slate-400 text-[11px]">
                              Pending {party} Signature
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Drawn + Typed + Biometric Signature Pad */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <PenTool className="w-4 h-4 text-emerald-600" />
                <span>E-Signature Capture (Drawn / Typed / Biometric)</span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Signing as <strong className="capitalize text-slate-900 dark:text-white">{currentUser.role.replace('_', ' ')}</strong> ({currentUser.name}).
              </p>

              <div className="text-xs space-y-1">
                <label htmlFor="signer-name" className="block font-semibold text-slate-700 dark:text-slate-300">
                  Full Signatory Legal Name
                </label>
                <input
                  id="signer-name"
                  type="text"
                  value={signerFullName}
                  onChange={(e) => setSignerFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              {/* Signature Mode Selector */}
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setSignatureMode('drawn')}
                  className={`py-1.5 rounded-md flex items-center justify-center gap-1 ${
                    signatureMode === 'drawn' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <PenTool className="w-3 h-3" />
                  Draw
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('typed')}
                  className={`py-1.5 rounded-md flex items-center justify-center gap-1 ${
                    signatureMode === 'typed' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Type className="w-3 h-3" />
                  Type
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('biometric')}
                  className={`py-1.5 rounded-md flex items-center justify-center gap-1 ${
                    signatureMode === 'biometric' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Fingerprint className="w-3 h-3" />
                  Biometric
                </button>
              </div>

              {/* Explicit Electronic Consent Checkbox */}
              <label className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span>
                  I confirm intent to sign electronically, record my timestamp audit trail, and acknowledge counsel review is advised before binding execution.
                </span>
              </label>

              {signatureMode === 'drawn' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Draw signature below:</span>
                    <button type="button" onClick={clearCanvas} className="text-[11px] underline">
                      Clear
                    </button>
                  </div>
                  <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2 touch-none">
                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={140}
                      onPointerDown={startDrawing}
                      onPointerMove={draw}
                      onPointerUp={stopDrawing}
                      className="w-full h-32 bg-white dark:bg-slate-950 rounded cursor-crosshair border border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveDrawnSignature}
                    disabled={!signatureHasDrawn || !consentConfirmed}
                    className="w-full py-2.5 min-h-[40px] px-4 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Attach Drawn Signature
                  </button>
                </div>
              )}

              {signatureMode === 'typed' && (
                <div className="space-y-3">
                  <div className="text-xs space-y-1">
                    <label htmlFor="typed-sig" className="block font-semibold text-slate-700 dark:text-slate-300">
                      Typed Electronic Signature
                    </label>
                    <input
                      id="typed-sig"
                      type="text"
                      value={typedSignatureText}
                      onChange={(e) => setTypedSignatureText(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-serif italic text-base"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveTypedSignature}
                    disabled={!typedSignatureText.trim() || !consentConfirmed}
                    className="w-full py-2.5 min-h-[40px] px-4 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <Type className="w-3.5 h-3.5" />
                    Attach Typed Signature
                  </button>
                </div>
              )}

              {signatureMode === 'biometric' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!consentConfirmed}
                    onClick={() => {
                      setBiometricMethod('face_id');
                      setIsBiometricModalOpen(true);
                    }}
                    className="py-2.5 min-h-[40px] px-2 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <ScanFace className="w-3.5 h-3.5" />
                    FaceID Sign
                  </button>
                  <button
                    type="button"
                    disabled={!consentConfirmed}
                    onClick={() => {
                      setBiometricMethod('touch_id');
                      setIsBiometricModalOpen(true);
                    }}
                    className="py-2.5 min-h-[40px] px-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    TouchID Sign
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 min-h-[40px] px-4 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF Draft
            </button>
          </div>
        </div>
      )}

      <BiometricAuthModal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        initialMethod={biometricMethod}
        title="Biometric Tenancy E-Sign (Simulated)"
        subtitle={`Electronic attestation for ${signerFullName || currentUser.name}`}
        userEmail={currentUser.email}
        userName={signerFullName || currentUser.name}
        onSuccess={handleBiometricSignature}
      />
    </div>
  );
};
