import withPWA from "next-pwa";

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Railway deployment — bundles server into .next/standalone/server.js
  output: "standalone",
};

export default pwa(nextConfig);
