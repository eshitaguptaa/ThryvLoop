import Link from 'next/link';

/**
 * Signup / waitlist consent copy — links to Terms and Privacy Policy.
 */
export default function LegalAuthConsent({ className = '', variant = 'signup' }) {
  const signupText = (
    <>
      By creating an account, you agree to our{' '}
      <Link href="/terms" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
        Terms of Service
      </Link>{' '}
      and{' '}
      <Link href="/privacy" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
        Privacy Policy
      </Link>
      .
    </>
  );

  const waitlistText = (
    <>
      We&apos;ll email you about Company Hubs per our{' '}
      <Link href="/privacy" className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
        Privacy Policy
      </Link>
      . You can unsubscribe anytime.
    </>
  );

  return (
    <p className={`text-xs text-center text-muted-foreground leading-relaxed ${className}`}>
      {variant === 'waitlist' ? waitlistText : signupText}
    </p>
  );
}
