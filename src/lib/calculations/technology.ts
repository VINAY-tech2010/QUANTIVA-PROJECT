import type { CalcResult, CalculatorInputs } from "@/types";
import { roundTo, toNumber } from "@/lib/utils/math";

/**
 * Number base converter: decimal ↔ binary ↔ octal ↔ hexadecimal.
 */
export function calculateBaseConvert(inputs: CalculatorInputs): CalcResult {
  const value = typeof inputs.value === "string" ? inputs.value.trim() : String(inputs.value ?? "");
  const fromBase = toNumber(inputs.fromBase, 10);

  if (!value) return { ok: false, error: "Enter a number to convert.", metrics: [] };
  if (![2, 8, 10, 16].includes(fromBase)) {
    return { ok: false, error: "Unsupported base.", metrics: [] };
  }

  const decimal = Number.parseInt(value, fromBase);
  if (Number.isNaN(decimal) || !Number.isFinite(decimal)) {
    return { ok: false, error: `That is not a valid base-${fromBase} number.`, metrics: [] };
  }
  if (Math.abs(decimal) > Number.MAX_SAFE_INTEGER) {
    return { ok: false, error: "Number is too large to convert safely.", metrics: [] };
  }

  return {
    ok: true,
    metrics: [
      { key: "decimal", label: "Decimal (base 10)", kind: "text", value: decimal.toString(10), primary: true },
      { key: "binary", label: "Binary (base 2)", kind: "text", value: decimal.toString(2) },
      { key: "octal", label: "Octal (base 8)", kind: "text", value: decimal.toString(8) },
      { key: "hex", label: "Hexadecimal (base 16)", kind: "text", value: decimal.toString(16).toUpperCase() },
    ],
    narrative: `${value} (base ${fromBase}) is ${decimal.toString(10)} in decimal, ${decimal.toString(2)} in binary, ${decimal.toString(8)} in octal, and ${decimal.toString(16).toUpperCase()} in hexadecimal.`,
    data: { decimal },
  };
}

/**
 * Download / transfer time: file size ÷ connection speed.
 */
export function calculateDownloadTime(inputs: CalculatorInputs): CalcResult {
  const sizeMb = toNumber(inputs.sizeMb); // megabytes
  const speedMbps = toNumber(inputs.speedMbps); // megabits per second

  if (sizeMb <= 0) return { ok: false, error: "File size must be greater than zero.", metrics: [] };
  if (speedMbps <= 0) return { ok: false, error: "Connection speed must be greater than zero.", metrics: [] };

  // MB (megabytes) → megabits: × 8.
  const megabits = sizeMb * 8;
  const totalSeconds = megabits / speedMbps;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);

  const parts: string[] = [];
  if (hours) parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
  if (minutes) parts.push(`${minutes} min${minutes === 1 ? "" : "s"}`);
  if (seconds || parts.length === 0) parts.push(`${seconds} sec${seconds === 1 ? "" : "s"}`);
  const friendly = parts.join(" ");

  return {
    ok: true,
    metrics: [
      { key: "time", label: "Estimated time", kind: "text", value: friendly, primary: true },
      { key: "seconds", label: "Total seconds", kind: "number", value: roundTo(totalSeconds, 1) },
    ],
    narrative: `A ${sizeMb} MB file over a ${speedMbps} Mbps connection takes about ${friendly} (real-world times are usually a bit longer due to overhead).`,
    data: { seconds: roundTo(totalSeconds, 1) },
  };
}

/**
 * Aspect ratio: simplify width:height and compute the diagonal ratio.
 */
export function calculateAspectRatio(inputs: CalculatorInputs): CalcResult {
  const width = toNumber(inputs.width);
  const height = toNumber(inputs.height);

  if (width <= 0 || height <= 0) {
    return { ok: false, error: "Width and height must be greater than zero.", metrics: [] };
  }

  const gcd = (a: number, b: number): number => {
    let x = Math.round(a);
    let y = Math.round(b);
    while (y !== 0) { const t = y; y = x % y; x = t; }
    return x || 1;
  };
  const g = gcd(width, height);
  const ratioW = Math.round(width) / g;
  const ratioH = Math.round(height) / g;
  const decimal = roundTo(width / height, 4);

  return {
    ok: true,
    metrics: [
      { key: "ratio", label: "Aspect ratio", kind: "text", value: `${ratioW}:${ratioH}`, primary: true },
      { key: "decimal", label: "Width ÷ height", kind: "number", value: decimal },
    ],
    narrative: `${width} × ${height} simplifies to an aspect ratio of ${ratioW}:${ratioH} (width is ${decimal}× the height).`,
    data: { ratioW, ratioH, decimal },
  };
}
