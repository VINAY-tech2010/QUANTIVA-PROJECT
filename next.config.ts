import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Disable Turbopack's persistent build cache. The cache snapshots
    // server-side env values (e.g. EMAIL_PROVIDER_API_KEY) into
    // .next/cache/turbopack/*.sst, which Netlify ships into the deploy bundle
    // where secrets scanning rejects it. The cache is a build-speed
    // optimization only — disabling it changes no runtime behavior.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
