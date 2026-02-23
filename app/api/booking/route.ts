import { NextRequest, NextResponse } from "next/server";
import {
  BookingConflictError,
  createBookingEvent,
} from "@/lib/server/googleCalendar";

export const runtime = "nodejs";

type BookingPayload = {
  name?: unknown;
  email?: unknown;
  projectSummary?: unknown;
  phone?: unknown;
  startIso?: unknown;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanString(value: unknown, maxChars: number): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, maxChars);
}

export async function POST(req: NextRequest) {
  let body: BookingPayload;
  try {
    body = (await req.json()) as BookingPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const name = cleanString(body.name, 80);
  const email = cleanString(body.email, 120).toLowerCase();
  const projectSummary = cleanString(body.projectSummary, 2500);
  const phone = cleanString(body.phone, 40);
  const startIso = cleanString(body.startIso, 80);

  if (!name || !email || !projectSummary || !startIso) {
    return NextResponse.json(
      {
        error: "Name, email, project summary, and selected time are required.",
      },
      { status: 400 }
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const parsedStartMs = Date.parse(startIso);
  if (!Number.isFinite(parsedStartMs)) {
    return NextResponse.json({ error: "Selected booking time is invalid." }, { status: 400 });
  }

  try {
    const booking = await createBookingEvent({
      name,
      email,
      projectSummary,
      phone,
      startIso: new Date(parsedStartMs).toISOString(),
    });

    return NextResponse.json({
      ok: true,
      ...booking,
    });
  } catch (error) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Booking failed. Please try another slot.",
      },
      { status: 500 }
    );
  }
}
