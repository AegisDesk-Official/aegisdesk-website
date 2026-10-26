import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Superuser Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * STRICT SERVER-ONLY: Never import or call from client components.
 * Bypasses Row Level Security (RLS) for idempotent webhook ingestion and administrative jobs.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("CRITICAL SECURITY ERROR: Supabase admin client invoked on the client side.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default createAdminClient;
