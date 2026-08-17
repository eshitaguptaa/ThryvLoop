import { redirect } from 'next/navigation';

/** Legacy route → Work board */
export default async function OrgTasksRedirect({ params }) {
  const { orgSlug } = await params;
  redirect(`/o/${encodeURIComponent(orgSlug)}/work`);
}
