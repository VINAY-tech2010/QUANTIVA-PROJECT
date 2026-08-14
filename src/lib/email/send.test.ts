// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// server-only is a build-time marker (resolved to empty.js under the
// "react-server" condition). Vitest resolves the throwing client entry, so
// stub it here; production builds enforce the boundary via Turbopack conditions.
vi.mock("server-only", () => ({}));

import {
  __test__,
  EmailNotConfiguredError,
  sendFeedbackEmail,
  type FeedbackEmailInput,
} from "./send";

const base: FeedbackEmailInput = {
  category: "bug",
  message: "The calculator returned NaN.",
  submittedAt: new Date("2026-08-11T12:00:00Z"),
};

const DUMMY_KEY = "re_test_dummy_key_not_a_real_secret";

describe("feedback email content", () => {
  it("escapes HTML in user content", () => {
    expect(__test__.escapeHtml('<script>"x"&\'')).toBe(
      "&lt;script&gt;&quot;x&quot;&amp;&#39;",
    );
  });

  it("builds a single-line subject and strips newlines (header-injection safe)", () => {
    const subject = __test__.buildSubject({
      ...base,
      subject: "Broken\nBcc: attacker@example.com",
    });
    expect(subject).not.toMatch(/[\r\n]/);
    expect(subject.startsWith("[calkulater] Bug report: ")).toBe(true);
  });

  it("uses the category label when no subject is provided", () => {
    expect(__test__.buildSubject(base)).toBe("[calkulater] Bug report");
  });

  it("includes the message in both text and HTML bodies", () => {
    expect(__test__.buildText(base)).toContain("The calculator returned NaN.");
    expect(__test__.buildHtml(base)).toContain("The calculator returned NaN.");
  });

  it("escapes HTML in the HTML body", () => {
    const html = __test__.buildHtml({ ...base, message: "<b>bold</b>" });
    expect(html).toContain("&lt;b&gt;bold&lt;/b&gt;");
    expect(html).not.toContain("<b>bold</b>");
  });
});

describe("email provider resolution (Cloudflare Workers env)", () => {
  it("returns null when nothing is configured", () => {
    expect(__test__.resolveProvider({})).toBeNull();
  });

  it("auto-detects Resend from EMAIL_PROVIDER_API_KEY alone", () => {
    expect(
      __test__.resolveProvider({ EMAIL_PROVIDER_API_KEY: DUMMY_KEY }),
    ).toEqual({ name: "resend" });
  });

  it("auto-detects smtp-webhook from FEEDBACK_SMTP_URL alone", () => {
    expect(
      __test__.resolveProvider({ FEEDBACK_SMTP_URL: "https://webhook.example/send" }),
    ).toEqual({ name: "smtp-webhook" });
  });

  it("prefers the explicit provider when its config is present", () => {
    expect(
      __test__.resolveProvider({
        EMAIL_PROVIDER: "resend",
        EMAIL_PROVIDER_API_KEY: DUMMY_KEY,
        FEEDBACK_SMTP_URL: "https://webhook.example/send",
      }),
    ).toEqual({ name: "resend" });
  });

  it("falls back to Resend when EMAIL_PROVIDER is unset but the key secret is set", () => {
    // The Cloudflare production failure mode: only the secret reached the worker.
    expect(
      __test__.resolveProvider({
        EMAIL_PROVIDER: "smtp-webhook",
        EMAIL_PROVIDER_API_KEY: DUMMY_KEY,
      }),
    ).toEqual({ name: "resend", hint: expect.stringContaining("smtp-webhook") });
  });

  it("falls back to the configured transport when an unrecognized provider is set", () => {
    expect(
      __test__.resolveProvider({
        EMAIL_PROVIDER: "mailgun",
        EMAIL_PROVIDER_API_KEY: DUMMY_KEY,
      }),
    ).toEqual({ name: "resend", hint: expect.stringContaining("mailgun") });
  });
});

describe("sendFeedbackEmail — HTTP transport (mocked fetch, dummy credentials)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("throws EmailNotConfiguredError without any provider config", async () => {
    await expect(sendFeedbackEmail(base)).rejects.toBeInstanceOf(
      EmailNotConfiguredError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws EmailNotConfiguredError when the owner inbox is missing", async () => {
    vi.stubEnv("EMAIL_PROVIDER_API_KEY", DUMMY_KEY);
    await expect(sendFeedbackEmail(base)).rejects.toBeInstanceOf(
      EmailNotConfiguredError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs the Resend payload with the API key as a Bearer token", async () => {
    vi.stubEnv("FEEDBACK_TO_EMAIL", "owner@example.com");
    vi.stubEnv("EMAIL_PROVIDER_API_KEY", DUMMY_KEY);
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await sendFeedbackEmail({
      ...base,
      name: "Ada",
      email: "ada@example.com",
      subject: "Broken calc",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${DUMMY_KEY}`);
    const body = JSON.parse(init.body as string);
    expect(body.from).toBe("calkulater <onboarding@resend.dev>");
    expect(body.to).toEqual(["owner@example.com"]);
    expect(body.reply_to).toBe("ada@example.com");
    expect(body.subject).toContain("Broken calc");
    expect(body.text).toContain("The calculator returned NaN.");
    expect(body.html).toContain("The calculator returned NaN.");
  });

  it("POSTs the webhook payload when only FEEDBACK_SMTP_URL is configured", async () => {
    vi.stubEnv("FEEDBACK_TO_EMAIL", "owner@example.com");
    vi.stubEnv("FEEDBACK_SMTP_URL", "https://webhook.example/send");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await sendFeedbackEmail(base);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://webhook.example/send");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
    const body = JSON.parse(init.body as string);
    expect(body.to).toBe("owner@example.com");
    expect(body.subject).toBe("[calkulater] Bug report");
  });

  it("throws a generic error (502 path) when the provider rejects the message", async () => {
    vi.stubEnv("FEEDBACK_TO_EMAIL", "owner@example.com");
    vi.stubEnv("EMAIL_PROVIDER_API_KEY", DUMMY_KEY);
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));

    await expect(sendFeedbackEmail(base)).rejects.toThrow("Resend responded 401");
  });
});
