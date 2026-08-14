/**
 * Root loading fallback shown while a route segment streams.
 * Mirrors the app backdrop so there is no layout shift on entry.
 */
export default function RootLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="h-9 w-56 animate-pulse rounded-lg bg-white/5" />
          <div className="hidden h-10 w-64 animate-pulse rounded-full bg-white/5 sm:block" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    </main>
  );
}