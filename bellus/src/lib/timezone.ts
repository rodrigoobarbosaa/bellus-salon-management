const SALON_TZ = "Europe/Madrid";

/**
 * Convert a naive datetime string (assumed Europe/Madrid local time) to UTC ISO string.
 * Handles DST automatically via Intl API.
 *
 * Input:  "2026-03-27T14:00" (Madrid local)
 * Output: "2026-03-27T12:00:00.000Z" (UTC, during CEST)
 */
export function madridToISO(naiveDatetime: string): string {
  // If already has timezone info, parse directly
  if (/[Z]/.test(naiveDatetime.slice(10)) || /[+-]\d{2}:\d{2}$/.test(naiveDatetime)) {
    return new Date(naiveDatetime).toISOString();
  }

  // Ensure seconds for consistent parsing
  const withSeconds =
    naiveDatetime.length === 16 ? naiveDatetime + ":00" : naiveDatetime;

  // Parse as UTC to get a reference timestamp
  const refUTC = new Date(withSeconds + "Z");

  // Find Madrid's local time at this UTC reference point
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SALON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(refUTC);

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value);

  // Reconstruct Madrid time as UTC to measure the offset
  const madridAsUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );

  const offsetMs = madridAsUTC - refUTC.getTime();

  // Naive datetime is Madrid local → subtract offset to get UTC
  return new Date(refUTC.getTime() - offsetMs).toISOString();
}

/**
 * Convert a Date object to a datetime-local input value in Europe/Madrid timezone.
 * Works correctly regardless of the browser's or server's timezone.
 *
 * Output: "2026-03-27T14:00"
 */
export function toMadridDatetimeLocal(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SALON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const hour = get("hour") === "24" ? "00" : get("hour");
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}

/**
 * Ensure a timestamptz string from Supabase includes UTC indicator.
 * Supabase may return timestamptz without offset (e.g. "2026-03-27T11:00:00").
 * Without it, FullCalendar and new Date() interpret it as local time — wrong.
 */
export function ensureUTC(ts: string): string {
  if (!ts) return ts;
  // Already has Z or +/-offset → fine
  if (ts.endsWith("Z") || /[+-]\d{2}(:\d{2})?$/.test(ts)) return ts;
  // timestamptz from Supabase without explicit offset → append Z
  return ts + "Z";
}

export { SALON_TZ };
