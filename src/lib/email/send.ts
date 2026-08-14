// Server-only boundary: importing this module from client code fails the build.
import "server-only";

/**
 * Server-side email delivery for calkulater feedback/contact/complaints.
 *
 * This module must only be imported from server code (route handlers / server
 * components). It reads private configuration from environment variables.
 * Compatible with Node.js (local dev, Netlify) and Cloudflare Workers
 * (OpenNext maps worker bindings/secrets to process.env) — it only uses
 * `fetch` and `process.env`, no Node-only APIs.
 *
 * Design goals:
 * - Secrets stay server-side (never NEXT_PUBLIC_*). On Cloudflare Workers the
 *   API key is stored as a worker secret (`wrangler secret put
 *   EMAIL_PROVIDER_API_KEY`), which never reaches client bundles.
 * - The provider is replaceable. A single `sendEmail` abstraction is used; the
 *   concrete transport is selected by environment variables, with
 *   auto-detection: if EMAIL_PROVIDER is unset (e.g. not propagated to the
 *   worker), the provider whose credentials are actually present is used.
 * - Graceful failure: missing configuration throws EmailNotConfiguredError
 *   (callers return 503); provider rejection throws a generic Error (502).
 * - No fake success: callers only report success when the provider accepted
 *   the message.
 *
 * Configuration (see .env.example):
 *   FEEDBACK_TO_EMAIL       — owner inbox (required to enable delivery)
 *   FEEDBACK_FROM_EMAIL     — sender address (provider-dependent)
 *   EMAIL_PROVIDER          — "resend" | "smtp-webhook" (optional; auto-detected)
 *   EMAIL_PROVIDER_API_KEY  — API key for Resend (Cloudflare secret)
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

export type EmailProviderName = "resend" | "smtp-webhook";

interface ResolvedProvider {
  name: EmailProviderName;
  /** Variable names that would change the selected provider (server-side hint). */
  hint?: string;
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
  return `[calkulater] ${base}`.replace(/[\r\n]+/g, " ").slice(0, 200);
}

function buildText(input: FeedbackEmailInput): string {
  const label = CATEGORY_LABELS[input.category] ?? input.category;
  const lines = [
    "calkulater — New Feedback",
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
  <h2 style="margin:0 0 12px;">calkulater — New Feedback</h2>
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

/**
 * Resolve the email transport for this deployment.
 *
 * Preference order:
 *   1. EMAIL_PROVIDER when set and its required configuration is present.
 *   2. Auto-detection: Resend when EMAIL_PROVIDER_API_KEY is set, otherwise
 *      smtp-webhook when FEEDBACK_SMTP_URL is set.
 *
 * On Cloudflare Workers only the secret (EMAIL_PROVIDER_API_KEY) may have
 * been propagated; if EMAIL_PROVIDER itself is missing or its config is
 * incomplete, the provider with real credentials is selected instead of
 * reporting "unavailable".
 */
export function resolveProvider(
  env: Record<string, string | undefined>,
): ResolvedProvider | null {
  const explicit = (env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
  const hasKey = Boolean(env.EMAIL_PROVIDER_API_KEY?.trim());
  const hasUrl = Boolean(env.FEEDBACK_SMTP_URL?.trim());

  if (explicit === "resend" && hasKey) {
    return { name: "resend" };
  }
  if (explicit === "smtp-webhook" && hasUrl) {
    return { name: "smtp-webhook" };
  }
  if (explicit && explicit !== "resend" && explicit !== "smtp-webhook") {
    return hasKey
      ? { name: "resend", hint: `Unrecognized EMAIL_PROVIDER "${explicit}"; using Resend.` }
      : hasUrl
        ? { name: "smtp-webhook", hint: `Unrecognized EMAIL_PROVIDER "${explicit}"; using smtp-webhook.` }
        : null;
  }
  if (hasKey) {
    return explicit
      ? { name: "resend", hint: `EMAIL_PROVIDER "${explicit}" is unconfigured; using Resend.` }
      : { name: "resend" };
  }
  if (hasUrl) {
    return explicit
      ? { name: "smtp-webhook", hint: `EMAIL_PROVIDER "${explicit}" is unconfigured; using smtp-webhook.` }
      : { name: "smtp-webhook" };
  }
  return null;
}

/** Dispatch to the configured provider. */
async function sendEmail(message: EmailMessage): Promise<void> {
  const provider = resolveProvider(process.env);
  if (!provider) {
    throw new EmailNotConfiguredError(
      "No email provider configured. Set EMAIL_PROVIDER_API_KEY (Resend) or " +
        "FEEDBACK_SMTP_URL (smtp-webhook) and FEEDBACK_TO_EMAIL. On Cloudflare " +
        "Workers store EMAIL_PROVIDER_API_KEY as a secret via " +
        "`wrangler secret put EMAIL_PROVIDER_API_KEY`.",
    );
  }
  if (provider.hint) {
    console.warn("[feedback] email provider:", provider.hint);
  }
  switch (provider.name) {
    case "resend":
      return sendViaResend(message);
    case "smtp-webhook":
      return sendViaWebhook(message);
  }
}

function buildResendPayload(message: EmailMessage): Record<string, unknown> {
  // Treat an empty/whitespace sender as unset so the verified default is used.
  const from =
    message.from && message.from.trim().length > 0
      ? message.from
      : "calkulater <onboarding@resend.dev>";
  return {
    from,
    to: [message.to],
    subject: message.subject,
    text: message.text,
    html: message.html,
    reply_to: message.replyTo,
  };
}

function buildWebhookPayload(message: EmailMessage): Record<string, unknown> {
  return {
    to: message.to,
    from: message.from,
    subject: message.subject,
    text: message.text,
    html: message.html,
    replyTo: message.replyTo,
  };
}

/** smtp-webhook — generic webhook endpoint (see .env.example). */
async function sendViaWebhook(message: EmailMessage): Promise<void> {
  const endpoint = process.env.FEEDBACK_SMTP_URL;
  if (!endpoint) {
    throw new EmailNotConfiguredError("No FEEDBACK_SMTP_URL configured");
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildWebhookPayload(message)),
  });
  if (!res.ok) {
    throw new Error(`Email webhook responded ${res.status}`);
  }
}

/** Resend (https://resend.com) — simple transactional email API. */
async function sendViaResend(message: EmailMessage): Promise<void> {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new EmailNotConfiguredError("No EMAIL_PROVIDER_API_KEY configured");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildResendPayload(message)),
  });
  if (!res.ok) {
    throw new Error(`Resend responded ${res.status}`);
  }
}

/* Exported for unit tests only. */
export const __test__ = {
  escapeHtml,
  buildSubject,
  buildText,
  buildHtml,
  resolveProvider,
  buildResendPayload,
  buildWebhookPayload,
};
