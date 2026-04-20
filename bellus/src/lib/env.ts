import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL deve ser uma URL válida"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY é obrigatório"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Bellus"),
  ANTHROPIC_API_KEY: z.string().default(""),
  EVOLUTION_API_URL: z.string().default(""),
  EVOLUTION_API_KEY: z.string().default(""),
  EVOLUTION_INSTANCE_NAME: z.string().default("Bellus"),
  EVOLUTION_INSTANCE_TOKEN: z.string().default(""),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
});

const _env = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL,
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY,
  EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME,
  EVOLUTION_INSTANCE_TOKEN: process.env.EVOLUTION_INSTANCE_TOKEN,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
});

if (!_env.success) {
  console.error("Variaveis de ambiente invalidas:");
  console.error(_env.error.flatten().fieldErrors);
}

export const isEnvConfigured = _env.success;

type Env = z.infer<typeof envSchema>;

export const env: Env = _env.success
  ? _env.data
  : {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "Bellus",
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
      EVOLUTION_API_URL: process.env.EVOLUTION_API_URL ?? "",
      EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ?? "",
      EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME ?? "Bellus",
      EVOLUTION_INSTANCE_TOKEN: process.env.EVOLUTION_INSTANCE_TOKEN ?? "",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
    };
