import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { validateESVRegistration } from '../utils/proptechLogic.ts';
import { BiometricAuthModal } from './BiometricAuthModal.tsx';
import { BiometricMethod, BiometricVerificationResult } from '../utils/webauthnBiometrics.ts';
import { UserKYCTracks } from '../types/index.ts';
import {
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Calendar,
  Award,
  AlertCircle,
  Scan,
  Fingerprint,
  KeyRound,
  Building,
  Briefcase,
  Wrench,
  UserCheck,
} from 'lucide-react';

export const KYCVerificationView: React.FC = () => {
  const { currentUser, updateUserKYC, updateUserKYCTrack, addAuditLog } = useApp();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalMethod, setModalMethod] = useState<BiometricMethod>('face_id');
  const [faceVerified, setFaceVerified] = useState(!!currentUser.kycData?.facialVerified);
  const [biometricRecord, setBiometricRecord] = useState(currentUser.kycData?.biometricAuth);

  // Track 1: Identity
  const [identityDocType, setIdentityDocType] = useState('NIN Slip + International Passport');
  // Track 2: Property Ownership Callback
  const [callbackDate, setCallbackDate] = useState('2026-11-15');
  const [callbackTime, setCallbackTime] = useState('11:00');
  const [deedRef, setDeedRef] = useState('Deed #IKY/VOL41/PAGE89 · Governor Consent');
  const [callbackScheduled, setCallbackScheduled] = useState(
    !!currentUser.kycData?.propertyOwnershipCallback?.scheduled
  );
  // Track 3: Professional Qualification vs Academic Degree
  const [profBody, setProfBody] = useState<'ESV' | 'NIESV' | 'ESVABON' | 'RICS'>('ESVABON');
  const [regNumber, setRegNumber] = useState(currentUser.kycData?.registrationNumber || 'ESVABON/R/8831');
  const [degreeDoc, setDegreeDoc] = useState('B.Sc Estate Management (UNILAG)');
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; message: string } | null>(null);
  // Track 4: Business Registration
  const [cacNumber, setCacNumber] = useState('CAC RC #1849204 · TIN #23091842');
  // Track 5: Artisan / Vendor
  const [artisanCred, setArtisanCred] = useState('NABTEB Plumbing & Hydro-Systems Cert + 2 Guarantors');

  const handleLaunchBiometric = (method: BiometricMethod) => {
    setModalMethod(method);
    setIsAuthModalOpen(true);
  };

  const handleBiometricSuccess = (result: BiometricVerificationResult) => {
    setFaceVerified(true);
    setBiometricRecord({
      method: result.method,
      credentialId: result.credentialId,
      publicKeyAlgorithm: result.publicKeyAlgorithm,
      authenticatorType: result.authenticatorType,
      verifiedTimestamp: result.verifiedTimestamp,
      signatureDigest: result.signatureDigest,
      livenessScore: result.livenessScore,
      deviceLabel: result.deviceLabel,
    });

    updateUserKYC(
      currentUser.id,
      {
        facialVerified: true,
        facialTimestamp: new Date().toLocaleString(),
        biometricAuth: {
          method: result.method,
          credentialId: result.credentialId,
          publicKeyAlgorithm: result.publicKeyAlgorithm,
          authenticatorType: result.authenticatorType,
          verifiedTimestamp: result.verifiedTimestamp,
          signatureDigest: result.signatureDigest,
          livenessScore: result.livenessScore,
          deviceLabel: result.deviceLabel,
        },
      },
      'verified'
    );

    addAuditLog(
      'kyc_submitted',
      `Biometric ${result.method.toUpperCase()} liveness verified on Track 1 (Identity). Credential: ${result.credentialId}`
    );
    setIsAuthModalOpen(false);
  };

  const handleValidateProfessionalBody = () => {
    const result = validateESVRegistration(regNumber, profBody);
    setValidationResult(result);
    if (result.isValid) {
      updateUserKYC(
        currentUser.id,
        { professionalBody: profBody, registrationNumber: regNumber },
        'in_review'
      );
      updateUserKYCTrack(
        currentUser.id,
        'professionalQualification',
        'in_review',
        `${profBody} (${regNumber}) + ${degreeDoc}`,
        'Submitted professional registration alongside academic credential.'
      );
    }
  };

  const handleScheduleCallback = (e: React.FormEvent) => {
    e.preventDefault();
    setCallbackScheduled(true);
    updateUserKYC(currentUser.id, {
      propertyOwnershipCallback: {
        scheduled: true,
        callDate: callbackDate,
        callTime: callbackTime,
        notes: `Ownership verification call scheduled with EstateDesk compliance officer (${deedRef}).`,
        agentConfirmed: true,
      },
    });
    updateUserKYCTrack(
      currentUser.id,
      'propertyOwnership',
      'in_review',
      deedRef,
      `Registry callback scheduled for ${callbackDate} at ${callbackTime}.`
    );
  };

  const trackDefs: { key: keyof UserKYCTracks; label: string; icon: React.ElementType; desc: string }[] = [
    {
      key: 'identity',
      label: '1. Identity Verification',
      icon: UserCheck,
      desc: 'NIN, Passport, Driver’s License & Biometrics',
    },
    {
      key: 'propertyOwnership',
      label: '2. Property Ownership',
      icon: Building,
      desc: 'C of O, Governor’s Consent, Deed & Callback',
    },
    {
      key: 'professionalQualification',
      label: '3. Professional Qualification',
      icon: Award,
      desc: 'ESV / NIESV / ESVABON seal distinct from degree',
    },
    {
      key: 'businessRegistration',
      label: '4. Business Registration',
      icon: Briefcase,
      desc: 'CAC RC incorporation & corporate TIN',
    },
    {
      key: 'artisanVendor',
      label: '5. Artisan & Vendor',
      icon: Wrench,
      desc: 'Trade certificate, guarantors & background check',
    },
  ];

  const statusColor = (status: string) => {
    if (status === 'verified') return 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40';
    if (status === 'in_review' || status === 'pending') return 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40';
    if (status === 'rejected') return 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/40';
    return 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Separated 5-Track KYC & Compliance Engine</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
          5-Track Verification & Accreditation
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Identity (NIN/Biometrics), Property Ownership, Professional Licensing (ESV/NIESV/ESVABON), Business CAC, and Artisan Trade credentials are audited independently and never conflated.
        </p>
      </div>

      {/* 5-Track Status Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {trackDefs.map((t) => {
          const Icon = t.icon;
          const record = currentUser.kycTracks[t.key];
          return (
            <div
              key={t.key}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <Icon className="w-4 h-4 text-slate-500" />
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${statusColor(record.status)}`}>
                  {record.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{t.label}</p>
              <p className="text-[11px] text-slate-500 leading-snug">{t.desc}</p>
              {record.documentName && (
                <p className="text-[10px] font-mono text-slate-600 dark:text-slate-300 truncate">
                  {record.documentName}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Track 1: Identity & Biometric Authentication */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Track 1: Identity & Biometric Liveness (WebAuthn Simulation)
              </h2>
              <p className="text-xs text-slate-500">
                Simulated FaceID, TouchID, or WebAuthn Passkey enrollment paired with NIN/Passport document reference.
              </p>
            </div>
          </div>

          {faceVerified && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Identity Attested
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-end text-xs">
          <div className="flex-1 w-full">
            <label htmlFor="id-doc-type" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Government Identity Document Reference
            </label>
            <input
              id="id-doc-type"
              type="text"
              value={identityDocType}
              onChange={(e) => setIdentityDocType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
            />
          </div>
          <button
            type="button"
            onClick={() => updateUserKYCTrack(currentUser.id, 'identity', 'in_review', identityDocType, 'Submitted for compliance review.')}
            className="px-4 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold whitespace-nowrap"
          >
            Submit Identity Doc
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { method: 'face_id' as BiometricMethod, label: 'FaceID Liveness', desc: 'Simulated 3D face scan', icon: Scan },
            { method: 'touch_id' as BiometricMethod, label: 'TouchID Sensor', desc: 'Simulated fingerprint match', icon: Fingerprint },
            { method: 'webauthn_passkey' as BiometricMethod, label: 'WebAuthn Passkey', desc: 'Platform credential flow', icon: KeyRound },
          ].map((b) => {
            const Icon = b.icon;
            const active = biometricRecord?.method === b.method;
            return (
              <button
                key={b.method}
                type="button"
                onClick={() => handleLaunchBiometric(b.method)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  active
                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{b.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{b.desc}</p>
                  </div>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Launch Sensor →
                </span>
              </button>
            );
          })}
        </div>

        {biometricRecord && (
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>Credential: {biometricRecord.credentialId}</div>
            <div>Digest: {biometricRecord.signatureDigest}</div>
          </div>
        )}
      </div>

      {/* Track 3: Professional Qualification vs Academic Degree */}
      {(currentUser.role === 'agent' || currentUser.role === 'landlord' || currentUser.role === 'super_admin') && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Track 3: Professional Accreditation (ESV / NIESV / ESVABON) vs Academic Degree
              </h2>
              <p className="text-xs text-slate-500">
                Academic Estate Management degrees are verified separately from statutory regulatory body licenses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label htmlFor="prof-body" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Statutory Body
              </label>
              <select
                id="prof-body"
                value={profBody}
                onChange={(e) => setProfBody(e.target.value as 'ESV' | 'NIESV' | 'ESVABON' | 'RICS')}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              >
                <option value="ESVABON">ESVABON</option>
                <option value="NIESV">NIESV</option>
                <option value="ESV">ESV</option>
                <option value="RICS">RICS</option>
              </select>
            </div>

            <div>
              <label htmlFor="prof-reg" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                License / Seal Number
              </label>
              <input
                id="prof-reg"
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
              />
            </div>

            <div>
              <label htmlFor="prof-deg" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Qualification (Separate)
              </label>
              <input
                id="prof-deg"
                type="text"
                value={degreeDoc}
                onChange={(e) => setDegreeDoc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              />
            </div>
          </div>

          {validationResult && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                validationResult.isValid
                  ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                  : 'bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-200'
              }`}
            >
              {validationResult.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{validationResult.message}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleValidateProfessionalBody}
            className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
          >
            Submit Professional License for Moderation
          </button>
        </div>
      )}

      {/* Track 2 & 4: Property Ownership Callback & Business Registration */}
      {(currentUser.role === 'landlord' || currentUser.role === 'facility_manager' || currentUser.role === 'super_admin') && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Track 2 & Track 4: Property Ownership Deed & Business Registration (CAC)
              </h2>
              <p className="text-xs text-slate-500">
                Schedule registry confirmation callback for property title and submit corporate CAC incorporation separately.
              </p>
            </div>
          </div>

          <form onSubmit={handleScheduleCallback} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="deed-ref" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title Deed / C of O Reference
                </label>
                <input
                  id="deed-ref"
                  type="text"
                  value={deedRef}
                  onChange={(e) => setDeedRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label htmlFor="cac-ref" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate CAC / TIN Reference (Track 4)
                </label>
                <div className="flex gap-2">
                  <input
                    id="cac-ref"
                    type="text"
                    value={cacNumber}
                    onChange={(e) => setCacNumber(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => updateUserKYCTrack(currentUser.id, 'businessRegistration', 'in_review', cacNumber, 'CAC registration submitted')}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                  >
                    Submit CAC
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cb-date" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Callback Date
                </label>
                <input
                  id="cb-date"
                  type="date"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label htmlFor="cb-time" className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Callback Time
                </label>
                <input
                  id="cb-time"
                  type="time"
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                />
              </div>
            </div>

            {callbackScheduled && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Ownership verification callback scheduled for {callbackDate} at {callbackTime}.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              Schedule Ownership Callback
            </button>
          </form>
        </div>
      )}

      {/* Track 5: Artisan / Vendor Verification */}
      {(currentUser.role === 'artisan' || currentUser.role === 'super_admin') && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Track 5: Artisan & Trade Vendor Certification
              </h2>
              <p className="text-xs text-slate-500">
                Submit trade certification, guarantor verification, and workshop proof to receive work order assignments.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 text-xs">
            <input
              type="text"
              aria-label="Artisan trade credentials"
              value={artisanCred}
              onChange={(e) => setArtisanCred(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
            />
            <button
              type="button"
              onClick={() => updateUserKYCTrack(currentUser.id, 'artisanVendor', 'in_review', artisanCred, 'Submitted trade certification and guarantors.')}
              className="px-4 py-2 min-h-[40px] font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            >
              Submit Vendor Credentials
            </button>
          </div>
        </div>
      )}

      <BiometricAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleBiometricSuccess}
        userEmail={currentUser.email}
        userName={currentUser.name}
        initialMethod={modalMethod}
      />
    </div>
  );
};
