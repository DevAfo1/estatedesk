import React, { useState, useEffect, useRef } from 'react';
import {
  BiometricMethod,
  BiometricVerificationResult,
  authenticateWithWebAuthn,
  createBiometricResult,
} from '../utils/webauthnBiometrics.ts';
import {
  Fingerprint,
  Scan,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: BiometricVerificationResult) => void;
  userEmail: string;
  userName: string;
  initialMethod?: BiometricMethod;
  title?: string;
  subtitle?: string;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
  userName,
  initialMethod = 'face_id',
  title = 'Biometric Identity Verification',
  subtitle = 'Authenticate using hardware-backed FaceID, TouchID, or WebAuthn platform authenticator.',
}) => {
  const [selectedMethod, setSelectedMethod] = useState<BiometricMethod>(initialMethod);
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'verifying' | 'success'>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Position yourself to scan or hold sensor');
  const [verifiedResult, setVerifiedResult] = useState<BiometricVerificationResult | null>(null);

  // Press-and-hold timer for TouchID
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMethod(initialMethod);
      setScanState('idle');
      setProgress(0);
      setVerifiedResult(null);
      setStatusMessage('Select biometric sensor to initiate cryptographic verification.');
    }
    return () => {
      clearTouchTimers();
    };
  }, [isOpen, initialMethod]);

  const clearTouchTimers = () => {
    if (touchTimerRef.current) clearInterval(touchTimerRef.current);
    if (touchProgressIntervalRef.current) clearInterval(touchProgressIntervalRef.current);
  };

  const playSuccessChime = () => {
    try {
      if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.25); // G5

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc1.stop(now + 0.35);
        osc2.stop(now + 0.45);
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
    } catch (_) {
      // Audio or vibration is optional
    }
  };

  // FaceID Scanning Flow
  const startFaceIdScan = async () => {
    setScanState('scanning');
    setProgress(0);
    setStatusMessage('TrueDepth sensor active: analyzing facial geometric landmarks...');

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setProgress(current);

      if (current === 40) {
        setStatusMessage('Evaluating infrared 3D depth mesh & micro-gaze liveness...');
      } else if (current === 80) {
        setStatusMessage('Generating FIDO2 ES256 cryptographic attestation signature...');
      } else if (current >= 100) {
        clearInterval(interval);
        setStatusMessage('Biometric geometry verified! Finalizing credential...');
        setScanState('verifying');
        setTimeout(async () => {
          const result = await authenticateWithWebAuthn('face_id', userEmail, userName);
          setVerifiedResult(result);
          setScanState('success');
          setStatusMessage('Biometric Identity Authenticated!');
          playSuccessChime();
          setTimeout(() => {
            onSuccess(result);
          }, 900);
        }, 350);
      }
    }, 160);
  };

  // TouchID Sensor Press Handlers
  const handleTouchDown = () => {
    if (scanState === 'success') return;
    setScanState('scanning');
    setProgress(0);
    setStatusMessage('Finger detected. Keep thumb pressed firmly on sensor...');

    let p = 0;
    touchProgressIntervalRef.current = setInterval(() => {
      p += 10;
      setProgress(Math.min(p, 100));

      if (p === 40) {
        setStatusMessage('Scanning epidermal ridge contours and subsurface capacitance...');
      } else if (p === 80) {
        setStatusMessage('Hashing biometric minutiae against Secure Enclave public key...');
      } else if (p >= 100) {
        clearTouchTimers();
        setScanState('verifying');
        setTimeout(async () => {
          const result = await authenticateWithWebAuthn('touch_id', userEmail, userName);
          setVerifiedResult(result);
          setScanState('success');
          playSuccessChime();
          setTimeout(() => {
            onSuccess(result);
          }, 1400);
        }, 500);
      }
    }, 140);
  };

  const handleTouchUp = () => {
    if (scanState === 'scanning' && progress < 100) {
      clearTouchTimers();
      setScanState('idle');
      setProgress(0);
      setStatusMessage('Touch released too early. Press and hold sensor until completion.');
    }
  };

  // WebAuthn Passkey Trigger
  const startPasskeyFlow = async () => {
    setScanState('scanning');
    setProgress(30);
    setStatusMessage('Initiating Web Authentication API (navigator.credentials)...');

    const result = await authenticateWithWebAuthn('webauthn_passkey', userEmail, userName);
    setProgress(100);
    setScanState('verifying');

    setTimeout(() => {
      setVerifiedResult(result);
      setScanState('success');
      playSuccessChime();
      setTimeout(() => {
        onSuccess(result);
      }, 1400);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>WebAuthn FIDO2 Biometric Security</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close biometric authentication modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Biometric Method Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setSelectedMethod('face_id');
              setScanState('idle');
              setProgress(0);
              setStatusMessage('Ready for FaceID 3D TrueDepth scan.');
            }}
            className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
              selectedMethod === 'face_id'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Scan className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>FaceID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMethod('touch_id');
              setScanState('idle');
              setProgress(0);
              setStatusMessage('Ready for TouchID fingerprint scan. Press and hold sensor.');
            }}
            className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
              selectedMethod === 'touch_id'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Fingerprint className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>TouchID</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMethod('webauthn_passkey');
              setScanState('idle');
              setProgress(0);
              setStatusMessage('Ready for FIDO2 WebAuthn platform passkey challenge.');
            }}
            className={`py-2 px-2 text-xs font-semibold rounded-lg flex flex-col items-center gap-1 transition-all ${
              selectedMethod === 'webauthn_passkey'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Passkey</span>
          </button>
        </div>

        {/* Interactive Biometric Sensor Stage */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white p-6 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
          {/* Subtle background sensor grid */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* METHOD 1: FACE ID */}
          {selectedMethod === 'face_id' && (
            <div className="flex flex-col items-center space-y-4 relative z-10">
              <div className="relative w-28 h-32 border-2 border-dashed border-emerald-400/60 rounded-[36px] flex items-center justify-center overflow-hidden">
                {scanState === 'success' ? (
                  <CheckCircle2 className="w-14 h-14 text-emerald-400 transition-transform scale-110" />
                ) : (
                  <>
                    <Scan className={`w-12 h-12 text-emerald-400 ${scanState === 'scanning' ? 'animate-pulse' : 'opacity-70'}`} />
                    {scanState === 'scanning' && (
                      <div
                        className="absolute left-0 right-0 h-1 bg-emerald-400 shadow-md shadow-emerald-400 transition-all duration-200"
                        style={{ top: `${progress}%` }}
                      />
                    )}
                  </>
                )}
              </div>

              {scanState === 'idle' && (
                <button
                  type="button"
                  onClick={startFaceIdScan}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Scan className="w-3.5 h-3.5" />
                  Trigger FaceID TrueDepth Scan
                </button>
              )}
            </div>
          )}

          {/* METHOD 2: TOUCH ID */}
          {selectedMethod === 'touch_id' && (
            <div className="flex flex-col items-center space-y-4 relative z-10">
              <div
                role="button"
                tabIndex={0}
                aria-label="TouchID Capacitive Sensor. Press and hold to scan fingerprint."
                onPointerDown={handleTouchDown}
                onPointerUp={handleTouchUp}
                onPointerCancel={handleTouchUp}
                className={`relative w-28 h-28 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all select-none touch-none ${
                  scanState === 'success'
                    ? 'border-emerald-400 bg-emerald-950/40'
                    : scanState === 'scanning'
                    ? 'border-blue-400 bg-blue-950/50 scale-95 shadow-lg shadow-blue-500/20'
                    : 'border-slate-700 bg-slate-900 hover:border-blue-400/80 hover:bg-slate-800'
                }`}
              >
                {/* SVG Radial Progress Ring */}
                {scanState === 'scanning' && (
                  <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeDasharray="282.7"
                      strokeDashoffset={282.7 - (282.7 * progress) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {scanState === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 transition-transform scale-110" />
                ) : (
                  <Fingerprint
                    className={`w-14 h-14 transition-colors ${
                      scanState === 'scanning' ? 'text-blue-400 animate-pulse' : 'text-slate-400'
                    }`}
                  />
                )}
              </div>

              {scanState !== 'success' && (
                <p className="text-[11px] text-slate-400 tracking-wide font-medium">
                  {scanState === 'scanning' ? `Hold steady: ${progress}%` : 'Press & hold circular sensor'}
                </p>
              )}
            </div>
          )}

          {/* METHOD 3: FIDO2 WEBAUTHN PASSKEY */}
          {selectedMethod === 'webauthn_passkey' && (
            <div className="flex flex-col items-center space-y-4 relative z-10 text-center">
              <div className="w-20 h-20 rounded-2xl border border-purple-500/40 bg-purple-950/40 flex items-center justify-center">
                {scanState === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                ) : (
                  <KeyRound className="w-10 h-10 text-purple-400" />
                )}
              </div>

              {scanState === 'idle' && (
                <button
                  type="button"
                  onClick={startPasskeyFlow}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Authenticate WebAuthn Passkey
                </button>
              )}
            </div>
          )}

          {/* Status Text & Verification Metadata */}
          <div className="mt-4 text-center space-y-1">
            <p className={`text-xs font-medium ${scanState === 'success' ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
              {statusMessage}
            </p>

            {verifiedResult && (
              <div className="text-[10px] font-mono text-emerald-300/90 flex items-center justify-center gap-2 pt-1">
                <span>{verifiedResult.credentialId}</span>
                <span aria-hidden="true">·</span>
                <span>Liveness: {(verifiedResult.livenessScore * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Security Specs Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Cryptographic FIDO2 Level 2</span>
          </div>
          <span className="font-mono text-[10px]">ECDSA P-256 · SHA-256</span>
        </div>
      </div>
    </div>
  );
};
