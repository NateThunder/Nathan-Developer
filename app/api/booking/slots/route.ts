import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, getPublicBookingConfig } from "@/lib/server/googleCalendar";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");

  let timeMin: Date | undefined;
  if (from) {
    const parsedMs = Date.parse(from);
    if (!Number.isFinite(parsedMs)) {
      return NextResponse.json({ error: "Invalid from timestamp." }, { status: 400 });
    }
    timeMin = new Date(parsedMs);
  }

  try {
    const config = getPublicBookingConfig();
    const slots = await getAvailableSlots({
      timeMin,
      maxSlots: 180,
    });

    return NextResponse.json({
      timezone: config.timeZone,
      meetingMinutes: config.meetingMinutes,
      slotDays: config.slotDays,
      workdayStart: config.workdayStart,
      workdayEnd: config.workdayEnd,
      slots,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load booking slots right now.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    );
  }
}
