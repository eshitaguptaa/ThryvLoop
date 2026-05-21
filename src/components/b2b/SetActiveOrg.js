'use client';

import { useAuth, useOrganizationList } from '@clerk/nextjs';
import { useEffect } from 'react';

/**
 * Sets the Clerk active organization when entering a workspace route.
 */
export default function SetActiveOrg({ organizationId }) {
  const { orgId } = useAuth();
  const { isLoaded, setActive } = useOrganizationList();

  useEffect(() => {
    if (!isLoaded || !organizationId || !setActive) return;
    if (orgId === organizationId) return;
    void setActive({ organization: organizationId });
  }, [isLoaded, organizationId, orgId, setActive]);

  return null;
}
