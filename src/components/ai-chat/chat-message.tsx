"use client";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ChatMessageProps {
  role: string;
  content: string;
  createdAt?: Date | string;
}

export function ChatMessage({ role, content, createdAt }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser && "items-end")}>
        <Card
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm"
          )}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </Card>

        {createdAt && (
          <p className="px-1 text-[10px] text-muted-foreground">
            {formatDateTime(createdAt)}
          </p>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

export function ChatMessageSkeleton() {
  return (
    <div className="flex w-full gap-3 justify-start">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex max-w-[80%] flex-col gap-1">
        <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5">
          <div className="space-y-2">
            <div className="h-3 w-48 animate-pulse rounded bg-muted-foreground/20" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted-foreground/20" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted-foreground/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
