import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
}

// Service role client — bypasses RLS for server-side operations
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Creates a scoped client with user's JWT — respects RLS
export function supabaseForUser(jwt: string) {
  return createClient(url!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
