"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, TypingDots } from "@/components/ai-chat/chat-message";
import { ChatInput } from "@/components/ai-chat/chat-input";
import { WelcomeMessage } from "@/components/ai-chat/welcome-message";
import { saveChatMessage, getAgencyContext, getActiveLlmConfig } from "@/lib/actions/chat-actions";
import { queryLlm } from "@/lib/services/llm";
import { toast } from "@/components/ui/toast";
import { MessageCircle, X, Bot } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/actions/chat-actions";

export function FloatingChat() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const carMatch = pathname.match(/^\/rent\/cars\/([^\/]+)/);
  const carId = carMatch ? carMatch[1] : null;
  const agency = searchParams.get("agency") || "demo";
  const agencyParam = carId ? agency : undefined;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [carName, setCarName] = useState<string | null>(null);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const hasAutoSentRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCarIdRef = useRef<string | null>(null);
  const sendFnRef = useRef<(content: string) => void>(async () => {});

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!carId) {
      setCarName(null);
      setHasAutoSent(false);
      hasAutoSentRef.current = false;
      setIsOpen(false);
      setMessages([]);
      prevCarIdRef.current = null;
      return;
    }

    if (carId !== prevCarIdRef.current) {
      prevCarIdRef.current = carId;
      setMessages([]);
      setHasAutoSent(false);
      hasAutoSentRef.current = false;
      setIsOpen(true);
      fetchCarName(carId, agency);
    }
  }, [carId, agency]);

  async function fetchCarName(id: string, agencySlug: string) {
    try {
      const res = await fetch(`/api/public/cars?agency=${agencySlug}&id=${id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCarName(`${json.data.brand} ${json.data.model}`);
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (carId && carName && !hasAutoSentRef.current && messages.length === 0) {
      hasAutoSentRef.current = true;
      setHasAutoSent(true);
      const timer = setTimeout(() => {
        sendFnRef.current(`Tell me about the ${carName}'s features, pricing and availability`);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [carId, carName, messages]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.message) {
        setMessages([]);
        setIsOpen(true);
        setTimeout(() => sendFnRef.current(detail.message), 600);
      }
    };
    window.addEventListener("chat:ask", handler);
    return () => window.removeEventListener("chat:ask", handler);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessageType = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: content.trim(),
        context: null,
        createdAt: new Date(),
        userId: "",
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        await saveChatMessage("user", content, undefined, agencyParam);

        const [ctxResult, configResult] = await Promise.all([
          getAgencyContext(agencyParam),
          getActiveLlmConfig(agencyParam),
        ]);

        if (!configResult.success || !configResult.data) {
          const errorMsg: ChatMessageType = {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              "LLM is not configured. Please go to Settings > LLM Configuration to set up your AI provider.",
            context: null,
            createdAt: new Date(),
            userId: "",
          };
          setMessages((prev) => [...prev, errorMsg]);
          await saveChatMessage("assistant", errorMsg.content, "error: llm_not_configured", agencyParam);
          setIsLoading(false);
          return;
        }

        if (!ctxResult.success || !ctxResult.data) {
          throw new Error("Failed to fetch agency context");
        }

        const llmMessages = messages.concat(userMsg).map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant" | "system",
          content: m.content,
        }));

        const contextType = carId ? "public" : "admin";
        const llmResult = await queryLlm(llmMessages, ctxResult.data, configResult.data, content, contextType, null, carName ? { brand: carName.split(" ")[0], model: carName.split(" ").slice(1).join(" ") } : null);

        if (!llmResult.success || !llmResult.data) {
          throw new Error(llmResult.error || "Failed to get AI response");
        }

        const aiMsg: ChatMessageType = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: llmResult.data,
          context: null,
          createdAt: new Date(),
          userId: "",
        };

        setMessages((prev) => [...prev, aiMsg]);
        await saveChatMessage("assistant", llmResult.data, undefined, agencyParam);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred";
        toast({ title: "Error", description: errorMsg, variant: "destructive" });

        const failMsg: ChatMessageType = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Sorry, something went wrong: ${errorMsg}`,
          context: null,
          createdAt: new Date(),
          userId: "",
        };
        setMessages((prev) => [...prev, failMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, agencyParam, carId, carName]
  );

  sendFnRef.current = sendMessage;

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage(suggestion);
    },
    [sendMessage]
  );

  return (
    <div className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="flex w-full flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all duration-200 sm:w-[380px]"
          style={{ height: "500px", maxHeight: "calc(100vh - 120px)" }}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <ScrollArea ref={scrollRef} className="flex-1">
            <div className="space-y-4 p-4">
              {messages.length === 0 ? (
                <WelcomeMessage onSuggestionClick={handleSuggestionClick} carName={carName || undefined} />
              ) : (
                <>
                  {messages.map((msg) => (
                    <ChatMessage
                      key={msg.id}
                      role={msg.role}
                      content={msg.content}
                      createdAt={msg.createdAt}
                    />
                  ))}
                  {isLoading && <TypingDots />}
                </>
              )}
            </div>
          </ScrollArea>

          <ChatInput onSend={sendMessage} isLoading={isLoading} disabled={false} />
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
      >
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping ping-delayed" />
          </>
        )}
        {isOpen ? (
          <X className="h-6 w-6 relative" />
        ) : (
          <MessageCircle className="h-6 w-6 relative" />
        )}
      </button>
      <style>{`
        .ping-delayed {
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          animation-delay: 0.5s;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
