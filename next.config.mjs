/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: new URL('.', import.meta.url).pathname.replace(/\/$/, ''),
  // Editor bundle is client-heavy; keep default splitting.
  // Silence the harmless dynamic+static import warning pattern from legacy chrome.jsx usage.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
