import type { Category, CategorySlug } from "@/types";

export const CATEGORIES: readonly Category[] = [
  {
    slug: "money",
    name: "Money & Loans",
    tagline: "Loans, savings, debt and growth",
    description:
      "Calculate loan payments, savings goals, emergency funds, debt payoff timelines, mortgage costs and compound growth. Clear, instant money answers.",
    icon: "banknote",
  },
  {
    slug: "buying",
    name: "Buying & Affordability",
    tagline: "Can I afford it? What's the real price?",
    description:
      "Work out affordability, discounts, unit prices, rent budgets, sales tax and tips so you can buy with confidence.",
    icon: "shopping-bag",
  },
  {
    slug: "time",
    name: "Time & Life",
    tagline: "Durations, dates and countdowns",
    description:
      "Measure time between two points, date differences, exact age and countdowns to the moments that matter.",
    icon: "clock",
  },
  {
    slug: "productivity",
    name: "Productivity",
    tagline: "Percentages, rates and break-even",
    description:
      "Handle percentages, freelance rates, meeting costs and break-even points to make sharper work decisions.",
    icon: "zap",
  },
  {
    slug: "math",
    name: "Math",
    tagline: "Arithmetic, algebra, geometry and more",
    description:
      "Everyday and advanced math: percentages, fractions, ratios, averages, powers, roots, equations, sequences, geometry and trigonometry.",
    icon: "sigma",
  },
  {
    slug: "science",
    name: "Science",
    tagline: "Physics and chemistry calculators",
    description:
      "Physics and chemistry tools: motion, force, energy, electricity, gases, solutions, concentration and temperature.",
    icon: "flask",
  },
  {
    slug: "statistics",
    name: "Statistics",
    tagline: "Averages, spread and probability",
    description:
      "Understand your data: mean, median, mode, spread, standard deviation, z-scores, probability, permutations and combinations.",
    icon: "chart",
  },
  {
    slug: "health",
    name: "Health & Fitness",
    tagline: "Body, nutrition and activity estimates",
    description:
      "Estimate BMI, calorie needs, macros, heart-rate zones and pace. Results are reference estimates, not medical advice.",
    icon: "heart",
  },
  {
    slug: "conversion",
    name: "Conversion",
    tagline: "Units, currency and measurements",
    description:
      "Convert length, mass, temperature, volume, speed, energy, pressure, data and more with a consistent conversion engine.",
    icon: "repeat",
  },
  {
    slug: "everyday",
    name: "Everyday",
    tagline: "Tips, fuel, cooking and home projects",
    description:
      "Practical daily tools: tips, bill splitting, fuel cost, electricity, cooking conversions, paint, flooring and more.",
    icon: "home",
  },
  {
    slug: "business",
    name: "Business",
    tagline: "Salary, margins and unit economics",
    description:
      "Work and business tools: salary conversions, overtime, commission, margins, markup, CAC, LTV and unit economics.",
    icon: "briefcase",
  },
  {
    slug: "technology",
    name: "Technology",
    tagline: "Number bases, data and networking",
    description:
      "Technical calculators: number base conversion, data storage, transfer time, aspect ratio, PPI and subnet tools.",
    icon: "cpu",
  },
] as const;

const CATEGORY_MAP = new Map<CategorySlug, Category>(
  CATEGORIES.map((c) => [c.slug, c]),
);

export function getCategory(slug: CategorySlug): Category {
  const category = CATEGORY_MAP.get(slug);
  if (!category) {
    throw new Error(`Unknown category: ${slug}`);
  }
  return category;
}

export function isCategorySlug(value: string): value is CategorySlug {
  return CATEGORY_MAP.has(value as CategorySlug);
}
