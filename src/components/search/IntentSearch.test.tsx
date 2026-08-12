import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
const { push } = mocks;

import { IntentSearch } from "./IntentSearch";

function typeAndSubmit(value: string) {
  render(<IntentSearch />);
  const input = screen.getByRole("textbox");
  fireEvent.change(input, { target: { value } });
  fireEvent.submit(input.closest("form") as HTMLFormElement);
}

describe("IntentSearch", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("navigates directly to a calculator for an exact tool name", () => {
    typeAndSubmit("Loan Calculator");
    expect(push).toHaveBeenCalledWith("/calculator/loan");
  });

  it("navigates to the loan calculator for the EMI abbreviation", () => {
    typeAndSubmit("EMI calculator");
    expect(push).toHaveBeenCalledWith("/calculator/loan");
  });

  it("navigates to the mortgage calculator for a misspelling", () => {
    typeAndSubmit("morgage calculator");
    expect(push).toHaveBeenCalledWith("/calculator/mortgage");
  });

  it("routes a confident natural-language calculation to its calculator prefilled", () => {
    typeAndSubmit("10% of 500");
    expect(push).toHaveBeenCalledWith("/calculator/percentage?mode=of&valueA=10&valueB=500");
  });

  it("shows an inline result for pure arithmetic", () => {
    typeAndSubmit("128 + 256");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/384/)).toBeInTheDocument();
  });

  it("shows the missing-tool panel for a tool that does not exist", () => {
    typeAndSubmit("Bitcoin Mining Profitability Calculator");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/Tool not available yet/i)).toBeInTheDocument();
    expect(screen.getByText(/isn't implemented in QUANTIVA yet/i)).toBeInTheDocument();
  });

  it("navigates to the improvement page with the tool prefilled when requesting", () => {
    typeAndSubmit("Bitcoin Mining Profitability Calculator");
    const requestBtn = screen.getByRole("button", { name: /Request this tool/i });
    fireEvent.click(requestBtn);
    expect(push).toHaveBeenCalledTimes(1);
    const url = push.mock.calls[0][0] as string;
    expect(url).toContain("/improvement");
    expect(url).toContain("category=tool-request");
    expect(url).toContain("tool=");
  });

  it("shows a no-result state with a few candidates for gibberish", () => {
    typeAndSubmit("asdkfj qworitu zxcvbn");
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText(/couldn't identify that/i)).toBeInTheDocument();
  });

  it("submits the search when the Enter key is pressed in the input", () => {
    render(<IntentSearch />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Loan Calculator" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });
    expect(push).toHaveBeenCalledWith("/calculator/loan");
  });

  it("does not submit on a non-Enter key press", () => {
    render(<IntentSearch />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Loan Calculator" } });
    fireEvent.keyDown(input, { key: "a", code: "KeyA" });
    expect(push).not.toHaveBeenCalled();
  });
});
