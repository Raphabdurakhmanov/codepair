import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint is not part of this MVP; don't block builds on it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
