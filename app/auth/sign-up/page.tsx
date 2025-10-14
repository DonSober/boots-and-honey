import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/sign-up-form";

export default async function Page() {
  const h = await headers();
  const host = h.get("host") || "";
  if (host.startsWith("admin.")) {
    redirect("/auth/login");
  }
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  );
}
