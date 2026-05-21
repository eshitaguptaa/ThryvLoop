/**
 * Clerk membership resources cannot be passed to Client Components (class instances, Dates, etc.).
 * Map them to plain JSON-serializable rows.
 * @param {Array<Record<string, unknown>>} members
 */
export function plainOrgMembersForClient(members) {
  return (members ?? []).map((m) => {
    const pud = m.publicUserData ?? {};
    return {
      id: String(m.id),
      role: String(m.role ?? ''),
      publicUserData: {
        userId: pud.userId != null ? String(pud.userId) : pud.user_id != null ? String(pud.user_id) : null,
        firstName: pud.firstName != null ? String(pud.firstName) : null,
        lastName: pud.lastName != null ? String(pud.lastName) : null,
        identifier: pud.identifier != null ? String(pud.identifier) : null,
        emailAddress: pud.emailAddress != null ? String(pud.emailAddress) : null,
      },
    };
  });
}
