import { describe, expect, it } from "vitest";

import { parsePublicEnv, parseServerEnv } from "./env";

const validPublic = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
};

const validServer = {
  ...validPublic,
  SUPABASE_SECRET_KEY: "sb_secret_test",
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
      /NEXT_PUBLIC_SUPABASE_URL[\s\S]*NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it("rejects a Supabase URL that is not a URL", () => {
    expect(() =>
      parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrowError(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("rejects a secret key placed in the public publishable variable", () => {
    expect(() =>
      parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_oops" }),
    ).toThrowError(/clave secreta/);
  });

  it("never exposes server secrets even if they are present", () => {
    const result = parsePublicEnv(validServer);

    expect(result).not.toHaveProperty("SUPABASE_SECRET_KEY");
    expect(result).not.toHaveProperty("RESEND_API_KEY");
    expect(result).not.toHaveProperty("TURNSTILE_SECRET_KEY");
  });
});

describe("parseServerEnv", () => {
  it("rejects a publishable key used as the secret key", () => {
    expect(() =>
      parseServerEnv({ ...validServer, SUPABASE_SECRET_KEY: "sb_publishable_test" }),
    ).toThrowError(/SUPABASE_SECRET_KEY/);
  });

  it("returns public and secret variables when all are valid", () => {
    expect(parseServerEnv(validServer)).toEqual(validServer);
  });

  it("throws when a secret is missing", () => {
    const withoutSecret = { ...validServer, SUPABASE_SECRET_KEY: "" };

    expect(() => parseServerEnv(withoutSecret)).toThrowError(/SUPABASE_SECRET_KEY/);
  });

  it("does not include the secret values in the error message", () => {
    const badEmail = { ...validServer, RESEND_FROM_EMAIL: "" };

    expect(() => parseServerEnv(badEmail)).toThrowError(
      expect.objectContaining({
        message: expect.not.stringContaining("sb_secret_test"),
      }),
    );
  });
});
