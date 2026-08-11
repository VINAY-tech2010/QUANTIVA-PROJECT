import { describe, it, expect, beforeEach } from "vitest";
import {
  loadHistory,
  addHistoryEntry,
  removeHistoryEntry,
  clearHistory,
  historyForCalculator,
} from "./history";
import {
  loadScenarios,
  scenariosForCalculator,
  saveScenario,
  deleteScenario,
  renameScenario,
  clearScenarios,
} from "./scenarios";
import { loadBudgets, budgetForCalculator, saveBudget, removeBudget, clearBudgets } from "./budgets";
import { loadPreferences, savePreferences } from "./preferences";
import { writeRaw, readRaw, clearAll } from "./local";
import type { HistoryEntry, Scenario } from "@/types";

function makeEntry(id: string, calculatorId = "loan"): HistoryEntry {
  return {
    id,
    calculatorId,
    calculatorName: "Loan Calculator",
    category: "money",
    inputs: { principal: 10000 },
    summary: { label: "Monthly payment", value: 199, kind: "currency" },
    currency: "USD",
    createdAt: Date.now(),
  };
}

function makeScenario(id: string, calculatorId = "loan"): Scenario {
  return {
    id,
    calculatorId,
    name: `Scenario ${id}`,
    overrides: { interestRate: 5 },
    createdAt: Date.now(),
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("history store", () => {
  it("starts empty", () => {
    expect(loadHistory()).toEqual([]);
  });

  it("adds entries newest-first and dedupes by id", () => {
    addHistoryEntry(makeEntry("a"));
    addHistoryEntry(makeEntry("b"));
    addHistoryEntry(makeEntry("a")); // duplicate id moves to front
    const all = loadHistory();
    expect(all.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("filters by calculator", () => {
    addHistoryEntry(makeEntry("a", "loan"));
    addHistoryEntry(makeEntry("b", "tip"));
    expect(historyForCalculator("tip").map((e) => e.id)).toEqual(["b"]);
  });

  it("removes a single entry", () => {
    addHistoryEntry(makeEntry("a"));
    addHistoryEntry(makeEntry("b"));
    removeHistoryEntry("a");
    expect(loadHistory().map((e) => e.id)).toEqual(["b"]);
  });

  it("clears all history", () => {
    addHistoryEntry(makeEntry("a"));
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });

  it("caps the list at 100 entries", () => {
    for (let i = 0; i < 120; i += 1) addHistoryEntry(makeEntry(`e${i}`));
    expect(loadHistory().length).toBe(100);
  });
});

describe("scenarios store", () => {
  it("saves and lists scenarios", () => {
    saveScenario(makeScenario("s1"));
    saveScenario(makeScenario("s2"));
    expect(loadScenarios().length).toBe(2);
  });

  it("updates an existing scenario by id", () => {
    saveScenario(makeScenario("s1"));
    saveScenario({ ...makeScenario("s1"), name: "Renamed" });
    const all = loadScenarios();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe("Renamed");
  });

  it("filters by calculator", () => {
    saveScenario(makeScenario("s1", "loan"));
    saveScenario(makeScenario("s2", "mortgage"));
    expect(scenariosForCalculator("mortgage").map((s) => s.id)).toEqual(["s2"]);
  });

  it("renames a scenario and returns false for missing id", () => {
    saveScenario(makeScenario("s1"));
    expect(renameScenario("s1", "New name")).toBe(true);
    expect(renameScenario("nope", "x")).toBe(false);
    expect(loadScenarios()[0].name).toBe("New name");
  });

  it("deletes a scenario", () => {
    saveScenario(makeScenario("s1"));
    deleteScenario("s1");
    expect(loadScenarios()).toEqual([]);
  });

  it("clears all scenarios", () => {
    saveScenario(makeScenario("s1"));
    clearScenarios();
    expect(loadScenarios()).toEqual([]);
  });
});

describe("budgets store", () => {
  it("saves and retrieves a budget per calculator", () => {
    saveBudget({ calculatorId: "loan", amount: 500, label: "Max payment", period: "monthly" });
    expect(budgetForCalculator("loan")?.amount).toBe(500);
    expect(budgetForCalculator("tip")).toBeNull();
  });

  it("upserts an existing budget", () => {
    saveBudget({ calculatorId: "loan", amount: 500, label: "Max", period: "monthly" });
    saveBudget({ calculatorId: "loan", amount: 600, label: "Max", period: "monthly" });
    expect(loadBudgets().length).toBe(1);
    expect(budgetForCalculator("loan")?.amount).toBe(600);
  });

  it("removes a budget", () => {
    saveBudget({ calculatorId: "loan", amount: 500, label: "Max", period: "monthly" });
    removeBudget("loan");
    expect(budgetForCalculator("loan")).toBeNull();
  });

  it("clears all budgets", () => {
    saveBudget({ calculatorId: "loan", amount: 500, label: "Max", period: "monthly" });
    clearBudgets();
    expect(loadBudgets()).toEqual([]);
  });
});

describe("preferences store", () => {
  it("returns defaults when empty", () => {
    const prefs = loadPreferences();
    expect(prefs.currency).toBe("USD");
  });

  it("persists a currency preference", () => {
    savePreferences({ currency: "INR" });
    expect(loadPreferences().currency).toBe("INR");
  });

  it("ignores an unsupported currency on load", () => {
    writeRaw("preferences", { version: 1, data: { currency: "XXX" } });
    expect(loadPreferences().currency).toBe("USD");
  });
});

describe("corruption handling", () => {
  it("returns empty history when stored JSON is malformed", () => {
    window.localStorage.setItem("quantiva:history", "{not json");
    expect(loadHistory()).toEqual([]);
  });

  it("returns empty scenarios when the version mismatches", () => {
    writeRaw("scenarios", { version: 999, data: [makeScenario("s1")] });
    expect(loadScenarios()).toEqual([]);
  });

  it("clearAll removes every quantiva key", () => {
    addHistoryEntry(makeEntry("a"));
    saveScenario(makeScenario("s1"));
    savePreferences({ currency: "EUR" });
    const removed = clearAll();
    expect(removed).toBeGreaterThan(0);
    expect(readRaw("history")).toBeNull();
    expect(loadScenarios()).toEqual([]);
  });
});
