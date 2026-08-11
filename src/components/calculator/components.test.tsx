import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CalcResult, CalculatorMetric } from "@/types";
import { CurrencyProvider } from "@/lib/currency/context";
import { MetricValue } from "./MetricValue";
import { ResultsPanel } from "./ResultsPanel";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}

describe("MetricValue", () => {
  it("formats currency metrics with the active currency", () => {
    const m: CalculatorMetric = { key: "a", label: "A", kind: "currency", value: 1234.5 };
    render(<MetricValue metric={m} />, { wrapper: Wrapper });
    expect(screen.getByText(/\$1,234\.50/)).toBeInTheDocument();
  });

  it("formats percent metrics", () => {
    const m: CalculatorMetric = { key: "b", label: "B", kind: "percent", value: 12.34 };
    render(<MetricValue metric={m} />, { wrapper: Wrapper });
    expect(screen.getByText(/12\.3%/)).toBeInTheDocument();
  });

  it("formats duration metrics", () => {
    const m: CalculatorMetric = { key: "c", label: "C", kind: "duration", value: 150 };
    render(<MetricValue metric={m} />, { wrapper: Wrapper });
    expect(screen.getByText(/2 hours 30 minutes/)).toBeInTheDocument();
  });
});

describe("ResultsPanel", () => {
  it("shows an empty state when there is no result", () => {
    render(<ResultsPanel result={null} />, { wrapper: Wrapper });
    expect(screen.getByText(/Enter values and calculate/i)).toBeInTheDocument();
  });

  it("shows an error alert when the result failed", () => {
    const r: CalcResult = { ok: false, error: "Bad input.", metrics: [] };
    render(<ResultsPanel result={r} />, { wrapper: Wrapper });
    expect(screen.getByRole("alert")).toHaveTextContent("Bad input.");
  });

  it("renders primary and secondary metrics", () => {
    const r: CalcResult = {
      ok: true,
      metrics: [
        { key: "p", label: "Monthly payment", kind: "currency", value: 396.02, primary: true },
        { key: "t", label: "Total interest", kind: "currency", value: 3761.2 },
      ],
    };
    render(<ResultsPanel result={r} />, { wrapper: Wrapper });
    expect(screen.getByText("Monthly payment")).toBeInTheDocument();
    expect(screen.getByText(/\$396\.02/)).toBeInTheDocument();
    expect(screen.getByText("Total interest")).toBeInTheDocument();
  });
});
