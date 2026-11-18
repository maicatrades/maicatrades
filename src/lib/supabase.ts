import { createClient } from "@supabase/supabase-js";
import { createPreviewProtectedFetch } from "./read-only-preview";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL in .env.local",
  );
}

if (!supabaseSecretKey) {
  throw new Error(
    "Missing SUPABASE_SECRET_KEY in .env.local",
  );
}

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    global: {
      fetch: createPreviewProtectedFetch((input, init) => fetch(input, init), supabaseUrl),
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);