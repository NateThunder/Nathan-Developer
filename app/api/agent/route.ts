import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type Service = {
  name: string;
  summary: string;
};

type EstimateArgs = {
  projectType?: string;
  pageCount?: number;
  includesCms?: boolean;
  includesBranding?: boolean;
  urgency?: "normal" | "fast" | "rush";
};

type QuoteArgs = {
  name?: string;
  email?: string;
  organization?: string;
  projectType?: string;
  timeline?: string;
  notes?: string;
};

type RateBucket = {
  count: number;
  resetAt: number;
};

type Provider = "openai" | "groq";
type ProviderMode = Provider | "auto";

type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

type GroqToolCall = {
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type ProviderResult = {
  ok: boolean;
  reply?: string;
  error?: string;
};

const CONTACT = {
  email: "hello@studio.com",
  phone: "+44 7846 677463",
  booking: "Use the Book a call button on this page.",
};

const SERVICES: Service[] = [
  {
    name: "Strategy",
    summary: "Positioning, messaging, and information architecture.",
  },
  {
    name: "UI/UX",
    summary: "Interface design, responsive layouts, and interaction design.",
  },
  {
    name: "Build",
    summary: "Production-ready development with performance and accessibility in mind.",
  },
  {
    name: "Motion",
    summary: "Subtle UI motion for clarity and perceived polish.",
  },
  {
    name: "Maintenance",
    summary: "Ongoing updates, content changes, and iteration support.",
  },
];

const SYSTEM_PROMPT = `
You are the website assistant for <STUDIO_NAME>, a web design studio.

Primary goal:
- Help visitors quickly understand how to get started.
- Drive qualified leads to "Book a call" or quote request.

Studio positioning:
- Fast delivery, high quality execution.
- Works with local businesses, organisations, bands/music projects, charities, and churches.
- Offers strategy, UI/UX, build, motion, and maintenance.
- Builds editable websites (basic CRUD/content editing workflows).

Style rules:
- Keep answers short, clear, and practical.
- Ask at most 1 clarification question at a time when needed.
- Prefer concrete next steps.
- If user asks pricing/timeline, use tools to estimate ranges.
- Always include a direct next action when relevant.
- If uncertain, say what is known and suggest booking a call.
`;

const PROVIDER_MODE: ProviderMode = "groq";
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
const MAX_MESSAGES = 14;
const MAX_CHARS_PER_MESSAGE = 1200;
const MAX_OUTPUT_TOKENS = 420;
const MAX_TOOL_ROUNDS = 4;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateBuckets = new Map<string, RateBucket>();

const quoteSubmissions: Array<{
  createdAt: string;
  payload: Required<Pick<QuoteArgs, "name" | "email">> &
    Omit<QuoteArgs, "name" | "email">;
}> = [];

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "get_services",
    description: "Get studio services and the fastest way to start a project.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "estimate_price_range",
    description:
      "Estimate directional project price range and timeline in GBP based on scope.",
    parameters: {
      type: "object",
      properties: {
        projectType: { type: "string" },
        pageCount: { type: "number" },
        includesCms: { type: "boolean" },
        includesBranding: { type: "boolean" },
        urgency: { type: "string", enum: ["normal", "fast", "rush"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_booking_details",
    description: "Return email, phone, and direct call-booking instructions.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "submit_quote_request",
    description: "Capture quote request details. Requires at least name and email.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        organization: { type: "string" },
        projectType: { type: "string" },
        timeline: { type: "string" },
        notes: { type: "string" },
      },
      additionalProperties: false,
    },
  },
];

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return "unknown";
}

function enforceRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);

  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (bucket.count >= RATE_LIMIT_MAX) {
    return false;
  }

  bucket.count += 1;
  rateBuckets.set(ip, bucket);
  return true;
}

function clampMessage(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, MAX_CHARS_PER_MESSAGE);
}

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized: ChatMessage[] = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const role =
        (entry as { role?: string }).role === "assistant" ? "assistant" : "user";
      const content = clampMessage((entry as { content?: unknown }).content);

      if (!content) {
        return null;
      }

      return { role, content };
    })
    .filter((item): item is ChatMessage => item !== null);

  return normalized.slice(-MAX_MESSAGES);
}

function getServices() {
  return {
    services: SERVICES,
    start:
      "Best start: share your goal, target audience, page count, and timeline in one message.",
  };
}

function estimatePriceRange(args: EstimateArgs) {
  const pageCount = Math.min(Math.max(args.pageCount ?? 5, 1), 40);
  let min = 900 + pageCount * 220;
  let max = 1700 + pageCount * 380;

  const type = (args.projectType ?? "").toLowerCase();
  if (type.includes("ecommerce")) {
    min += 1000;
    max += 2400;
  }
  if (type.includes("music") || type.includes("band")) {
    min += 400;
    max += 900;
  }
  if (type.includes("church") || type.includes("charity")) {
    min += 300;
    max += 700;
  }

  if (args.includesCms) {
    min += 450;
    max += 1200;
  }
  if (args.includesBranding) {
    min += 600;
    max += 1700;
  }

  switch (args.urgency) {
    case "fast":
      min = Math.round(min * 1.12);
      max = Math.round(max * 1.16);
      break;
    case "rush":
      min = Math.round(min * 1.22);
      max = Math.round(max * 1.3);
      break;
    default:
      break;
  }

  const timelineWeeks = Math.max(2, Math.ceil(pageCount / 3));
  const timingText =
    args.urgency === "rush"
      ? `${Math.max(1, timelineWeeks - 2)}-${Math.max(2, timelineWeeks - 1)} weeks`
      : args.urgency === "fast"
        ? `${Math.max(2, timelineWeeks - 1)}-${timelineWeeks} weeks`
        : `${timelineWeeks}-${timelineWeeks + 1} weeks`;

  return {
    currency: "GBP",
    estimatedRange: {
      min,
      max,
    },
    estimatedTimeline: timingText,
    note:
      "This is a directional estimate, not a formal quote. A call confirms scope and fixed pricing.",
  };
}

function getBookingDetails() {
  return {
    contact: CONTACT,
    steps: [
      "Share your project goal and target audience.",
      "Include preferred timeline and rough budget if available.",
      "Use Book a call to discuss scope and receive a clear quote.",
    ],
  };
}

function submitQuoteRequest(args: QuoteArgs) {
  const name = clampMessage(args.name);
  const email = clampMessage(args.email);

  if (!name || !email) {
    return {
      ok: false,
      error: "Name and email are required to submit a quote request.",
      contact: CONTACT,
    };
  }

  quoteSubmissions.push({
    createdAt: new Date().toISOString(),
    payload: {
      name,
      email,
      organization: clampMessage(args.organization),
      projectType: clampMessage(args.projectType),
      timeline: clampMessage(args.timeline),
      notes: clampMessage(args.notes),
    },
  });

  return {
    ok: true,
    message:
      "Quote request captured. Please also use Book a call so we can confirm scope quickly.",
    contact: CONTACT,
  };
}

function runTool(name: string, args: unknown) {
  if (name === "get_services") {
    return getServices();
  }

  if (name === "estimate_price_range") {
    return estimatePriceRange((args ?? {}) as EstimateArgs);
  }

  if (name === "get_booking_details") {
    return getBookingDetails();
  }

  if (name === "submit_quote_request") {
    return submitQuoteRequest((args ?? {}) as QuoteArgs);
  }

  return { error: `Unknown tool: ${name}` };
}

function buildResponsesTools() {
  return TOOL_DEFINITIONS.map((tool) => ({
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));
}

function buildChatTools() {
  return TOOL_DEFINITIONS.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

function extractResponseToolCalls(responseJson: unknown): Array<{
  call_id: string;
  name: string;
  arguments: string;
}> {
  if (!responseJson || typeof responseJson !== "object") {
    return [];
  }

  const output = (responseJson as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return [];
  }

  return output
    .filter((item) => {
      return (
        !!item &&
        typeof item === "object" &&
        (item as { type?: string }).type === "function_call"
      );
    })
    .map((item) => {
      const typed = item as {
        call_id?: string;
        name?: string;
        arguments?: string;
      };

      return {
        call_id: typed.call_id ?? "",
        name: typed.name ?? "",
        arguments: typed.arguments ?? "{}",
      };
    })
    .filter((call) => call.call_id && call.name);
}

function extractResponseOutputText(responseJson: unknown): string {
  if (!responseJson || typeof responseJson !== "object") {
    return "";
  }

  const text = (responseJson as { output_text?: unknown }).output_text;
  if (typeof text === "string" && text.trim()) {
    return text.trim();
  }

  const output = (responseJson as { output?: unknown }).output;
  if (!Array.isArray(output)) {
    return "";
  }

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    if ((item as { type?: string }).type !== "message") {
      continue;
    }

    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) {
      continue;
    }

    for (const block of content) {
      if (!block || typeof block !== "object") {
        continue;
      }
      if ((block as { type?: string }).type === "output_text") {
        const value = (block as { text?: unknown }).text;
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }
    }
  }

  return "";
}

function extractGroqChoiceMessage(responseJson: unknown): {
  content?: unknown;
  tool_calls?: unknown;
} | null {
  if (!responseJson || typeof responseJson !== "object") {
    return null;
  }

  const choices = (responseJson as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices.length) {
    return null;
  }

  const first = choices[0];
  if (!first || typeof first !== "object") {
    return null;
  }

  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== "object") {
    return null;
  }

  return message as { content?: unknown; tool_calls?: unknown };
}

function extractGroqMessageText(message: { content?: unknown }): string {
  if (typeof message.content === "string" && message.content.trim()) {
    return message.content.trim();
  }

  return "";
}

function extractGroqToolCalls(message: { tool_calls?: unknown }): Array<{
  id: string;
  name: string;
  arguments: string;
}> {
  if (!Array.isArray(message.tool_calls)) {
    return [];
  }

  return (message.tool_calls as GroqToolCall[])
    .map((call) => ({
      id: call.id ?? "",
      name: call.function?.name ?? "",
      arguments: call.function?.arguments ?? "{}",
    }))
    .filter((call) => call.id && call.name);
}

function getProviderMode(): ProviderMode {
  if (PROVIDER_MODE === "groq") {
    return "groq";
  }
  if (PROVIDER_MODE === "auto") {
    return "auto";
  }
  return "openai";
}

function resolveProvider(mode: ProviderMode): Provider | null {
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  if (mode === "openai") {
    return hasOpenAI ? "openai" : null;
  }

  if (mode === "groq") {
    return hasGroq ? "groq" : null;
  }

  if (hasOpenAI) {
    return "openai";
  }
  if (hasGroq) {
    return "groq";
  }

  return null;
}

function looksLikeInsufficientQuota(error: string): boolean {
  const normalized = error.toLowerCase();
  return (
    normalized.includes("insufficient_quota") ||
    normalized.includes("exceeded your current quota")
  );
}

function looksLikeOpenAIAuthError(error: string): boolean {
  const normalized = error.toLowerCase();
  return (
    normalized.includes("invalid_issuer") ||
    normalized.includes("invalid api key") ||
    normalized.includes("invalid_api_key") ||
    normalized.includes("authentication token is not from a valid issuer") ||
    normalized.includes("openai api error (401)")
  );
}

async function callOpenAIResponses(payload: Record<string, unknown>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false as const,
      error:
        "Missing OPENAI_API_KEY. Set it in your environment to enable the chat agent.",
    };
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const raw = await res.text();
    return {
      ok: false as const,
      error: `OpenAI API error (${res.status}): ${raw.slice(0, 500)}`,
    };
  }

  const json = (await res.json()) as Record<string, unknown>;
  return { ok: true as const, json };
}

async function callGroqChatCompletions(payload: Record<string, unknown>) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      ok: false as const,
      error:
        "Missing GROQ_API_KEY. Set it in your environment to enable Groq for the chat agent.",
    };
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const raw = await res.text();
    return {
      ok: false as const,
      error: `Groq API error (${res.status}): ${raw.slice(0, 500)}`,
    };
  }

  const json = (await res.json()) as Record<string, unknown>;
  return { ok: true as const, json };
}

async function generateWithOpenAI(transcript: string): Promise<ProviderResult> {
  const tools = buildResponsesTools();
  const input = [
    {
      role: "user",
      content: [{ type: "input_text", text: transcript }],
    },
  ];

  const first = await callOpenAIResponses({
    model: OPENAI_MODEL,
    instructions: SYSTEM_PROMPT,
    input,
    tools,
    tool_choice: "auto",
    max_output_tokens: MAX_OUTPUT_TOKENS,
  });

  if (!first.ok) {
    return { ok: false, error: first.error };
  }

  let responseJson = first.json;

  for (let i = 0; i < MAX_TOOL_ROUNDS; i += 1) {
    const calls = extractResponseToolCalls(responseJson);
    if (!calls.length) {
      break;
    }

    const toolOutputs = calls.map((call) => {
      let parsedArgs: unknown = {};
      try {
        parsedArgs = JSON.parse(call.arguments || "{}");
      } catch {
        parsedArgs = {};
      }

      const output = runTool(call.name, parsedArgs);
      return {
        type: "function_call_output",
        call_id: call.call_id,
        output: JSON.stringify(output),
      };
    });

    const followUp = await callOpenAIResponses({
      model: OPENAI_MODEL,
      instructions: SYSTEM_PROMPT,
      previous_response_id: (responseJson as { id?: unknown }).id,
      input: toolOutputs,
      tools,
      tool_choice: "auto",
      max_output_tokens: MAX_OUTPUT_TOKENS,
    });

    if (!followUp.ok) {
      return { ok: false, error: followUp.error };
    }

    responseJson = followUp.json;
  }

  const reply =
    extractResponseOutputText(responseJson) ||
    "I can help with services, pricing, and next steps. Tell me your project type, timeline, and goals.";

  return { ok: true, reply };
}

async function generateWithGroq(transcript: string): Promise<ProviderResult> {
  const tools = buildChatTools();
  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: transcript },
  ];

  for (let i = 0; i < MAX_TOOL_ROUNDS; i += 1) {
    const step = await callGroqChatCompletions({
      model: GROQ_MODEL,
      messages,
      tools,
      tool_choice: "auto",
      max_completion_tokens: MAX_OUTPUT_TOKENS,
    });

    if (!step.ok) {
      return { ok: false, error: step.error };
    }

    const message = extractGroqChoiceMessage(step.json);
    if (!message) {
      return { ok: false, error: "Groq API error: missing assistant message." };
    }

    const assistantText = extractGroqMessageText(message);
    const toolCalls = extractGroqToolCalls(message);

    messages.push({
      role: "assistant",
      content: assistantText,
      ...(Array.isArray(message.tool_calls) && message.tool_calls.length
        ? { tool_calls: message.tool_calls }
        : {}),
    });

    if (!toolCalls.length) {
      return {
        ok: true,
        reply:
          assistantText ||
          "I can help with services, pricing, and next steps. Tell me your project type, timeline, and goals.",
      };
    }

    for (const call of toolCalls) {
      let parsedArgs: unknown = {};
      try {
        parsedArgs = JSON.parse(call.arguments || "{}");
      } catch {
        parsedArgs = {};
      }

      const output = runTool(call.name, parsedArgs);

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.name,
        content: JSON.stringify(output),
      });
    }
  }

  const finalStep = await callGroqChatCompletions({
    model: GROQ_MODEL,
    messages,
    tools,
    tool_choice: "auto",
    max_completion_tokens: MAX_OUTPUT_TOKENS,
  });

  if (!finalStep.ok) {
    return { ok: false, error: finalStep.error };
  }

  const finalMessage = extractGroqChoiceMessage(finalStep.json);
  if (!finalMessage) {
    return { ok: false, error: "Groq API error: missing final assistant message." };
  }

  return {
    ok: true,
    reply:
      extractGroqMessageText(finalMessage) ||
      "I can help with services, pricing, and next steps. Tell me your project type, timeline, and goals.",
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!enforceRateLimit(ip)) {
    return NextResponse.json(
      {
        reply: "Too many requests right now. Please wait a moment and try again.",
      },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawMessages = (body as { messages?: unknown })?.messages;
  const messages = sanitizeMessages(rawMessages);

  if (!messages.length) {
    return NextResponse.json(
      { error: "Provide at least one chat message." },
      { status: 400 }
    );
  }

  const transcript = messages
    .map(
      (message) =>
        `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`
    )
    .join("\n");

  const mode = getProviderMode();
  const provider = resolveProvider(mode);

  if (!provider) {
    const setupMessage =
      mode === "groq"
        ? "Assistant setup incomplete. Add GROQ_API_KEY and redeploy."
        : "Assistant setup incomplete. Add OPENAI_API_KEY or GROQ_API_KEY and redeploy.";

    return NextResponse.json(
      {
        reply: setupMessage,
      },
      { status: 502 }
    );
  }

  const hasGroq = Boolean(process.env.GROQ_API_KEY);
  let result: ProviderResult;

  if (provider === "openai") {
    result = await generateWithOpenAI(transcript);

    if (
      !result.ok &&
      mode !== "groq" &&
      hasGroq &&
      result.error &&
      (looksLikeInsufficientQuota(result.error) ||
        looksLikeOpenAIAuthError(result.error))
    ) {
      const fallback = await generateWithGroq(transcript);
      if (fallback.ok) {
        result = fallback;
      }
    }
  } else {
    result = await generateWithGroq(transcript);
  }

  if (!result.ok) {
    return NextResponse.json(
      {
        reply:
          "The assistant is temporarily unavailable. Please use Book a call to continue.",
        error: result.error ?? "Unknown provider error.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ reply: result.reply });
}
