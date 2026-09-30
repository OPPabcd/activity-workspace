import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: { fileId: string } }) {
  const file = await db.fileNode.findUnique({ where: { id: params.fileId } });
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });

  await db.fileNode.update({
    where: { id: file.id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    }
  });

  await db.activityLog.create({
    data: {
      repoId: file.repoId,
      actionType: "FILE_DELETED",
      title: `Memindahkan ${file.name} ke Recycle Bin`,
      weightScore: 1,
    }
  });

  return NextResponse.json({ success: true });
}
