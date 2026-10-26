import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a browser-side Supabase client using @supabase/ssr.
 * Cookies are automatically synchronized with the browser's document.cookie.
 * Safe for client components ('use client').
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export default createClient;
