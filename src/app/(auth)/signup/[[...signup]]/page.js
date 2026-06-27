'use client';

import { SignUp } from '@clerk/nextjs';
import AuthPageShell, { useClerkAppearance } from '@/components/auth/AuthPageShell';
import LegalAuthConsent from '@/components/legal/LegalAuthConsent';

export default function SignUpPage() {
  const appearance = useClerkAppearance();

  return (
    <AuthPageShell>
      <div className="flex flex-col items-center gap-4 w-full max-w-md px-4">
        <SignUp
          fallbackRedirectUrl="/home"
          signInUrl="/?auth=signin"
          appearance={appearance}
        />
        <LegalAuthConsent className="px-2" />
      </div>
    </AuthPageShell>
  );
}
