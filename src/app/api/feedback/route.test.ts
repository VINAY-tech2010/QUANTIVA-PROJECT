import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock state so the vi.mock factory (also hoisted) can reference it.
const mocks = vi.hoisted(() => {
  class MockEmailNotConfiguredError extends Error {
    constructor(message = "Email is not configured on this server") {
      super(message);
      this.name = "EmailNotConfiguredError";
    }
  }
  return { sendFeedbackEmail: vi.fn(), MockEmailNotConfiguredError };
});

vi.mock("@/lib/email/send", () => ({
  sendFeedbackEmail: mocks.sendFeedbackEmail,
  EmailNotConfiguredError: mocks.MockEmailNotConfiguredError,
}));

import { POST } from "./route";

const { sendFeedbackEmail, MockEmailNotConfiguredError } = mocks;

let ipCounter = 0;
function makeRequest(body: unknown): Request {
  // Distinct IP per request so the in-memory rate limiter doesn't throttle
  // across tests within the same file.
  ipCounter += 1;
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": `10.0.0.${ipCounter}`,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/feedback — tool-request", () => {
  beforeEach(() => {
    sendFeedbackEmail.mockReset();
    sendFeedbackEmail.mockResolvedValue(undefined);
  });

  it("accepts a valid tool-request and emails it", async () => {
    const res = await POST(
      makeRequest({
        category: "tool-request",
        subject: "Tool Request: Compound Interest Calculator",
        message:
          "Tool requested: Compound Interest Calculator\n\nWhat it should do: compute compound interest",
      }),
    );
    expect(res.status).toBe(200);
    expect(sendFeedbackEmail).toHaveBeenCalledTimes(1);
    const arg = sendFeedbackEmail.mock.calls[0][0] as {
      category: string;
      subject?: string;
      message: string;
    };
    expect(arg.category).toBe("tool-request");
    expect(arg.subject).toContain("Compound Interest Calculator");
    expect(arg.message).toContain("Compound Interest Calculator");
  });

  it("rejects a tool-request with an empty message", async () => {
    const res = await POST(makeRequest({ category: "tool-request", message: "" }));
    expect(res.status).toBe(400);
    expect(sendFeedbackEmail).not.toHaveBeenCalled();
  });

  it("rejects an invalid category", async () => {
    const res = await POST(makeRequest({ category: "not-a-category", message: "hi" }));
    expect(res.status).toBe(400);
    expect(sendFeedbackEmail).not.toHaveBeenCalled();
  });

  it("silently accepts honeypot submissions without emailing", async () => {
    const res = await POST(
      makeRequest({ category: "tool-request", message: "spam", website: "http://bot.example" }),
    );
    expect(res.status).toBe(200);
    expect(sendFeedbackEmail).not.toHaveBeenCalled();
  });

  it("returns 503 when email is not configured", async () => {
    sendFeedbackEmail.mockRejectedValueOnce(new MockEmailNotConfiguredError());
    const res = await POST(makeRequest({ category: "tool-request", message: "please add this" }));
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/unavailable/i);
    // Must not leak internals.
    expect(JSON.stringify(body)).not.toMatch(/api[_ ]?key|smtp|resend|stack/i);
  });

  it("returns 502 without leaking provider details on provider failure", async () => {
    sendFeedbackEmail.mockRejectedValueOnce(new Error("Resend responded 401 invalid key"));
    const res = await POST(makeRequest({ category: "tool-request", message: "please add this" }));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(JSON.stringify(body)).not.toMatch(/resend|401|invalid key/i);
  });
});
