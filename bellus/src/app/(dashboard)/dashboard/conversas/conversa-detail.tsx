"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Bot, User, Send, UserCheck, XCircle, RefreshCw, Phone, Instagram } from "lucide-react";
import { assumeConversation, releaseConversation, closeConversation, sendHumanMessage } from "@/app/actions/conversas";

interface Conversa {
  id: string;
  canal: string;
  external_id: string;
  estado: string;
  ultima_mensagem_em: string | null;
  created_at: string;
  cliente_id: string | null;
  clientes: { nome: string; telefone: string } | null;
}

interface Mensagem {
  id: string;
  direcao: string;
  tipo: string;
  conteudo: string | null;
  status: string;
  created_at: string;
}

export function ConversaDetail({ conversa, salaoId }: { conversa: Conversa; salaoId: string }) {
  const t = useTranslations("conversas");
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [estado, setEstado] = useState(conversa.estado);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    setEstado(conversa.estado);
    fetchMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversa.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/conversas/${conversa.id}/mensagens`);
      if (res.ok) {
        const data = await res.json();
        setMensagens(data.mensagens ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleAssume() {
    const result = await assumeConversation(conversa.id);
    if (result.success) setEstado("aguardando_humano");
  }

  async function handleRelease() {
    const result = await releaseConversation(conversa.id);
    if (result.success) setEstado("ativo");
  }

  async function handleClose() {
    const result = await closeConversation(conversa.id);
    if (result.success) setEstado("encerrado");
  }

  async function handleSend() {
    if (!messageText.trim() || sending) return;
    setSending(true);
    try {
      const result = await sendHumanMessage(conversa.id, salaoId, conversa.canal, conversa.external_id, messageText.trim());
      if (result.success) {
        setMessageText("");
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100">
            {conversa.canal === "whatsapp" ? (
              <Phone className="h-4 w-4 text-green-600" />
            ) : (
              <Instagram className="h-4 w-4 text-pink-500" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-stone-900">
              {conversa.clientes?.nome ?? conversa.external_id}
            </p>
            <p className="text-xs text-stone-400">
              {conversa.canal === "whatsapp" ? "WhatsApp" : "Instagram"} &middot;{" "}
              {conversa.clientes?.telefone ?? conversa.external_id}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {estado === "ativo" && (
            <button
              onClick={handleAssume}
              className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
            >
              <UserCheck className="h-3.5 w-3.5" />
              {t("actions.assume")}
            </button>
          )}
          {estado === "aguardando_humano" && (
            <button
              onClick={handleRelease}
              className="flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-100"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t("actions.release")}
            </button>
          )}
          {estado !== "encerrado" && (
            <button
              onClick={handleClose}
              className="flex items-center gap-1.5 rounded-lg bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-100"
            >
              <XCircle className="h-3.5 w-3.5" />
              {t("actions.close")}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-bellus-gold" />
          </div>
        ) : mensagens.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">{t("noMessages")}</p>
        ) : (
          mensagens.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direcao === "recebida" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  msg.direcao === "recebida"
                    ? "bg-stone-100 text-stone-800"
                    : "bg-bellus-gold/90 text-white"
                }`}
              >
                {/* Sender indicator */}
                <div className="mb-1 flex items-center gap-1">
                  {msg.direcao === "recebida" ? (
                    <User className="h-3 w-3 text-stone-400" />
                  ) : (
                    <Bot className="h-3 w-3 opacity-70" />
                  )}
                  <span className={`text-[10px] ${msg.direcao === "recebida" ? "text-stone-400" : "text-white/70"}`}>
                    {msg.direcao === "recebida" ? t("labels.cliente") : t("labels.bellus")}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.conteudo ?? `[${msg.tipo}]`}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    msg.direcao === "recebida" ? "text-stone-400" : "text-white/60"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {msg.direcao === "enviada" && msg.status !== "enviada" && ` · ${msg.status}`}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input area — only when human has assumed control */}
      {estado === "aguardando_humano" && (
        <div className="border-t border-stone-200 p-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={t("inputPlaceholder")}
              className="flex-1 rounded-lg border border-stone-200 px-3 py-2 text-sm focus:border-bellus-gold focus:outline-none focus:ring-1 focus:ring-bellus-gold"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-bellus-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-bellus-gold/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-stone-400">{t("humanModeHint")}</p>
        </div>
      )}

      {/* Info bar when bot is active */}
      {estado === "ativo" && (
        <div className="flex items-center gap-2 border-t border-stone-200 bg-green-50 px-4 py-2.5">
          <Bot className="h-4 w-4 text-green-600" />
          <p className="text-xs text-green-700">{t("botActive")}</p>
        </div>
      )}

      {/* Info bar when closed */}
      {estado === "encerrado" && (
        <div className="flex items-center gap-2 border-t border-stone-200 bg-stone-50 px-4 py-2.5">
          <XCircle className="h-4 w-4 text-stone-400" />
          <p className="text-xs text-stone-500">{t("conversaClosed")}</p>
        </div>
      )}
    </div>
  );
}
