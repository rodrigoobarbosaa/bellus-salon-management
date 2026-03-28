import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();
  const { data: saloes } = await supabase
    .from("saloes")
    .select("slug, criado_em");

  const bookingPages = (saloes ?? []).map((s) => ({
    url: `https://bellus.app/booking/${s.slug}`,
    lastModified: s.criado_em ? new Date(s.criado_em) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://bellus.app/site",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1.0,
    },
    ...bookingPages,
  ];
}
