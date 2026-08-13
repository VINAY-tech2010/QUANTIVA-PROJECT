// @vitest-environment node
import { describe, it, expect, vi } from "vitest";

// server-only is a build-time marker (resolved to empty.js under the
// "react-server" condition). Vitest resolves the throwing client entry, so
// stub it here; production builds enforce the boundary via Turbopack conditions.
vi.mock("server-only", () => ({}));

import { __test__, type FeedbackEmailInput } from "./send";

const base: FeedbackEmailInput = {
  category: "bug",
  message: "The calculator returned NaN.",
  submittedAt: new Date("2026-08-11T12:00:00Z"),
};

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
    expect(subject.startsWith("[QUANTIVA] Bug report: ")).toBe(true);
  });

  it("uses the category label when no subject is provided", () => {
    expect(__test__.buildSubject(base)).toBe("[QUANTIVA] Bug report");
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
