import { redirect } from 'next/navigation';

/** Legacy route → People */
export default async function OrgMembersRedirect({ params }) {
  const { orgSlug } = await params;
  redirect(`/o/${encodeURIComponent(orgSlug)}/people`);
}
