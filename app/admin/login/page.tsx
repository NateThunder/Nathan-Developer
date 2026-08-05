import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/server/adminAuth";

export const metadata: Metadata = {
  title: "Admin login | Somevi Labs",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAdminAuthenticated()) redirect("/admin/analytics");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <section className="w-full max-w-md rounded-[22px] border-2 border-[var(--color-border)] bg-[var(--color-surface-alt)] p-7 shadow-[0_18px_38px_rgba(5,14,18,0.5)]">
        <p className="mono-label text-xs text-[var(--color-accent-warm)]">PRIVATE AREA</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">Admin login</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Enter the site administrator password.</p>
        <form action="/api/admin/login" method="post" className="mt-7 space-y-4">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              autoFocus
              className="mt-2 h-12 w-full rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
            />
          </label>
          {error ? <p role="alert" className="text-sm text-[#ffb19a]">Incorrect password.</p> : null}
          <button className="w-full rounded-full border-2 border-[#8a3f2f] bg-[var(--color-accent-warm)] px-5 py-3 font-semibold text-[#1d1b1a]">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
