import { GoogleGenerativeAI } from '@google/generative-ai';
import { THRYVBOT_SYSTEM_PROMPT, buildContextMessage, ANALYTICS_INSIGHT_PROMPT } from '@/lib/assistant/prompt';
import {
  ASSISTANT_TOOL_DECLARATIONS,
  executeAssistantTool,
  collectCardsFromToolResults,
} from '@/lib/assistant/tools';
import { toGeminiHistory } from '@/lib/assistant/conversations';
import { formatGeminiError } from '@/lib/assistant/errors';

/** Override via GEMINI_MODEL in .env.local if you hit quota limits */
const DEFAULT_MODEL = 'gemini-2.5-flash';
const MAX_TOOL_ROUNDS = 3;

function getModelName() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to .env.local.');
  }
  return new GoogleGenerativeAI(apiKey);
}

function getModel() {
  const genAI = getGeminiClient();
  return genAI.getGenerativeModel({
    model: getModelName(),
    systemInstruction: THRYVBOT_SYSTEM_PROMPT,
    tools: [{ functionDeclarations: ASSISTANT_TOOL_DECLARATIONS }],
  });
}

async function sendChatMessage(chat, content) {
  try {
    return await chat.sendMessage(content);
  } catch (err) {
    const { message, status } = formatGeminiError(err);
    const error = new Error(message);
    error.status = status;
    throw error;
  }
}

function getResponseText(response) {
  try {
    return response?.response?.text()?.trim() || '';
  } catch {
    return '';
  }
}

function buildFallbackReply(toolTrace) {
  const focus = toolTrace.find((t) => t.name === 'get_focus_summary')?.result;
  if (focus && !focus.error) {
    return `Today: ${focus.summary || focus.formatted}.`;
  }
  const tasks = toolTrace.find((t) => t.name === 'get_tasks')?.result;
  if (tasks && !tasks.error) {
    return `You have ${tasks.count ?? tasks.tasks?.length ?? 0} open task(s).`;
  }
  return '';
}

/**
 * Run ThryvBot chat with tool calling loop.
 * @param {{ messages: Array<{ role: string, content: string }>, userMessage: string, userId: string, userName?: string }} params
 */
export async function runAssistantChat({ messages, userMessage, userId, userName }) {
  const model = getModel();
  const history = toGeminiHistory(messages);
  const contextMsg = buildContextMessage({ nowIso: new Date().toISOString(), userName });

  const chat = model.startChat({ history });

  /** @type {Array<{ name: string, result: unknown }>} */
  const toolTrace = [];
  let cards = [];

  let response = await sendChatMessage(chat, `${contextMsg}\n\nUser: ${userMessage}`);
  let rounds = 0;

  while (rounds < MAX_TOOL_ROUNDS) {
    const functionCalls = response.response.functionCalls?.() || [];
    if (functionCalls.length === 0) break;

    rounds += 1;
    const functionResponses = [];

    for (const call of functionCalls) {
      const name = call.name;
      const args = call.args || {};
      let result;
      try {
        result = await executeAssistantTool(userId, name, args);
      } catch (err) {
        result = {
          error: err instanceof Error ? err.message : 'Tool execution failed',
        };
      }
      toolTrace.push({ name, result });
      functionResponses.push({
        functionResponse: {
          name,
          response: result,
        },
      });
    }

    cards = collectCardsFromToolResults(toolTrace.map((t) => t.result));

    response = await sendChatMessage(chat, functionResponses);
  }

  let reply = getResponseText(response);
  if (!reply) {
    reply = buildFallbackReply(toolTrace) || 'I could not generate a reply. Please try again.';
  }

  if (cards.length === 0 && toolTrace.length > 0) {
    cards = collectCardsFromToolResults(toolTrace.map((t) => t.result));
  }

  return {
    reply,
    metadata: {
      cards,
      toolTrace: toolTrace.map(({ name, result }) => ({ name, success: !result?.error })),
    },
  };
}

/**
 * Generate a morning briefing without a user message (template + tool data).
 * @param {string} userId
 * @param {string} [userName]
 */
export async function buildMorningBriefing(userId, userName) {
  const name = userName?.trim() || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  let taskData;
  let eventData;
  let focusData;

  try {
    [taskData, eventData, focusData] = await Promise.all([
      executeAssistantTool(userId, 'get_tasks', { column: 'all', limit: 20 }),
      executeAssistantTool(userId, 'get_calendar_events', {}),
      executeAssistantTool(userId, 'get_focus_summary', { period: 'today' }),
    ]);
  } catch {
    return {
      reply: `${greeting}, ${name}! I'm ThryvBot — ask me about your tasks, calendar, or focus time.`,
      metadata: { cards: [], isBriefing: true },
    };
  }

  const highPriority = (taskData.tasks || []).filter((t) => t.priority === 'High Priority');
  const focusTasks = (taskData.tasks || []).filter((t) => t.column === 'todaysFocus');
  const nextEvent = (eventData.events || [])[0];

  const parts = [`${greeting}, ${name}!`];

  if (highPriority.length > 0) {
    parts.push(
      `You have **${highPriority.length} high-priority task${highPriority.length === 1 ? '' : 's'}** today.`
    );
  } else if (focusTasks.length > 0) {
    parts.push(`You have ${focusTasks.length} task${focusTasks.length === 1 ? '' : 's'} in Today's Focus.`);
  } else if (taskData.count > 0) {
    parts.push(`You have ${taskData.count} open task${taskData.count === 1 ? '' : 's'}.`);
  } else {
    parts.push('Your task board looks clear.');
  }

  if (nextEvent) {
    const start = new Date(nextEvent.startsAt);
    const timeStr = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    parts.push(`Your next event is **${nextEvent.title}** at ${timeStr}.`);
  }

  if (focusData.sessionCount > 0 || focusData.totalSeconds > 0) {
    parts.push(`You've logged **${focusData.formatted || focusData.summary}** of focus time today.`);
  }

  parts.push('How can I help you stay on track?');

  const cards = [
    ...(nextEvent ? [eventData.cards?.[0]].filter(Boolean) : []),
    ...(highPriority[0] ? [{ type: 'task', id: highPriority[0].id, title: highPriority[0].title, priority: highPriority[0].priority }] : []),
  ].slice(0, 3);

  return {
    reply: parts.join(' '),
    metadata: { cards, isBriefing: true },
  };
}

function parseAnalyticsInsightJson(text) {
  const trimmed = String(text || '').trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse AI insight response.');
  }
  const parsed = JSON.parse(jsonMatch[0]);
  const summary = String(parsed.summary || '').trim();
  const tips = Array.isArray(parsed.tips)
    ? parsed.tips.map((t) => String(t).trim()).filter(Boolean).slice(0, 3)
    : [];
  if (!summary && tips.length === 0) {
    throw new Error('Empty AI insight response.');
  }
  return { summary, tips };
}

/**
 * Generate analytics tips from dashboard metrics via Gemini.
 * @param {{ metrics: Record<string, unknown>, userName?: string }} params
 */
export async function buildAnalyticsInsight({ metrics, userName }) {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({
    model: getModelName(),
    systemInstruction: ANALYTICS_INSIGHT_PROMPT,
  });

  const contextMsg = buildContextMessage({
    nowIso: new Date().toISOString(),
    userName,
  });

  let response;
  try {
    response = await model.generateContent(
      `${contextMsg}\n\nMetrics JSON:\n${JSON.stringify(metrics, null, 2)}`
    );
  } catch (err) {
    const { message, status } = formatGeminiError(err);
    const error = new Error(message);
    error.status = status;
    throw error;
  }

  const text = response?.response?.text()?.trim() || '';
  return parseAnalyticsInsightJson(text);
}
