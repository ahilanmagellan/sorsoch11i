import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only server-side client (anon key). Safe for fetching public data
 * in Server Components / Route Handlers.
 */
export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
