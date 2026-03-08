import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yvfdgvdwozvlfpghsncq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2ZmRndmR3b3p2bGZwZ2hzbmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODQwODAsImV4cCI6MjA4Nzk2MDA4MH0.DDb4_X7rSNsP5RiU0RHYmpusdL1j2fx7gxXzXpCjQJo";

// Storage that works everywhere: SSR (Node), Web (browser), Native (iOS/Android)
const universalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      }
    } catch {
      // SSR or native — no localStorage
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: universalStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
