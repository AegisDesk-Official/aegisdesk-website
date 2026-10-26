import { createClient } from "@/lib/db/server";
import { User } from "@supabase/supabase-js";

export type UserRole = "owner" | "client_admin" | "client_agent" | "client_viewer";

export interface MembershipRecord {
  id: string;
  org_id: string;
  user_id: string;
  role: UserRole;
  organizations?: {
    id: string;
    name: string;
    slug: string;
    status: string;
    confidence_threshold: number;
    is_demo: boolean;
  };
}

/**
 * Retrieves the currently authenticated Supabase user from request cookies.
 * Server-only execution.
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Requires an authenticated user session. Throws if unauthenticated.
 */
export async function requireServerUser(): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Active session required.");
  }
  return user;
}

/**
 * Retrieves all organization memberships for a user from the database.
 * Never trusts client headers or client claims.
 */
export async function getUserMemberships(userId: string): Promise<MembershipRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select(`
      id,
      org_id,
      user_id,
      role,
      organizations (
        id,
        name,
        slug,
        status,
        confidence_threshold,
        is_demo
      )
    `)
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data as unknown as MembershipRecord[];
}

/**
 * Verifies that the authenticated user possesses an authorized role in target_org_id.
 * Validates strictly in Postgres. Never trusts browser-sent parameters.
 */
export async function requireRole(
  targetOrgId: string,
  allowedRoles: UserRole[] = ["owner", "client_admin"]
): Promise<{ user: User; membership: MembershipRecord }> {
  const user = await requireServerUser();
  const memberships = await getUserMemberships(user.id);

  const matched = memberships.find(
    (m) => (m.org_id === targetOrgId || m.role === "owner") && allowedRoles.includes(m.role)
  );

  if (!matched) {
    throw new Error(`FORBIDDEN: Insufficient permissions for organization ${targetOrgId}.`);
  }

  return { user, membership: matched };
}

/**
 * Checks if a user has the platform 'owner' role in any membership.
 */
export async function isOwnerUser(userId: string): Promise<boolean> {
  const memberships = await getUserMemberships(userId);
  return memberships.some((m) => m.role === "owner");
}
