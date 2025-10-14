import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

// Admin allowlist via env var. Configure a comma-separated list of emails.
function isAllowedAdmin(email: string | undefined | null): boolean {
  const list = process.env.ADMIN_EMAILS || "";
  const allowed = list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!email) return false;
  return allowed.includes(email.toLowerCase());
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not signed in: send to login on this domain
    redirect("/auth/login");
  }

  if (!isAllowedAdmin(user.email)) {
    redirect("/forbidden");
  }

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
