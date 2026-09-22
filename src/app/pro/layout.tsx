import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Private Pro | MaicaTrades",
  description: "Private MaicaTrades market research dashboard.",
  robots: { index: false, follow: false },
};

export default async function ProLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/pro");

  return children;
}
