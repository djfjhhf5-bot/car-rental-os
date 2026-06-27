"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, ChatMessageSkeleton } from "@/components/ai-chat/chat-message";
import { ChatInput } from "@/components/ai-chat/chat-input";
import { WelcomeMessage } from "@/components/ai-chat/welcome-message";
import { toast } from "@/components/ui/toast";
import { Trash2, AlertCircle } from "lucide-react";
import { getChatHistory, saveChatMessage, clearChatHistory, getAgencyContext, getActiveLlmConfig } from "@/lib/actions/chat-actions";
import { queryLlm } from "@/lib/services/llm";
import type { ChatMessage as ChatMessageType } from "@/lib/actions/chat-actions";
import type { AgencyContext } from "@/lib/actions/chat-actions";
import type { LlmConfig } from "@/lib/services/llm";

export default function AiChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [llmConfigured, setLlmConfigured] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const ctxResult = await getAgencyContext();
        if (!ctxResult.success || !ctxResult.data) return;

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
  }, []);

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
          setLlmConfigured(false);
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
          await saveChatMessage(
            "assistant",
            errorMsg.content,
            "error: llm_not_configured"
          );
          setIsLoading(false);
          return;
        }

        setLlmConfigured(true);

        if (!ctxResult.success || !ctxResult.data) {
          throw new Error("Failed to fetch agency context");
        }

        const llmMessages = messages.concat(userMsg).map((m) => ({
          role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant" | "system",
          content: m.content,
        }));

        const llmResult = await queryLlm(
          llmMessages,
          ctxResult.data,
          configResult.data,
          content
        );

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
        const errorMsg =
          err instanceof Error ? err.message : "An unexpected error occurred";
        toast({
          title: "Error",
          description: errorMsg,
          variant: "destructive",
        });

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

  const handleNewChat = useCallback(async () => {
    await clearChatHistory();
    setMessages([]);
    setLlmConfigured(null);
    setIsLoading(false);
  }, []);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion);
    },
    [handleSend]
  );

  const isFirstLoad = !isInitialized;

  if (isFirstLoad) {
    return (
      <div className="flex h-full flex-col">
        <LoadingHeader />
        <div className="flex-1 space-y-4 p-4">
          <ChatMessageSkeleton />
          <ChatMessageSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">AI Chat</h1>
          {llmConfigured === false && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              <AlertCircle className="h-3 w-3" />
              Not configured
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewChat}
          disabled={isLoading || messages.length === 0}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          New Chat
        </Button>
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

      <ChatInput
        onSend={handleSend}
        isLoading={isLoading}
        disabled={!isInitialized}
      />
    </div>
  );
}

function LoadingHeader() {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="h-8 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}
