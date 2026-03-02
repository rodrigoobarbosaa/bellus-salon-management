"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Users, AlertCircle, TrendingUp, Phone, Mail, ChevronRight } from "lucide-react";
import { ClienteForm } from "./cliente-form";

interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  idioma_preferido: string;
  opt_out_notificacoes: boolean;
  proximo_retorno: string | null;
  created_at: string;
}

interface ReturnNotif {
  id: string;
  tipo: string;
  status: string;
  cliente_id: string;
}

interface ClientesListProps {
  clientes: Cliente[];
  totalClientes: number;
  pendingReturn: number;
  returnNotifs: ReturnNotif[];
}

const IDIOMA_LABELS: Record<string, string> = { es: "ES", pt: "PT", en: "EN", ru: "RU" };

export function ClientesList({ clientes, totalClientes, pendingReturn, returnNotifs }: ClientesListProps) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.telefone.includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [clientes, search]);

  const today = new Date().toISOString().slice(0, 10);

  // Conversion stats
  const totalSent = returnNotifs.length;
  const totalConverted = returnNotifs.filter((n) => n.status === "enviado").length;
  const conversionRate = totalSent > 0 ? Math.round((totalConverted / totalSent) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Clientes</h1>
          <p className="text-sm text-stone-500">{totalClientes} clientes registrados</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-1 h-4 w-4" /> Nuevo cliente
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">{totalClientes}</p>
              <p className="text-xs text-stone-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">{pendingReturn}</p>
              <p className="text-xs text-stone-500">Retorno pendiente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-800">{conversionRate}%</p>
              <p className="text-xs text-stone-500">Conversión retorno</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <Input
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client list */}
      <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-stone-400">
            {search ? "No se encontraron clientes." : "Aún no hay clientes registrados."}
          </div>
        ) : (
          filtered.map((c) => {
            const isOverdue = c.proximo_retorno && c.proximo_retorno <= today;
            return (
              <Link
                key={c.id}
                href={`/dashboard/clientes/${c.id}`}
                className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bellus-gold/10 text-sm font-bold text-bellus-gold">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-800">{c.nome}</span>
                      <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-500">
                        {IDIOMA_LABELS[c.idioma_preferido] ?? c.idioma_preferido}
                      </span>
                      {isOverdue && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          Retorno
                        </span>
                      )}
                      {c.opt_out_notificacoes && (
                        <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                          Opt-out
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.telefone}
                      </span>
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
              </Link>
            );
          })
        )}
      </div>

      <ClienteForm open={showForm} onOpenChange={setShowForm} />
    </div>
  );
}
