import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const repos = await db.repository.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { files: { where: { isDeleted: false } } } }
    }
  });
  return NextResponse.json(repos);
}

export async function POST(req: Request) {
  const { name, description } = await req.json();
  const repo = await db.repository.create({
    data: { name, description }
  });
  
  await db.activityLog.create({
    data: {
      repoId: repo.id,
      actionType: "REPO_CREATED",
      title: `Membuat Repositori Baru: ${repo.name}`,
      weightScore: 2,
    }
  });

  return NextResponse.json(repo);
}
