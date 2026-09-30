import { db } from "@/lib/db";
import { resolveFilePath } from "@/lib/storage";
import fsp from "fs/promises";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { fileId: string } }) {
  const file = await db.fileNode.findUnique({ where: { id: params.fileId } });
  if (!file || !file.storagePath) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });

  const fullPath = resolveFilePath(file.storagePath);
  try {
    const content = await fsp.readFile(fullPath, "utf-8");
    return NextResponse.json({ name: file.name, content });
  } catch {
    return NextResponse.json({ error: "Gagal membaca isi file" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { fileId: string } }) {
  const { content } = await req.json();
  const file = await db.fileNode.findUnique({ where: { id: params.fileId } });
  if (!file || !file.storagePath) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });

  const fullPath = resolveFilePath(file.storagePath);
  await fsp.writeFile(fullPath, content, "utf-8");

  const stat = await fsp.stat(fullPath);
  await db.fileNode.update({
    where: { id: file.id },
    data: { fileSize: BigInt(stat.size), updatedAt: new Date() },
  });

  await db.activityLog.create({
    data: {
      repoId: file.repoId,
      actionType: "FILE_EDITED",
      title: `Mengubah isi: ${file.name}`,
      weightScore: 1,
    }
  });

  return NextResponse.json({ success: true });
}
