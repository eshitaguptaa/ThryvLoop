'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import NavbarLanding from '@/components/landing_sections/NavbarLanding';
import FooterLanding from '@/components/landing_sections/FooterLanding';
import LandingAmbient from '@/components/landing/LandingAmbient';
import { ScrollReveal } from '@/components/landing_sections/ScrollReveal';
import { LegalBlock, LegalIcon, legalCardClass } from '@/components/legal/legalDocumentRender';

/**
 * @param {object} props
 * @param {object} props.meta - { lastUpdated, effectiveDate, contactEmail, ... }
 * @param {Array} props.highlights
 * @param {Array} props.sections
 * @param {string} props.badgeIcon - Material icon name for hero badge
 * @param {string} props.badgeLabel
 * @param {string} props.titleBefore - H1 text before gradient span
 * @param {string} props.titleGradient - Gradient span text
 * @param {string} props.subtitle
 * @param {string} props.footerTitle
 * @param {string} props.footerBody - plain text; contactEmail appended via mailto if provided
 * @param {Array<{ label: string, href: string, primary?: boolean }>} props.footerActions
 * @param {object} [props.sidebar]
 * @param {string} props.sidebar.helpText
 * @param {Array<{ label: string, href: string }>} props.sidebar.links
 */
export default function LegalDocumentPage({
  meta,
  highlights,
  sections,
  badgeIcon,
  badgeLabel,
  titleBefore,
  titleGradient,
  subtitle,
  footerTitle,
  footerBody,
  footerActions,
  sidebar,
}) {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [initialMode, setInitialMode] = useState('signin');
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef(null);

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
    const exists = sections.some((s) => s.id === hash);
    if (!exists) return;
    setActiveSection(hash);
    window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [sections]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;
      setReadProgress(scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0);

      const offset = 120;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.getBoundingClientRect().top <= offset) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [sections]);

  const openAuth = useCallback((mode) => {
    setInitialMode(mode);
    setIsAuthOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.set('auth', mode);
    window.history.replaceState({}, '', url);
  }, []);

  const closeAuth = useCallback(() => {
    setIsAuthOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    window.history.replaceState({}, '', url);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    window.history.replaceState(null, '', `#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="fixed top-16 left-0 right-0 z-[999] h-0.5 bg-border" aria-hidden>
        <div
          className="h-full bg-gradient-to-r from-[var(--primary)] to-[#6366f1] transition-[width] duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <LandingAmbient />
      <NavbarLanding onSignInClick={() => openAuth('signin')} onGetStartedClick={() => openAuth('signup')} />

      <main className="relative z-10 pt-24 pb-8" ref={contentRef}>
        <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 rounded-full bg-card/70 px-4 py-1.5 text-xs font-semibold text-[var(--primary)] ring-1 ring-inset ring-border shadow-sm uppercase">
              <LegalIcon name={badgeIcon} className="text-lg" />
              {badgeLabel}
            </div>
            <h1 className="mt-5 landing-display text-4xl sm:text-5xl lg:text-[3.25rem] text-foreground">
              {titleBefore}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b4ded] to-[#3b82f6]">
                {titleGradient}
              </span>
            </h1>
            <p className="mt-5 landing-body text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                <LegalIcon name="calendar_today" className="text-base" />
                Last updated:{' '}
                <strong className="text-foreground font-medium">{meta.lastUpdated}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                <LegalIcon name="event" className="text-base" />
                Effective: <strong className="text-foreground font-medium">{meta.effectiveDate}</strong>
              </span>
            </div>
          </ScrollReveal>
        </section>

        {highlights?.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-12">
            <ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className={`${legalCardClass} p-5 hover:border-[var(--primary)]/30 hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--light)] text-[var(--primary)]">
                      <LegalIcon name={item.icon} />
                    </div>
                    <h2 className="mt-4 font-bold text-foreground text-base">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </section>
        )}

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-14 lg:mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <nav className={`${legalCardClass} p-4`} aria-label="Table of contents">
                <p className="px-2 mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  On this page
                </p>
                <ol className="list-none m-0 p-0 space-y-0.5 max-h-[min(70vh,520px)] overflow-y-auto">
                  {sections.map((section) => (
                    <li key={section.id}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition-all ${
                          activeSection === section.id
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>

              {sidebar && (
                <div
                  className={`${legalCardClass} mt-4 p-5 hidden lg:block border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary)]/8 to-transparent`}
                >
                  <LegalIcon name="help" className="text-2xl text-[var(--primary)]" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Questions?</p>
                  <p className="mt-1 text-sm text-muted-foreground">{sidebar.helpText}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    {sidebar.links.map((link) =>
                      link.href.startsWith('mailto:') ? (
                        <a
                          key={link.href}
                          href={link.href}
                          className="text-sm font-semibold text-[var(--primary)] hover:underline"
                        >
                          {link.label} →
                        </a>
                      ) : (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="text-sm font-semibold text-[var(--primary)] hover:underline"
                        >
                          {link.label} →
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              )}
            </aside>

            <div className="min-w-0 space-y-8">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className={`${legalCardClass} scroll-mt-28 p-6 sm:p-8`}>
                  <div className="flex items-start gap-4 mb-2">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)]/15 to-[#6366f1]/10 text-[var(--primary)]">
                      <LegalIcon name={section.icon} className="text-2xl" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground pt-1.5">
                      {section.title}
                    </h2>
                  </div>
                  <div className="mt-2 pl-0 sm:pl-16">
                    {section.blocks.map((block, i) => (
                      <LegalBlock key={i} block={block} blockKey={`${section.id}-${i}`} />
                    ))}
                  </div>
                </section>
              ))}

              <div className={`${legalCardClass} p-6 sm:p-8 text-center bg-muted/30`}>
                <LegalIcon name="verified" className="text-4xl text-[var(--primary)]" />
                <p className="mt-4 text-lg font-semibold text-foreground">{footerTitle}</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">{footerBody}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {footerActions.map((action) =>
                    action.href.startsWith('mailto:') ? (
                      <a
                        key={action.href}
                        href={action.href}
                        className={
                          action.primary
                            ? 'inline-flex h-10 items-center px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all'
                            : 'inline-flex h-10 items-center px-5 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted transition-colors'
                        }
                      >
                        {action.label}
                      </a>
                    ) : (
                      <Link
                        key={action.href}
                        href={action.href}
                        className={
                          action.primary
                            ? 'inline-flex h-10 items-center px-5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/20 transition-all'
                            : 'inline-flex h-10 items-center px-5 rounded-xl text-sm font-semibold border border-border bg-card hover:bg-muted transition-colors'
                        }
                      >
                        {action.label}
                      </Link>
                    ),
                  )}
                </div>
                {meta.counselNotice ? (
                  <p className="mt-6 text-xs text-muted-foreground max-w-2xl mx-auto leading-relaxed border-t border-border pt-6">
                    {meta.counselNotice}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterLanding />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} initialMode={initialMode} />
    </div>
  );
}
