const API_BASE_URL = "http://192.168.1.130:3000";

export async function fetchSlots(params: {
  salao_id: string;
  date: string;
  profissional_id?: string;
  duration?: number;
}): Promise<{ busy: string[] }> {
  const qs = new URLSearchParams({
    salao_id: params.salao_id,
    date: params.date,
  });
  if (params.profissional_id) qs.set("profissional_id", params.profissional_id);
  if (params.duration) qs.set("duration", String(params.duration));

  const res = await fetch(`${API_BASE_URL}/api/booking/slots?${qs}`);
  return res.json();
}

export { API_BASE_URL };
