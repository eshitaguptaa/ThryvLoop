'use client';

import { SignUp } from '@clerk/nextjs';
import AuthPageShell, { useClerkAppearance } from '@/components/auth/AuthPageShell';

export default function SignUpPage() {
  const appearance = useClerkAppearance();

  return (
    <AuthPageShell>
      <SignUp
        fallbackRedirectUrl="/home"
        signInUrl="/?auth=signin"
        appearance={appearance}
      />
    </AuthPageShell>
  );
}
