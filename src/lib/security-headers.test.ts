import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, securityHeaders } from "./security-headers";

const SUPABASE = "https://abcd.supabase.co";

describe("contentSecurityPolicy", () => {
  it("permite Supabase (https y wss), Turnstile y GA4, y bloquea iframes y objetos", () => {
    const csp = contentSecurityPolicy({ supabaseUrl: SUPABASE, isDev: false });
    expect(csp).toContain("connect-src 'self' https://abcd.supabase.co wss://abcd.supabase.co");
    expect(csp).toContain("frame-src https://challenges.cloudflare.com");
    expect(csp).toContain("https://www.google.com");
    expect(csp).toContain("https://www.googletagmanager.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("no permite eval en producción, sí en desarrollo", () => {
    expect(contentSecurityPolicy({ supabaseUrl: SUPABASE, isDev: false })).not.toContain(
      "unsafe-eval",
    );
    expect(contentSecurityPolicy({ supabaseUrl: SUPABASE, isDev: true })).toContain(
      "'unsafe-eval'",
    );
  });

  it("no deja huecos si falta la URL de Supabase", () => {
    const csp = contentSecurityPolicy({ supabaseUrl: undefined, isDev: false });
    expect(csp).not.toMatch(/ {2}/);
    expect(csp).not.toContain("supabase");
  });
});

describe("securityHeaders", () => {
  it("incluye HSTS, nosniff, DENY, Referrer-Policy y Permissions-Policy", () => {
    const keys = securityHeaders({ supabaseUrl: SUPABASE, isDev: false }).map((h) => h.key);
    expect(keys).toEqual([
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]);
  });
});
