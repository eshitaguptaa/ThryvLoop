'use client';

import { useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useAssistant } from '@/contexts/AssistantContext';

export default function ThryvBotHistory() {
  const {
    showHistory,
    setShowHistory,
    conversations,
    loadConversations,
    loadConversation,
    startNewConversation,
    isLoading,
  } = useAssistant();

  useEffect(() => {
    if (showHistory) void loadConversations();
  }, [showHistory, loadConversations]);

  if (!showHistory) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-card/95 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h5 className="text-sm font-bold text-foreground">Chat history</h5>
        <button
          type="button"
          onClick={() => setShowHistory(false)}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close history"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <button
          type="button"
          onClick={() => void startNewConversation()}
          disabled={isLoading}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
        {conversations.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No past conversations yet.</p>
        ) : (
          <ul className="space-y-1">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => void loadConversation(c.id)}
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted"
                >
                  <span className="line-clamp-1 font-medium">{c.title || 'New chat'}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.updated_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
