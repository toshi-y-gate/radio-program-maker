import {
  registerSchema,
  loginSchema,
  createVoiceSchema,
  generateSchema,
  historyListSchema,
} from "../../../src/utils/validation";

describe("registerSchema", () => {
  it("should accept valid input", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "12345678",
      displayName: "テストユーザー",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = registerSchema.safeParse({
      email: "invalid",
      password: "12345678",
      displayName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "1234567",
      displayName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty displayName", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "12345678",
      displayName: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("should accept valid input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password",
    });
    expect(result.success).toBe(true);
  });

  it("should reject missing password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("createVoiceSchema", () => {
  it("should accept valid input", () => {
    const result = createVoiceSchema.safeParse({ name: "My Voice" });
    expect(result.success).toBe(true);
  });

  it("should reject empty name", () => {
    const result = createVoiceSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});

describe("generateSchema", () => {
  const validInput = {
    script: "[太郎] こんにちは",
    speakers: [{ speaker: "太郎", voiceId: "male-qn-qingse" }],
    settings: {
      speed: 1.0,
      volume: 1.0,
      pitch: 0,
      emotion: "neutral" as const,
      model: "speech-2.8-hd" as const,
    },
  };

  it("should accept valid input", () => {
    const result = generateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("should accept input with bgm", () => {
    const result = generateSchema.safeParse({
      ...validInput,
      bgm: { insertMode: "background", volume: 0.5 },
    });
    expect(result.success).toBe(true);
  });

  it("should reject empty script", () => {
    const result = generateSchema.safeParse({
      ...validInput,
      script: "",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty speakers", () => {
    const result = generateSchema.safeParse({
      ...validInput,
      speakers: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject more than 4 speakers", () => {
    const result = generateSchema.safeParse({
      ...validInput,
      speakers: [
        { speaker: "A", voiceId: "v1" },
        { speaker: "B", voiceId: "v2" },
        { speaker: "C", voiceId: "v3" },
        { speaker: "D", voiceId: "v4" },
        { speaker: "E", voiceId: "v5" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid speed", () => {
    const result = generateSchema.safeParse({
      ...validInput,
      settings: { ...validInput.settings, speed: 3.0 },
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid emotion", () => {
    const result = generateSchema.safeParse({
      ...validInput,
      settings: { ...validInput.settings, emotion: "invalid" },
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid model", () => {
    const result = generateSchema.safeParse({
      ...validInput,
      settings: { ...validInput.settings, model: "invalid-model" },
    });
    expect(result.success).toBe(false);
  });
});

describe("historyListSchema", () => {
  it("should accept valid input", () => {
    const result = historyListSchema.safeParse({
      page: "1",
      limit: "20",
    });
    expect(result.success).toBe(true);
  });

  it("should apply defaults", () => {
    const result = historyListSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
      expect(result.data.sort).toBe("newest");
    }
  });

  it("should accept search parameter", () => {
    const result = historyListSchema.safeParse({
      search: "test",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid sort", () => {
    const result = historyListSchema.safeParse({
      sort: "invalid",
    });
    expect(result.success).toBe(false);
  });
});
