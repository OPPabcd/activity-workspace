import { db } from "@/lib/db";
import { resolveFilePath } from "@/lib/storage";
import fs from "fs";
import fsp from "fs/promises";

export async function GET(req: Request, { params }: { params: { fileId: string } }) {
  const file = await db.fileNode.findUnique({ where: { id: params.fileId } });
  if (!file || !file.storagePath) {
    return new Response("File tidak ditemukan", { status: 404 });
  }

  const filePath = resolveFilePath(file.storagePath);
  let stat;
  try {
    stat = await fsp.stat(filePath);
  } catch {
    return new Response("File fisik hilang dari storage", { status: 404 });
  }

  const fileSize = stat.size;
  const range = req.headers.get("range");
  const mime = file.mimeType || "application/octet-stream";

  if (!range) {
    const stream = fs.createReadStream(filePath);
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": mime,
      },
    });
  }

  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 2 * 1024 * 1024, fileSize - 1);
  const chunkSize = end - start + 1;

  const stream = fs.createReadStream(filePath, { start, end });
  return new Response(stream as unknown as ReadableStream, {
    status: 206,
    headers: {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize.toString(),
      "Content-Type": mime,
    },
  });
}
