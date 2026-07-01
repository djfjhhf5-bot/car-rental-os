import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/services/encryption";
import type { AgencyContext } from "@/lib/actions/chat-actions";

export type LlmConfig = {
  id: string;
  provider: string;
  apiKey: string | null;
  model: string;
  apiUrl: string | null;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function getLlmConfig(
  agencyId: string
): Promise<{ success: boolean; data?: LlmConfig; error?: string }> {
  try {
    const config = await prisma.llmConfig.findFirst({
      where: { agencyId, active: true },
    });

    if (!config) {
      return { success: false, error: "No active LLM configuration found" };
    }

    return {
      success: true,
      data: {
        id: config.id,
        provider: config.provider,
        apiKey: config.apiKey ? decrypt(config.apiKey) : null,
        model: config.model,
        apiUrl: config.apiUrl,
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch LLM config" };
  }
}

function buildSystemPrompt(context: AgencyContext, contextType: "admin" | "public" = "admin"): string {
  const vehicleList = context.vehicles
    .map(
      (v) =>
        `- ${v.brand} ${v.model} (${v.year}) — ${v.category}, ${v.transmission}, ${v.fuelType}, ${v.seats} seats — ${context.currency} ${v.dailyRate.toLocaleString()}/day (weekly: ${v.weeklyRate ? context.currency + " " + v.weeklyRate.toLocaleString() : "N/A"}, monthly: ${v.monthlyRate ? context.currency + " " + v.monthlyRate.toLocaleString() : "N/A"}) — Deposit: ${context.currency} ${v.depositAmount.toLocaleString()} — Status: ${v.status}`
    )
    .join("\n");

  if (contextType === "public") {
    return `You are a friendly WhatsApp assistant for ${context.agencyName}, a car rental agency.

## FLEET
${vehicleList}

## RULES
- Always greet warmly first, then ask about their needs (when, where, how many people, budget)
- Keep responses under 3 short sentences
- Reference specific cars with prices from the fleet above
- Use ${context.currency}
- Never mention admin/internal features
- If they ask "what cars", list all available with key details then ask about needs
- Guide users to the website page they're looking for:
  - Browse cars → ${context.carsPageUrl}
  - Booking/renting → ${context.carsPageUrl}
  - Agency info/contact → keep it conversational, no link needed
- Do NOT send the link in casual greetings or general chat`;
  }

  const fleetSummary = context.fleetSummary;
  const utilizationRate =
    fleetSummary.total > 0
      ? Math.round(
          ((fleetSummary.booked + fleetSummary.available) /
            fleetSummary.total) *
            100
        )
      : 0;

  return `You are an expert AI assistant for Car Rental OS, a comprehensive car rental management platform. You help agency owners and staff manage their fleet, bookings, clients, and business operations.

## AGENCY DATA CONTEXT
Current agency data for ${context.agencyName}:
- Fleet: ${fleetSummary.total} total vehicles (${fleetSummary.available} available, ${fleetSummary.booked} booked/rented, ${fleetSummary.maintenance} in maintenance) — ${utilizationRate}% utilization
- Active Bookings: ${context.activeBookings}
- Total Clients: ${context.totalClients}
- Revenue This Month: ${context.currency} ${context.revenueThisMonth.toLocaleString()}
- Total Revenue: ${context.currency} ${context.totalRevenue.toLocaleString()}
- Bookings This Month: ${context.recentBookingsCount}
- Popular Categories: ${context.popularCategories.map((c) => `${c.category} (${c.count})`).join(", ")}

### FLEET VEHICLES (${context.vehicles.length} total)
${vehicleList}

## SALES & MARKETING FRAMEWORKS

When advising on sales, customer acquisition, or closing deals, apply these frameworks:

### AIDA (Attention → Interest → Desire → Action)
- **Attention**: Grab prospect attention with compelling offers, stats, or pain points
- **Interest**: Build interest by highlighting unique value propositions (e.g., "Our SUV fleet includes 2024 models with GPS")
- **Desire**: Create desire through benefits ("Free additional driver, unlimited mileage")
- **Action**: Clear call-to-action ("Book a test drive today")

### Sales Funnel (Awareness → Interest → Decision → Action)
- **Awareness**: How prospects discover the agency (Google, referrals, social media)
- **Interest**: Engaging content (specials, fleet showcase, blog)
- **Decision**: Pricing, comparisons, testimonials that drive choice
- **Action**: Booking completion, contract signing

### SPIN Selling (Situation → Problem → Implication → Need-payoff)
- **Situation**: Ask about current rental arrangements
- **Problem**: Identify frustrations (hidden fees, old cars, poor service)
- **Implication**: Explore consequences of not solving it
- **Need-payoff**: Present your solution's value

### Storytelling in Sales
- Connect emotionally with customer stories
- Share success stories ("A client rented our van for a family trip and loved the GPS and child seat options")
- Use testimonials and case studies

### Social Selling
- Build relationships before pitching
- Provide value through tips and insights
- Engage on WhatsApp and social platforms

### Customer Acquisition Strategies
- Referral programs (discount for referring friends)
- Corporate accounts with negotiated rates
- Seasonal promotions and partnerships (hotels, travel agencies)
- Online presence optimization (Google Business Profile, reviews)

## APP USAGE GUIDANCE
Explain how to use Car Rental OS features including:
- Fleet management (add/edit vehicles, track maintenance, update status)
- Booking management (create/modify/cancel bookings, check availability)
- Client management (add clients, track history)
- Contract management (create contracts from templates, digital signatures)
- Payment tracking (record payments, deposits, refunds)
- Reports and dashboard analytics
- WhatsApp integration for customer communication
- AI chat for business insights

## BUSINESS DECISION SUPPORT
- Analyze fleet utilization and suggest improvements
- Identify revenue opportunities and underperforming areas
- Recommend pricing strategies based on demand
- Advise on maintenance scheduling to minimize downtime
- Help with customer complaint resolution
- Suggest marketing strategies based on agency data

## RESPONSE GUIDELINES
- Be concise, practical, and data-driven
- Reference the agency's actual data when giving advice
- Provide actionable steps, not just theory
- When asked about specific features, explain step-by-step how to use them
- Use a professional but friendly tone
- If you don't have enough data to give specific advice, ask clarifying questions
- Format responses with clear sections when helpful, but avoid excessive formatting
- Keep responses focused on car rental business operations`;
}

function buildUserMessage(
  messages: ChatMessage[],
  userInput: string
): string {
  const conversationHistory = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `Previous conversation:\n${conversationHistory}\n\nUser's new message: ${userInput}`;
}

export async function queryLlm(
  messages: ChatMessage[],
  agencyContext: AgencyContext,
  llmConfig: LlmConfig,
  userInput: string,
  contextType: "admin" | "public" = "admin"
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const systemPrompt = buildSystemPrompt(agencyContext, contextType);
    const userMessage = buildUserMessage(messages, userInput);

    switch (llmConfig.provider) {
      case "openai":
        return queryOpenAI(systemPrompt, userMessage, llmConfig);
      case "anthropic":
        return queryAnthropic(systemPrompt, userMessage, llmConfig);
      case "openrouter":
        return queryOpenRouter(systemPrompt, userMessage, llmConfig);
      case "custom":
        return queryCustom(systemPrompt, userMessage, llmConfig);
      default:
        return queryOpenAI(systemPrompt, userMessage, llmConfig);
    }
  } catch {
    return { success: false, error: "Failed to query LLM" };
  }
}

async function queryOpenAI(
  systemPrompt: string,
  userMessage: string,
  config: LlmConfig
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "OpenAI API key not configured" };
    }

    const response = await fetch(
      config.apiUrl || "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `OpenAI API error: ${err}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from OpenAI" };
    }

    return { success: true, data: content.trim() };
  } catch {
    return { success: false, error: "Failed to query OpenAI" };
  }
}

async function queryAnthropic(
  systemPrompt: string,
  userMessage: string,
  config: LlmConfig
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Anthropic API key not configured" };
    }

    const response = await fetch(
      config.apiUrl || "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model || "claude-3-opus-20240229",
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `Anthropic API error: ${err}` };
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) {
      return { success: false, error: "No response from Anthropic" };
    }

    return { success: true, data: content.trim() };
  } catch {
    return { success: false, error: "Failed to query Anthropic" };
  }
}

async function queryOpenRouter(
  systemPrompt: string,
  userMessage: string,
  config: LlmConfig
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const apiKey = config.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { success: false, error: "OpenRouter API key not configured" };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(
      config.apiUrl || "https://openrouter.ai/api/v1/chat/completions",
      {
        signal: controller.signal,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Car Rental OS",
        },
        body: JSON.stringify({
          model: config.model || "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `OpenRouter API error: ${err}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from OpenRouter" };
    }

    return { success: true, data: content.trim() };
  } catch {
    return { success: false, error: "Failed to query OpenRouter" };
  }
}

async function queryCustom(
  systemPrompt: string,
  userMessage: string,
  config: LlmConfig
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    if (!config.apiUrl) {
      return {
        success: false,
        error: "Custom API URL not configured",
      };
    }

    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey
          ? { Authorization: `Bearer ${config.apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        model: config.model || "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `Custom API error: ${err}` };
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content || data.content?.[0]?.text;
    if (!content) {
      return { success: false, error: "No response from custom API" };
    }

    return { success: true, data: content.trim() };
  } catch {
    return { success: false, error: "Failed to query custom API" };
  }
}
