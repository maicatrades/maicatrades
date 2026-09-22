"use client";

import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProLogoutButton() {
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
      aria-label="Sign out of Private Pro"
    >
      <LogOut size={15} />
      <span className="hidden md:inline">Sign out</span>
    </button>
  );
}
