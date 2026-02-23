import crypto from "node:crypto";

type BusyPeriod = {
  start: string;
  end: string;
};

type FreeBusyResponse = {
  calendars?: Record<
    string,
    {
      busy?: BusyPeriod[];
    }
  >;
};

type CreatedEvent = {
  id: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
};

type BookingConfig = {
  serviceAccountEmail: string;
  serviceAccountPrivateKey: string;
  calendarId: string;
  timeZone: string;
  meetingMinutes: number;
  slotDays: number;
  workdayStartMinutes: number;
  workdayEndMinutes: number;
};

type SlotQuery = {
  timeMin?: Date;
  timeMax?: Date;
  maxSlots?: number;
};

type BookingCreateInput = {
  name: string;
  email: string;
  projectSummary: string;
  phone?: string;
  startIso: string;
};

export type BookingSlot = {
  startIso: string;
  endIso: string;
};

export type BookingCreatedResult = {
  eventId: string;
  htmlLink?: string;
  hangoutLink?: string;
  startIso: string;
  endIso: string;
  timezone: string;
};

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

class GoogleApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GoogleApiError";
    this.status = status;
  }
}

const GOOGLE_API_BASE = "https://www.googleapis.com";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar";
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MAX_RESPONSE_SNIPPET = 500;

const accessTokenCache: {
  token: string;
  expiresAtMs: number;
} = {
  token: "",
  expiresAtMs: 0,
};

function toInt(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseClockMinutes(value: string, fallback: number): number {
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return fallback;
  }
  const hour = Number.parseInt(match[1] ?? "0", 10);
  const minute = Number.parseInt(match[2] ?? "0", 10);
  return hour * 60 + minute;
}

function isForbiddenForServiceAccounts(error: unknown): boolean {
  return (
    error instanceof GoogleApiError &&
    error.status === 403 &&
    /forbiddenForServiceAccounts/i.test(error.message)
  );
}

function formatClockMinutes(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60, totalMinutes));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatIsoTime(date: Date) {
  return date.toISOString();
}

function encodeBase64Url(value: string | Buffer) {
  const source = typeof value === "string" ? Buffer.from(value) : value;
  return source
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function readBookingConfig(): BookingConfig {
  const serviceAccountEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "").trim();
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "";
  const calendarId = (process.env.GOOGLE_CALENDAR_ID ?? "").trim();
  const timeZone = (process.env.BOOKING_TIMEZONE ?? "Europe/London").trim();
  const meetingMinutes = clampInt(
    toInt(process.env.BOOKING_MEETING_MINUTES, 30),
    15,
    120
  );
  const slotDays = clampInt(toInt(process.env.BOOKING_SLOT_DAYS, 14), 1, 28);
  const workdayStartMinutes = parseClockMinutes(
    process.env.BOOKING_WORKDAY_START ?? "09:00",
    9 * 60
  );
  const workdayEndMinutes = parseClockMinutes(
    process.env.BOOKING_WORKDAY_END ?? "18:00",
    18 * 60
  );

  if (!serviceAccountEmail || !privateKeyRaw || !calendarId) {
    throw new Error(
      "Booking config incomplete. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, and GOOGLE_CALENDAR_ID."
    );
  }

  if (workdayEndMinutes <= workdayStartMinutes) {
    throw new Error("Booking config invalid. BOOKING_WORKDAY_END must be after BOOKING_WORKDAY_START.");
  }

  return {
    serviceAccountEmail,
    serviceAccountPrivateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    calendarId,
    timeZone,
    meetingMinutes,
    slotDays,
    workdayStartMinutes,
    workdayEndMinutes,
  };
}

export function getPublicBookingConfig() {
  const cfg = readBookingConfig();
  return {
    timeZone: cfg.timeZone,
    meetingMinutes: cfg.meetingMinutes,
    slotDays: cfg.slotDays,
    workdayStart: formatClockMinutes(cfg.workdayStartMinutes),
    workdayEnd: formatClockMinutes(cfg.workdayEndMinutes),
  };
}

function createServiceJwt(config: BookingConfig) {
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: config.serviceAccountEmail,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = encodeBase64Url(JSON.stringify(header));
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(config.serviceAccountPrivateKey);

  return `${signingInput}.${encodeBase64Url(signature)}`;
}

async function getGoogleAccessToken(config: BookingConfig) {
  const now = Date.now();
  if (accessTokenCache.token && now < accessTokenCache.expiresAtMs - 30_000) {
    return accessTokenCache.token;
  }

  const assertion = createServiceJwt(config);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new GoogleApiError(
      res.status,
      `Google token request failed: ${raw.slice(0, MAX_RESPONSE_SNIPPET)}`
    );
  }

  let json: {
    access_token?: string;
    expires_in?: number;
  };
  try {
    json = JSON.parse(raw) as { access_token?: string; expires_in?: number };
  } catch {
    throw new GoogleApiError(500, "Google token response was not valid JSON.");
  }

  if (!json.access_token) {
    throw new GoogleApiError(500, "Google token response missing access_token.");
  }

  const expiresIn = Number.isFinite(json.expires_in) ? Number(json.expires_in) : 3600;
  accessTokenCache.token = json.access_token;
  accessTokenCache.expiresAtMs = Date.now() + expiresIn * 1000;

  return accessTokenCache.token;
}

async function googleJsonFetch<T>(
  config: BookingConfig,
  path: string,
  init: RequestInit = {},
  allowRetry: boolean = true
): Promise<T> {
  const token = await getGoogleAccessToken(config);
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${GOOGLE_API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401 && allowRetry) {
    accessTokenCache.token = "";
    accessTokenCache.expiresAtMs = 0;
    return googleJsonFetch<T>(config, path, init, false);
  }

  const raw = await res.text();
  if (!res.ok) {
    throw new GoogleApiError(
      res.status,
      `Google API request failed: ${raw.slice(0, MAX_RESPONSE_SNIPPET)}`
    );
  }

  if (!raw) {
    return {} as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new GoogleApiError(500, "Google API response was not valid JSON.");
  }
}

function getLocalParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);

  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  const hour = Number.parseInt(pick("hour"), 10);
  const minute = Number.parseInt(pick("minute"), 10);
  const weekday = pick("weekday");

  return {
    dateKey: `${year}-${month}-${day}`,
    weekday,
    minutes: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
  };
}

function isWeekend(weekday: string) {
  return weekday === "Sat" || weekday === "Sun";
}

function isSlotWithinWindow(
  startMs: number,
  endMs: number,
  config: BookingConfig
): boolean {
  const startParts = getLocalParts(new Date(startMs), config.timeZone);
  const endParts = getLocalParts(new Date(endMs), config.timeZone);

  if (isWeekend(startParts.weekday)) {
    return false;
  }

  if (startParts.dateKey !== endParts.dateKey) {
    return false;
  }

  if (startParts.minutes < config.workdayStartMinutes) {
    return false;
  }

  if (endParts.minutes > config.workdayEndMinutes) {
    return false;
  }

  return true;
}

function toBusyRanges(response: FreeBusyResponse, calendarId: string) {
  const busy = response.calendars?.[calendarId]?.busy ?? [];
  return busy
    .map((item) => {
      const startMs = Date.parse(item.start);
      const endMs = Date.parse(item.end);
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
        return null;
      }
      return {
        startMs,
        endMs,
      };
    })
    .filter((item): item is { startMs: number; endMs: number } => item !== null)
    .sort((a, b) => a.startMs - b.startMs);
}

function overlapsBusy(
  startMs: number,
  endMs: number,
  busyRanges: Array<{ startMs: number; endMs: number }>
) {
  for (const busy of busyRanges) {
    if (busy.endMs <= startMs) {
      continue;
    }
    if (busy.startMs >= endMs) {
      return false;
    }
    return true;
  }
  return false;
}

function ceilToStep(timestampMs: number, stepMinutes: number) {
  const stepMs = stepMinutes * MINUTE_MS;
  return Math.ceil(timestampMs / stepMs) * stepMs;
}

async function fetchBusyRanges(config: BookingConfig, timeMinIso: string, timeMaxIso: string) {
  const response = await googleJsonFetch<FreeBusyResponse>(config, "/calendar/v3/freeBusy", {
    method: "POST",
    body: JSON.stringify({
      timeMin: timeMinIso,
      timeMax: timeMaxIso,
      timeZone: config.timeZone,
      items: [{ id: config.calendarId }],
    }),
  });

  return toBusyRanges(response, config.calendarId);
}

export async function getAvailableSlots(query: SlotQuery = {}): Promise<BookingSlot[]> {
  const config = readBookingConfig();
  const nowMs = Date.now() + 2 * MINUTE_MS;

  const rangeStartMs = Math.max(query.timeMin?.getTime() ?? nowMs, nowMs);
  const defaultRangeEndMs = rangeStartMs + config.slotDays * DAY_MS;
  const rangeEndMs = query.timeMax
    ? Math.min(query.timeMax.getTime(), rangeStartMs + 31 * DAY_MS)
    : defaultRangeEndMs;

  if (!Number.isFinite(rangeStartMs) || !Number.isFinite(rangeEndMs) || rangeEndMs <= rangeStartMs) {
    return [];
  }

  const busyRanges = await fetchBusyRanges(
    config,
    formatIsoTime(new Date(rangeStartMs)),
    formatIsoTime(new Date(rangeEndMs))
  );

  const durationMs = config.meetingMinutes * MINUTE_MS;
  const maxSlots = clampInt(query.maxSlots ?? 160, 1, 400);
  const slots: BookingSlot[] = [];

  for (
    let cursorMs = ceilToStep(rangeStartMs, config.meetingMinutes);
    cursorMs + durationMs <= rangeEndMs;
    cursorMs += config.meetingMinutes * MINUTE_MS
  ) {
    const slotEndMs = cursorMs + durationMs;
    if (!isSlotWithinWindow(cursorMs, slotEndMs, config)) {
      continue;
    }
    if (overlapsBusy(cursorMs, slotEndMs, busyRanges)) {
      continue;
    }

    slots.push({
      startIso: formatIsoTime(new Date(cursorMs)),
      endIso: formatIsoTime(new Date(slotEndMs)),
    });

    if (slots.length >= maxSlots) {
      break;
    }
  }

  return slots;
}

export async function createBookingEvent(
  input: BookingCreateInput
): Promise<BookingCreatedResult> {
  const config = readBookingConfig();
  const startMs = Date.parse(input.startIso);
  if (!Number.isFinite(startMs)) {
    throw new Error("Invalid booking time selected.");
  }
  const durationMs = config.meetingMinutes * MINUTE_MS;
  const endMs = startMs + durationMs;

  if (startMs <= Date.now()) {
    throw new Error("Selected meeting time must be in the future.");
  }

  if (!isSlotWithinWindow(startMs, endMs, config)) {
    throw new Error("Selected meeting time is outside available hours.");
  }

  const busyRanges = await fetchBusyRanges(
    config,
    formatIsoTime(new Date(startMs)),
    formatIsoTime(new Date(endMs))
  );
  if (overlapsBusy(startMs, endMs, busyRanges)) {
    throw new BookingConflictError(
      "That slot was just taken. Please choose another available time."
    );
  }

  const description = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    `Phone: ${input.phone?.trim() ? input.phone.trim() : "Not provided"}`,
    "",
    "Project summary:",
    input.projectSummary,
  ].join("\n");

  const startIso = formatIsoTime(new Date(startMs));
  const endIso = formatIsoTime(new Date(endMs));

  const basePayload = {
    summary: `Initial Meeting - ${input.name}`,
    description,
    start: {
      dateTime: startIso,
      timeZone: config.timeZone,
    },
    end: {
      dateTime: endIso,
      timeZone: config.timeZone,
    },
  };
  const attendeePayload = {
    ...basePayload,
    attendees: [{ email: input.email }],
  };

  const calendarPath = `/calendar/v3/calendars/${encodeURIComponent(
    config.calendarId
  )}/events`;

  const createEvent = async (
    payload: typeof basePayload | typeof attendeePayload,
    sendUpdates: "all" | "none"
  ) => {
    try {
      return await googleJsonFetch<CreatedEvent>(
        config,
        `${calendarPath}?sendUpdates=${sendUpdates}&conferenceDataVersion=1`,
        {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            conferenceData: {
              createRequest: {
                requestId: crypto.randomUUID(),
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            },
          }),
        }
      );
    } catch (error) {
      if (error instanceof GoogleApiError) {
        return googleJsonFetch<CreatedEvent>(config, `${calendarPath}?sendUpdates=${sendUpdates}`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      throw error;
    }
  };

  let createdEvent: CreatedEvent;
  try {
    createdEvent = await createEvent(attendeePayload, "all");
  } catch (error) {
    if (!isForbiddenForServiceAccounts(error)) {
      throw error;
    }
    createdEvent = await createEvent(basePayload, "none");
  }

  if (!createdEvent.id) {
    throw new Error("Google Calendar did not return an event id.");
  }

  return {
    eventId: createdEvent.id,
    htmlLink: createdEvent.htmlLink,
    hangoutLink: createdEvent.hangoutLink,
    startIso: createdEvent.start?.dateTime ?? startIso,
    endIso: createdEvent.end?.dateTime ?? endIso,
    timezone: config.timeZone,
  };
}
