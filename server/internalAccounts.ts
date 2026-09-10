// Accounts that belong to Lucas himself (admin access + feature testing),
// not real users. Per claude/comped-beta-access-2026-09.md these are
// explicitly "not users" — so they're excluded anywhere we report on user
// behavior: engagement analytics (login time, audio listens), the CSV
// exports handed to investors, and newsletter sends.
//
// Two ways an account lands here, unioned:
//   1. Listed explicitly by email below (covers every address Lucas is
//      known to have registered with, admin-flagged or not).
//   2. The `isAdmin` flag on the user record — so a future test account he
//      flags admin is excluded automatically without a code change here.
//
// If Lucas ever creates a new testing account that ISN'T admin-flagged,
// add its email to the set below.
export const INTERNAL_EMAILS = new Set([
  "lucas@acqlerate.com",
  "lucas.l.cruz.es@gmail.com",
  "lucas.l.cruz.pr@gmail.com",
  "jumpmasterguy@gmail.com",
]);

export function isInternalAccount(u: { email?: string | null; isAdmin?: boolean | null }): boolean {
  if (u.isAdmin) return true;
  const email = (u.email ?? "").toLowerCase();
  return INTERNAL_EMAILS.has(email);
}

/** Filters a user list down to real users — drops Lucas's own accounts. */
export function excludeInternalAccounts<T extends { email?: string | null; isAdmin?: boolean | null }>(
  users: T[],
): T[] {
  return users.filter(u => !isInternalAccount(u));
}
