import { notFound } from "next/navigation";

/**
 * Catch-all for unmatched paths. Without it, unknown URLs render the
 * not-found page with a 200 status on the OpenNext worker (a soft 404, which
 * search engines treat as a thin duplicate page). Routing through notFound()
 * guarantees the correct 404 status code. Static and API routes take
 * precedence over this segment.
 */
export default function CatchAllPage() {
  notFound();
}