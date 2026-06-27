import Link from 'next/link';
import { ScrollReveal } from '@/components/landing_sections/ScrollReveal';
import { PRIVACY_META } from '@/lib/privacyPolicyContent';

const FOOTER_LINKS = [
  { href: '/help', label: 'Help Centre' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/billing', label: 'Billing & Refunds' },
  { href: '/dpa', label: 'DPA (Teams)' },
];

export default function FooterLanding() {
  return (
    <ScrollReveal
      as="footer"
      variant="fadeUpSoft"
      className="w-full bg-[var(--footer)] text-white py-12 px-8"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent no-underline"
          >
            ThryvLoop
          </Link>
          <p className="mt-3 text-white/60 leading-relaxed text-sm">
            One unified workspace for focus, tasks, calendar, and analytics — built for measurable
            productivity.
          </p>
        </div>

        <nav aria-label="Footer">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white/80 mb-3">
            Legal &amp; support
          </h4>
          <ul className="list-none space-y-2">
            {FOOTER_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-white/60 no-underline text-sm transition-colors hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${PRIVACY_META.supportEmail}`}
                className="text-white/60 no-underline text-sm transition-colors hover:text-white"
              >
                {PRIVACY_META.supportEmail}
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="max-w-[1200px] mx-auto mt-10 pt-6 border-t border-white/10 text-center text-white/50 text-sm">
        <p>© {new Date().getFullYear()} ThryvLoop. All rights reserved.</p>
      </div>
    </ScrollReveal>
  );
}
