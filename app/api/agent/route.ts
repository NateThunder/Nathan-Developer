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

type FormattedTone = "friendly_professional";

type FormattedAgentPayload = {
  tone: FormattedTone;
  summary: string;
  missing_fields: string[];
  next_question: string;
  reply: string;
  format_source: "schema" | "fallback";
};

type ToolName =
  | "get_services"
  | "estimate_price_range"
  | "get_booking_details"
  | "submit_quote_request";

type InlineToolInvocation = {
  name: ToolName;
  args: unknown;
};

const CONTACT = {
  email: "manager@nathansomevi.com",
  phone: "+44 7846 677463",
  whatsapp: "+44 7846 677463",
  preferredContact: "WhatsApp",
  calendar: "",
  workingHours: "09:00-18:00 UK time (after-hours calls possible when necessary).",
  booking: "Use the Book a Call button on this page.",
};

const QUALIFICATION_CORE =
  "Share your business type, goals, budget, timeline, and required features in one message.";

const RESPONSE_POLICY = {
  scopeAndNextSteps:
    "I can help with scope, pricing, and next steps. Share your business type, goals, budget, timeline, and required features, then use the Book a Call button.",
  qualificationCore: QUALIFICATION_CORE,
  qualificationNextStep: `${QUALIFICATION_CORE.replace(
    /\.$/,
    ""
  )}, then use the Book a Call button.`,
  quoteViaBookCall:
    "For upper-range quotes, use the Book a Call button and share your business type, goals, budget, timeline, and required features. We can confirm scope and next steps on the call.",
  toolSyntax:
    "That is internal tool syntax, not something you need to type. Just write your request normally and I will handle it. Use the Book a Call button on this page.",
  directCoding:
    "This assistant does not do coding work directly. I can help you scope the project and next steps. Share business type, goals, budget, timeline, and required features, then use the Book a Call button.",
  techStack:
    "We build websites in React and Next.js. For apps, we use Swift, React Native, and Flutter depending on the product. We use modern coding tools for strong performance and scalable quality.",
  aiRole:
    "The AI agent handles light questions plus booking and scheduling calls/meetings. It does not do coding work.",
  bookingIntent:
    "Perfect. Use the Book a Call button on this page to choose a time. In the project summary, mention your classes, what you need, and your preferred timeline.",
  pricingGuide:
    "Pricing guide: basic 1-page site is GBP 600-1000. Advanced websites are GBP 1000-3000+ depending on features and timeline. App MVPs are GBP 1000-2000. Full native apps with database + APIs are usually GBP 3000-8000+. For exact upper-range pricing, use the Book a Call button.",
  timelineGuide:
    "Typical timelines: basic website around 1 week. Advanced websites usually 2-4 weeks, sometimes longer for complex features. App MVPs are often 2-8 weeks. Native apps usually take longer than cross-platform. Use the Book a Call button to lock the scope and timeline.",
  services:
    "We build business websites, mobile apps, custom systems, booking automations, and MVP prototypes. If you want, I can recommend the best option for your project, or you can use the Book a Call button.",
  servicesCompact:
    "We build websites, apps, custom systems, booking automations, and MVPs. Share your goals and timeline, then use the Book a Call button.",
  estimateFallback:
    "I can estimate pricing once the scope is confirmed. Share key requirements, then use the Book a Call button.",
  providerFallback:
    "I can still help you get started. Share business type, goals, budget, timeline, and required features in one message, then use the Book a Call button.",
  quoteScopeConfirm: "Use the Book a Call button to discuss further and confirm the project scope.",
  quoteCaptured:
    "Your quote request has been captured. Please use the Book a Call button on this page to discuss further and confirm the project scope.",
};

const SERVICES: Service[] = [
  {
    name: "Business Websites",
    summary: "High-converting websites built for your audience and goals.",
  },
  {
    name: "Mobile Apps",
    summary: "Customer-facing apps for bookings, memberships, and digital services.",
  },
  {
    name: "Custom Systems",
    summary: "Internal tools, integrations, and data workflows for daily operations.",
  },
  {
    name: "Booking and Automation",
    summary: "Automated booking, scheduling, and lead follow-up experiences.",
  },
  {
    name: "MVP Prototypes",
    summary: "Fast validation builds before full-scale development.",
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
- Booking: ${CONTACT.booking}
- Working hours: 09:00-18:00 UK time (after-hours calls possible when necessary).

Behavior rules:
- Keep answers short and direct.
- Ask at most one clarification question at a time.
- Use a warm, human tone: acknowledge the idea before asking for details.
- In early discovery, avoid jumping straight to budget unless the user asks for pricing.
- Prefer asking about goals/outcomes before budget on first qualification turns.
- Never invent tools, frameworks, prices, deadlines, or policies.
- Never guarantee outcomes or fixed delivery before confirming scope.
- Do not mention WordPress unless user explicitly asks for WordPress.
- Never output raw tool/function syntax (for example: <function=...>...</function>).
- Never ask a visitor to share their email just so you can send a quote.
- For quote follow-up, always direct to: "${CONTACT.booking}"
- If a request is specific/unclear or needs confirmation, direct to: "${CONTACT.booking}"
- For quote requests, collect required fields before giving upper-range guidance.

Canonical response policy (must match site hardcoded responses):
- Booking intent: "${RESPONSE_POLICY.bookingIntent}"
- Services (non-technical): "${RESPONSE_POLICY.services}"
- Pricing if details are missing: ask for missing fields, then direct to "${CONTACT.booking}".
- Only provide tech stack details when user explicitly asks for stack/framework/tech.
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
const QUALIFICATION_LOOKBACK_MESSAGES = 60;
const MAX_CHARS_PER_MESSAGE = 1200;
const MAX_OUTPUT_TOKENS = 420;
const MAX_TOOL_ROUNDS = 4;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const FORMATTER_MAX_SUMMARY_CHARS = 280;
const FORMATTER_MAX_QUESTION_CHARS = 200;
const FORMATTER_MAX_REPLY_CHARS = 420;
const BOOK_CALL_FOLLOW_UP_QUESTION = "Would you like to book a call?";
const FORMATTER_ALLOWED_MISSING_FIELDS = new Set([
  "name",
  "email",
  "business type",
  "budget",
  "timeline",
  "required features",
  "scope",
  "goals",
  "availability",
]);
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
      "Return email, phone, WhatsApp preference, working hours, and booking instructions.",
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

function normalizeIp(value: string): string {
  const trimmed = value.trim().replace(/^\[(.*)\]$/, "$1");

  if (!trimmed) {
    return "";
  }

  // Strip ":port" only for IPv4 values; keep IPv6 values intact.
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(trimmed)) {
    return trimmed.replace(/:\d+$/, "");
  }

  return trimmed;
}

function getClientIp(req: NextRequest): string {
  const directCandidates = [
    req.headers.get("x-real-ip"),
    req.headers.get("cf-connecting-ip"),
  ];
  for (const value of directCandidates) {
    if (!value) continue;
    const normalized = normalizeIp(value);
    if (normalized) return normalized;
  }

  const canTrustForwarded =
    process.env.NODE_ENV !== "production" ||
    process.env.TRUST_PROXY === "true" ||
    Boolean(process.env.VERCEL);

  if (canTrustForwarded) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      for (const candidate of forwarded.split(",")) {
        const normalized = normalizeIp(candidate);
        if (normalized) {
          return normalized;
        }
      }
    }
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

function sanitizeMessages(raw: unknown, maxMessages: number = MAX_MESSAGES): ChatMessage[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized: ChatMessage[] = raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const rawRole = (entry as { role?: unknown }).role;
      if (rawRole !== undefined && rawRole !== "assistant" && rawRole !== "user") {
        return null;
      }

      const role: ChatRole = rawRole === "assistant" ? "assistant" : "user";
      const content = clampMessage((entry as { content?: unknown }).content);

      if (!content) {
        return null;
      }

      return { role, content };
    })
    .filter((item): item is ChatMessage => item !== null);

  return normalized.slice(-Math.max(1, maxMessages));
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
    userText.match(/\b(?:my name is|i am|i'm|this is|name\s*[:\-])\s*([a-z][a-z' -]{1,48})/i)?.[1] ??
      ""
  );

  const explicitBusinessType = clampMessage(
    userText.match(
      /\b(?:business type|organisation type|organization type|company type|industry)\s*[:\-]\s*([^\n,.]+)/i
    )?.[1] ?? ""
  );
  const businessType = explicitBusinessType
    ? explicitBusinessType
    : includesAny(text, ["charity", "non-profit", "nonprofit"])
      ? "charity organisation"
    : includesAny(text, ["band", "music"])
      ? "band/music"
        : /\b(?:local|small)\s+business\b/.test(text) ||
            /\b(?:my|our)\s+business\b/.test(text)
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

function hasTechStackIntent(text: string): boolean {
  return includesAny(text, [
    "tech stack",
    "what stack",
    "what do you use",
    "built with",
    "which framework",
    "which tech",
  ]);
}

function hasBookingIntent(text: string): boolean {
  return (
    /\bbook(?:ing)?\b/.test(text) ||
    /\bschedule\b/.test(text) ||
    /\bmeeting\b/.test(text) ||
    /\bappointment\b/.test(text) ||
    /\bavailable times?\b/.test(text) ||
    /\btime slots?\b/.test(text)
  );
}

function filterBehaviorResponse(
  reply: string,
  latestUserMessage: string,
  messages: ChatMessage[] = []
): string {
  const normalizedWhitespace = reply.replace(/\s+/g, " ").trim();
  if (!normalizedWhitespace) {
    return "";
  }

  const normalized = normalizedWhitespace.replace(/\?\./g, "?");
  const latestUserText = latestUserMessage.toLowerCase();
  const userAskedTechStack = hasTechStackIntent(latestUserText);
  const userAskedBooking = hasBookingIntent(latestUserText);
  const qualificationState = messages.length ? extractQualificationState(messages) : null;
  const hasBudgetContext = Boolean(qualificationState?.budget);

  // Keep booking replies simple and action-oriented unless stack details are explicitly requested.
  if (userAskedBooking && !userAskedTechStack) {
    return RESPONSE_POLICY.bookingIntent;
  }

  if (
    /<function=/i.test(normalized) ||
    /<\/function>/i.test(normalized) ||
    /<(?:get_services|estimate_price_range|get_booking_details|submit_quote_request)>/i.test(
      normalized
    )
  ) {
    return RESPONSE_POLICY.scopeAndNextSteps;
  }

  const asksForEmailToSendQuote =
    /\b(?:provide|share)(?:\s+me)?(?:\s+with)?\s+your\s+email(?:\s+address)?\b/i.test(
      normalized
    ) &&
    /\bquote\b/i.test(normalized);
  const framesEmailAsQuoteStep =
    /\byour\s+email(?:\s+address)?\b/i.test(normalized) &&
    /\b(?:send|share|provide)\b/i.test(normalized) &&
    /\bquote\b/i.test(normalized);
  if (asksForEmailToSendQuote || framesEmailAsQuoteStep) {
    return RESPONSE_POLICY.quoteViaBookCall;
  }

  if (!userAskedTechStack) {
    const looksLikeTechnicalServiceDump =
      /\bservices?:\b/i.test(normalized) &&
      /\b(?:react|next\.?js|swift|react native|flutter|api|database)\b/i.test(normalized);
    if (looksLikeTechnicalServiceDump) {
      return RESPONSE_POLICY.services;
    }
  }

  const abruptBudgetPrompt =
    /\b(?:to get started|to start)\b/i.test(normalized) &&
    /\b(?:rough|approx(?:imate)?|ballpark)?\s*budget\b/i.test(normalized);
  if (abruptBudgetPrompt && !hasBudgetContext) {
    return "Love the idea for your business. If you are happy to share, what budget range are you aiming for? That helps me suggest the best next step.";
  }

  const abruptFeaturePrompt =
    /\bkey features?\b/i.test(normalized) &&
    /\bwebsite\b/i.test(normalized) &&
    /\bcan you please share\b/i.test(normalized);
  if (abruptFeaturePrompt) {
    return "Great start. What are the top 2-3 features you want first? For example: class schedule, booking, payments, testimonials, or a contact form.";
  }

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  if (wordCount < 4 || /^contact us\.?$/i.test(normalized)) {
    return RESPONSE_POLICY.qualificationNextStep;
  }

  return normalized;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clampText(value: string, maxChars: number): string {
  if (maxChars <= 0) {
    return "";
  }
  return normalizeWhitespace(value).slice(0, maxChars).trim();
}

function truncateAtWordBoundary(value: string, maxChars: number): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return "";
  }
  if (normalized.length <= maxChars) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxChars + 1);
  const lastSpace = sliced.lastIndexOf(" ");
  const cut =
    lastSpace >= Math.floor(maxChars * 0.55) ? sliced.slice(0, lastSpace) : sliced.slice(0, maxChars);
  return `${cut.trim()}...`;
}

function appendBookCallFollowUp(reply: string): string {
  const normalized = normalizeWhitespace(reply);
  if (!normalized) {
    return clampText(BOOK_CALL_FOLLOW_UP_QUESTION, FORMATTER_MAX_REPLY_CHARS);
  }

  if (/\bwould you like to book a call\?/i.test(normalized)) {
    return clampText(normalized, FORMATTER_MAX_REPLY_CHARS);
  }

  const maxBaseChars = FORMATTER_MAX_REPLY_CHARS - BOOK_CALL_FOLLOW_UP_QUESTION.length - 1;
  if (maxBaseChars <= 0) {
    return clampText(BOOK_CALL_FOLLOW_UP_QUESTION, FORMATTER_MAX_REPLY_CHARS);
  }

  const base = clampText(normalized, maxBaseChars);
  if (!base) {
    return clampText(BOOK_CALL_FOLLOW_UP_QUESTION, FORMATTER_MAX_REPLY_CHARS);
  }

  return `${base} ${BOOK_CALL_FOLLOW_UP_QUESTION}`;
}

function toFormatterTone(value: unknown): FormattedTone {
  if (typeof value !== "string") {
    return "friendly_professional";
  }

  const normalized = value.toLowerCase().replace(/[-\s]+/g, "_").trim();
  if (normalized === "friendly_professional") {
    return "friendly_professional";
  }

  return "friendly_professional";
}

function normalizeMissingFieldArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const cleaned = value
    .map((item) => (typeof item === "string" ? item : ""))
    .map((item) => item.toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim())
    .filter((item) => FORMATTER_ALLOWED_MISSING_FIELDS.has(item));

  return Array.from(new Set(cleaned));
}

function questionForMissingField(field: string): string {
  if (field === "scope") {
    return "What is the core scope for version one?";
  }
  if (field === "goals") {
    return "What is the main outcome you want this project to deliver?";
  }
  if (field === "availability") {
    return "When are you available to start and review milestones?";
  }
  if (field === "name") {
    return "What name should I use for your project request?";
  }
  if (field === "email") {
    return "What email should I use for follow-up?";
  }
  if (field === "business type") {
    return "What type of business or organisation is this for?";
  }
  if (field === "budget") {
    return "What budget range are you aiming for?";
  }
  if (field === "timeline") {
    return "What timeline are you targeting for launch?";
  }
  if (field === "required features") {
    return "What are the top features you need first?";
  }

  return "What detail should we confirm next?";
}

function splitSummaryAndQuestion(text: string): {
  summary: string;
  nextQuestion: string;
} {
  const normalized = normalizeWhitespace(text);
  if (!normalized) {
    return { summary: "", nextQuestion: "" };
  }

  const segments = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  if (segments.length >= 2) {
    const tail = segments[segments.length - 1] ?? "";
    if (tail.endsWith("?")) {
      const summary = truncateAtWordBoundary(
        segments.slice(0, -1).join(" "),
        FORMATTER_MAX_SUMMARY_CHARS
      );
      return {
        summary: summary || truncateAtWordBoundary(normalized, FORMATTER_MAX_SUMMARY_CHARS),
        nextQuestion: truncateAtWordBoundary(tail, FORMATTER_MAX_QUESTION_CHARS),
      };
    }
  }

  return {
    summary: truncateAtWordBoundary(normalized, FORMATTER_MAX_SUMMARY_CHARS),
    nextQuestion: "",
  };
}

function extractJsonCandidate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const fenced = fencedMatch[1].trim();
    if (fenced.startsWith("{") && fenced.endsWith("}")) {
      return fenced;
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return null;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const candidate = extractJsonCandidate(text);
  if (!candidate) {
    return null;
  }

  try {
    const parsed = JSON.parse(candidate);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return null;
  }

  return null;
}

function parseStructuredFormatterPayload(rawReply: string): {
  tone: FormattedTone;
  summary: string;
  missingFields: string[];
  nextQuestion: string;
  replyText: string;
  hasMissingFieldsKey: boolean;
} | null {
  const parsed = parseJsonObject(rawReply);
  if (!parsed) {
    return null;
  }

  const summarySource = parsed.summary ?? parsed.message ?? parsed.reply;
  const summary = truncateAtWordBoundary(
    typeof summarySource === "string" ? summarySource : "",
    FORMATTER_MAX_SUMMARY_CHARS
  );
  if (!summary) {
    return null;
  }

  const hasMissingFieldsKey =
    Object.prototype.hasOwnProperty.call(parsed, "missing_fields") ||
    Object.prototype.hasOwnProperty.call(parsed, "missingFields");
  const rawMissing = parsed.missing_fields ?? parsed.missingFields;
  if (hasMissingFieldsKey && !Array.isArray(rawMissing)) {
    return null;
  }

  const nextQuestionSource = parsed.next_question ?? parsed.nextQuestion;
  if (
    nextQuestionSource !== undefined &&
    nextQuestionSource !== null &&
    typeof nextQuestionSource !== "string"
  ) {
    return null;
  }

  const replySource = parsed.reply;
  if (replySource !== undefined && replySource !== null && typeof replySource !== "string") {
    return null;
  }

  return {
    tone: toFormatterTone(parsed.tone),
    summary,
    missingFields: normalizeMissingFieldArray(rawMissing),
    nextQuestion: truncateAtWordBoundary(
      typeof nextQuestionSource === "string" ? nextQuestionSource : "",
      FORMATTER_MAX_QUESTION_CHARS
    ),
    replyText: truncateAtWordBoundary(
      typeof replySource === "string" ? replySource : "",
      FORMATTER_MAX_REPLY_CHARS
    ),
    hasMissingFieldsKey,
  };
}

function buildFallbackFormattedPayload(
  rawReply: string,
  latestUserMessage: string,
  messages: ChatMessage[]
): FormattedAgentPayload {
  const filteredReply = filterBehaviorResponse(rawReply, latestUserMessage, messages);
  const qualificationState = extractQualificationState(messages);
  const missingFields = getMissingQualificationFields(qualificationState);
  const split = splitSummaryAndQuestion(filteredReply);
  const summary =
    split.summary || truncateAtWordBoundary(RESPONSE_POLICY.providerFallback, FORMATTER_MAX_SUMMARY_CHARS);
  const nextQuestion = split.nextQuestion
    ? split.nextQuestion
    : missingFields.length
      ? questionForMissingField(missingFields[0] ?? "")
      : BOOK_CALL_FOLLOW_UP_QUESTION;

  const replyBase =
    truncateAtWordBoundary(filteredReply, FORMATTER_MAX_REPLY_CHARS) ||
    truncateAtWordBoundary(
      normalizeWhitespace([summary, nextQuestion].filter(Boolean).join(" ")),
      FORMATTER_MAX_REPLY_CHARS
    ) ||
    RESPONSE_POLICY.providerFallback;
  const reply = appendBookCallFollowUp(replyBase);

  return {
    tone: "friendly_professional",
    summary,
    missing_fields: missingFields,
    next_question: nextQuestion,
    reply,
    format_source: "fallback",
  };
}

function formatAgentResponse(
  rawReply: string,
  latestUserMessage: string,
  messages: ChatMessage[]
): FormattedAgentPayload {
  const fallback = buildFallbackFormattedPayload(rawReply, latestUserMessage, messages);
  const parsed =
    parseStructuredFormatterPayload(rawReply) ??
    parseStructuredFormatterPayload(fallback.reply);
  if (!parsed) {
    return fallback;
  }

  const missingFields = parsed.hasMissingFieldsKey
    ? parsed.missingFields
    : fallback.missing_fields;
  const nextQuestion =
    parsed.nextQuestion ||
    (missingFields.length
      ? questionForMissingField(missingFields[0] ?? "")
      : BOOK_CALL_FOLLOW_UP_QUESTION);
  const mappedReplyRaw =
    parsed.replyText || normalizeWhitespace([parsed.summary, nextQuestion].filter(Boolean).join(" "));
  const mappedReply = filterBehaviorResponse(mappedReplyRaw, latestUserMessage, messages);
  const safeReply = appendBookCallFollowUp(
    truncateAtWordBoundary(mappedReply, FORMATTER_MAX_REPLY_CHARS) || fallback.reply
  );

  return {
    tone: parsed.tone,
    summary: parsed.summary,
    missing_fields: missingFields,
    next_question: nextQuestion,
    reply: safeReply,
    format_source: "schema",
  };
}

function buildProviderInstructions(messages: ChatMessage[]): string {
  const qualification = extractQualificationState(messages);
  const knownFields = [
    qualification.name ? "name" : "",
    qualification.email ? "email" : "",
    qualification.businessType ? "business type" : "",
    qualification.budget ? "budget" : "",
    qualification.timeline ? "timeline" : "",
    qualification.requiredFeatures ? "required features" : "",
  ].filter(Boolean);
  const missingFields = getMissingQualificationFields(qualification);
  const latestUser = clampMessage(findLatestUserMessage(messages));

  return `${SYSTEM_PROMPT}

Request context:
- Latest user message: ${JSON.stringify(latestUser)}
- Known qualification fields: ${
    knownFields.length ? knownFields.join(", ") : "none"
  }
- Missing qualification fields: ${
    missingFields.length ? missingFields.join(", ") : "none"
  }

Output contract:
- Prefer a JSON object (no markdown) with keys:
  - tone: "friendly_professional"
  - summary: string
  - missing_fields: string[]
  - next_question: string
- Ask at most one follow-up question.
- If details are complete, set missing_fields to [] and next_question to "".
- If JSON output is not possible, return concise plain text in a friendly professional tone.
`;
}

function getStaticReply(userText: string, messages: ChatMessage[]): string | null {
  const text = userText.toLowerCase();

  if (
    includesAny(text, [
      "<submit_quote_request>",
      "<get_booking_details>",
      "<function=",
      "</function>",
    ])
  ) {
    return RESPONSE_POLICY.toolSyntax;
  }

  const asksDirectCoding = includesAny(text, [
    "write code",
    "write the code",
    "build and ship",
    "build the app code",
    "full app code",
    "code it for me",
    "build the backend",
    "build the frontend",
    "develop it for me",
    "ship the app code",
  ]);
  if (asksDirectCoding) {
    return RESPONSE_POLICY.directCoding;
  }

  const asksTechStack = hasTechStackIntent(text);
  if (asksTechStack) {
    return RESPONSE_POLICY.techStack;
  }

  const asksAiRole =
    includesAny(text, ["ai agent", "assistant"]) &&
    includesAny(text, ["code", "coding", "build", "develop"]);
  if (asksAiRole) {
    return RESPONSE_POLICY.aiRole;
  }

  const asksBooking = hasBookingIntent(text);
  if (asksBooking) {
    return RESPONSE_POLICY.bookingIntent;
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
      return `For an upper-range quote, please share: ${missing.join(", ")}. Then ${CONTACT.booking}`;
    }

    return RESPONSE_POLICY.pricingGuide;
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
    return RESPONSE_POLICY.timelineGuide;
  }

  const asksServices = includesAny(text, [
    "services",
    "what do you do",
    "what can you build",
    "what do you offer",
  ]);
  if (asksServices) {
    return RESPONSE_POLICY.services;
  }

  const asksContact = includesAny(text, [
    "contact",
    "whatsapp",
    "book a call",
    "schedule",
    "meeting",
    "calendar",
    "phone number",
    "email address",
    "your email",
    "reach you",
  ]);
  if (asksContact) {
    return `Contact: ${CONTACT.email} | ${CONTACT.phone} (WhatsApp preferred). Working hours: ${CONTACT.workingHours} ${CONTACT.booking}`;
  }

  return null;
}

function getServices() {
  return {
    services: SERVICES,
    start: RESPONSE_POLICY.qualificationCore,
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
      `Directional estimate only. Upper-range quotes require name, email, business type, budget, timeline, and required features. ${RESPONSE_POLICY.quoteScopeConfirm}`,
  };
}

function getBookingDetails() {
  return {
    contact: CONTACT,
    steps: [
      "Send name, email, business type, budget, timeline, and required features.",
      "WhatsApp is preferred for quick coordination.",
      RESPONSE_POLICY.quoteScopeConfirm,
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
      error: `Please share ${missing.join(", ")} before we quote the upper range. ${CONTACT.booking}`,
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
    message: RESPONSE_POLICY.quoteCaptured,
    contact: CONTACT,
  };
}

function isToolName(value: string): value is ToolName {
  return (
    value === "get_services" ||
    value === "estimate_price_range" ||
    value === "get_booking_details" ||
    value === "submit_quote_request"
  );
}

function parseInlineToolArgs(rawArgs: string): unknown {
  const trimmed = rawArgs.trim();
  if (!trimmed) {
    return {};
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return {};
  }
}

function extractInlineToolInvocations(text: string): InlineToolInvocation[] {
  const invocations: InlineToolInvocation[] = [];
  const pushInvocation = (rawName: string, rawArgs: string) => {
    if (!isToolName(rawName)) {
      return;
    }
    invocations.push({
      name: rawName,
      args: parseInlineToolArgs(rawArgs),
    });
  };

  let match: RegExpExecArray | null;

  const explicitTagPattern =
    /<(get_services|estimate_price_range|get_booking_details|submit_quote_request)>([\s\S]*?)<\/(?:\1|function)>/gi;
  while ((match = explicitTagPattern.exec(text)) !== null) {
    pushInvocation(match[1] ?? "", match[2] ?? "");
  }

  const functionAssignPattern =
    /<function=(get_services|estimate_price_range|get_booking_details|submit_quote_request)>([\s\S]*?)<\/function>/gi;
  while ((match = functionAssignPattern.exec(text)) !== null) {
    pushInvocation(match[1] ?? "", match[2] ?? "");
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
    workingHours: contact?.workingHours ?? CONTACT.workingHours,
    booking: contact?.booking ?? CONTACT.booking,
  };

  return `Contact: ${resolved.email} | ${resolved.phone} (WhatsApp: ${resolved.whatsapp}). Working hours: ${resolved.workingHours} ${resolved.booking}`;
}

function stringifyEstimateRange(output: unknown): string {
  if (!output || typeof output !== "object") {
    return RESPONSE_POLICY.estimateFallback;
  }

  const typed = output as {
    currency?: unknown;
    estimatedRange?: { min?: unknown; max?: unknown };
    estimatedTimeline?: unknown;
    note?: unknown;
  };

  const min =
    typeof typed.estimatedRange?.min === "number" ? typed.estimatedRange.min : null;
  const max =
    typeof typed.estimatedRange?.max === "number" ? typed.estimatedRange.max : null;
  const currency = typeof typed.currency === "string" ? typed.currency : "GBP";
  const timeline =
    typeof typed.estimatedTimeline === "string" ? typed.estimatedTimeline : "";
  const note = typeof typed.note === "string" ? typed.note : "";

  if (min === null || max === null) {
    return RESPONSE_POLICY.estimateFallback;
  }

  return `Estimated range: ${currency} ${min}-${max}. Timeline: ${timeline || "depends on scope"}. ${note}`.trim();
}

function stringifyServicesOutput(output: unknown): string {
  if (!output || typeof output !== "object") {
    return RESPONSE_POLICY.servicesCompact;
  }

  const typed = output as {
    services?: Array<{ name?: unknown }>;
    start?: unknown;
  };

  const names = Array.isArray(typed.services)
    ? typed.services
        .map((service) => (typeof service?.name === "string" ? service.name : ""))
        .filter(Boolean)
    : [];
  const start = typeof typed.start === "string" ? typed.start : "";

  if (!names.length) {
    return RESPONSE_POLICY.servicesCompact;
  }

  return `Services: ${names.join(", ")}. ${start}`.trim();
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

    if (invocation.name === "get_booking_details") {
      replies.push(stringifyBookingDetails(output));
      continue;
    }

    if (invocation.name === "estimate_price_range") {
      replies.push(stringifyEstimateRange(output));
      continue;
    }

    replies.push(stringifyServicesOutput(output));
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
  const instructions = buildProviderInstructions(messages);

  const first = await callOpenAIResponses({
    model: OPENAI_MODEL,
    instructions,
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
      instructions,
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

  const reply = extractResponseOutputText(responseJson);
  if (!reply) {
    return {
      ok: false,
      error: "OpenAI API returned an empty assistant response.",
    };
  }

  const resolved = resolveInlineToolSyntax(reply);
  return { ok: true, reply: resolved ?? reply };
}

async function generateWithGroq(messages: ChatMessage[]): Promise<ProviderResult> {
  const tools = buildChatTools();
  const instructions = buildProviderInstructions(messages);
  const completionMessages: Array<Record<string, unknown>> = [
    { role: "system", content: instructions },
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
      if (!assistantText) {
        return {
          ok: false,
          error: "Groq API returned an empty assistant response.",
        };
      }
      const resolved = resolveInlineToolSyntax(assistantText);
      return {
        ok: true,
        reply: resolved ?? assistantText,
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

  const text = extractGroqMessageText(finalMessage);
  if (!text) {
    return { ok: false, error: "Groq API returned an empty final assistant response." };
  }

  const resolved = resolveInlineToolSyntax(text);
  return {
    ok: true,
    reply: resolved ?? text,
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
  const allMessages = sanitizeMessages(rawMessages, QUALIFICATION_LOOKBACK_MESSAGES);
  const messages = allMessages.slice(-MAX_MESSAGES);

  if (!messages.length) {
    return NextResponse.json(
      { error: "Provide at least one chat message." },
      { status: 400 }
    );
  }

  const latestUserMessage = findLatestUserMessage(messages);
  if (!latestUserMessage) {
    return NextResponse.json(
      { error: "Include at least one user message." },
      { status: 400 }
    );
  }

  const staticReply = getStaticReply(latestUserMessage, allMessages);
  if (staticReply) {
    const formatted = formatAgentResponse(staticReply, latestUserMessage, allMessages);
    return NextResponse.json({
      reply: formatted.reply,
      formatted,
    });
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
    console.error("Agent provider failure", result.error ?? "Unknown provider error.");
    const formatted = formatAgentResponse(
      RESPONSE_POLICY.providerFallback,
      latestUserMessage,
      allMessages
    );
    return NextResponse.json({
      reply: formatted.reply,
      formatted,
    });
  }

  const formatted = formatAgentResponse(
    result.reply || RESPONSE_POLICY.providerFallback,
    latestUserMessage,
    allMessages
  );
  return NextResponse.json({
    reply: formatted.reply,
    formatted,
  });
}
