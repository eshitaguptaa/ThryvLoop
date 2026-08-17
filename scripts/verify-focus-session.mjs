/**
 * Focus session edge-case regression suite.
 * Run: node scripts/verify-focus-session.mjs
 */
import assert from 'assert';
import {
  canClaimFocusSessionOwnership,
  canSystemResume,
  FOCUS_SESSION_CHECKIN_MAX_MS,
  FOCUS_SESSION_CHECKIN_MIN_MS,
  FOCUS_SESSION_ELSEWHERE_MAX_MS,
  FOCUS_SESSION_OWNER_STALE_MS,
  isFocusSessionElsewhere,
  isFocusSessionOwner,
  nextFocusCheckInDelayMs,
  resolvePauseReason,
  shouldPauseFromPageIdle,
} from '../src/lib/focusSession.js';

function eq(actual, expected, label) {
  assert.strictEqual(actual, expected, label);
}

// --- pause reason ---
eq(resolvePauseReason({ active: true, manual: false, idlePaused: false }), null, 'active → null');
eq(resolvePauseReason({ active: false, manual: true, idlePaused: false }), 'manual', 'manual');
eq(resolvePauseReason({ active: false, manual: false, idlePaused: true }), 'idle', 'idle paused');
eq(resolvePauseReason({ active: false, manual: false, idlePaused: false }), null, 'fresh inactive');
eq(
  resolvePauseReason({ active: true, manual: true, idlePaused: true }),
  'manual',
  'corrupt active+manual prefers manual'
);

// --- system resume ---
eq(
  canSystemResume({ sessionActive: false, pauseReason: 'idle', manualOff: false }),
  true,
  'idle may resume'
);
eq(
  canSystemResume({ sessionActive: false, pauseReason: null, manualOff: false }),
  false,
  'fresh user no auto-start'
);
eq(
  canSystemResume({ sessionActive: false, pauseReason: 'idle', manualOff: true }),
  false,
  'manual blocks resume'
);
eq(
  canSystemResume({ sessionActive: true, pauseReason: null, manualOff: false }),
  false,
  'already active'
);
eq(
  canSystemResume({ sessionActive: false, pauseReason: 'manual', manualOff: true }),
  false,
  'manual pause reason'
);

// --- ownership ---
const tabA = 'tab-a';
const tabB = 'tab-b';
const now = 1_000_000;

eq(isFocusSessionOwner({ owner: null, tabId: tabA }), false, 'no owner');
eq(isFocusSessionOwner({ owner: { tabId: tabA, at: now }, tabId: tabA }), true, 'same tab owner');
eq(isFocusSessionOwner({ owner: { tabId: tabA, at: now }, tabId: tabB }), false, 'other tab');

eq(canClaimFocusSessionOwnership({ owner: null, tabId: tabA, now }), true, 'claim empty');
eq(
  canClaimFocusSessionOwnership({ owner: { tabId: tabA, at: now }, tabId: tabA, now }),
  true,
  'claim self'
);
eq(
  canClaimFocusSessionOwnership({
    owner: { tabId: tabA, at: now },
    tabId: tabB,
    now,
  }),
  false,
  'cannot steal fresh owner'
);
eq(
  canClaimFocusSessionOwnership({
    owner: { tabId: tabA, at: now - FOCUS_SESSION_OWNER_STALE_MS - 1 },
    tabId: tabB,
    now,
  }),
  true,
  'can claim stale owner'
);
eq(
  canClaimFocusSessionOwnership({
    owner: { tabId: tabA, at: now },
    tabId: tabB,
    now,
    force: true,
  }),
  true,
  'force claim steals fresh owner'
);

eq(isFocusSessionElsewhere({ tabVisible: true, pageFocused: true }), false, 'in front');
eq(isFocusSessionElsewhere({ tabVisible: false, pageFocused: true }), true, 'hidden tab');
eq(isFocusSessionElsewhere({ tabVisible: true, pageFocused: false }), true, 'unfocused');

const delayA = nextFocusCheckInDelayMs(() => 0);
const delayB = nextFocusCheckInDelayMs(() => 1);
eq(delayA, FOCUS_SESSION_CHECKIN_MIN_MS, 'check-in delay min');
eq(delayB, FOCUS_SESSION_CHECKIN_MAX_MS, 'check-in delay max');
eq(
  nextFocusCheckInDelayMs(() => 0.5) >= FOCUS_SESSION_CHECKIN_MIN_MS &&
    nextFocusCheckInDelayMs(() => 0.5) <= FOCUS_SESSION_CHECKIN_MAX_MS,
  true,
  'check-in delay in range'
);

const idle10 = 10 * 60 * 1000;
const elsewhereMax = FOCUS_SESSION_ELSEWHERE_MAX_MS;

// --- page idle vs working in other apps ---
eq(
  shouldPauseFromPageIdle({
    sessionActive: true,
    systemIdleArmed: false,
    tabVisible: false,
    pageFocused: true,
    idleForMs: 10 * 60 * 1000,
    elsewhereForMs: 10 * 60 * 1000,
    idleThresholdMs: idle10,
    elsewhereMaxMs: elsewhereMax,
  }),
  false,
  'elsewhere under 1h must not pause'
);
eq(
  shouldPauseFromPageIdle({
    sessionActive: true,
    systemIdleArmed: false,
    tabVisible: true,
    pageFocused: false,
    idleForMs: 10 * 60 * 1000,
    elsewhereForMs: elsewhereMax,
    idleThresholdMs: idle10,
    elsewhereMaxMs: elsewhereMax,
  }),
  true,
  'elsewhere for 1h must pause (anti-AFK)'
);
eq(
  shouldPauseFromPageIdle({
    sessionActive: true,
    systemIdleArmed: false,
    tabVisible: true,
    pageFocused: true,
    idleForMs: 10 * 60 * 1000,
    elsewhereForMs: 0,
    idleThresholdMs: idle10,
    elsewhereMaxMs: elsewhereMax,
  }),
  true,
  'focused idle tab may page-idle'
);
eq(
  shouldPauseFromPageIdle({
    sessionActive: true,
    systemIdleArmed: true,
    tabVisible: true,
    pageFocused: true,
    idleForMs: 10 * 60 * 1000,
    elsewhereForMs: elsewhereMax,
    idleThresholdMs: idle10,
    elsewhereMaxMs: elsewhereMax,
  }),
  false,
  'OS idle armed → ignore page idle'
);
eq(
  shouldPauseFromPageIdle({
    sessionActive: false,
    systemIdleArmed: false,
    tabVisible: true,
    pageFocused: true,
    idleForMs: 10 * 60 * 1000,
    elsewhereForMs: elsewhereMax,
    idleThresholdMs: idle10,
    elsewhereMaxMs: elsewhereMax,
  }),
  false,
  'inactive session never page-idles'
);

console.log('verify-focus-session: all edge cases ok');
