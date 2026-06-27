'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import NavbarLanding from '@/components/landing_sections/NavbarLanding';
import FooterLanding from '@/components/landing_sections/FooterLanding';
import LandingAmbient from '@/components/landing/LandingAmbient';
import { ScrollReveal } from '@/components/landing_sections/ScrollReveal';
import {
  HELP_CATEGORIES,
  POPULAR_ARTICLE_IDS,
  getAllHelpArticles,
  searchHelpArticles,
} from '@/lib/helpCentreContent';

const cardClass =
  'relative overflow-hidden bg-card border border-border rounded-3xl transition-all duration-300';

function renderAnswer(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part.split('\n').map((line, j, arr) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < arr.length - 1 ? <br /> : null}
      </span>
    ));
  });
}

function CategoryIcon({ name, className = 'text-2xl' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

function FaqItem({ article, isOpen, onToggle, highlight }) {
  return (
    <article
      id={article.id}
      className={`scroll-mt-28 rounded-2xl border transition-all duration-300 ${
        isOpen
          ? 'border-[var(--primary)]/40 bg-[var(--primary)]/[0.04] shadow-md shadow-[var(--primary)]/5'
          : 'border-border bg-card/60 hover:border-[var(--primary)]/25 hover:bg-card'
      } ${highlight ? 'ring-2 ring-[var(--primary)]/30' : ''}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-foreground leading-snug pr-2">{article.question}</span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            isOpen
              ? 'bg-[var(--primary)] text-white rotate-45'
              : 'bg-[var(--light)] text-[var(--primary)]'
          }`}
        >
          <CategoryIcon name="add" className="text-xl" />
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border/60 px-5 pb-5 pt-4 text-[15px] leading-relaxed text-muted-foreground sm:px-6 sm:pb-6">
            {renderAnswer(article.answer)}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HelpCentrePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(HELP_CATEGORIES[0].id);
  const [openArticles, setOpenArticles] = useState(() => new Set());
  const [highlightId, setHighlightId] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('signin');
  const searchInputRef = useRef(null);
  const categoryNavRef = useRef(null);

  const isSearching = query.trim().length > 0;

  const filteredArticles = useMemo(() => searchHelpArticles(query), [query]);

  const articlesByCategory = useMemo(() => {
    if (!isSearching) return null;
    const map = new Map();
    for (const article of filteredArticles) {
      const list = map.get(article.categoryId) || [];
      list.push(article);
      map.set(article.categoryId, list);
    }
    return map;
  }, [filteredArticles, isSearching]);

  const resultCount = filteredArticles.length;

  const popularArticles = useMemo(() => {
    const all = getAllHelpArticles();
    return POPULAR_ARTICLE_IDS.map((id) => all.find((a) => a.id === id)).filter(Boolean);
  }, []);

  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'signin' || authParam === 'signup') {
      setInitialMode(authParam);
      setIsAuthOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    const article = getAllHelpArticles().find((a) => a.id === hash);
    if (!article) return;

    setActiveCategory(article.categoryId);
    setOpenArticles((prev) => new Set(prev).add(hash));
    setHighlightId(hash);

    const timer = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    const clearHighlight = window.setTimeout(() => setHighlightId(null), 2400);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearHighlight);
    };
  }, []);

  const openAuth = useCallback(
    (mode) => {
      setInitialMode(mode);
      setIsAuthOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.set('auth', mode);
      window.history.replaceState({}, '', url);
    },
    [],
  );

  const closeAuth = useCallback(() => {
    setIsAuthOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url);
  }, []);

  const toggleArticle = (id) => {
    setOpenArticles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    window.history.replaceState(null, '', `#${id}`);
  };

  const scrollToCategory = (categoryId) => {
    setActiveCategory(categoryId);
    if (isSearching) setQuery('');
    const el = document.getElementById(`category-${categoryId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const jumpToArticle = (article) => {
    setQuery('');
    setActiveCategory(article.categoryId);
    setOpenArticles((prev) => new Set(prev).add(article.id));
    setHighlightId(article.id);
    window.history.replaceState(null, '', `#${article.id}`);
    window.setTimeout(() => {
      document.getElementById(article.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    window.setTimeout(() => setHighlightId(null), 2400);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setQuery('');
      searchInputRef.current?.blur();
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <LandingAmbient />
      <NavbarLanding onSignInClick={() => openAuth('signin')} onGetStartedClick={() => openAuth('signup')} />

      <main className="relative z-10 pt-24 pb-8">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-border shadow-sm uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
              </span>
              Help Centre
            </div>
            <h1 className="mt-5 landing-display text-4xl sm:text-5xl lg:text-[3.25rem] text-foreground">
              How can we{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b4ded] to-[#3b82f6]">
                help you?
              </span>
            </h1>
            <p className="mt-5 landing-body text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Search our knowledge base for guides on focus, tasks, calendar, integrations, and
              everything else in ThryvLoop.
            </p>
          </ScrollReveal>

          {/* Search */}
          <ScrollReveal className="mt-10 max-w-2xl mx-auto">
            <div className={`${cardClass} p-2 shadow-lg shadow-[var(--primary)]/5`}>
              <div className="relative">
                <CategoryIcon
                  name="search"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground pointer-events-none"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search articles… e.g. calendar sync, focus timer, password"
                  className="w-full rounded-2xl border-0 bg-[var(--light)] py-4 pl-12 pr-12 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-[var(--primary)] focus:bg-card transition-all"
                  aria-label="Search help articles"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <CategoryIcon name="close" className="text-xl" />
                  </button>
                )}
              </div>
              {isSearching && (
                <p className="mt-3 px-2 text-sm text-muted-foreground text-left">
                  {resultCount === 0
                    ? 'No articles match your search.'
                    : `${resultCount} article${resultCount === 1 ? '' : 's'} found`}
                </p>
              )}
            </div>
          </ScrollReveal>

          {/* Popular links */}
          {!isSearching && (
            <ScrollReveal className="mt-8">
              <p className="text-sm font-medium text-muted-foreground mb-3">Popular topics</p>
              <div className="flex flex-wrap justify-center gap-2">
                {popularArticles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => jumpToArticle(article)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/5 hover:text-[var(--primary)]"
                  >
                    <CategoryIcon name={article.categoryIcon} className="text-lg text-[var(--primary)]" />
                    {article.question.replace(/\?$/, '')}
                  </button>
                ))}
              </div>
            </ScrollReveal>
          )}
        </section>

        {/* Content layout */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-14 lg:mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
            {/* Category sidebar */}
            {!isSearching && (
              <aside className="lg:sticky lg:top-24 lg:self-start">
                <nav
                  ref={categoryNavRef}
                  className={`${cardClass} p-3 lg:p-4`}
                  aria-label="Help categories"
                >
                  <p className="hidden lg:block px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Categories
                  </p>
                  <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 scrollbar-thin">
                    {HELP_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => scrollToCategory(cat.id)}
                        className={`flex shrink-0 lg:shrink items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all whitespace-nowrap lg:whitespace-normal ${
                          activeCategory === cat.id
                            ? 'bg-gradient-to-r from-[var(--primary)] to-[#6366f1] text-white shadow-md shadow-indigo-500/20'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <CategoryIcon
                          name={cat.icon}
                          className={`text-xl ${activeCategory === cat.id ? 'text-white' : 'text-[var(--primary)]'}`}
                        />
                        <span className="hidden sm:inline lg:inline">{cat.title}</span>
                        <span className="sm:hidden lg:hidden">{cat.title.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </nav>

                {/* Contact card */}
                <div className={`${cardClass} mt-4 p-5 hidden lg:block bg-gradient-to-br from-[var(--primary)]/10 via-card to-[#6366f1]/5`}>
                  <CategoryIcon name="mail" className="text-3xl text-[var(--primary)]" />
                  <h3 className="mt-3 font-bold text-foreground">Still need help?</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    Our team typically responds within one business day.
                  </p>
                  <a
                    href="mailto:support@thryvloop.com"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] hover:underline"
                  >
                    support@thryvloop.com
                    <CategoryIcon name="arrow_forward" className="text-lg" />
                  </a>
                </div>
              </aside>
            )}

            {/* Articles */}
            <div className="min-w-0 space-y-12">
              {isSearching ? (
                <section>
                  {resultCount === 0 ? (
                    <div className={`${cardClass} p-10 text-center`}>
                      <CategoryIcon name="search_off" className="text-5xl text-muted-foreground/50" />
                      <h2 className="mt-4 text-xl font-bold">No results found</h2>
                      <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                        Try different keywords like &quot;timer&quot;, &quot;google&quot;, or
                        &quot;tasks&quot;. Or browse categories below.
                      </p>
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                      >
                        Browse all articles
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {HELP_CATEGORIES.filter((cat) => articlesByCategory?.has(cat.id)).map((cat) => (
                        <div key={cat.id}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--light)] text-[var(--primary)]">
                              <CategoryIcon name={cat.icon} />
                            </div>
                            <h2 className="text-xl font-bold">{cat.title}</h2>
                          </div>
                          <div className="space-y-3">
                            {(articlesByCategory.get(cat.id) || []).map((article) => (
                              <FaqItem
                                key={article.id}
                                article={article}
                                isOpen={openArticles.has(article.id)}
                                onToggle={() => toggleArticle(article.id)}
                                highlight={highlightId === article.id}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                HELP_CATEGORIES.map((category) => (
                  <section
                    key={category.id}
                    id={`category-${category.id}`}
                    className="scroll-mt-28"
                    onMouseEnter={() => setActiveCategory(category.id)}
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)]/15 to-[#6366f1]/10 text-[var(--primary)] ring-1 ring-[var(--primary)]/10">
                        <CategoryIcon name={category.icon} className="text-3xl" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{category.title}</h2>
                        <p className="mt-1 text-muted-foreground">{category.description}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {category.articles.map((article) => (
                        <FaqItem
                          key={article.id}
                          article={article}
                          isOpen={openArticles.has(article.id)}
                          onToggle={() => toggleArticle(article.id)}
                          highlight={highlightId === article.id}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </div>

          {/* Mobile contact */}
          <div className={`${cardClass} mt-12 p-6 lg:hidden text-center bg-gradient-to-br from-[var(--primary)]/10 via-card to-[#6366f1]/5`}>
            <h3 className="text-lg font-bold">Still need help?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Email us and we&apos;ll get back to you within one business day.
            </p>
            <a
              href="mailto:support@thryvloop.com"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
            >
              <CategoryIcon name="mail" className="text-lg text-white" />
              Contact Support
            </a>
          </div>

          {/* Back to app CTA */}
          <ScrollReveal className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Ready to get back to work?</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => openAuth('signin')}
                className="inline-flex h-11 items-center px-6 rounded-xl font-semibold border-2 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="inline-flex h-11 items-center px-6 rounded-xl font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
              >
                Back to Homepage
              </button>
            </div>
          </ScrollReveal>
        </div>
      </main>

      <FooterLanding />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} initialMode={initialMode} />
    </div>
  );
}
