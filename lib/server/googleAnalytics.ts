import crypto from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const ANALYTICS_API = "https://analyticsdata.googleapis.com/v1beta";

type DateRange = { startDate: string; endDate: string };
type ReportRow = { dimensions: string[]; metrics: number[] };

export type AnalyticsReport = {
  summary: {
    users: number;
    sessions: number;
    pageViews: number;
    events: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  trend: ReportRow[];
  pages: ReportRow[];
  sources: ReportRow[];
  devices: ReportRow[];
  countries: ReportRow[];
  events: ReportRow[];
};

type ApiResponse = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  error?: { message?: string };
};

const tokenCache = { token: "", expiresAt: 0 };

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function getConfig() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() ?? "";
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  const propertyId = process.env.GA_PROPERTY_ID?.trim() ?? "";
  if (!email || !privateKey || !/^\d+$/.test(propertyId)) {
    throw new Error("GA4 reporting is not configured on the server.");
  }
  return { email, privateKey, propertyId };
}

async function getAccessToken() {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 30_000) return tokenCache.token;
  const config = getConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: config.email,
      scope: ANALYTICS_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64Url(signer.sign(config.privateKey))}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !payload.access_token) {
    throw new Error("Google authentication failed for the analytics service account.");
  }
  tokenCache.token = payload.access_token;
  tokenCache.expiresAt = Date.now() + (payload.expires_in ?? 3600) * 1000;
  return tokenCache.token;
}

async function runReport(
  dateRange: DateRange,
  dimensions: string[],
  metrics: string[],
  limit = 10,
  orderByMetric?: string
): Promise<ReportRow[]> {
  const config = getConfig();
  const token = await getAccessToken();
  const response = await fetch(`${ANALYTICS_API}/properties/${config.propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateRanges: [dateRange],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      limit,
      orderBys: orderByMetric ? [{ metric: { metricName: orderByMetric }, desc: true }] : undefined,
    }),
    cache: "no-store",
  });
  const payload = (await response.json()) as ApiResponse;
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("The service account does not have Viewer access to this GA4 property.");
    }
    throw new Error(payload.error?.message || "Google Analytics could not return this report.");
  }
  return (payload.rows ?? []).map((row) => ({
    dimensions: (row.dimensionValues ?? []).map((item) => item.value || "(not set)"),
    metrics: (row.metricValues ?? []).map((item) => Number(item.value ?? 0)),
  }));
}

export async function getAnalyticsReport(dateRange: DateRange): Promise<AnalyticsReport> {
  const [summaryRows, trend, pages, sources, devices, countries, events] = await Promise.all([
    runReport(
      dateRange,
      [],
      ["activeUsers", "sessions", "screenPageViews", "eventCount", "averageSessionDuration", "bounceRate"],
      1
    ),
    runReport(dateRange, ["date"], ["activeUsers", "sessions", "screenPageViews"], 400),
    runReport(dateRange, ["pagePath"], ["screenPageViews", "activeUsers"], 10, "screenPageViews"),
    runReport(dateRange, ["sessionSourceMedium"], ["sessions", "activeUsers"], 10, "sessions"),
    runReport(dateRange, ["deviceCategory"], ["activeUsers", "sessions"], 10, "activeUsers"),
    runReport(dateRange, ["country"], ["activeUsers", "sessions"], 10, "activeUsers"),
    runReport(dateRange, ["eventName"], ["eventCount", "totalUsers"], 25, "eventCount"),
  ]);
  const metrics = summaryRows[0]?.metrics ?? [];
  return {
    summary: {
      users: metrics[0] ?? 0,
      sessions: metrics[1] ?? 0,
      pageViews: metrics[2] ?? 0,
      events: metrics[3] ?? 0,
      averageSessionDuration: metrics[4] ?? 0,
      bounceRate: metrics[5] ?? 0,
    },
    trend: trend.sort((a, b) => (a.dimensions[0] ?? "").localeCompare(b.dimensions[0] ?? "")),
    pages,
    sources,
    devices,
    countries,
    events,
  };
}
