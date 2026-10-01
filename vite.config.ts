import { defineConfig } from "vitest/config";
const headers = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
export default defineConfig({
  server: {
    headers: {
      ...headers,
      "Content-Security-Policy": csp.replace(
        "style-src 'self'",
        "style-src 'self' 'unsafe-inline'",
      ),
    },
  },
  preview: { headers: { ...headers, "Content-Security-Policy": csp } },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/domain/**/*.ts"],
      thresholds: { branches: 90 },
    },
  },
});
