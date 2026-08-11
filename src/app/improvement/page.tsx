"use client";

import { Suspense, useState, type FormEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { playClick, playConfirm } from "@/lib/sound";

const CATEGORIES = [
  { value: "suggest", label: "Suggest an improvement" },
  { value: "feature", label: "Request a feature" },
  { value: "bug", label: "Report a bug" },
  { value: "complaint", label: "Make a complaint" },
  { value: "general", label: "General feedback" },
  { value: "contact", label: "Contact message" },
  { value: "tool-request", label: "Request a tool" },
] as const;

type Status = "idle" | "sending" | "sent" | "error";

const SUCCESS_MESSAGE: Record<string, string> = {
  complaint:
    "Your complaint has been submitted successfully. We appreciate you taking the time to report the issue.",
  "tool-request":
    "Thanks for the suggestion. Your tool request has been sent successfully and may be considered for a future QUANTIVA update.",
  default: "Thank you. Your feedback has been submitted successfully.",
};

function ImprovementForm() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") === "tool-request" ? "tool-request" : "suggest";
  const initialTool = searchParams.get("tool") ?? "";

  const [category, setCategory] = useState<string>(initialCategory);
  const [toolName, setToolName] = useState(initialTool);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const isToolRequest = category === "tool-request";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return; // prevent duplicate rapid submissions
    setStatus("sending");
    setError(null);

    // Compose the message for tool requests from the structured fields.
    const finalMessage = isToolRequest
      ? [
          `Tool requested: ${toolName}`,
          "",
          `What it should do: ${message}`,
          details ? `Additional details: ${details}` : null,
        ]
          .filter((l): l is string => l !== null)
          .join("\n")
      : message;

    const finalSubject = isToolRequest
      ? `Tool Request: ${toolName}`
      : subject;

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name,
          email,
          subject: finalSubject,
          message: finalMessage,
          website, // honeypot
          page: pathname,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Your request couldn't be submitted right now. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("sent");
      setMessage("");
      setDetails("");
      setSubject("");
      playConfirm();
    } catch {
      setError("Your request couldn't be submitted right now. Please try again.");
      setStatus("error");
    }
  }

  const successText = SUCCESS_MESSAGE[category] ?? SUCCESS_MESSAGE.default;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        <span className="text-gradient">
          {isToolRequest ? "Request a New Tool" : "Help us improve"}
        </span>
      </h1>
      <p className="mt-2 text-muted">
        {isToolRequest
          ? "What tool would you like to see in QUANTIVA?"
          : "Suggest improvements, request features, report bugs, make a complaint, or send a general message. We read every submission."}
      </p>

      {status === "sent" ? (
        <div className="card mt-8 p-8 text-center" role="status">
          <p className="text-lg font-medium text-foreground">
            {isToolRequest ? "Request submitted" : "Thank you!"}
          </p>
          <p className="mt-2 text-sm text-muted">{successText}</p>
          <button
            type="button"
            className="btn-ghost mt-6"
            onClick={() => {
              setStatus("idle");
              playClick();
            }}
          >
            Send another
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card mt-8 flex flex-col gap-5 p-6">
          {!isToolRequest && (
            <div>
              <label htmlFor="fb-category" className="block text-sm font-medium text-foreground">
                Category
              </label>
              <select
                id="fb-category"
                className="input mt-1.5"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isToolRequest && (
            <div>
              <label htmlFor="fb-tool-name" className="block text-sm font-medium text-foreground">
                Tool name
              </label>
              <input
                id="fb-tool-name"
                className="input mt-1.5"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                maxLength={120}
                required
                placeholder="e.g. Compound Interest Calculator"
              />
              <p className="mt-1.5 text-xs text-muted">
                You can request a calculator, converter, financial tool, date/time tool, or another
                useful calculation feature.
              </p>
            </div>
          )}

          {!isToolRequest && (
            <div>
              <label htmlFor="fb-subject" className="block text-sm font-medium text-foreground">
                Subject <span className="text-muted">(optional)</span>
              </label>
              <input
                id="fb-subject"
                className="input mt-1.5"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                placeholder="Brief summary"
              />
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="fb-name" className="block text-sm font-medium text-foreground">
                Name <span className="text-muted">(optional)</span>
              </label>
              <input
                id="fb-name"
                className="input mt-1.5"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="fb-email" className="block text-sm font-medium text-foreground">
                Email <span className="text-muted">(optional — for a reply)</span>
              </label>
              <input
                id="fb-email"
                type="email"
                className="input mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="fb-message" className="block text-sm font-medium text-foreground">
              {isToolRequest ? "What would you like the tool to do?" : "Message"}
            </label>
            <textarea
              id="fb-message"
              className="input mt-1.5 min-h-32 resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              required
              placeholder={
                isToolRequest
                  ? "Explain what you want the calculator/tool to calculate or help with…"
                  : "Tell us what's on your mind…"
              }
            />
            {isToolRequest && (
              <p className="mt-1.5 text-xs text-muted">
                Tell us what you want the tool to calculate or how you want it to work. We&apos;ll
                review the request and consider it for a future update.
              </p>
            )}
          </div>

          {isToolRequest && (
            <div>
              <label htmlFor="fb-details" className="block text-sm font-medium text-foreground">
                Additional details <span className="text-muted">(optional)</span>
              </label>
              <textarea
                id="fb-details"
                className="input mt-1.5 min-h-20 resize-y"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                placeholder="Any specific features, inputs, formulas, units, or behavior you want…"
              />
            </div>
          )}

          {/* Honeypot: hidden from humans, attractive to bots. Never fill this. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-[-9999px]">
            <label htmlFor="fb-website">Website</label>
            <input
              id="fb-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-rose-400">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary self-start" disabled={status === "sending"}>
            {status === "sending"
              ? "Sending request…"
              : isToolRequest
                ? "Submit Request"
                : "Send feedback"}
          </button>
        </form>
      )}
    </main>
  );
}

export default function ImprovementPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
          <p className="text-muted">Loading…</p>
        </main>
      }
    >
      <ImprovementForm />
    </Suspense>
  );
}
