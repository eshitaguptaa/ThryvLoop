import Link from 'next/link';

export function LegalIcon({ name, className = 'text-2xl' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

function stripRedundantBold(text, label) {
  if (!label) return text;
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`^\\s*\\*\\*${escaped}\\*\\*`), '');
}

function renderBold(text, keyPrefix) {
  if (!text) return [];
  return text.split(/(\*\*[^*]+\*\*)/g).flatMap((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part ? [part] : [];
  });
}

export function renderInline(text, keyPrefix = 'inline') {
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let segment = 0;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderBold(text.slice(lastIndex, match.index), `${keyPrefix}-seg-${segment++}`));
    }
    const href = match[2];
    const isInternal = href.startsWith('/');
    parts.push(
      isInternal ? (
        <Link
          key={`${keyPrefix}-link-${match.index}`}
          href={href}
          className="font-medium text-[var(--primary)] underline underline-offset-2 hover:opacity-80"
        >
          {match[1]}
        </Link>
      ) : (
        <a
          key={`${keyPrefix}-link-${match.index}`}
          href={href}
          className="font-medium text-[var(--primary)] underline underline-offset-2 hover:opacity-80"
          target="_blank"
          rel="noopener noreferrer"
        >
          {match[1]}
        </a>
      ),
    );
    lastIndex = match.index + match[0].length;
    const remainder = text.slice(lastIndex);
    const deduped = stripRedundantBold(remainder, match[1]);
    if (deduped.length !== remainder.length) {
      lastIndex += remainder.length - deduped.length;
    }
  }

  if (lastIndex < text.length) {
    parts.push(...renderBold(text.slice(lastIndex), `${keyPrefix}-seg-${segment++}`));
  }

  return parts.length ? parts : renderBold(text, `${keyPrefix}-plain`);
}

export function LegalBlock({ block, blockKey }) {
  if (block.type === 'h3') {
    return (
      <h3 className="mt-6 mb-2 text-lg font-bold text-foreground first:mt-0">
        {renderInline(block.text, `${blockKey}-h3`)}
      </h3>
    );
  }
  if (block.type === 'ul') {
    return (
      <ul className="mt-3 space-y-2.5 list-none pl-0">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" aria-hidden />
            <span>{renderInline(item, `${blockKey}-li-${i}`)}</span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground first:mt-0">
      {renderInline(block.text, `${blockKey}-p`)}
    </p>
  );
}

export const legalCardClass =
  'relative overflow-hidden bg-card border border-border rounded-3xl transition-all duration-300';
