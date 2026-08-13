import { describe, expect, it } from "vitest";
import { seoTitle, buildMetadata } from "./index";

describe("seoTitle", () => {
  it("joins the tool name with a capitalized supporting phrase", () => {
    expect(seoTitle("Loan Calculator", "Monthly payment and total interest for any loan.")).toBe(
      "Loan Calculator – Monthly payment and total interest for any loan",
    );
  });

  it("returns the name alone when there is no supporting text", () => {
    expect(seoTitle("Loan Calculator", "")).toBe("Loan Calculator");
  });

  it("keeps titles under the length cap and truncates on a word boundary", () => {
    const long = "Monthly payment, total repayment and total interest for any loan.";
    const title = seoTitle("Loan Calculator", long);
    expect(title.length).toBeLessThanOrEqual(72);
    expect(title).toBe("Loan Calculator – Monthly payment, total repayment and total interest…");
  });

  it("truncates at a word boundary", () => {
    const supporting = "Monthly payment, total repayment and total interest for any loan.";
    const title = seoTitle("Loan Calculator", supporting);
    const lastWord = title.replace(/…$/, "").split(" ").pop() ?? "";
    expect(supporting).toMatch(new RegExp(`\\b${lastWord}\\b`));
    expect(title.endsWith("…")).toBe(true);
  });
});

describe("buildMetadata", () => {
  it("emits a canonical URL and default OG image", () => {
    const meta = buildMetadata({ title: "Test", description: "Desc", path: "/test" });
    expect(meta.alternates?.canonical).toBe("https://calkulater.app/test");
    expect(meta.openGraph?.images).toEqual([
      { url: "https://calkulater.app/opengraph-image", width: 1200, height: 630, alt: "calkulater — Test" },
    ]);
  });

  it("uses a page-specific OG image when provided", () => {
    const meta = buildMetadata({
      title: "Loan Calculator",
      description: "Desc",
      path: "/calculator/loan",
      ogImagePath: "/calculator/loan/opengraph-image",
    });
    expect(meta.openGraph?.images).toEqual([
      { url: "https://calkulater.app/calculator/loan/opengraph-image", width: 1200, height: 630, alt: "calkulater — Loan Calculator" },
    ]);
  });

  it("never emits a keywords meta tag", () => {
    const meta = buildMetadata({ title: "Test", description: "Desc", path: "/test" });
    expect(meta.keywords).toBeUndefined();
  });
});
