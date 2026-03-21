import { hashPassword, verifyPassword } from "../../../src/utils/password";

describe("password utils", () => {
  it("should hash a password", async () => {
    const hash = await hashPassword("testpassword");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("testpassword");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("should verify a correct password", async () => {
    const hash = await hashPassword("testpassword");
    const result = await verifyPassword("testpassword", hash);
    expect(result).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const hash = await hashPassword("testpassword");
    const result = await verifyPassword("wrongpassword", hash);
    expect(result).toBe(false);
  });

  it("should produce different hashes for the same password", async () => {
    const hash1 = await hashPassword("testpassword");
    const hash2 = await hashPassword("testpassword");
    expect(hash1).not.toBe(hash2);
  });
});
