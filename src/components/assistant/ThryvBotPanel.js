'use client';

import { Loader2, History, X } from 'lucide-react';
import { useAssistant } from '@/contexts/AssistantContext';
import ThryvBotMessage from '@/components/assistant/ThryvBotMessage';
import ThryvBotHistory from '@/components/assistant/ThryvBotHistory';

function TypingIndicator() {
  return (
    <div className="ml-11 flex items-center gap-2">
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-none border border-transparent bg-muted px-3 py-2">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:75ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
      </div>
      <span className="text-xs italic text-muted-foreground">ThryvBot is typing...</span>
    </div>
  );
}

export default function ThryvBotPanel({ userInitial = 'ME' }) {
  const {
    isOpen,
    close,
    messages,
    isLoading,
    error,
    sendMessage,
    setShowHistory,
    showHistory,
  } = useAssistant();

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const input = form.elements.namedItem('message');
    if (!(input instanceof HTMLInputElement)) return;
    const value = input.value.trim();
    if (!value) return;
    void sendMessage(value);
    input.value = '';
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex w-[min(100vw-3rem,420px)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
      <div className="relative flex h-[min(70vh,520px)] flex-col">
        <ThryvBotHistory />

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/80 px-5 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg ring-2 ring-card">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2a2 2 0 00-2 2c0 .74.4 1.39 1 1.73V7H8a2 2 0 00-2 2v1H5a2 2 0 00-2 2v2a2 2 0 002 2h1v1a2 2 0 002 2h2v1.27c-.6.34-1 .99-1 1.73a2 2 0 002 2 2 2 0 002-2c0-.74-.4-1.39-1-1.73V17h2a2 2 0 002-2v-1h1a2 2 0 002-2v-2a2 2 0 00-2-2h-1V9a2 2 0 00-2-2h-2V5.73c.6-.34 1-.99 1-1.73a2 2 0 00-2-2z" />
                </svg>
              </div>
              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-card shadow-sm" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">ThryvBot</h4>
              <span className="text-xs font-bold uppercase tracking-wider text-green-500">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Chat history"
            >
              <History className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-surface/40 p-5 dark:bg-background/40">
          {messages.length === 0 && !isLoading && (
            <p className="text-center text-sm text-muted-foreground">
              Ask about your tasks, calendar, or focus time.
            </p>
          )}
          {messages.map((msg) => (
            <ThryvBotMessage key={msg.id} message={msg} userInitial={userInitial} />
          ))}
          {isLoading && <TypingIndicator />}
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600 dark:bg-red-950/50 dark:text-red-300">{error}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border bg-card p-4">
          <div className="relative group/input">
            <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 blur transition-opacity group-hover/input:opacity-10" />
            <input
              name="message"
              disabled={isLoading}
              className="relative z-10 w-full rounded-full border border-border bg-muted py-3.5 pl-5 pr-14 text-sm text-foreground shadow-inner placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60"
              placeholder="Ask anything..."
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md transition-all hover:scale-110 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
