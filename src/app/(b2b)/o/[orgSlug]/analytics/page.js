import { redirect } from 'next/navigation';

/** Legacy route → Insights */
export default async function OrgAnalyticsRedirect({ params }) {
  const { orgSlug } = await params;
  redirect(`/o/${encodeURIComponent(orgSlug)}/insights`);
}
