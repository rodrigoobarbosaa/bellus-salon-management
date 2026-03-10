import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/booking/slots?salao_id=X&date=YYYY-MM-DD&profissional_id=Y&duration=Z
 * Returns busy time slots for the given date and professional.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const salaoId = searchParams.get("salao_id");
  const date = searchParams.get("date");
  const profissionalId = searchParams.get("profissional_id");
  const duration = parseInt(searchParams.get("duration") ?? "30", 10);

  if (!salaoId || !date) {
    return NextResponse.json({ busy: [] });
  }

  const supabase = createServiceClient();

  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

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
      const slotStart = new Date(`${date}T${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:00`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

      if (slotStart < end && slotEnd > start) {
        const timeStr = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
        busySlots.add(timeStr);
      }
    }
  }

  return NextResponse.json({ busy: Array.from(busySlots) });
}
