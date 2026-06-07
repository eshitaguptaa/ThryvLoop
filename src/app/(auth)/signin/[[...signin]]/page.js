'use client';

import { SignIn } from '@clerk/nextjs';
import AuthPageShell, { useClerkAppearance } from '@/components/auth/AuthPageShell';

export default function SignInPage() {
  const appearance = useClerkAppearance();

  return (
    <AuthPageShell>
      <SignIn
        fallbackRedirectUrl="/home"
        signUpUrl="/signup"
        appearance={appearance}
      />
    </AuthPageShell>
  );
}
