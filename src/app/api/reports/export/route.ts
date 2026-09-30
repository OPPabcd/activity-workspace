import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start") || searchParams.get("startDate");
  const end = searchParams.get("end") || searchParams.get("endDate");

  if (!start || !end) {
    return NextResponse.json({ error: "Rentang tanggal harus diisi" }, { status: 400 });
  }

  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return NextResponse.json({ error: "Rentang tanggal minimal 7 hari (1 minggu)" }, { status: 400 });
  }

  const [completedRepos, inProgressRepos, activities] = await Promise.all([
    db.repository.findMany({
      where: { status: "COMPLETED", completedAt: { gte: startDate, lte: endDate } },
      include: { _count: { select: { files: true, activities: true } } }
    }),
    db.repository.findMany({
      where: { status: "IN_PROGRESS" },
      include: { _count: { select: { files: true, activities: true } } }
    }),
    db.activityLog.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      orderBy: { createdAt: "desc" },
      include: { repository: { select: { name: true } } }
    })
  ]);

  const totalWeight = activities.reduce((acc, act) => acc + (act.weightScore || 1), 0);

  return NextResponse.json({
    range: {
      startDate: start,
      endDate: end,
      totalDays: diffDays,
    },
    stats: {
      totalActivities: activities.length,
      totalWeight,
      completedCount: completedRepos.length,
      inProgressCount: inProgressRepos.length,
    },
    summary: {
      diffDays,
      totalActivities: activities.length,
      completedCount: completedRepos.length,
      inProgressCount: inProgressRepos.length
    },
    completedRepos,
    inProgressRepos,
    activities
  });
}
