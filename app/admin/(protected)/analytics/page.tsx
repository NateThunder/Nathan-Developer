import type { Metadata } from "next";
import { getAnalyticsReport, type AnalyticsReport } from "@/lib/server/googleAnalytics";

export const metadata: Metadata = { title: "Analytics | Somevi Admin" };
export const dynamic = "force-dynamic";

type RangeKey = "7" | "30" | "90" | "365" | "custom";
type Query = { range?: string; start?: string; end?: string };

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || isoDate(date) !== value ? null : date;
}

function resolveRange(query: Query) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const requested = (["7", "30", "90", "365", "custom"] as RangeKey[]).includes(query.range as RangeKey)
    ? (query.range as RangeKey)
    : "30";

  if (requested === "custom") {
    const start = parseDate(query.start);
    const end = parseDate(query.end);
    if (start && end && start <= end && end <= today && end.getTime() - start.getTime() <= 730 * 86_400_000) {
      return { key: requested, startDate: isoDate(start), endDate: isoDate(end), invalid: false };
    }
  }

  const days = requested === "custom" ? 30 : Number(requested);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return {
    key: requested,
    startDate: isoDate(start),
    endDate: isoDate(today),
    invalid: requested === "custom",
  };
}

function number(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

function duration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

function prettyDate(value: string) {
  if (!/^\d{8}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
    new Date(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}T00:00:00Z`)
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
      <p className="text-sm text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      {note ? <p className="mt-1 text-xs text-[var(--color-muted)]">{note}</p> : null}
    </article>
  );
}

function RankingTable({
  title,
  rows,
  metricLabel,
}: {
  title: string;
  rows: AnalyticsReport["pages"];
  metricLabel: string;
}) {
  const max = Math.max(...rows.map((row) => row.metrics[0] ?? 0), 1);
  return (
    <section className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
      <h2 className="border-b border-[var(--color-border)] px-5 py-4 text-lg font-semibold">{title}</h2>
      {rows.length ? (
        <div className="divide-y divide-[var(--color-border)]">
          {rows.map((row, index) => (
            <div key={`${row.dimensions[0]}-${index}`} className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-5 py-3 text-sm">
              <div
                className="absolute inset-y-1 left-0 bg-[var(--color-accent-warm)]/10"
                style={{ width: `${((row.metrics[0] ?? 0) / max) * 100}%` }}
              />
              <span className="relative truncate" title={row.dimensions[0]}>{row.dimensions[0] || "(not set)"}</span>
              <span className="relative font-semibold">{number(row.metrics[0] ?? 0)} <span className="font-normal text-[var(--color-muted)]">{metricLabel}</span></span>
            </div>
          ))}
        </div>
      ) : <p className="p-5 text-sm text-[var(--color-muted)]">No data in this period.</p>}
    </section>
  );
}

function TrendChart({ rows }: { rows: AnalyticsReport["trend"] }) {
  const max = Math.max(...rows.map((row) => row.metrics[2] ?? 0), 1);
  return (
    <section className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold">Page-view trend</h2>
        <span className="text-xs text-[var(--color-muted)]">Daily</span>
      </div>
      {rows.length ? (
        <div className="mt-6 overflow-x-auto pb-2">
          <div className="flex h-52 min-w-[680px] items-end gap-1" role="img" aria-label="Daily page views">
            {rows.map((row) => {
              const views = row.metrics[2] ?? 0;
              return (
                <div key={row.dimensions[0]} className="group flex h-full min-w-1 flex-1 items-end" title={`${prettyDate(row.dimensions[0] ?? "")}: ${number(views)} views`}>
                  <div className="w-full min-w-1 rounded-t-sm bg-[var(--color-accent-warm)] transition group-hover:brightness-125" style={{ height: `${Math.max((views / max) * 100, views ? 3 : 0)}%` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-xs text-[var(--color-muted)]">
            <span>{prettyDate(rows[0]?.dimensions[0] ?? "")}</span>
            <span>{prettyDate(rows.at(-1)?.dimensions[0] ?? "")}</span>
          </div>
        </div>
      ) : <p className="mt-5 text-sm text-[var(--color-muted)]">No trend data in this period.</p>}
    </section>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const range = resolveRange(query);
  let report: AnalyticsReport | null = null;
  let error = "";
  try {
    report = await getAnalyticsReport({ startDate: range.startDate, endDate: range.endDate });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Analytics data is currently unavailable.";
  }

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mono-label text-xs text-[var(--color-accent-warm)]">GA4 PROPERTY {process.env.GA_PROPERTY_ID}</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Analytics overview</h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{range.startDate} to {range.endDate}</p>
        </div>
        <form method="get" className="flex flex-wrap items-end gap-3 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
          <label className="text-xs text-[var(--color-muted)]">Range
            <select name="range" defaultValue={range.key} className="mt-1 block h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)]">
              <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option><option value="custom">Custom</option>
            </select>
          </label>
          <label className="text-xs text-[var(--color-muted)]">Start
            <input type="date" name="start" defaultValue={query.start ?? range.startDate} className="mt-1 block h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)]" />
          </label>
          <label className="text-xs text-[var(--color-muted)]">End
            <input type="date" name="end" defaultValue={query.end ?? range.endDate} className="mt-1 block h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)]" />
          </label>
          <button className="h-10 rounded-full bg-[var(--color-accent-warm)] px-5 text-sm font-semibold text-[#1d1b1a]">Apply</button>
        </form>
      </div>

      {range.invalid ? <p className="mt-4 rounded-xl border border-[#8a3f2f] bg-[#8a3f2f]/15 p-3 text-sm text-[#ffb19a]">Invalid custom range. Showing the last 30 days; custom ranges can cover up to two years and cannot end in the future.</p> : null}
      {error ? (
        <section className="mt-8 rounded-[18px] border border-[#8a3f2f] bg-[#8a3f2f]/15 p-6">
          <h2 className="font-semibold text-[#ffb19a]">Analytics connection required</h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{error}</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Add the configured Google service-account email as a Viewer in GA4 Property Access Management, then reload this page.</p>
        </section>
      ) : null}

      {report ? (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Active users" value={number(report.summary.users)} />
            <MetricCard label="Sessions" value={number(report.summary.sessions)} />
            <MetricCard label="Page views" value={number(report.summary.pageViews)} />
            <MetricCard label="Events" value={number(report.summary.events)} />
            <MetricCard label="Avg. session" value={duration(report.summary.averageSessionDuration)} />
            <MetricCard label="Bounce rate" value={`${(report.summary.bounceRate * 100).toFixed(1)}%`} />
          </section>
          <div className="mt-6"><TrendChart rows={report.trend} /></div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <RankingTable title="Top pages" rows={report.pages} metricLabel="views" />
            <RankingTable title="Traffic sources" rows={report.sources} metricLabel="sessions" />
            <RankingTable title="Events" rows={report.events} metricLabel="events" />
            <RankingTable title="Countries" rows={report.countries} metricLabel="users" />
            <RankingTable title="Devices" rows={report.devices} metricLabel="users" />
          </div>
          <p className="mt-6 text-xs text-[var(--color-muted)]">Only visitors who accepted analytics consent appear in these reports. Mark <code>booking_completed</code> as a key event in GA4 to report it as a conversion.</p>
        </>
      ) : null}
    </main>
  );
}
