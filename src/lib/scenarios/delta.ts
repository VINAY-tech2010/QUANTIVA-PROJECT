import type {
  CalcResult,
  CalculatorMetric,
  MetricKind,
  ScenarioDelta,
} from "@/types";

/**
 * Metric kinds where a smaller number is generally better for the user
 * (costs, interest, time-to-goal). Everything else treats larger as better.
 */
const LOWER_IS_BETTER = new Set(["duration"]);

/**
 * Heuristic: decide whether a metric improves when its value goes down.
 * Uses the metric kind plus label/key keywords (cost, interest, payment...).
 */
function lowerIsBetter(metric: CalculatorMetric): boolean {
  if (LOWER_IS_BETTER.has(metric.kind)) return true;
  const text = `${metric.key} ${metric.label}`.toLowerCase();
  return /(cost|interest|payment|repay|debt|expense|price|tax|duration|time|months|years|break.?even)/.test(
    text,
  );
}

function isNumeric(v: number | string): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** Format a signed delta for the headline, using the metric kind. */
function formatDeltaValue(kind: MetricKind, diff: number): string {
  const abs = Math.abs(diff);
  switch (kind) {
    case "currency":
      // Currency formatting is applied by the caller with the active currency;
      // here we just produce a plain signed number string.
      return abs.toFixed(2);
    case "percent":
      return `${abs.toFixed(1)}%`;
    case "number":
      return abs.toLocaleString(undefined, { maximumFractionDigits: 2 });
    default:
      return String(abs);
  }
}

/**
 * Compute the comparison between a baseline result and a scenario result.
 * Returns null when either side failed or there is nothing comparable.
 */
export function computeScenarioDelta(
  scenarioId: string,
  scenarioName: string,
  baseline: CalcResult,
  scenario: CalcResult,
): ScenarioDelta | null {
  if (!baseline.ok || !scenario.ok) return null;

  const scenarioByKey = new Map(scenario.metrics.map((m) => [m.key, m]));
  const deltas: ScenarioDelta["deltas"] = [];

  for (const bm of baseline.metrics) {
    const sm = scenarioByKey.get(bm.key);
    if (!sm) continue;

    const entry: ScenarioDelta["deltas"][number] = {
      metricKey: bm.key,
      label: bm.label,
      kind: bm.kind,
      baseline: bm.value,
      scenario: sm.value,
    };

    if (isNumeric(bm.value) && isNumeric(sm.value)) {
      const difference = sm.value - bm.value;
      entry.difference = difference;
      if (difference !== 0) {
        const better = lowerIsBetter(bm) ? difference < 0 : difference > 0;
        entry.improved = better;
      }
    }
    deltas.push(entry);
  }

  if (deltas.length === 0) return null;

  // Headline: use the primary metric (or first numeric delta).
  const primary =
    baseline.metrics.find((m) => m.primary) ?? baseline.metrics[0];
  let headline = `Compared to your baseline`;
  if (primary) {
    const d = deltas.find((x) => x.metricKey === primary.key);
    if (d && d.difference !== undefined && d.difference !== 0) {
      const verb = d.improved ? "Save" : "Add";
      const amount = formatDeltaValue(primary.kind, d.difference);
      headline =
        primary.kind === "currency"
          ? `${verb} ${amount} on ${primary.label.toLowerCase()}`
          : `${d.improved ? "Better" : "Worse"} ${primary.label.toLowerCase()} by ${amount}`;
    } else {
      headline = `No change in ${primary.label.toLowerCase()}`;
    }
  }

  return { scenarioId, scenarioName, headline, deltas };
}
