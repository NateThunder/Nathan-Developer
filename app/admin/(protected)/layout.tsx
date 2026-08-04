import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/server/adminAuth";

export const metadata: Metadata = {
  title: "Admin | Somevi Labs",
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-band)]">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/admin/analytics" className="font-semibold">Somevi Admin</Link>
          <form action="/api/admin/logout" method="post">
            <button className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]">
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
