import { describe, expect, it } from "vitest";

import { parsePublicEnv, parseServerEnv } from "./env";

const validPublic = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
};

const validServer = {
  ...validPublic,
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  RESEND_API_KEY: "re_test_key",
  RESEND_FROM_EMAIL: "Berypez <pedidos@example.com>",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
};

describe("parsePublicEnv", () => {
  it("returns the public variables when all are valid", () => {
    expect(parsePublicEnv(validPublic)).toEqual(validPublic);
  });

  it("throws a message naming every missing variable", () => {
    expect(() => parsePublicEnv({})).toThrowError(
      /NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("rejects a Supabase URL that is not a URL", () => {
    expect(() =>
      parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("never exposes server secrets even if they are present", () => {
    const result = parsePublicEnv(validServer);

    expect(result).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
    expect(result).not.toHaveProperty("RESEND_API_KEY");
    expect(result).not.toHaveProperty("TURNSTILE_SECRET_KEY");
  });
});

describe("parseServerEnv", () => {
  it("returns public and secret variables when all are valid", () => {
    expect(parseServerEnv(validServer)).toEqual(validServer);
  });

  it("throws when a secret is missing", () => {
    const withoutServiceRole = { ...validServer, SUPABASE_SERVICE_ROLE_KEY: "" };

    expect(() => parseServerEnv(withoutServiceRole)).toThrowError(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("does not include the secret values in the error message", () => {
    const badEmail = { ...validServer, RESEND_FROM_EMAIL: "" };

    expect(() => parseServerEnv(badEmail)).toThrowError(
      expect.objectContaining({
        message: expect.not.stringContaining("service-role-key"),
      }),
    );
  });
});
