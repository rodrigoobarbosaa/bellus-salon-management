"use client";

import { useTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/locale";
import { Globe } from "lucide-react";

const langs = ["pt", "es", "en"] as const;

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

export function LandingLangSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState("es");

  useEffect(() => {
    setCurrent(getCookie("locale") ?? "es");
  }, []);

  function pick(loc: string) {
    if (loc === current) return;
    startTransition(async () => {
      await setLocale(loc as "pt" | "es" | "en" | "ru");
      router.refresh();
      setCurrent(loc);
    });
  }

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-xs">
      <Globe className="size-3 text-white/40" />
      {langs.map((loc, i) => (
        <span key={loc} className="flex items-center">
          {i > 0 && <span className="mr-1.5 text-white/20">|</span>}
          <button
            onClick={() => pick(loc)}
            disabled={isPending}
            className={`rounded px-1 py-0.5 transition ${
              current === loc
                ? "font-semibold text-[#c9a96e]"
                : "cursor-pointer text-white/40 hover:text-white/80"
            } ${isPending ? "opacity-50" : ""}`}
          >
            {loc.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
