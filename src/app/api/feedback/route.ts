import { NextResponse } from "next/server";
import { sendFeedbackEmail, EmailNotConfiguredError } from "@/lib/email/send";

export const runtime = "nodejs";

const CATEGORIES = ["suggest", "feature", "bug", "complaint", "general", "contact", "tool-request"] as const;
type Category = (typeof CATEGORIES)[number];

const MAX_MESSAGE = 5000;
const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_SUBJECT = 200;
const MAX_PAGE = 300;

/** Sliding-window rate limit: max submissions per IP per window. */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface RateEntry {
  count: number;
  resetAt: number;
}

// In-memory rate limiter. Suitable for a single-instance deployment; for
// multi-instance/serverless, back this with a shared store (e.g. Redis).
const rateLimit = new Map<string, RateEntry>();

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function sanitize(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  // Strip control characters (except newline/tab) to prevent header injection.
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * POST /api/feedback
 * Accepts contact/complaint/feedback submissions and emails them to the owner.
 *
 * Configuration (server-side only, never NEXT_PUBLIC_*):
 *   FEEDBACK_TO_EMAIL   — owner inbox (required to enable delivery)
 *   FEEDBACK_FROM_EMAIL — sender address (provider-dependent)
 *   EMAIL_PROVIDER / EMAIL_PROVIDER_API_KEY / FEEDBACK_SMTP_URL
 *   — see src/lib/email/send.ts and .env.example
 *
 * Returns 503 when email is not configured, 502 when the provider rejects the
 * message, 429 when rate-limited, 400 for invalid input. Never exposes
 * internal/provider errors to the client.
 */
export async function POST(request: Request) {
  if (!checkRateLimit(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;

  // Honeypot: a field hidden from humans but filled by bots. Silently accept
  // (pretend success) so bots don't adapt, but do not send anything.
  const honeypot = sanitize(data.website, 100);
  if (honeypot) {
    return NextResponse.json({ ok: true });
  }

  const category = sanitize(data.category, 40) as Category;
  const name = sanitize(data.name, MAX_NAME);
  const email = sanitize(data.email, MAX_EMAIL);
  const subject = sanitize(data.subject, MAX_SUBJECT);
  const message = sanitize(data.message, MAX_MESSAGE);
  const page = sanitize(data.page, MAX_PAGE);

  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category." }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (email && !isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  try {
    await sendFeedbackEmail({
      category,
      name: name || undefined,
      email: email || undefined,
      subject: subject || undefined,
      message,
      page: page || undefined,
      submittedAt: new Date(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof EmailNotConfiguredError) {
      return NextResponse.json(
        { error: "Feedback is currently unavailable. Please try again later." },
        { status: 503 },
      );
    }
    // Log technical detail server-side only; return a friendly message.
    console.error("[feedback] email delivery failed:", err);
    return NextResponse.json(
      { error: "Failed to send feedback. Please try again later." },
      { status: 502 },
    );
  }
}
