import OrgAreaShell from '@/app/(b2b)/o/OrgAreaShell';

export const dynamic = 'force-dynamic';

export default function OrgAreaLayout({ children }) {
  return <OrgAreaShell>{children}</OrgAreaShell>;
}
