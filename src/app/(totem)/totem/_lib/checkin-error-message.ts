// The check-in API answers in English for logs and integrators; attendees at the kiosk need
// a short Portuguese sentence that tells them what to do next. CHECKIN_NO_FACE_DETECTED stays
// unmapped on purpose: the face loop matches its raw text to skip empty frames silently.
const MESSAGES: Record<string, string> = {
  // Shared by the code, QR and face screens, so the advice stays method-neutral.
  CHECKIN_PARTICIPANT_NOT_FOUND: 'Não encontramos sua inscrição. Confira os dados ou procure a equipe do evento.',
  CHECKIN_MULTIPLE_FACES: 'Mais de um rosto na câmera. Deixe apenas uma pessoa em frente ao totem.',
  CHECKIN_LOW_LIVENESS: 'Não conseguimos confirmar a presença ao vivo. Olhe para a câmera e tente de novo.',
  CHECKIN_NO_BLINK: 'Não detectamos uma piscada. Olhe para a câmera e pisque naturalmente.',
  CHECKIN_UNSTABLE_TRACK: 'Rosto em movimento. Fique parado em frente à câmera por um instante.',
  CHECKIN_LOW_HISTORICAL_LIVENESS: 'Precisamos de mais alguns segundos de imagem. Tente novamente.',
  CHECKIN_LOW_CONFIDENCE: 'Não conseguimos confirmar sua identidade. Tente de novo ou use outro método.',
  CHECKIN_PERSON_COOLDOWN: 'Aguarde alguns segundos antes de tentar novamente.',
  CHECKIN_VECTOR_SEARCH_UNAVAILABLE: 'O reconhecimento facial está indisponível agora. Use outro método de check-in.',
  CHECKIN_INVALID_EMBEDDING: 'Não foi possível processar a imagem. Tente novamente.',
  CHECKIN_DUPLICATE: 'Seu check-in já foi registrado neste acesso.',
  CHECKIN_METHOD_DISABLED: 'Este método não está disponível neste evento. Escolha outra opção.',
  TOTEM_NO_ACTIVE_EVENT: 'Este totem não está vinculado a um evento ativo. Procure a equipe do evento.',
  REQUEST_TIMEOUT: 'A conexão está lenta. Tente novamente em instantes.',
};

const TECHNICAL_FAILURE_MESSAGE = 'Não foi possível validar agora. Tente novamente ou procure a equipe do evento.';

// Domain rejections carry a meaningful API message (the face loop even matches on it), so
// unknown ones pass through. Anything else — 5xx, proxy pages, network errors — is a technical
// failure and must not read like the attendee did something wrong.
function isDomainCode(code: string): boolean {
  return code.startsWith('CHECKIN_') || code.startsWith('TOTEM_');
}

export function getCheckInErrorMessage(error: { code: string; message: string }): string {
  return MESSAGES[error.code] ?? (isDomainCode(error.code) ? error.message : TECHNICAL_FAILURE_MESSAGE);
}

// "Código inválido" over "you already checked in" reads as an accusation; name the real situation.
const TITLES: Record<string, string> = {
  CHECKIN_DUPLICATE: 'Check-in já realizado',
  CHECKIN_TICKET_CANCELLED: 'Ingresso cancelado',
  CHECKIN_WRONG_GATE: 'Acesso não permitido aqui',
  CHECKIN_METHOD_DISABLED: 'Método indisponível',
  REQUEST_TIMEOUT: 'Conexão lenta',
};

export function getCheckInErrorTitle(error: { code: string }, fallback: string): string {
  return TITLES[error.code] ?? (isDomainCode(error.code) ? fallback : 'Não foi possível validar');
}
