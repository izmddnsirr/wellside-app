import { NextRequest, NextResponse } from "next/server";
import { createDailyQueuePin } from "@/utils/queue";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const expected = createDailyQueuePin();

  if (pin !== expected) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // Cookie expires at midnight Malaysia time (UTC+8), same moment the PIN rotates
  const MALAYSIA_OFFSET_MS = 8 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const malaysiaNowMs = nowMs + MALAYSIA_OFFSET_MS;
  const midnightMalaysiaMs =
    Math.ceil(malaysiaNowMs / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000);
  const secondsUntilMidnight = Math.floor((midnightMalaysiaMs - malaysiaNowMs) / 1000);

  res.cookies.set("tv_pin", expected, {
    httpOnly: true,
    sameSite: "lax",
    path: "/tv",
    maxAge: secondsUntilMidnight,
  });

  return res;
}
