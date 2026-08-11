/**
 * Server-side email delivery for QUANTIVA feedback/contact/complaints.
 *
 * This module must only be imported from server code (route handlers / server
 * components). It reads private configuration from environment variables.
 *
 * Design goals:
 * - Secrets stay server-side (never NEXT_PUBLIC_*).
 * - The provider is replaceable. A single `sendEmail` abstraction is used; the
 *   concrete transport is selected by environment variables.
 * - No fake success: callers only report success when the provider accepted
 *   the message.
 *
 * Configuration (see .env.example):
 *   FEEDBACK_TO_EMAIL       — owner inbox (required to enable delivery)
 *   FEEDBACK_FROM_EMAIL     — sender address (provider-dependent)
 *   EMAIL_PROVIDER          — "resend" | "smtp-webhook" (default: smtp-webhook)
 *   EMAIL_PROVIDER_API_KEY  — API key for the chosen provider (e.g. Resend)
 *   FEEDBACK_SMTP_URL       — generic webhook endpoint (smtp-webhook provider)
 */

export class EmailNotConfiguredError extends Error {
  constructor(message = "Email is not configured on this server") {
    super(message);
    this.name = "EmailNotConfiguredError";
  }
}

export interface FeedbackEmailInput {
  category: string;
  name?: string;
  email?: string;
  subject?: string;
  message: string;
  page?: string;
  submittedAt: Date;
  userAgent?: string;
}

interface EmailMessage {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  suggest: "Feature suggestion",
  feature: "Feature request",
  bug: "Bug report",
  complaint: "Complaint",
  general: "General feedback",
  contact: "Contact message",
  "tool-request": "Tool request",
};

/** Escape user content for safe inclusion in an HTML email body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSubject(input: FeedbackEmailInput): string {
  const label = CATEGORY_LABELS[input.category] ?? input.category;
  const base = input.subject ? `${label}: ${input.subject}` : label;
  // Subject must be single-line to prevent header injection.
  return `[QUANTIVA] ${base}`.replace(/[\r\n]+/g, " ").slice(0, 200);
}

function buildText(input: FeedbackEmailInput): string {
  const label = CATEGORY_LABELS[input.category] ?? input.category;
  const lines = [
    "QUANTIVA — New Feedback",
    "",
    `Type: ${label}`,
    input.subject ? `Subject: ${input.subject}` : null,
    input.name ? `Name: ${input.name}` : null,
    input.email ? `From: ${input.email}` : null,
    `Submitted: ${input.submittedAt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}`,
    input.page ? `Page: ${input.page}` : null,
    "",
    "Message:",
    input.message,
    "",
    input.userAgent ? `Context: ${input.userAgent}` : null,
  ];
  return lines.filter((l): l is string => l !== null).join("\n");
}

function buildHtml(input: FeedbackEmailInput): string {
  const label = CATEGORY_LABELS[input.category] ?? input.category;
  const row = (k: string, v?: string) =>
    v
      ? `<tr><td style="padding:4px 12px 4px 0;color:#888;vertical-align:top;white-space:nowrap;">${k}</td><td style="padding:4px 0;">${escapeHtml(v)}</td></tr>`
      : "";
  const submitted = input.submittedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
  return `<!doctype html>
<html><body style="font-family:system-ui,Arial,sans-serif;color:#111;line-height:1.5;">
  <h2 style="margin:0 0 12px;">QUANTIVA — New Feedback</h2>
  <table style="border-collapse:collapse;margin-bottom:16px;">
    ${row("Type", label)}
    ${row("Subject", input.subject)}
    ${row("Name", input.name)}
    ${row("From", input.email)}
    ${row("Submitted", submitted)}
    ${row("Page", input.page)}
  </table>
  <div style="padding:12px 16px;background:#f5f5f5;border-radius:8px;white-space:pre-wrap;">${escapeHtml(input.message)}</div>
  ${input.userAgent ? `<p style="color:#aaa;font-size:12px;margin-top:16px;">Context: ${escapeHtml(input.userAgent)}</p>` : ""}
</body></html>`;
}

/**
 * Send a feedback email to the configured owner inbox.
 * Throws EmailNotConfiguredError when delivery is not configured, or a generic
 * Error when the provider rejects the message.
 */
export async function sendFeedbackEmail(input: FeedbackEmailInput): Promise<void> {
  const to = process.env.FEEDBACK_TO_EMAIL;
  if (!to) {
    throw new EmailNotConfiguredError();
  }
  const message: EmailMessage = {
    to,
    from: process.env.FEEDBACK_FROM_EMAIL,
    subject: buildSubject(input),
    text: buildText(input),
    html: buildHtml(input),
    replyTo: input.email,
  };
  await sendEmail(message);
}

/** Dispatch to the configured provider. */
async function sendEmail(message: EmailMessage): Promise<void> {
  const provider = (process.env.EMAIL_PROVIDER ?? "smtp-webhook").toLowerCase();
  switch (provider) {
    case "resend":
      return sendViaResend(message);
    case "smtp-webhook":
    default:
      return sendViaWebhook(message);
  }
}

/** Resend (https://resend.com) — simple transactional email API. */
async function sendViaWebhook(message: EmailMessage): Promise<void> {
  const endpoint = process.env.FEEDBACK_SMTP_URL;
  if (!endpoint) {
    throw new EmailNotConfiguredError("No FEEDBACK_SMTP_URL configured");
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: message.to,
      from: message.from,
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: message.replyTo,
    }),
  });
  if (!res.ok) {
    throw new Error(`Email webhook responded ${res.status}`);
  }
}

async function sendViaResend(message: EmailMessage): Promise<void> {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new EmailNotConfiguredError("No EMAIL_PROVIDER_API_KEY configured");
  }
  // Treat an empty/whitespace sender as unset so the verified default is used.
  const from =
    message.from && message.from.trim().length > 0
      ? message.from
      : "QUANTIVA <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
      reply_to: message.replyTo,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}`);
  }
}

/* Exported for unit tests only. */
export const __test__ = { escapeHtml, buildSubject, buildText, buildHtml };
