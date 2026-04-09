import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow WebSocket HMR connections from your cloudflared tunnel
  allowedDevOrigins: ['app.shahriarfardows.com'],
};


export default nextConfig;
