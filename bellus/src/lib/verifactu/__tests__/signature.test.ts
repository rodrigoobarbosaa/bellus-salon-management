import {
  signFacturaHash,
  verifyFacturaSignature,
} from "../signature";
import { generateKeyPairSync } from "crypto";

describe("signFacturaHash", () => {
  it("should return null firma_digital when no private key (degraded mode)", () => {
    const result = signFacturaHash("abc123", null);

    expect(result.firma_digital).toBeNull();
    expect(result.signed).toBe(false);
    expect(result.warning).toBeDefined();
  });

  it("should return a valid base64 signature when private key is provided", () => {
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const hash = "a".repeat(64);
    const result = signFacturaHash(hash, privateKey as unknown as string);

    expect(result.signed).toBe(true);
    expect(result.firma_digital).toBeTruthy();
    // Base64 pattern
    expect(result.firma_digital).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it("should produce different signatures for different hashes", () => {
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const r1 = signFacturaHash("a".repeat(64), privateKey as unknown as string);
    const r2 = signFacturaHash("b".repeat(64), privateKey as unknown as string);

    expect(r1.firma_digital).not.toBe(r2.firma_digital);
  });
});

describe("verifyFacturaSignature", () => {
  it("should verify a valid signature", () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const hash = "c".repeat(64);
    const signed = signFacturaHash(hash, privateKey as unknown as string);

    const valid = verifyFacturaSignature(
      hash,
      signed.firma_digital!,
      publicKey as unknown as string
    );
    expect(valid).toBe(true);
  });

  it("should reject a tampered hash", () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const hash = "d".repeat(64);
    const signed = signFacturaHash(hash, privateKey as unknown as string);

    const tampered = "e".repeat(64);
    const valid = verifyFacturaSignature(
      tampered,
      signed.firma_digital!,
      publicKey as unknown as string
    );
    expect(valid).toBe(false);
  });

  it("should return false for invalid signature", () => {
    const { publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const valid = verifyFacturaSignature(
      "f".repeat(64),
      "not_a_real_signature",
      publicKey as unknown as string
    );
    expect(valid).toBe(false);
  });
});
