import ProtectedShell from '@/app/(b2c)/(protected)/ProtectedShell';

export const dynamic = 'force-dynamic';

export default function ProtectedLayout({ children }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
