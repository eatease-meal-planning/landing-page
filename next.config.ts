import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // renderEmail() reads src/templates/*.html at runtime with a template name
  // the tracer cannot resolve statically, so every route that sends mail has
  // to pull the directory in explicitly.
  outputFileTracingIncludes: {
    "/api/contacts": ["./src/templates/**"],
    "/api/contacts/confirm": ["./src/templates/**"],
    "/api/account-deletion": ["./src/templates/**"],
  },
};

export default nextConfig;
