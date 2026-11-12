import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // GitHub Pages serves this project from /Kingdom-of-eternity.
  basePath: process.env.GITHUB_ACTIONS ? "/Kingdom-of-eternity" : ""
};

export default nextConfig;
