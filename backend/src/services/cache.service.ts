import fs from "fs";
import path from "path";

const CACHE_DIR = path.resolve(__dirname, "../../cache");

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function getCacheStats(): { count: number; sizeMB: number } {
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR);
  let totalSize = 0;

  for (const file of files) {
    const filePath = path.join(CACHE_DIR, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      totalSize += stat.size;
    }
  }

  return {
    count: files.filter((f) => {
      const fp = path.join(CACHE_DIR, f);
      return fs.statSync(fp).isFile();
    }).length,
    sizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
  };
}

export function clearCache(): { deletedCount: number } {
  ensureCacheDir();
  const files = fs.readdirSync(CACHE_DIR);
  let deletedCount = 0;

  for (const file of files) {
    const filePath = path.join(CACHE_DIR, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  }

  return { deletedCount };
}
