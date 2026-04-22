import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedAdminClient: SupabaseClient | null = null;

function requiredEnv(
  name: "SUPABASE_URL" | "SUPABASE_SERVICE_KEY" | "SUPABASE_ANON_KEY",
) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function getSupabaseAdminClient(): SupabaseClient {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  cachedAdminClient = createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );

  return cachedAdminClient;
}

// Service role client — bypasses RLS for server-side operations.
// Uses lazy init so missing env vars don't crash the function at cold start.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseAdminClient() as any;
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
}) as SupabaseClient;

// Creates a scoped client with user's JWT — respects RLS
export function supabaseForUser(jwt: string) {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_ANON_KEY"),
    {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
