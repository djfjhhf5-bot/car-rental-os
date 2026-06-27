"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, ChatMessageSkeleton } from "@/components/ai-chat/chat-message";
import { ChatInput } from "@/components/ai-chat/chat-input";
import { WelcomeMessage } from "@/components/ai-chat/welcome-message";
import { getChatHistory, saveChatMessage, getAgencyContext, getActiveLlmConfig } from "@/lib/actions/chat-actions";
import { queryLlm } from "@/lib/services/llm";
import { toast } from "@/components/ui/toast";
import { MessageCircle, X, Bot } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/actions/chat-actions";

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    async function init() {
      try {
        const chatResult = await getChatHistory();
        if (chatResult.success && chatResult.data) {
          setMessages(chatResult.data);
        }
        setIsInitialized(true);
      } catch {
        setIsInitialized(true);
      }
    }
    init();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = useCallback(
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
        await saveChatMessage("user", content);

        const [ctxResult, configResult] = await Promise.all([
          getAgencyContext(),
          getActiveLlmConfig(),
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
          await saveChatMessage("assistant", errorMsg.content, "error: llm_not_configured");
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

        const llmResult = await queryLlm(llmMessages, ctxResult.data, configResult.data, content);

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
        await saveChatMessage("assistant", llmResult.data);
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
    [isLoading, messages]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend]
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 bottom-4 right-4">
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
                <WelcomeMessage onSuggestionClick={handleSuggestionClick} />
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
                  {isLoading && <ChatMessageSkeleton />}
                </>
              )}
            </div>
          </ScrollArea>

          <ChatInput onSend={handleSend} isLoading={isLoading} disabled={!isInitialized} />
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
