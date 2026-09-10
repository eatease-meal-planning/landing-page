import { defineConfig } from "vitest/config";
import path from "node:path";

const alias = {
  "@": path.resolve(import.meta.dirname, "./src"),
  "@public": path.resolve(import.meta.dirname, "./public"),
};

export default defineConfig({
  test: {
    projects: [
      {
        // Route handlers and pure logic. No DOM — these must stay fast.
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          globals: true,
          setupFiles: ["./vitest.setup.node.ts"],
          include: ["src/{app,db,lib}/**/*.test.ts"],
        },
      },
      {
        // Client Components.
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./vitest.setup.dom.ts"],
          include: ["src/components/**/*.test.tsx"],
        },
      },
    ],
  },
});
