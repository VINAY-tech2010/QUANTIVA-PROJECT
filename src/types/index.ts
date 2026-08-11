/**
 * Core shared types for QUANTIVA.
 *
 * These types are the single source of truth for the calculator engine,
 * currency system, intent parser, storage, scenarios, and dashboard.
 * Keep them free of UI concerns and free of `any`.
 */

/* ------------------------------------------------------------------------ */
/* Categories                                                                */
/* ------------------------------------------------------------------------ */

export type CategorySlug =
  | "money"
  | "buying"
  | "time"
  | "productivity"
  | "math"
  | "science"
  | "statistics"
  | "health"
  | "conversion"
  | "everyday"
  | "business"
  | "technology";

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Short tagline shown on cards / nav. */
  tagline: string;
  /** Longer description for the category landing page + SEO. */
  description: string;
  /** Icon key resolved by the UI icon map. */
  icon: string;
}

/* ------------------------------------------------------------------------ */
/* Currency                                                                  */
/* ------------------------------------------------------------------------ */

/** ISO 4217 currency code, e.g. "USD", "INR", "EUR". */
export type CurrencyCode = string;

export interface Currency {
  code: CurrencyCode;
  /** Display name, e.g. "US Dollar". */
  name: string;
  /** Symbol used for compact display, e.g. "$", "₹", "€". */
  symbol: string;
  /** Number of minor units (decimal places). Usually 2; 0 for JPY etc. */
  decimals: number;
  /** BCP 47 locale used for number formatting. */
  locale: string;
}

/** Exchange rate relative to a base currency. */
export interface ExchangeRate {
  base: CurrencyCode;
  quote: CurrencyCode;
  /** Units of `quote` per 1 unit of `base`. */
  rate: number;
  /** Epoch milliseconds when the rate was retrieved. */
  timestamp: number;
  /** True when served from the static development fallback (not live). */
  isFallback: boolean;
}

export interface ExchangeRateTable {
  base: CurrencyCode;
  /** Map of quote currency -> rate. */
  rates: Record<CurrencyCode, number>;
  timestamp: number;
  isFallback: boolean;
}

/* ------------------------------------------------------------------------ */
/* Calculator fields & inputs                                                */
/* ------------------------------------------------------------------------ */

export type FieldType =
  | "currency"
  | "number"
  | "percent"
  | "integer"
  | "time"
  | "date"
  | "datetime"
  | "select"
  | "text"
  | "textarea";

export interface FieldOption {
  value: string;
  label: string;
}

export interface CalculatorField {
  /** Stable key used in the inputs object. */
  key: string;
  label: string;
  type: FieldType;
  /** Placeholder / helper text. */
  help?: string;
  /** Default value applied on first render. */
  defaultValue?: number | string;
  /** For select fields. */
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  /** Whether a valid value is required to compute a result. */
  required: boolean;
  /** Unit label shown beside the input, e.g. "months", "%", "hrs". */
  unit?: string;
  /**
   * Optional quick-preset values shown as tappable chips above the input.
   * Selecting a chip fills the field; the value remains fully editable.
   */
  quickPresets?: { label: string; value: number }[];
}

/**
 * Raw calculator input values keyed by field key.
 * Numbers are stored as numbers; times as "HH:MM"; dates as "YYYY-MM-DD";
 * selects/text as strings.
 */
export type CalculatorInputs = Record<string, number | string>;

/* ------------------------------------------------------------------------ */
/* Results                                                                   */
/* ------------------------------------------------------------------------ */

export type MetricKind =
  | "currency"
  | "number"
  | "percent"
  | "duration"
  | "date"
  | "text";

export interface CalculatorMetric {
  key: string;
  label: string;
  kind: MetricKind;
  /**
   * Structured value. For currency -> number in the active currency's
   * base units; duration -> total minutes; date -> ISO string; percent ->
   * number (e.g. 12.5 means 12.5%).
   */
  value: number | string;
  /** Emphasize as the primary/hero metric. */
  primary?: boolean;
  /** Optional qualitative tone for styling. */
  tone?: "neutral" | "positive" | "negative" | "warning";
}

/** A single line/row in an amortization or schedule table. */
export interface ScheduleRow {
  label: string;
  values: Record<string, number | string>;
}

export interface CalcResult {
  /** Whether the inputs produced a valid, meaningful result. */
  ok: boolean;
  /** User-facing error message when ok === false. */
  error?: string;
  /** Ordered metrics for display. */
  metrics: CalculatorMetric[];
  /**
   * Narrative explanation built from structured values. Currency amounts are
   * expressed as template tokens like {monthlyPayment} so the UI can render
   * them in the active currency without stale symbols.
   */
  narrative?: string;
  /** Optional tabular schedule (e.g. amortization). */
  schedule?: ScheduleRow[];
  /**
   * Structured payload for scenario comparison and dashboard aggregation.
   * Keys are tool-specific but must be numeric where aggregation is expected.
   */
  data?: Record<string, number | string>;
}

/* ------------------------------------------------------------------------ */
/* Scenarios                                                                 */
/* ------------------------------------------------------------------------ */

/** A named what-if variant of a calculator's inputs. */
export interface Scenario {
  id: string;
  /** Calculator this scenario belongs to. */
  calculatorId: string;
  name: string;
  /** Partial input overrides applied on top of the baseline inputs. */
  overrides: CalculatorInputs;
  createdAt: number;
}

/** Comparison between a baseline result and a scenario result. */
export interface ScenarioDelta {
  scenarioId: string;
  scenarioName: string;
  /** Human-readable headline, e.g. "Save $1,240 in interest". */
  headline: string;
  /** Per-metric deltas keyed by metric key. */
  deltas: {
    metricKey: string;
    label: string;
    /** Metric kind, used to format baseline/scenario values. */
    kind: MetricKind;
    baseline: number | string;
    scenario: number | string;
    /** Signed numeric difference when both sides are numeric. */
    difference?: number;
    /** True when the scenario is an improvement for this metric. */
    improved?: boolean;
  }[];
}

/* ------------------------------------------------------------------------ */
/* Budget                                                                    */
/* ------------------------------------------------------------------------ */

/** Optional, tool-specific budget entered by the user. */
export interface Budget {
  calculatorId: string;
  /** Budget amount in the active currency. */
  amount: number;
  /** What the budget represents, e.g. "Monthly budget", "Max payment". */
  label: string;
  /** Cadence for comparison, if relevant. */
  period?: "monthly" | "one-time" | "yearly";
}

/* ------------------------------------------------------------------------ */
/* Calculator definition & registry                                          */
/* ------------------------------------------------------------------------ */

export interface CalculatorDefinition {
  /** Unique stable id, e.g. "loan". */
  id: string;
  /** URL slug, e.g. "loan". Same as id for most tools. */
  slug: string;
  name: string;
  /** User-facing question, e.g. "What will my loan cost?". */
  question: string;
  /** One-line supporting text under the title. */
  supporting: string;
  /** Longer description for SEO / category pages. */
  description: string;
  category: CategorySlug;
  icon: string;
  fields: CalculatorField[];
  /** Pure calculation function. */
  calculate: (inputs: CalculatorInputs) => CalcResult;
  /** Concise methodology explanation. */
  methodology: string;
  /**
   * Optional structured "Explain My Result" content: the formula, worked
   * steps, interpretation guidance, and assumptions.
   */
  explanation?: {
    /** Human-readable formula, e.g. "M = P · r(1+r)^n / ((1+r)^n − 1)". */
    formula: string;
    /** Ordered worked steps describing how the result is derived. */
    steps: string[];
    /** How to interpret the headline result. */
    interpretation: string;
    /** Assumptions and caveats. */
    assumptions: string[];
  };
  /** Whether this tool supports what-if scenarios. */
  supportsScenarios: boolean;
  /** Whether this tool deals in money (enables currency + budget UI). */
  usesCurrency: boolean;
  /** Optional budget configuration; undefined means no budget UI. */
  budget?: {
    label: string;
    period: "monthly" | "one-time" | "yearly";
    /** Metric key the budget is compared against. */
    compareMetricKey: string;
  };
  /** Preset scenario templates for this tool. */
  scenarioPresets?: {
    name: string;
    overrides: CalculatorInputs;
  }[];
  /** Related calculator ids shown at the bottom of the page. */
  related: string[];
  /** SEO keywords / search phrases used by intent matching. */
  keywords: string[];
}

/* ------------------------------------------------------------------------ */
/* Intent / natural-language search                                          */
/* ------------------------------------------------------------------------ */

export interface IntentCandidate {
  toolId: string;
  name: string;
  confidence: number;
}

export interface IntentResult {
  /** Matched calculator id, or null when no confident match. */
  toolId: string | null;
  /** 0..1 confidence score. */
  confidence: number;
  /** Extracted parameters keyed by calculator field key. */
  parameters: CalculatorInputs;
  /** Field keys the tool needs but were not found in the query. */
  unresolvedFields: string[];
  /** Candidate tools when confidence is low (for disambiguation UI). */
  candidates: IntentCandidate[];
  /** The normalized query that was parsed. */
  query: string;
  /** Confidence tier driving routing behaviour. */
  tier?: "high" | "medium" | "low";
  /** Human label for the recognized intent, e.g. "Percentage Calculation". */
  recognizedLabel?: string;
  /** Short human summary of what was understood, e.g. "10% of 500". */
  recognizedSummary?: string;
  /** True when every required field is filled and the result can be computed now. */
  autoCalculable?: boolean;
  /** Inline result for intents computed without routing (e.g. arithmetic). */
  inlineResult?: { label: string; value: string };
  /** ISO target date for live countdown intents. */
  liveCountdownTarget?: string;
  /** Human-readable names of the missing required fields. */
  missingLabels?: string[];
}

/* ------------------------------------------------------------------------ */
/* History / storage                                                         */
/* ------------------------------------------------------------------------ */

export interface HistoryEntry {
  id: string;
  calculatorId: string;
  calculatorName: string;
  category: CategorySlug;
  /** Inputs at the time of calculation. */
  inputs: CalculatorInputs;
  /** Primary metric snapshot for quick display. */
  summary: {
    label: string;
    value: number | string;
    kind: MetricKind;
  } | null;
  /** Currency active at the time (for money tools). */
  currency?: CurrencyCode;
  createdAt: number;
}

export interface UserPreferences {
  currency: CurrencyCode;
  /** Whether the user dismissed optional onboarding hints. */
  hintsDismissed?: boolean;
  /** Appearance mode. */
  theme?: ThemeMode;
  /** Accent hue (degrees 0-360) for the custom theme. */
  accentHue?: number;
  /** Tactile calculator sound preference. */
  soundEnabled?: boolean;
}

/** Appearance modes supported by the theme system. */
export type ThemeMode = "dark" | "light" | "system" | "custom";

/** A user-saved calculation (distinct from automatic history). */
export interface SavedCalculation {
  id: string;
  calculatorId: string;
  calculatorName: string;
  category: CategorySlug;
  name: string;
  inputs: CalculatorInputs;
  summary: {
    label: string;
    value: number | string;
    kind: MetricKind;
  } | null;
  currency?: CurrencyCode;
  createdAt: number;
}

/** Versioned storage envelope for all persisted slices. */
export interface StorageEnvelope<T> {
  version: number;
  data: T;
}
