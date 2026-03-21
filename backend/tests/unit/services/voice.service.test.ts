import { getPresetVoices } from "../../../src/services/voice.service";

describe("voice.service", () => {
  describe("getPresetVoices", () => {
    it("should return 8 preset voices", () => {
      const presets = getPresetVoices();
      expect(presets).toHaveLength(8);
    });

    it("should have 4 Japanese voices", () => {
      const presets = getPresetVoices();
      const ja = presets.filter((v) => v.language === "ja");
      expect(ja).toHaveLength(4);
    });

    it("should have 4 English voices", () => {
      const presets = getPresetVoices();
      const en = presets.filter((v) => v.language === "en");
      expect(en).toHaveLength(4);
    });

    it("each voice should have id, name, language, gender", () => {
      const presets = getPresetVoices();
      for (const voice of presets) {
        expect(voice.id).toBeDefined();
        expect(voice.name).toBeDefined();
        expect(["ja", "en"]).toContain(voice.language);
        expect(["male", "female"]).toContain(voice.gender);
      }
    });
  });
});
