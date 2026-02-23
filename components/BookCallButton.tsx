"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const CONTACT_EMAIL = "manager@nathansomevi.com";
const CONTACT_PHONE_E164 = "+447846677463";
const CONTACT_PHONE_LABEL = "+44 7846 677463";
const WHATSAPP_E164 = "447846677463";
const DEFAULT_TIMEZONE = "Europe/London";
const DEFAULT_WORKDAY_START = "09:00";
const DEFAULT_WORKDAY_END = "18:00";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type BookingSlot = {
  startIso: string;
  endIso: string;
};

type BookingResponse = {
  eventId: string;
  htmlLink?: string;
  hangoutLink?: string;
  startIso: string;
  endIso: string;
  timezone: string;
};

type BookCallButtonProps = {
  className: string;
  label?: string;
  onOpen?: () => void;
};

type CalendarCell = {
  dateKey: string;
  inMonth: boolean;
};

function getDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const pick = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function getDateKeyFromIso(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return getDateKeyInTimeZone(date, timeZone);
}

function getTimeKeyFromIso(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function parseClockMinutes(value: string, fallback: number): number {
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return fallback;
  }
  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
}

function formatClockMinutes(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60, totalMinutes));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function splitDateKey(dateKey: string): { year: number; month: number; day: number } | null {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const year = Number.parseInt(match[1] || "0", 10);
  const month = Number.parseInt(match[2] || "0", 10);
  const day = Number.parseInt(match[3] || "0", 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return { year, month, day };
}

function formatUtcDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const parts = splitDateKey(dateKey);
  if (!parts) {
    return dateKey;
  }
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return formatUtcDateKey(date);
}

function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

function getMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

function shiftMonthKey(monthKey: string, delta: number): string {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return monthKey;
  }
  const year = Number.parseInt(match[1] || "0", 10);
  const month = Number.parseInt(match[2] || "1", 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return monthKey;
  }
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthStartDateKey(monthKey: string): string {
  return `${monthKey}-01`;
}

function getMonthEndDateKey(monthKey: string): string {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return `${monthKey}-31`;
  }
  const year = Number.parseInt(match[1] || "0", 10);
  const month = Number.parseInt(match[2] || "1", 10);
  const lastDay = new Date(Date.UTC(year, month, 0));
  return formatUtcDateKey(lastDay);
}

function buildCalendarCells(monthKey: string): CalendarCell[] {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return [];
  }
  const year = Number.parseInt(match[1] || "0", 10);
  const month = Number.parseInt(match[2] || "1", 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return [];
  }

  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekdayMondayBased = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStart = new Date(Date.UTC(year, month - 1, 1 - firstWeekdayMondayBased));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      Date.UTC(
        gridStart.getUTCFullYear(),
        gridStart.getUTCMonth(),
        gridStart.getUTCDate() + index
      )
    );
    return {
      dateKey: formatUtcDateKey(date),
      inMonth: date.getUTCMonth() + 1 === month,
    };
  });
}

function formatMonthLabel(monthKey: string): string {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return monthKey;
  }
  const year = Number.parseInt(match[1] || "0", 10);
  const month = Number.parseInt(match[2] || "1", 10);
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateKeyLong(dateKey: string): string {
  const parts = splitDateKey(dateKey);
  if (!parts) {
    return dateKey;
  }
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(iso: string, timeZone: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function BookCallButton({
  className,
  label = "Book a Call",
  onOpen,
}: BookCallButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectSummary, setProjectSummary] = useState("");
  const [phone, setPhone] = useState("");
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState<BookingResponse | null>(null);
  const [slotTimeZone, setSlotTimeZone] = useState(DEFAULT_TIMEZONE);
  const [meetingMinutes, setMeetingMinutes] = useState(30);
  const [slotDays, setSlotDays] = useState(14);
  const [workdayStart, setWorkdayStart] = useState(DEFAULT_WORKDAY_START);
  const [workdayEnd, setWorkdayEnd] = useState(DEFAULT_WORKDAY_END);
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [visibleMonthKey, setVisibleMonthKey] = useState("");
  const selectedSlotRef = useRef(selectedSlot);
  const selectedDateKeyRef = useRef(selectedDateKey);

  useEffect(() => {
    selectedSlotRef.current = selectedSlot;
  }, [selectedSlot]);

  useEffect(() => {
    selectedDateKeyRef.current = selectedDateKey;
  }, [selectedDateKey]);

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    setSlotsError("");

    try {
      const res = await fetch("/api/booking/slots", {
        method: "GET",
        cache: "no-store",
      });
      const payload = (await res.json()) as {
        slots?: BookingSlot[];
        timezone?: string;
        meetingMinutes?: number;
        slotDays?: number;
        workdayStart?: string;
        workdayEnd?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(payload.error || "Unable to load booking slots.");
      }

      const nextTimeZone = payload.timezone || DEFAULT_TIMEZONE;
      const nextMeetingMinutes = Number.isFinite(payload.meetingMinutes)
        ? Number(payload.meetingMinutes)
        : 30;
      const nextSlotDays = Number.isFinite(payload.slotDays)
        ? Math.max(1, Math.min(28, Number(payload.slotDays)))
        : 14;
      const nextWorkdayStart =
        typeof payload.workdayStart === "string" && payload.workdayStart.trim()
          ? payload.workdayStart.trim()
          : DEFAULT_WORKDAY_START;
      const nextWorkdayEnd =
        typeof payload.workdayEnd === "string" && payload.workdayEnd.trim()
          ? payload.workdayEnd.trim()
          : DEFAULT_WORKDAY_END;
      const nextSlots = Array.isArray(payload.slots) ? payload.slots : [];
      const windowStartDateKey = getDateKeyInTimeZone(new Date(), nextTimeZone);
      const windowEndDateKey = addDaysToDateKey(windowStartDateKey, nextSlotDays - 1);
      const isInRange = (dateKey: string) =>
        compareDateKeys(dateKey, windowStartDateKey) >= 0 &&
        compareDateKeys(dateKey, windowEndDateKey) <= 0;

      const currentSelectedSlot = selectedSlotRef.current;
      const currentSelectedDateKey = selectedDateKeyRef.current;
      const nextSelectedSlot = nextSlots.some((slot) => slot.startIso === currentSelectedSlot)
        ? currentSelectedSlot
        : nextSlots[0]?.startIso || "";
      const fallbackDateKey = nextSelectedSlot
        ? getDateKeyFromIso(nextSelectedSlot, nextTimeZone)
        : windowStartDateKey;
      const nextDateKey =
        currentSelectedDateKey && isInRange(currentSelectedDateKey)
          ? currentSelectedDateKey
          : fallbackDateKey;

      setSlots(nextSlots);
      setSlotTimeZone(nextTimeZone);
      setMeetingMinutes(nextMeetingMinutes);
      setSlotDays(nextSlotDays);
      setWorkdayStart(nextWorkdayStart);
      setWorkdayEnd(nextWorkdayEnd);
      selectedSlotRef.current = nextSelectedSlot;
      selectedDateKeyRef.current = nextDateKey;
      setSelectedSlot(nextSelectedSlot);
      setSelectedDateKey(nextDateKey);
      setVisibleMonthKey(getMonthKey(nextDateKey));
    } catch (error) {
      setSlotsError(
        error instanceof Error
          ? error.message
          : "Unable to load booking slots right now."
      );
      setSlots([]);
      selectedSlotRef.current = "";
      selectedDateKeyRef.current = "";
      setSelectedSlot("");
      setSelectedDateKey("");
      setVisibleMonthKey("");
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void loadSlots();
  }, [isOpen, loadSlots]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedProjectSummary = projectSummary.trim();
  const trimmedPhone = phone.trim();
  const emailLooksValid = EMAIL_PATTERN.test(trimmedEmail);
  const canBook = Boolean(
    trimmedName &&
      emailLooksValid &&
      trimmedProjectSummary &&
      selectedSlot &&
      !isBooking &&
      !slotsLoading
  );

  const bookingWindowStartDateKey = useMemo(
    () => getDateKeyInTimeZone(new Date(), slotTimeZone),
    [slotTimeZone]
  );
  const bookingWindowEndDateKey = useMemo(
    () => addDaysToDateKey(bookingWindowStartDateKey, slotDays - 1),
    [bookingWindowStartDateKey, slotDays]
  );

  const isDateInBookingWindow = useCallback(
    (dateKey: string) =>
      compareDateKeys(dateKey, bookingWindowStartDateKey) >= 0 &&
      compareDateKeys(dateKey, bookingWindowEndDateKey) <= 0,
    [bookingWindowEndDateKey, bookingWindowStartDateKey]
  );

  const slotsByDateAndTime = useMemo(() => {
    const grouped = new Map<string, Map<string, BookingSlot>>();
    for (const slot of slots) {
      const dateKey = getDateKeyFromIso(slot.startIso, slotTimeZone);
      const timeKey = getTimeKeyFromIso(slot.startIso, slotTimeZone);
      if (!dateKey || !timeKey) {
        continue;
      }
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, new Map<string, BookingSlot>());
      }
      grouped.get(dateKey)?.set(timeKey, slot);
    }
    return grouped;
  }, [slots, slotTimeZone]);

  const availableDateKeys = useMemo(
    () => new Set<string>(Array.from(slotsByDateAndTime.keys())),
    [slotsByDateAndTime]
  );

  const effectiveDateKey = selectedDateKey || bookingWindowStartDateKey;
  const activeMonthKey = visibleMonthKey || getMonthKey(effectiveDateKey);
  const calendarCells = useMemo(() => buildCalendarCells(activeMonthKey), [activeMonthKey]);
  const selectedDateSlots = slotsByDateAndTime.get(effectiveDateKey);

  const workdayStartMinutes = useMemo(
    () => parseClockMinutes(workdayStart, 9 * 60),
    [workdayStart]
  );
  const workdayEndMinutes = useMemo(
    () => parseClockMinutes(workdayEnd, 18 * 60),
    [workdayEnd]
  );

  const dailyTimeRows = useMemo(() => {
    const rows: Array<{
      startTime: string;
      endTime: string;
      slot?: BookingSlot;
    }> = [];
    for (
      let startMinutes = workdayStartMinutes;
      startMinutes + meetingMinutes <= workdayEndMinutes;
      startMinutes += meetingMinutes
    ) {
      const startTime = formatClockMinutes(startMinutes);
      rows.push({
        startTime,
        endTime: formatClockMinutes(startMinutes + meetingMinutes),
        slot: selectedDateSlots?.get(startTime),
      });
    }
    return rows;
  }, [meetingMinutes, selectedDateSlots, workdayEndMinutes, workdayStartMinutes]);

  const canGoPrevMonth = useMemo(() => {
    const prevMonthKey = shiftMonthKey(activeMonthKey, -1);
    const prevMonthEnd = getMonthEndDateKey(prevMonthKey);
    return compareDateKeys(prevMonthEnd, bookingWindowStartDateKey) >= 0;
  }, [activeMonthKey, bookingWindowStartDateKey]);

  const canGoNextMonth = useMemo(() => {
    const nextMonthKey = shiftMonthKey(activeMonthKey, 1);
    const nextMonthStart = getMonthStartDateKey(nextMonthKey);
    return compareDateKeys(nextMonthStart, bookingWindowEndDateKey) <= 0;
  }, [activeMonthKey, bookingWindowEndDateKey]);

  const selectedSlotDetails = slots.find((slot) => slot.startIso === selectedSlot);

  const openDialog = () => {
    onOpen?.();
    setBookingError("");
    setBookingSuccess(null);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
  };

  const onSelectDate = (dateKey: string) => {
    if (!isDateInBookingWindow(dateKey)) {
      return;
    }
    selectedDateKeyRef.current = dateKey;
    setSelectedDateKey(dateKey);
    setVisibleMonthKey(getMonthKey(dateKey));
    setBookingError("");
    const firstAvailableSlot = Array.from(slotsByDateAndTime.get(dateKey)?.values() || [])[0];
    selectedSlotRef.current = firstAvailableSlot?.startIso || "";
    setSelectedSlot(firstAvailableSlot?.startIso || "");
  };

  const onSelectSlot = (slot: BookingSlot) => {
    selectedSlotRef.current = slot.startIso;
    setSelectedSlot(slot.startIso);
    const dateKey = getDateKeyFromIso(slot.startIso, slotTimeZone);
    if (dateKey) {
      selectedDateKeyRef.current = dateKey;
      setSelectedDateKey(dateKey);
      setVisibleMonthKey(getMonthKey(dateKey));
    }
  };

  const onBookMeeting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canBook) {
      return;
    }

    setIsBooking(true);
    setBookingError("");
    setBookingSuccess(null);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          projectSummary: trimmedProjectSummary,
          phone: trimmedPhone,
          startIso: selectedSlot,
        }),
      });

      const payload = (await res.json()) as BookingResponse & { error?: string };

      if (!res.ok) {
        throw new Error(payload.error || "Unable to book this meeting right now.");
      }

      setBookingSuccess(payload);
      setProjectSummary("");
      void loadSlots();
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : "Unable to book this meeting."
      );
    } finally {
      setIsBooking(false);
    }
  };

  const canRenderPortal = typeof document !== "undefined";
  const whatsAppMessage = encodeURIComponent(
    "Hi Nathan, I would like to discuss a new project."
  );

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className={`relative z-[80] ${className}`}
      >
        {label}
      </button>

      {isOpen && canRenderPortal
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-6 sm:items-center sm:pb-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
            >
              <button
                type="button"
                aria-label="Close contact details"
                onClick={closeDialog}
                className="absolute inset-0 bg-black/75"
              />

              <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[780px] overflow-hidden rounded-t-[24px] border-2 border-[var(--color-accent-warm)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-card)] sm:rounded-[24px]">
                <button
                  type="button"
                  aria-label="Close window"
                  onClick={closeDialog}
                  className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
                >
                  x
                </button>

                <div className="contact-scrollbar relative my-5 max-h-[calc(100dvh-4.5rem)] overflow-y-auto p-5 sm:my-6 sm:max-h-[calc(100dvh-5rem)] sm:p-6">
                <p className="mono-label text-[11px] text-[var(--color-accent-warm)]">
                  CONTACT AND BOOKING
                </p>
                <h3
                  id={titleId}
                  className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--color-text)]"
                >
                  Contact
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                  Choose a fast contact option or book a {meetingMinutes}-minute
                  meeting instantly.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <a
                    href={`tel:${CONTACT_PHONE_E164}`}
                    className="pixel-notch inline-flex flex-col items-start justify-between gap-2 rounded-[14px] border-2 border-[var(--color-accent-warm)] bg-[var(--color-surface-alt)] px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
                  >
                    <span className="mono-label text-[10px] text-[var(--color-accent-soft)]">
                      CALL
                    </span>
                    <span>{CONTACT_PHONE_LABEL}</span>
                  </a>

                  <a
                    href={`https://wa.me/${WHATSAPP_E164}?text=${whatsAppMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="pixel-notch inline-flex flex-col items-start justify-between gap-2 rounded-[14px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
                  >
                    <span className="mono-label text-[10px] text-[var(--color-accent-soft)]">
                      MESSAGE
                    </span>
                    <span>WhatsApp ({CONTACT_PHONE_LABEL})</span>
                  </a>

                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="pixel-notch inline-flex flex-col items-start justify-between gap-2 rounded-[14px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
                  >
                    <span className="mono-label text-[10px] text-[var(--color-accent-soft)]">
                      EMAIL
                    </span>
                    <span className="break-all">{CONTACT_EMAIL}</span>
                  </a>
                </div>

                  <section className="mt-6 rounded-[16px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
                  <p className="mono-label text-[10px] text-[var(--color-accent-soft)]">
                    BOOK MEETING ({meetingMinutes} MINUTES)
                  </p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    Time zone: {slotTimeZone}
                  </p>

                  {bookingSuccess ? (
                    <div className="mt-4 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                      <p className="text-sm font-semibold text-[var(--color-text)]">
                        Meeting booked
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {formatDateTime(bookingSuccess.startIso, bookingSuccess.timezone)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {bookingSuccess.hangoutLink ? (
                          <a
                            href={bookingSuccess.hangoutLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent-soft)]"
                          >
                            Open Meet Link
                          </a>
                        ) : null}
                        {bookingSuccess.htmlLink ? (
                          <a
                            href={bookingSuccess.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent-soft)]"
                          >
                            Open Calendar Event
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setBookingSuccess(null);
                            setBookingError("");
                          }}
                          className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent-soft)]"
                        >
                          Book Another Time
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={onBookMeeting} className="mt-4 space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs text-[var(--color-muted)]">
                          Name *
                          <input
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Your name"
                            className="mt-1 h-10 w-full rounded-[10px] border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent-soft)]"
                          />
                        </label>

                        <label className="text-xs text-[var(--color-muted)]">
                          Email *
                          <input
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@example.com"
                            className="mt-1 h-10 w-full rounded-[10px] border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent-soft)]"
                          />
                        </label>
                      </div>

                      <label className="block text-xs text-[var(--color-muted)]">
                        Project summary *
                        <textarea
                          value={projectSummary}
                          onChange={(event) => setProjectSummary(event.target.value)}
                          placeholder="What are you trying to build?"
                          rows={4}
                          className="mt-1 w-full rounded-[10px] border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent-soft)]"
                        />
                      </label>

                      <label className="block text-xs text-[var(--color-muted)]">
                        Phone (optional)
                        <input
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="+44 ..."
                          className="mt-1 h-10 w-full rounded-[10px] border-2 border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent-soft)]"
                        />
                      </label>

                      <div>
                        <p className="text-xs text-[var(--color-muted)]">Select a time *</p>

                        {slotsLoading ? (
                          <p className="mt-2 text-sm text-[var(--color-muted)]">
                            Loading available slots...
                          </p>
                        ) : slotsError ? (
                          <div className="mt-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                            <p className="text-sm text-[var(--color-muted)]">{slotsError}</p>
                            <button
                              type="button"
                              onClick={() => {
                                void loadSlots();
                              }}
                              className="mt-2 inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent-soft)]"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 grid min-h-0 gap-3 lg:grid-cols-[1.05fr_1fr] lg:items-stretch">
                            <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  disabled={!canGoPrevMonth}
                                  onClick={() =>
                                    setVisibleMonthKey(shiftMonthKey(activeMonthKey, -1))
                                  }
                                  className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1 text-[11px] font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Prev
                                </button>
                                <p className="text-xs font-semibold text-[var(--color-text)]">
                                  {formatMonthLabel(activeMonthKey)}
                                </p>
                                <button
                                  type="button"
                                  disabled={!canGoNextMonth}
                                  onClick={() =>
                                    setVisibleMonthKey(shiftMonthKey(activeMonthKey, 1))
                                  }
                                  className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1 text-[11px] font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  Next
                                </button>
                              </div>

                              <div className="mt-3 grid grid-cols-7 gap-1">
                                {WEEKDAY_HEADERS.map((weekday) => (
                                  <p
                                    key={weekday}
                                    className="text-center text-[11px] font-semibold text-[var(--color-muted)]"
                                  >
                                    {weekday}
                                  </p>
                                ))}
                              </div>

                              <div className="mt-2 grid grid-cols-7 gap-1">
                                {calendarCells.map((cell) => {
                                  const day = splitDateKey(cell.dateKey)?.day;
                                  const isSelected = cell.dateKey === effectiveDateKey;
                                  const isInWindow = isDateInBookingWindow(cell.dateKey);
                                  const hasAvailability = availableDateKeys.has(cell.dateKey);
                                  const isSelectable = cell.inMonth && isInWindow;

                                  const className = isSelected
                                    ? "border-[#8a3f2f] bg-[var(--color-accent-warm)] text-[#1d1b1a]"
                                    : isSelectable && hasAvailability
                                      ? "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-accent-soft)]"
                                      : isSelectable
                                        ? "border-dashed border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]"
                                        : cell.inMonth
                                          ? "border-[var(--color-border)]/35 bg-[var(--color-bg)] text-[var(--color-muted)]/50"
                                          : "border-transparent bg-transparent text-[var(--color-muted)]/30";

                                  return (
                                    <button
                                      key={cell.dateKey}
                                      type="button"
                                      disabled={!isSelectable}
                                      onClick={() => onSelectDate(cell.dateKey)}
                                      aria-pressed={isSelected}
                                      className={`inline-flex h-11 flex-col items-center justify-center rounded-[8px] border text-[11px] font-semibold transition disabled:cursor-not-allowed ${className}`}
                                    >
                                      <span>{day ?? ""}</span>
                                      <span className="text-[10px] leading-none">
                                        {hasAvailability ? "•" : " "}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 lg:min-h-0">
                              <div className="flex h-full min-h-0 flex-col">
                                <p className="text-xs font-semibold text-[var(--color-text)]">
                                  {formatDateKeyLong(effectiveDateKey)}
                                </p>
                                <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                                  Working hours: {workdayStart} - {workdayEnd}
                                </p>

                                <div className="mt-3 min-h-0 max-h-[220px] rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg)] p-2">
                                  <div className="contact-scrollbar h-full min-h-0 overflow-y-auto pr-1 pb-2">
                                    {dailyTimeRows.length ? (
                                      <div className="grid grid-cols-2 gap-2">
                                        {dailyTimeRows.map((row) => {
                                          if (!row.slot) {
                                            return (
                                              <div
                                                key={`${effectiveDateKey}-${row.startTime}`}
                                                className="flex flex-col rounded-[8px] border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-2 text-left"
                                              >
                                                <span className="text-[11px] font-semibold text-[var(--color-muted)]/70">
                                                  {row.startTime} - {row.endTime}
                                                </span>
                                                <span className="text-[10px] text-[var(--color-muted)]/45">
                                                  Unavailable
                                                </span>
                                              </div>
                                            );
                                          }

                                          const slot = row.slot;
                                          const isSelected = selectedSlot === slot.startIso;

                                          return (
                                            <button
                                              key={slot.startIso}
                                              type="button"
                                              onClick={() => onSelectSlot(slot)}
                                              aria-pressed={isSelected}
                                              className={`rounded-[8px] border px-2 py-2 text-left text-[11px] font-semibold transition ${
                                                isSelected
                                                  ? "border-[#8a3f2f] bg-[var(--color-accent-warm)] text-[#1d1b1a]"
                                                  : "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-accent-soft)]"
                                              }`}
                                            >
                                              {row.startTime} - {row.endTime}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-[var(--color-muted)]">
                                        No bookable times in this workday window.
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {!Array.from(selectedDateSlots?.values() || []).length ? (
                                  <p className="mt-3 text-xs text-[var(--color-muted)]">
                                    No availability on this date.
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {selectedSlotDetails ? (
                        <p className="text-xs text-[var(--color-muted)]">
                          Selected:{" "}
                          {formatDateTime(selectedSlotDetails.startIso, slotTimeZone)}
                        </p>
                      ) : null}

                      {bookingError ? (
                        <p className="text-xs text-[#8a3f2f]">{bookingError}</p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={!canBook}
                        className="pixel-notch inline-flex w-full items-center justify-center rounded-full border-2 border-[#8a3f2f] bg-[var(--color-accent-warm)] px-4 py-2.5 text-sm font-semibold text-[#1d1b1a] shadow-[0_8px_16px_rgba(20,8,4,0.32)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isBooking ? "Booking..." : "Book Meeting"}
                      </button>
                    </form>
                  )}
                  </section>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
