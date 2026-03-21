import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { serviceName, serviceCategory, servicePrice, tone, language } = await request.json();

  if (!serviceName) {
    return NextResponse.json({ error: "Service name required" }, { status: 400 });
  }

  const toneDescriptions: Record<string, string> = {
    profissional: "profesional, elegante y confiable",
    descontraido: "informal, divertido y cercano",
    luxo: "lujoso, exclusivo y premium",
  };

  const toneDesc = toneDescriptions[tone] || toneDescriptions.profissional;
  const lang = language === "pt" ? "portugues" : "espanol";

  const prompt = `Genera contenido de marketing para un salon de belleza.

SERVICIO: ${serviceName}
CATEGORIA: ${serviceCategory || "general"}
PRECIO: ${servicePrice ? servicePrice + " EUR" : "no especificado"}
TONO DE VOZ: ${toneDesc}
IDIOMA: ${lang}

Genera exactamente este JSON (sin markdown, solo JSON puro):
{
  "variations": [
    {
      "title": "titulo del anuncio (max 30 chars)",
      "body": "texto del anuncio (max 90 chars)"
    },
    {
      "title": "variacion 2",
      "body": "texto variacion 2"
    },
    {
      "title": "variacion 3",
      "body": "texto variacion 3"
    }
  ],
  "headlines": ["headline 1", "headline 2", "headline 3", "headline 4"],
  "descriptions": ["descripcion 1 (max 90 chars)", "descripcion 2"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Error generating content" }, { status: 500 });
  }

  const result = await response.json();
  const text = result.content?.[0]?.text || "{}";

  try {
    const content = JSON.parse(text);
    return NextResponse.json(content);
  } catch {
    return NextResponse.json({ error: "Invalid response format", raw: text }, { status: 500 });
  }
}
