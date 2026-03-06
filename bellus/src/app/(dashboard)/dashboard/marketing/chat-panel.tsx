"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createConversation,
  updateConversation,
  type ChatMessage,
} from "@/app/actions/marketing";

export function ChatPanel() {
  const t = useTranslations("marketing");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Create conversation if new
    let convId = conversationId;
    if (!convId) {
      convId = await createConversation();
      setConversationId(convId);
    }

    // Stream response
    try {
      const response = await fetch("/api/marketing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          conversationId: convId,
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantText = "";
      let buffer = "";

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                assistantText += data.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantText,
                  };
                  return updated;
                });
              }
            } catch {
              // Skip
            }
          }
        }
      }

      // Save conversation
      if (convId) {
        const finalMessages = [
          ...newMessages,
          { role: "assistant" as const, content: assistantText, timestamp: new Date().toISOString() },
        ];
        const titulo = newMessages[0]?.content.slice(0, 50) || "Conversa";
        await updateConversation(convId, finalMessages, messages.length === 0 ? titulo : undefined);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: t("chatError"),
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="flex h-[600px] flex-col">
      <CardContent className="flex flex-1 flex-col gap-0 p-0">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot className="text-bellus-gold mb-3 size-12 opacity-50" />
              <p className="text-sm font-medium text-stone-600">{t("chatWelcome")}</p>
              <p className="mt-1 max-w-sm text-xs text-stone-400">{t("chatHint")}</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="bg-bellus-gold/10 flex size-7 shrink-0 items-center justify-center rounded-full">
                  <Bot className="text-bellus-gold size-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-bellus-gold text-white"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-200">
                  <User className="size-4 text-stone-600" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="bg-bellus-gold/10 flex size-7 shrink-0 items-center justify-center rounded-full">
                <Bot className="text-bellus-gold size-4" />
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-stone-100 px-3 py-2">
                <Loader2 className="size-4 animate-spin text-stone-400" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-stone-100 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chatPlaceholder")}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
