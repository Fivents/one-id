import { describe, expect, it } from 'vitest';

import { getCheckInErrorMessage, getCheckInErrorTitle } from '@/app/(totem)/totem/_lib/checkin-error-message';

describe('getCheckInErrorMessage', () => {
  it('replaces the English API text of known codes with kiosk copy', () => {
    const message = getCheckInErrorMessage({
      code: 'CHECKIN_PARTICIPANT_NOT_FOUND',
      message: 'Participant not found.',
    });
    expect(message).not.toBe('Participant not found.');
    expect(message).toMatch(/inscrição/);
  });

  it('never tells a rejected duplicate to go ahead', () => {
    const message = getCheckInErrorMessage({ code: 'CHECKIN_DUPLICATE', message: 'Participant already checked in.' });
    expect(message).not.toMatch(/seguir/i);
  });

  it('keeps the API text for codes it does not know', () => {
    // The face loop matches on this text to skip "no face" frames silently, so it must pass through.
    const raw = 'No face detected. Please position your face in front of the camera.';
    expect(getCheckInErrorMessage({ code: 'CHECKIN_NO_FACE_DETECTED', message: raw })).toBe(raw);
  });
});

describe('face recognition rejections', () => {
  const english: Array<[string, string]> = [
    ['CHECKIN_MULTIPLE_FACES', 'Multiple faces detected. Please keep only one person in front of the camera.'],
    ['CHECKIN_LOW_LIVENESS', 'Liveness check failed. Please present a live face.'],
    ['CHECKIN_NO_BLINK', 'Blink not detected. Please present a live face.'],
    ['CHECKIN_UNSTABLE_TRACK', 'Face not stable. Please keep your face steady in front of the camera.'],
    ['CHECKIN_LOW_HISTORICAL_LIVENESS', 'Not enough liveness evidence from tracking. Please try again.'],
    ['CHECKIN_LOW_CONFIDENCE', 'Confidence below threshold.'],
    ['CHECKIN_PERSON_COOLDOWN', 'Check-in blocked by anti-fraud cooldown.'],
    ['CHECKIN_VECTOR_SEARCH_UNAVAILABLE', 'Vector search is not available for face check-in.'],
    ['CHECKIN_INVALID_EMBEDDING', 'Embedding must contain 512 dimensions.'],
  ];

  it.each(english)('translates %s', (code, message) => {
    const translated = getCheckInErrorMessage({ code, message });
    expect(translated).not.toBe(message);
    expect(translated).not.toMatch(/Please|detected|threshold/i);
  });
});

describe('getCheckInErrorTitle', () => {
  it('names the situation for known codes', () => {
    expect(getCheckInErrorTitle({ code: 'CHECKIN_DUPLICATE' }, 'Código inválido')).toBe('Check-in já realizado');
  });

  it('falls back to the screen title for other domain rejections', () => {
    expect(getCheckInErrorTitle({ code: 'CHECKIN_SOMETHING_NEW' }, 'Código inválido')).toBe('Código inválido');
  });

  it('does not blame the attendee for a server failure', () => {
    expect(getCheckInErrorTitle({ code: 'INTERNAL' }, 'Código inválido')).not.toBe('Código inválido');
    expect(getCheckInErrorMessage({ code: 'INTERNAL', message: 'Internal error.' })).not.toMatch(/Internal/);
  });
});

describe('transport failures', () => {
  it('never shows the technical fallback text on the kiosk', () => {
    expect(getCheckInErrorMessage({ code: 'REQUEST_FAILED', message: 'Request failed.' })).not.toMatch(
      /Request failed/,
    );
  });
});
