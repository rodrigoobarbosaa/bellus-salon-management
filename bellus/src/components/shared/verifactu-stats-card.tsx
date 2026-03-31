"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { FacturasAeatStats } from "@/app/actions/verifactu";

interface VerifactuStatsCardProps {
  stats: FacturasAeatStats;
}

export function VerifactuStatsCard({ stats }: VerifactuStatsCardProps) {
  const hasAlert = stats.rechazadasAntigas > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-stone-400">
          Verifactu AEAT
        </CardTitle>
        <div className="flex size-8 items-center justify-center rounded-lg bg-bellus-gold/10">
          <Send className="text-bellus-gold size-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-green-500" />
              <span className="text-stone-500">Aceptadas</span>
            </span>
            <span className="font-medium text-green-700 tabular-nums">{stats.aceptadas}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span className="text-stone-500">Pendientes</span>
            </span>
            <span className="font-medium text-amber-700 tabular-nums">{stats.pendientes}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500" />
              <span className="text-stone-500">Rechazadas</span>
            </span>
            <span className="font-medium text-red-700 tabular-nums">{stats.rechazadas}</span>
          </div>
        </div>

        {hasAlert && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-sm text-red-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              <strong>{stats.rechazadasAntigas}</strong> factura{stats.rechazadasAntigas > 1 ? "s" : ""} rechazada{stats.rechazadasAntigas > 1 ? "s" : ""} hace mas de 24h
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href="/dashboard/fiscal"
          className="text-bellus-gold hover:text-bellus-gold/80 inline-flex items-center gap-1 text-sm font-medium transition-all hover:gap-2"
        >
          Ver facturas <ArrowRight className="size-3" />
        </Link>
      </CardFooter>
    </Card>
  );
}
