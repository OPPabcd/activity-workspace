import path from "path";
import fs from "fs";

export function getStorageRoot() {
  const root = process.env.DEFAULT_STORAGE_PATH || "./uploads";
  if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
  return path.resolve(root);
}

export function resolveFilePath(storagePath: string) {
  return path.join(getStorageRoot(), storagePath);
}
