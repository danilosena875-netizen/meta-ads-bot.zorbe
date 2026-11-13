/**
 * Gerencia sessões de conversa por usuário Telegram
 * Armazena o estado do fluxo de criação de anúncio
 */

const sessions = new Map();

function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, { step: 'idle', data: {} });
  }
  return sessions.get(userId);
}

function setSession(userId, state) {
  sessions.set(userId, state);
}

function clearSession(userId) {
  sessions.set(userId, { step: 'idle', data: {} });
}

module.exports = { getSession, setSession, clearSession };
