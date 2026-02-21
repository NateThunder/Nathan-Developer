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
  includesApiIntegration?: boolean;
  includesAiAgent?: boolean;
  platform?: "web" | "cross-platform" | "native";
  isMvp?: boolean;
  urgency?: "normal" | "fast" | "rush";
};

type QuoteArgs = {
  name?: string;
  email?: string;
  businessType?: string;
  organization?: string;
  projectType?: string;
  budget?: string;
  timeline?: string;
  requiredFeatures?: string;
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

type InlineToolInvocation = {
  name: "submit_quote_request" | "get_booking_details";
  args: unknown;
};

const CONTACT = {
  email: "manager@nathansomevi.com",
  phone: "+44 7846 677463",
  whatsapp: "+44 7846 677463",
  preferredContact: "WhatsApp",
  calendar:
    "https://calendar.google.com/calendar/u/0?cid=NGRmYTk5NjFlZDc5YWQ0MjhhYzQ1YmRhMjNkZTdhNDczNTBkMzNiMzA4YmE4MDAzMGU5ZGQzYzVjY2Y1NThkYkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t",
  workingHours: "09:00-18:00 UK time (after-hours calls possible when necessary).",
  booking: "Use the Book a call button on this page.",
};

const SERVICES: Service[] = [
  {
    name: "Websites (React / Next.js)",
    summary: "Fast, scalable websites with clean UX and strong performance.",
  },
  {
    name: "Apps (Swift / React Native / Flutter)",
    summary:
      "Cross-platform MVPs and native mobile apps based on your product goals.",
  },
  {
    name: "API + Database Setup",
    summary: "Backend APIs, databases, file handling, and integration workflows.",
  },
  {
    name: "AI Agent Setup",
    summary:
      "Lead-qualification assistant for light questions, bookings, and scheduling.",
  },
  {
    name: "MVP Prototypes",
    summary:
      "Rapid prototypes and validation builds before full production rollout.",
  },
];

const SYSTEM_PROMPT = `
You are the website assistant for Somevi Labs, a web design studio.

Primary goal:
- Help visitors quickly get started and move them to booking.
- Qualify leads for quotes and calls.
- Handle light questions only; this assistant does not perform coding work.

Business profile:
- Friendly and professional tone, with clear, practical communication.
- Core clients: local businesses, bands/music projects, and charity organisations.
- Core web stack: React + Next.js.
- Mobile stack: Swift, React Native, Flutter.
- Delivery style: fast shipping, high quality, scalable builds.
- Can include editable content workflows (basic CRUD) where relevant.

Pricing and timeline guidance:
- Basic 1-page portfolio website with no extra features: GBP 600-1000, usually around 1 week.
- Advanced website: GBP 1000-3000+, typically 2-4 weeks depending on complexity and features.
- App MVP: GBP 1000-2000, typically 2-8 weeks depending on features and stack.
- Full native app with database + APIs: GBP 3000-8000+, usually longer than cross-platform builds.
- APIs, AI agents, and higher complexity increase both cost and timeline.
- Upper-range quotes require details first: name, email, business type, budget, timeline, required features.

Contact and booking details:
- Email: manager@nathansomevi.com
- Phone/WhatsApp: +44 7846 677463
- Preferred contact: WhatsApp
- Calendar booking link: https://calendar.google.com/calendar/u/0?cid=NGRmYTk5NjFlZDc5YWQ0MjhhYzQ1YmRhMjNkZTdhNDczNTBkMzNiMzA4YmE4MDAzMGU5ZGQzYzVjY2Y1NThkYkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t
- Working hours: 09:00-18:00 UK time (after-hours calls possible when necessary).

Behavior rules:
- Keep answers short and direct.
- Ask at most one clarification question at a time.
- Never invent tools, frameworks, prices, deadlines, or policies.
- Never guarantee outcomes or fixed delivery before confirming scope.
- Do not mention WordPress unless user explicitly asks for WordPress.
- If a request is specific/unclear or needs confirmation, direct to: "Book a call."
- For quote requests, collect required fields before giving upper-range guidance.
`;

const providerModeFromEnv = (process.env.AGENT_PROVIDER ?? "auto").toLowerCase();
const PROVIDER_MODE: ProviderMode =
  providerModeFromEnv === "openai" ||
  providerModeFromEnv === "groq" ||
  providerModeFromEnv === "auto"
    ? providerModeFromEnv
    : "auto";
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
  payload: Required<
    Pick<
      QuoteArgs,
      "name" | "email" | "businessType" | "budget" | "timeline" | "requiredFeatures"
    >
  > &
    Omit<
      QuoteArgs,
      "name" | "email" | "businessType" | "budget" | "timeline" | "requiredFeatures"
    >;
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
        includesApiIntegration: { type: "boolean" },
        includesAiAgent: { type: "boolean" },
        platform: { type: "string", enum: ["web", "cross-platform", "native"] },
        isMvp: { type: "boolean" },
        urgency: { type: "string", enum: ["normal", "fast", "rush"] },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_booking_details",
    description:
      "Return email, phone, WhatsApp preference, calendar link, and booking instructions.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "submit_quote_request",
    description:
      "Capture quote request details. Requires name, email, business type, budget, timeline, and required features.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        businessType: { type: "string" },
        organization: { type: "string" },
        projectType: { type: "string" },
        budget: { type: "string" },
        timeline: { type: "string" },
        requiredFeatures: { type: "string" },
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

function findLatestUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") {
      return messages[i].content;
    }
  }

  return "";
}

function includesAny(value: string, fragments: string[]): boolean {
  return fragments.some((fragment) => value.includes(fragment));
}

function extractQualificationState(messages: ChatMessage[]) {
  const userText = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content)
    .join("\n");
  const text = userText.toLowerCase();

  const email = clampMessage(
    userText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? ""
  );
  const name = clampMessage(
    userText.match(/\b(?:my name is|i am|i'm)\s+([a-z][a-z' -]{1,48})/i)?.[1] ?? ""
  );

  const explicitBusinessType = clampMessage(
    userText.match(
      /\b(?:business type|organisation type|organization type)\s*[:\-]\s*([^\n,.]+)/i
    )?.[1] ?? ""
  );
  const businessType = explicitBusinessType
    ? explicitBusinessType
    : includesAny(text, ["charity", "non-profit", "nonprofit"])
      ? "charity organisation"
      : includesAny(text, ["band", "music"])
        ? "band/music"
        : includesAny(text, ["local business", "small business", "business"])
          ? "local business"
          : "";

  const budgetFromField = clampMessage(
    userText.match(/\b(?:budget|price range|cost range)\s*[:\-]?\s*([^\n.]+)/i)?.[1] ??
      ""
  );
  const budgetFromCurrency = clampMessage(
    userText.match(/£\s?\d[\d,]*(?:\s*(?:to|-)\s*£?\s?\d[\d,]*)?/i)?.[0] ?? ""
  );
  const budget = budgetFromField || budgetFromCurrency;

  const timelineFromField = clampMessage(
    userText.match(/\b(?:timeline|deadline|delivery)\s*[:\-]?\s*([^\n.]+)/i)?.[1] ??
      ""
  );
  const timelineFromDuration = clampMessage(
    userText.match(
      /\b\d+\s*(?:day|days|week|weeks|month|months)\b(?:\s*(?:to|-)\s*\d+\s*(?:day|days|week|weeks|month|months))?/i
    )?.[0] ?? ""
  );
  const timeline = timelineFromField || timelineFromDuration || (text.includes("asap") ? "ASAP" : "");

  let requiredFeatures = clampMessage(
    userText.match(/\b(?:required features|features|scope)\s*[:\-]?\s*([^\n]+)/i)?.[1] ??
      ""
  );
  if (!requiredFeatures) {
    const detected: string[] = [];
    if (includesAny(text, ["api", "apis"])) {
      detected.push("API integration");
    }
    if (includesAny(text, ["database", "db"])) {
      detected.push("database");
    }
    if (includesAny(text, ["ai agent", "assistant"])) {
      detected.push("AI agent");
    }
    if (includesAny(text, ["cms", "crud", "editable"])) {
      detected.push("editable content workflow");
    }
    if (includesAny(text, ["booking", "calendar", "scheduling"])) {
      detected.push("booking/scheduling");
    }
    if (includesAny(text, ["ecommerce", "payments", "shop"])) {
      detected.push("ecommerce");
    }
    requiredFeatures = detected.join(", ");
  }

  return {
    name,
    email,
    businessType: clampMessage(businessType),
    budget: clampMessage(budget),
    timeline: clampMessage(timeline),
    requiredFeatures: clampMessage(requiredFeatures),
  };
}

function getMissingQualificationFields(
  state: ReturnType<typeof extractQualificationState>
): string[] {
  const missing: string[] = [];
  if (!state.name) missing.push("name");
  if (!state.email) missing.push("email");
  if (!state.businessType) missing.push("business type");
  if (!state.budget) missing.push("budget");
  if (!state.timeline) missing.push("timeline");
  if (!state.requiredFeatures) missing.push("required features");
  return missing;
}

function getStaticReply(userText: string, messages: ChatMessage[]): string | null {
  const text = userText.toLowerCase();

  if (
    includesAny(text, [
      "<submit_quote_request>",
      "<get_booking_details>",
      "</function>",
    ])
  ) {
    return "That is internal tool syntax, not something you need to type. Just write your request normally and I will handle it. Book a call.";
  }

  const asksTechStack = includesAny(text, [
    "tech stack",
    "what stack",
    "what do you use",
    "built with",
    "which framework",
    "which tech",
  ]);
  if (asksTechStack) {
    return "We build websites in React and Next.js. For apps, we use Swift, React Native, and Flutter depending on the product. We use modern coding tools for strong performance and scalable quality.";
  }

  const asksAiRole =
    includesAny(text, ["ai agent", "assistant"]) &&
    includesAny(text, ["code", "coding", "build", "develop"]);
  if (asksAiRole) {
    return "The AI agent handles light questions plus booking and scheduling calls/meetings. It does not do coding work.";
  }

  const asksPricing = includesAny(text, [
    "price",
    "pricing",
    "cost",
    "quote",
    "how much",
  ]);
  if (asksPricing) {
    const state = extractQualificationState(messages);
    const missing = getMissingQualificationFields(state);

    if (missing.length) {
      return `For an upper-range quote, please share: ${missing.join(", ")}. Then Book a call.`;
    }

    return "Pricing guide: basic 1-page site is GBP 600-1000. Advanced websites are GBP 1000-3000+ depending on features and timeline. App MVPs are GBP 1000-2000. Full native apps with database + APIs are usually GBP 3000-8000+. For exact upper-range pricing, Book a call.";
  }

  const asksTimeline = includesAny(text, [
    "how long",
    "turnaround",
    "delivery time",
    "timeframe",
    "how many weeks",
    "how quick",
  ]);
  if (asksTimeline) {
    return "Typical timelines: basic website around 1 week. Advanced websites usually 2-4 weeks, sometimes longer for complex features. App MVPs are often 2-8 weeks. Native apps usually take longer than cross-platform. Book a call to lock the scope and timeline.";
  }

  const asksServices = includesAny(text, [
    "services",
    "what do you do",
    "what can you build",
    "what do you offer",
  ]);
  if (asksServices) {
    return "We build websites (React/Next.js), mobile apps (Swift/React Native/Flutter), API + database setups, AI agents for bookings/scheduling, and MVP prototypes. Book a call and we can recommend the best setup for your project.";
  }

  const asksContact = includesAny(text, [
    "contact",
    "whatsapp",
    "book a call",
    "booking",
    "schedule",
    "meeting",
    "calendar",
    "phone number",
    "email address",
    "your email",
    "reach you",
  ]);
  if (asksContact) {
    return `Contact: ${CONTACT.email} | ${CONTACT.phone} (WhatsApp preferred). Working hours: ${CONTACT.workingHours} Calendar: ${CONTACT.calendar} Book a call.`;
  }

  return null;
}

function getServices() {
  return {
    services: SERVICES,
    start:
      "Best start: share business type, goals, budget, timeline, and required features in one message.",
  };
}

function estimatePriceRange(args: EstimateArgs) {
  const projectType = (args.projectType ?? "").toLowerCase();
  const pageCount = Math.min(Math.max(args.pageCount ?? 1, 1), 60);
  const includesApiIntegration =
    Boolean(args.includesApiIntegration) ||
    includesAny(projectType, ["api", "database", "backend"]);
  const includesAiAgent =
    Boolean(args.includesAiAgent) || includesAny(projectType, ["ai agent", "assistant"]);

  const isAppProject =
    args.platform === "cross-platform" ||
    args.platform === "native" ||
    includesAny(projectType, [
      "app",
      "mobile",
      "react native",
      "flutter",
      "swift",
      "ios",
      "android",
    ]);
  const isNative =
    args.platform === "native" ||
    includesAny(projectType, ["native", "swift", "ios", "android"]);
  const isMvp = Boolean(args.isMvp) || includesAny(projectType, ["mvp", "prototype"]);

  let min = 0;
  let max = 0;
  let estimatedTimeline = "";
  let projectClass = "";

  if (isAppProject) {
    if (isNative) {
      min = 3000;
      max = 8000;
      estimatedTimeline = "4-12 weeks";
      projectClass = "full_native_app";
    } else if (isMvp) {
      min = 1000;
      max = 2000;
      estimatedTimeline = "2-8 weeks";
      projectClass = "app_mvp";
    } else {
      min = 1600;
      max = 3200;
      estimatedTimeline = "2-8 weeks";
      projectClass = "cross_platform_app";
    }
  } else {
    const basicOnePage =
      pageCount <= 1 &&
      !args.includesCms &&
      !args.includesBranding &&
      !includesApiIntegration &&
      !includesAiAgent;

    if (basicOnePage) {
      min = 600;
      max = 1000;
      estimatedTimeline = "around 1 week";
      projectClass = "basic_one_page_website";
    } else {
      min = 1000;
      max = 3000;
      estimatedTimeline = "2-4 weeks (longer for complex features)";
      projectClass = "advanced_website";
    }

    if (pageCount > 6) {
      min += 250;
      max += 900;
    }
  }

  if (args.includesCms) {
    min += 250;
    max += 900;
  }
  if (args.includesBranding) {
    min += 250;
    max += 700;
  }
  if (includesApiIntegration) {
    min += 300;
    max += 1400;
  }
  if (includesAiAgent) {
    min += 400;
    max += 1800;
  }

  switch (args.urgency) {
    case "fast":
      min = Math.round(min * 1.08);
      max = Math.round(max * 1.15);
      break;
    case "rush":
      min = Math.round(min * 1.15);
      max = Math.round(max * 1.25);
      break;
    default:
      break;
  }

  return {
    currency: "GBP",
    projectClass,
    estimatedRange: {
      min: Math.round(min),
      max: Math.round(max),
    },
    estimatedTimeline,
    note:
      "Directional estimate only. Upper-range quotes require name, email, business type, budget, timeline, and required features. Book a call to confirm project scope.",
  };
}

function getBookingDetails() {
  return {
    contact: CONTACT,
    steps: [
      "Send name, email, business type, budget, timeline, and required features.",
      "WhatsApp is preferred for quick coordination.",
      "Use Book a call to discuss further and confirm the project scope.",
    ],
  };
}

function submitQuoteRequest(args: QuoteArgs) {
  const name = clampMessage(args.name);
  const email = clampMessage(args.email);
  const businessType = clampMessage(args.businessType || args.organization);
  const budget = clampMessage(args.budget);
  const timeline = clampMessage(args.timeline);
  const requiredFeatures = clampMessage(args.requiredFeatures || args.notes);

  const missing: string[] = [];
  if (!name) missing.push("name");
  if (!email) missing.push("email");
  if (!businessType) missing.push("business type");
  if (!budget) missing.push("budget");
  if (!timeline) missing.push("timeline");
  if (!requiredFeatures) missing.push("required features");

  if (missing.length) {
    return {
      ok: false,
      error: `Please share ${missing.join(", ")} before we quote the upper range. Book a call.`,
      contact: CONTACT,
    };
  }

  quoteSubmissions.push({
    createdAt: new Date().toISOString(),
    payload: {
      name,
      email,
      businessType,
      organization: clampMessage(args.organization),
      projectType: clampMessage(args.projectType),
      budget,
      timeline,
      requiredFeatures,
      notes: clampMessage(args.notes),
    },
  });

  return {
    ok: true,
    message:
      "Your quote request has been captured. Please use the Book a call button on this webpage to discuss further and confirm the project scope.",
    contact: CONTACT,
  };
}

function extractInlineToolInvocations(text: string): InlineToolInvocation[] {
  const invocations: InlineToolInvocation[] = [];
  const pattern = /<(submit_quote_request|get_booking_details)>([\s\S]*?)<\/function>/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const name = match[1] as InlineToolInvocation["name"];
    const rawArgs = (match[2] ?? "").trim();
    let args: unknown = {};

    if (rawArgs) {
      try {
        args = JSON.parse(rawArgs);
      } catch {
        args = {};
      }
    }

    invocations.push({ name, args });
  }

  return invocations;
}

function stringifyBookingDetails(output: unknown): string {
  const contact =
    output && typeof output === "object"
      ? (output as { contact?: Partial<typeof CONTACT> }).contact
      : undefined;
  const resolved = {
    email: contact?.email ?? CONTACT.email,
    phone: contact?.phone ?? CONTACT.phone,
    whatsapp: contact?.whatsapp ?? CONTACT.whatsapp,
    calendar: contact?.calendar ?? CONTACT.calendar,
    workingHours: contact?.workingHours ?? CONTACT.workingHours,
    booking: contact?.booking ?? CONTACT.booking,
  };

  return `Contact: ${resolved.email} | ${resolved.phone} (WhatsApp: ${resolved.whatsapp}). Working hours: ${resolved.workingHours} Calendar: ${resolved.calendar} ${resolved.booking}`;
}

function resolveInlineToolSyntax(text: string): string | null {
  const invocations = extractInlineToolInvocations(text);
  if (!invocations.length) {
    return null;
  }

  const replies: string[] = [];

  for (const invocation of invocations) {
    const output = runTool(invocation.name, invocation.args);

    if (invocation.name === "submit_quote_request") {
      if (
        output &&
        typeof output === "object" &&
        (output as { ok?: boolean }).ok &&
        typeof (output as { message?: unknown }).message === "string"
      ) {
        replies.push((output as { message: string }).message);
      } else if (
        output &&
        typeof output === "object" &&
        typeof (output as { error?: unknown }).error === "string"
      ) {
        replies.push((output as { error: string }).error);
      }
      continue;
    }

    replies.push(stringifyBookingDetails(output));
  }

  return replies.join(" ");
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
  return PROVIDER_MODE;
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

function buildResponsesInput(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: [
      {
        type: message.role === "assistant" ? "output_text" : "input_text",
        text: message.content,
      },
    ],
  }));
}

function buildProviderMessages(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

async function generateWithOpenAI(messages: ChatMessage[]): Promise<ProviderResult> {
  const tools = buildResponsesTools();
  const input = buildResponsesInput(messages);

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

  const resolved = resolveInlineToolSyntax(reply);
  return { ok: true, reply: resolved ?? reply };
}

async function generateWithGroq(messages: ChatMessage[]): Promise<ProviderResult> {
  const tools = buildChatTools();
  const completionMessages: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...buildProviderMessages(messages),
  ];

  for (let i = 0; i < MAX_TOOL_ROUNDS; i += 1) {
    const step = await callGroqChatCompletions({
      model: GROQ_MODEL,
      messages: completionMessages,
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

    completionMessages.push({
      role: "assistant",
      content: assistantText,
      ...(Array.isArray(message.tool_calls) && message.tool_calls.length
        ? { tool_calls: message.tool_calls }
        : {}),
    });

    if (!toolCalls.length) {
      const resolved = resolveInlineToolSyntax(assistantText);
      const fallback =
        assistantText ||
        "I can help with services, pricing, and next steps. Tell me your project type, timeline, and goals.";
      return {
        ok: true,
        reply: resolved ?? fallback,
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

      completionMessages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.name,
        content: JSON.stringify(output),
      });
    }
  }

  const finalStep = await callGroqChatCompletions({
    model: GROQ_MODEL,
    messages: completionMessages,
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
    reply: (() => {
      const text =
        extractGroqMessageText(finalMessage) ||
        "I can help with services, pricing, and next steps. Tell me your project type, timeline, and goals.";
      const resolved = resolveInlineToolSyntax(text);
      return resolved ?? text;
    })(),
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

  const latestUserMessage = findLatestUserMessage(messages);
  const staticReply = getStaticReply(latestUserMessage, messages);
  if (staticReply) {
    return NextResponse.json({ reply: staticReply });
  }

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
    result = await generateWithOpenAI(messages);

    if (!result.ok && mode !== "groq" && hasGroq) {
      const fallback = await generateWithGroq(messages);
      if (fallback.ok) {
        result = fallback;
      }
    }
  } else {
    result = await generateWithGroq(messages);
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
