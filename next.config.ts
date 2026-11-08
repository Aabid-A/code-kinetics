import type { NextConfig } from "next";

// Test fixtures (files named page.fixture.tsx) become routes only when LAB_FIXTURES=1, which only the Playwright
// dev-mode spec sets (Next 16 keeps dev output in .next/dev, apart from the production build). Production builds keep
// the single "/" route. agentRules is off so the dev server does not write an AGENTS.md into the repository.
const fixtures = process.env.LAB_FIXTURES === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(fixtures ? { pageExtensions: ["fixture.tsx", "tsx", "ts", "jsx", "js"], agentRules: false } : {}),
};

export default nextConfig;
