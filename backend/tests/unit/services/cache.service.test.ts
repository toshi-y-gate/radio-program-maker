import fs from "fs";
import path from "path";
import { getCacheStats, clearCache } from "../../../src/services/cache.service";

const CACHE_DIR = path.resolve(__dirname, "../../../cache");

describe("cache.service", () => {
  beforeEach(() => {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
      }
    }
  });

  describe("getCacheStats", () => {
    it("should return zero stats when cache is empty", () => {
      const stats = getCacheStats();
      expect(stats.count).toBe(0);
      expect(stats.sizeMB).toBe(0);
    });

    it("should count cache files", () => {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(CACHE_DIR, "test1.mp3"), "data1");
      fs.writeFileSync(path.join(CACHE_DIR, "test2.mp3"), "data2");

      const stats = getCacheStats();
      expect(stats.count).toBe(2);
      expect(stats.sizeMB).toBeGreaterThanOrEqual(0);
    });
  });

  describe("clearCache", () => {
    it("should delete all cache files", () => {
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }
      fs.writeFileSync(path.join(CACHE_DIR, "test1.mp3"), "data1");
      fs.writeFileSync(path.join(CACHE_DIR, "test2.mp3"), "data2");

      const result = clearCache();
      expect(result.deletedCount).toBe(2);

      const stats = getCacheStats();
      expect(stats.count).toBe(0);
    });

    it("should return zero when cache is already empty", () => {
      const result = clearCache();
      expect(result.deletedCount).toBe(0);
    });
  });
});
