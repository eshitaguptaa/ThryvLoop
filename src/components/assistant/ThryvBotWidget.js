'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bot } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useAssistant } from '@/contexts/AssistantContext';
import ThryvBotPanel from '@/components/assistant/ThryvBotPanel';

function isImmersiveFocusRoute(pathname) {
  return pathname?.startsWith('/focus') || pathname?.startsWith('/meet');
}

export default function ThryvBotWidget() {
  const pathname = usePathname();
  const { user } = useUser();
  const { isOpen, toggle, close } = useAssistant();

  const hidden = isImmersiveFocusRoute(pathname);

  useEffect(() => {
    if (hidden && isOpen) close();
  }, [hidden, isOpen, close]);

  if (hidden) return null;

  const userInitial =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.username?.charAt(0)?.toUpperCase() ||
    'ME';

  return (
    <>
      <ThryvBotPanel userInitial={userInitial} />

      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? 'Close ThryvBot' : 'Open ThryvBot'}
        aria-expanded={isOpen}
        className={`fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 lg:bottom-6 lg:right-6 ${
          isOpen ? 'ring-2 ring-white/50' : ''
        }`}
      >
        <Bot className="h-6 w-6" />
        {!isOpen && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
        )}
      </button>
    </>
  );
}
