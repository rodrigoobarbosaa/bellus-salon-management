import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/supabase";

/**
 * Supabase client com service_role key.
 * Bypassa RLS — usar APENAS em server actions para operações admin.
 */
export function createServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[ServiceClient] WARNING: SUPABASE_SERVICE_ROLE_KEY is empty — RLS bypass will NOT work. Cron jobs and admin operations may fail.");
  }
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
