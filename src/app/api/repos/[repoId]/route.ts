import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { repoId: string } }) {
  const repo = await db.repository.findUnique({
    where: { id: params.repoId },
    include: {
      files: {
        where: { isDeleted: false },
        orderBy: [{ type: "asc" }, { name: "asc" }]
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });

  if (!repo) return NextResponse.json({ error: "Repository tidak ditemukan" }, { status: 404 });
  return NextResponse.json(repo);
}

export async function PATCH(req: Request, { params }: { params: { repoId: string } }) {
  const body = await req.json();
  const repo = await db.repository.update({
    where: { id: params.repoId },
    data: {
      ...body,
      completedAt: body.status === "COMPLETED" ? new Date() : null,
    }
  });

  if (body.status) {
    await db.activityLog.create({
      data: {
        repoId: repo.id,
        actionType: "STATUS_CHANGED",
        title: body.status === "COMPLETED" ? "Menandai Repositori Selesai" : "Membuka Kembali Repositori",
        weightScore: body.status === "COMPLETED" ? 3 : 1,
      }
    });
  }

  return NextResponse.json(repo);
}

export async function DELETE(req: Request, { params }: { params: { repoId: string } }) {
  await db.repository.delete({ where: { id: params.repoId } });
  return NextResponse.json({ success: true });
}
