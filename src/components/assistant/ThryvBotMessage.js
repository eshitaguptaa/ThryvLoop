'use client';

function formatEventTime(startsAt, endsAt) {
  if (!startsAt) return '';
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const timeOpts = { hour: 'numeric', minute: '2-digit' };
  const startStr = start.toLocaleTimeString([], timeOpts);
  if (!end || Number.isNaN(end.getTime())) return startStr;
  return `${startStr} - ${end.toLocaleTimeString([], timeOpts)}`;
}

function RichCard({ card }) {
  if (!card) return null;

  if (card.type === 'event') {
    return (
      <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <span className="text-xs font-semibold text-foreground">{card.title}</span>
        </div>
        <div className="text-[10px] text-muted-foreground">{formatEventTime(card.startsAt, card.endsAt)}</div>
      </div>
    );
  }

  if (card.type === 'task') {
    return (
      <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          <span className="text-xs font-semibold text-foreground">{card.title}</span>
        </div>
        {card.priority && (
          <div className="text-[10px] text-muted-foreground">{card.priority}</div>
        )}
      </div>
    );
  }

  return null;
}

function renderContentWithBold(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={i} className="rounded bg-indigo-50 px-1 py-0.5 font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

export default function ThryvBotMessage({ message, userInitial = 'ME' }) {
  const isUser = message.role === 'user';
  const cards = message.metadata?.cards || [];

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-gradient-to-br from-indigo-600 to-purple-700 p-4 text-sm text-white shadow-lg shadow-indigo-500/20">
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-bold text-muted-foreground">
          {userInitial}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-[10px] font-bold text-white shadow-md">
        AI
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-transparent bg-muted p-4 text-sm text-foreground shadow-sm">
        <p className="leading-relaxed whitespace-pre-wrap">{renderContentWithBold(message.content)}</p>
        {cards.map((card, i) => (
          <RichCard key={`${card.type}-${card.id || i}`} card={card} />
        ))}
      </div>
    </div>
  );
}
