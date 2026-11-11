import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateChallenge,
  bufferToHex,
  generateBiometricDigest,
  createBiometricResult,
} from './webauthnBiometrics.ts';

test('generateChallenge creates random byte buffer of requested length', () => {
  const challenge1 = generateChallenge(32);
  const challenge2 = generateChallenge(16);
  assert.equal(challenge1.length, 32);
  assert.equal(challenge2.length, 16);
  assert.ok(challenge1 instanceof Uint8Array);
});

test('bufferToHex converts byte arrays to proper hex string', () => {
  const bytes = new Uint8Array([0x00, 0x0f, 0xa5, 0xff]);
  assert.equal(bufferToHex(bytes), '000fa5ff');
});

test('generateBiometricDigest generates deterministic tamper-evident cryptographic hash', () => {
  const digest1 = generateBiometricDigest('sarah.j@gmail.com', 'face_id', '2026-11-09T00:00:00Z', 'cred_fid_123');
  const digest2 = generateBiometricDigest('sarah.j@gmail.com', 'face_id', '2026-11-09T00:00:00Z', 'cred_fid_123');
  assert.equal(digest1, digest2);
  assert.ok(digest1.startsWith('0xBIO_FACE_ID_'));

  const digestDifferent = generateBiometricDigest('sarah.j@gmail.com', 'touch_id', '2026-11-09T00:00:00Z', 'cred_fid_123');
  assert.notEqual(digest1, digestDifferent);
});

test('createBiometricResult returns complete verification record with liveness score', () => {
  const faceResult = createBiometricResult('face_id', 'afoluxhomes@gmail.com', 'Dr. Afolayan', false);
  assert.equal(faceResult.success, true);
  assert.equal(faceResult.method, 'face_id');
  assert.equal(faceResult.authenticatorType, 'secure_enclave');
  assert.ok(faceResult.credentialId.startsWith('cred_fid_'));
  assert.ok(faceResult.livenessScore >= 0.98);
  assert.ok(faceResult.signatureDigest.startsWith('0xBIO_FACE_ID_'));

  const touchResult = createBiometricResult('touch_id', 'kingsley.esv@afolux.com', 'Kingsley Okafor', false);
  assert.equal(touchResult.method, 'touch_id');
  assert.equal(touchResult.authenticatorType, 'platform_tpm');
  assert.ok(touchResult.credentialId.startsWith('cred_tid_'));
});
