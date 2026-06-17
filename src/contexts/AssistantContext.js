'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { getUserStorageItem, setUserStorageItem, removeUserStorageItem } from '@/utils/userStorage';
import { parseApiJson } from '@/lib/assistant/clientApi';
import { getFriendlyAssistantReply, getNewChatWelcome } from '@/lib/assistant/fallbackReplies';

const AssistantContext = createContext(null);

const CONVERSATION_KEY = 'assistant-conversation-id';
const BRIEFING_DATE_KEY = 'assistant-briefing-date';

function todayKey() {
  return new Date().toDateString();
}

export function AssistantProvider({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const userId = user?.id || null;

  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationId, setConversationIdState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const briefingLoadedRef = useRef(false);
  const openInitRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    const saved = getUserStorageItem(userId, CONVERSATION_KEY, CONVERSATION_KEY);
    if (saved) setConversationIdState(saved);
  }, [userId]);

  useEffect(() => {
    if (!isOpen) {
      openInitRef.current = false;
    }
  }, [isOpen]);

  const setConversationId = useCallback(
    (id) => {
      setConversationIdState(id);
      if (!userId) return;
      if (id) {
        setUserStorageItem(userId, CONVERSATION_KEY, id);
      } else {
        removeUserStorageItem(userId, CONVERSATION_KEY);
      }
    },
    [userId]
  );

  const appendAssistantMessage = useCallback((content, metadata = {}) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content,
        metadata,
        created_at: new Date().toISOString(),
      },
    ]);
  }, []);

  const loadBriefingMessage = useCallback(async () => {
    try {
      const res = await fetch('/api/assistant/briefing');
      const json = await parseApiJson(res);
      if (!res.ok || !json.reply) return false;
      setMessages([
        {
          id: `briefing-${Date.now()}`,
          role: 'assistant',
          content: json.reply,
          metadata: json.metadata || {},
          created_at: new Date().toISOString(),
        },
      ]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setShowHistory(false);
  }, []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const loadConversations = useCallback(async () => {
    if (!isSignedIn) return [];
    try {
      const res = await fetch('/api/assistant/conversations');
      const json = await parseApiJson(res);
      if (!res.ok) return [];
      setConversations(json.conversations || []);
      return json.conversations || [];
    } catch {
      return [];
    }
  }, [isSignedIn]);

  const loadConversation = useCallback(
    async (id) => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/assistant/conversations/${id}`);
        const json = await parseApiJson(res);
        if (!res.ok) {
          setConversationId(null);
          setMessages([]);
          await loadBriefingMessage();
          return;
        }
        setConversationId(id);
        setMessages(json.messages || []);
        setShowHistory(false);
      } catch {
        setConversationId(null);
        setMessages([]);
        await loadBriefingMessage();
      } finally {
        setIsLoading(false);
      }
    },
    [loadBriefingMessage, setConversationId]
  );

  const startNewConversation = useCallback(async () => {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    setIsLoading(true);
    try {
      const gotBriefing = await loadBriefingMessage();
      if (!gotBriefing) {
        setMessages([
          {
            id: `welcome-${Date.now()}`,
            role: 'assistant',
            content: getNewChatWelcome(),
            metadata: {},
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadBriefingMessage, setConversationId]);

  const fetchBriefing = useCallback(async () => {
    if (!isSignedIn || briefingLoadedRef.current) return;
    const lastBriefing = userId ? getUserStorageItem(userId, BRIEFING_DATE_KEY, BRIEFING_DATE_KEY) : null;
    if (lastBriefing === todayKey()) return;

    try {
      const res = await fetch('/api/assistant/briefing');
      const json = await parseApiJson(res);
      if (!res.ok) return;

      briefingLoadedRef.current = true;
      if (userId) setUserStorageItem(userId, BRIEFING_DATE_KEY, todayKey());

      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            id: `briefing-${Date.now()}`,
            role: 'assistant',
            content: json.reply,
            metadata: json.metadata || {},
            created_at: new Date().toISOString(),
          },
        ];
      });
    } catch {
      // non-fatal
    }
  }, [isSignedIn, userId]);

  useEffect(() => {
    if (!isOpen || !isSignedIn || openInitRef.current) return;
    openInitRef.current = true;

    const init = async () => {
      if (conversationId) {
        await loadConversation(conversationId);
      } else {
        await fetchBriefing();
      }
    };

    void init();
  }, [isOpen, isSignedIn, conversationId, loadConversation, fetchBriefing]);

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg = {
        id: `local-user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        metadata: {},
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const res = await fetch('/api/assistant/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            conversationId,
          }),
        });
        const json = await parseApiJson(res);

        if (!res.ok) {
          appendAssistantMessage(getFriendlyAssistantReply({ status: res.status }), {
            isFallback: true,
          });
          return;
        }

        if (json.conversationId && json.conversationId !== conversationId) {
          setConversationId(json.conversationId);
        }

        if (json.message) {
          setMessages((prev) => [...prev, json.message]);
        } else if (json.reply) {
          appendAssistantMessage(json.reply, json.metadata || {});
        }
      } catch {
        appendAssistantMessage(getFriendlyAssistantReply(), { isFallback: true });
      } finally {
        setIsLoading(false);
      }
    },
    [appendAssistantMessage, conversationId, isLoading, setConversationId]
  );

  const value = useMemo(
    () => ({
      isOpen,
      showHistory,
      setShowHistory,
      conversationId,
      messages,
      conversations,
      isLoading,
      open,
      close,
      toggle,
      sendMessage,
      loadConversation,
      loadConversations,
      startNewConversation,
    }),
    [
      isOpen,
      showHistory,
      conversationId,
      messages,
      conversations,
      isLoading,
      open,
      close,
      toggle,
      sendMessage,
      loadConversation,
      loadConversations,
      startNewConversation,
    ]
  );

  if (!isLoaded) return children;

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error('useAssistant must be used within AssistantProvider');
  }
  return ctx;
}

/** Safe hook when provider may be absent */
export function useAssistantOptional() {
  return useContext(AssistantContext);
}
