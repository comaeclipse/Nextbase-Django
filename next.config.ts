import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the dev-mode overlay so it never pollutes pixel-parity screenshots.
  devIndicators: false,
};

export default nextConfig;
