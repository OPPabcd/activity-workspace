import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function optimizeImage(inputBuffer: Buffer, targetPath: string) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await sharp(inputBuffer)
    .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(targetPath);

  const thumbPath = targetPath.replace(/\.webp$/, "_thumb.webp");
  await sharp(inputBuffer)
    .resize(320, 320, { fit: "cover" })
    .webp({ quality: 70 })
    .toFile(thumbPath);
}
