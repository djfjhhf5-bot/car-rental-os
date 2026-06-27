"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Lightbulb, Sparkles } from "lucide-react";

const SUGGESTIONS = [
  "How can I improve my fleet utilization?",
  "Which cars are most profitable?",
  "What's my booking pipeline look like?",
  "How do I handle a difficult customer?",
  "Guide me through creating a new booking",
];

interface WelcomeMessageProps {
  onSuggestionClick: (suggestion: string) => void;
}

export function WelcomeMessage({ onSuggestionClick }: WelcomeMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
      <div className="mb-4 rounded-full bg-primary/10 p-3">
        <Bot className="h-8 w-8 text-primary" />
      </div>

      <h2 className="mb-1 text-xl font-semibold">AI Assistant</h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        I can help you manage your rental agency, analyze data, apply sales
        frameworks, and make better business decisions. Ask me anything!
      </p>

      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Lightbulb className="h-4 w-4" />
        Suggested questions
      </div>

      <div className="flex max-w-lg flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            className="rounded-full text-xs"
            onClick={() => onSuggestionClick(suggestion)}
          >
            <Sparkles className="mr-1 h-3 w-3" />
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
