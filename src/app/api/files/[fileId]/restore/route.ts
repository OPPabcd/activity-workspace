import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { fileId: string } }) {
  const target = await db.fileNode.findUnique({
    where: { id: params.fileId }
  });

  if (!target || !target.isDeleted) {
    return NextResponse.json({ error: "File tidak ditemukan di Recycle Bin" }, { status: 404 });
  }

  // Cari atau buat virtual folder 'bin' di root repo
  let binFolder = await db.fileNode.findFirst({
    where: {
      repoId: target.repoId,
      parentId: null,
      name: "bin",
      type: "FOLDER",
      isDeleted: false
    }
  });

  if (!binFolder) {
    binFolder = await db.fileNode.create({
      data: {
        repoId: target.repoId,
        parentId: null,
        name: "bin",
        type: "FOLDER"
      }
    });
  }

  const restored = await db.fileNode.update({
    where: { id: target.id },
    data: {
      isDeleted: false,
      deletedAt: null,
      parentId: binFolder.id // Dipindahkan ke folder /bin
    }
  });

  await db.activityLog.create({
    data: {
      repoId: target.repoId,
      actionType: "FILE_RESTORED",
      title: `Memulihkan ${target.name} ke folder /bin`,
      weightScore: 1
    }
  });

  return NextResponse.json({ success: true, file: restored });
}
