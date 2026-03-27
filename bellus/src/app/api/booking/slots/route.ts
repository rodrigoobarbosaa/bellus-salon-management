import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
import { madridToISO } from "@/lib/timezone";

// In-memory rate limiting (30 req/min per IP)
const rateLimit = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimit) {
    if (now > entry.resetAt) rateLimit.delete(ip);
  }
}, 300_000);

/**
 * GET /api/booking/slots?salao_id=X&date=YYYY-MM-DD&profissional_id=Y&duration=Z
 * Returns busy time slots for the given date and professional.
 */
export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const { searchParams } = request.nextUrl;
  const salaoId = searchParams.get("salao_id");
  const date = searchParams.get("date");
  const profissionalId = searchParams.get("profissional_id");
  const duration = parseInt(searchParams.get("duration") ?? "30", 10);

  if (!salaoId || !date) {
    return NextResponse.json({ busy: [] });
  }

  const supabase = createServiceClient();

  const dayStart = madridToISO(`${date}T00:00`);
  const dayEnd = madridToISO(`${date}T23:59`);

  // Build query for appointments
  let agendaQuery = supabase
    .from("agendamentos")
    .select("data_hora_inicio, data_hora_fim")
    .eq("salao_id", salaoId)
    .neq("status", "cancelado")
    .gte("data_hora_inicio", dayStart)
    .lte("data_hora_inicio", dayEnd);

  if (profissionalId) {
    agendaQuery = agendaQuery.eq("profissional_id", profissionalId);
  }

  const { data: agendamentos } = await agendaQuery;

  // Build query for bloqueios
  let bloqueioQuery = supabase
    .from("bloqueios")
    .select("data_hora_inicio, data_hora_fim")
    .eq("salao_id", salaoId)
    .lte("data_hora_inicio", dayEnd)
    .gte("data_hora_fim", dayStart);

  if (profissionalId) {
    bloqueioQuery = bloqueioQuery.eq("profissional_id", profissionalId);
  }

  const { data: bloqueios } = await bloqueioQuery;

  // Calculate busy slots (30-min intervals that overlap with existing appointments/blocks)
  const busySlots = new Set<string>();

  const allEvents = [
    ...((agendamentos ?? []) as Array<{ data_hora_inicio: string; data_hora_fim: string }>),
    ...((bloqueios ?? []) as Array<{ data_hora_inicio: string; data_hora_fim: string }>),
  ];

  for (const event of allEvents) {
    const start = new Date(event.data_hora_inicio);
    const end = new Date(event.data_hora_fim);

    // Mark all 30-min slots that would overlap with this event
    // A slot at HH:MM is busy if [HH:MM, HH:MM+duration] overlaps [start, end]
    for (let m = 0; m < 24 * 60; m += 30) {
      const hh = String(Math.floor(m / 60)).padStart(2, "0");
      const mm = String(m % 60).padStart(2, "0");
      const slotStart = new Date(madridToISO(`${date}T${hh}:${mm}`));
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      if (slotStart < end && slotEnd > start) {
        busySlots.add(`${hh}:${mm}`);
      }
    }
  }

  return NextResponse.json({ busy: Array.from(busySlots) });
}
