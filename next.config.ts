import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone — a self-contained server.js plus only the
  // node_modules it actually needs, traced via dependency analysis. This
  // is what the Electron desktop build embeds instead of shipping the
  // whole repo's node_modules. Harmless for normal `next start` deploys.
  output: "standalone",
};

export default nextConfig;
