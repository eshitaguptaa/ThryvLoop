const GENERIC_REPLIES = [
  "Hmm, I didn't quite get that. Mind asking again?",
  "I'm having a quiet moment — try sending that once more.",
  "Let me reset — could you repeat that?",
];

const RATE_LIMIT_REPLIES = [
  "I'm getting a lot of questions right now — wait a moment and try again!",
  "Taking a quick breather — ask me again in a few seconds.",
];

const NEW_CHAT_WELCOME =
  'Fresh start — ask me about your tasks, calendar, or focus time.';

/**
 * User-facing assistant reply when the API fails. Never surfaces technical errors.
 * @param {{ status?: number }} [options]
 */
export function getFriendlyAssistantReply({ status } = {}) {
  if (status === 429) {
    return RATE_LIMIT_REPLIES[Math.floor(Math.random() * RATE_LIMIT_REPLIES.length)];
  }
  return GENERIC_REPLIES[Math.floor(Math.random() * GENERIC_REPLIES.length)];
}

export function getNewChatWelcome() {
  return NEW_CHAT_WELCOME;
}
