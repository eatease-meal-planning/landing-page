import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  outputFileTracingIncludes: {
    "/api/contacts": ["./src/templates/**"],
    "/api/contacts/confirm": ["./src/templates/**"],
  },
};

export default nextConfig;
