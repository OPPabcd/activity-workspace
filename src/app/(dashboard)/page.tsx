import prisma from "@/lib/db";
import { ActivityHeatmap } from "@/components/heatmap/ActivityHeatmap";
import Link from "next/link";
import { FolderGit2, ArrowRight, FileText, Clock, HardDrive } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [repos, activities, allDates] = await Promise.all([
    prisma.repository.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: {
        _count: {
          select: { files: { where: { isDeleted: false } } },
        },
      },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: {
        repository: { select: { name: true } },
      },
    }),
    prisma.activityLog.findMany({
      select: { createdAt: true, weightScore: true },
    }),
  ]);

  const heatmapData = allDates.map((a) => ({
    date: a.createdAt.toISOString().slice(0, 10),
    count: a.weightScore,
  }));

  return (
    <div className="space-y-6">
      {/* Top Welcome & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Personal Workspace</h1>
          <p className="text-xs text-zinc-400">
            Dokumentasi rekayasa sistem, pelacakan aktivitas harian & media storage.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/repos"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Buka Repositori
          </Link>
          <Link
            href="/reports"
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Export Laporan
          </Link>
        </div>
      </div>

      {/* Heatmap Contribution Section */}
      <ActivityHeatmap data={heatmapData} />

      {/* Repositories & Activity Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Repositories */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-emerald-400" />
              Repositori Terkini
            </h2>
            <Link
              href="/repos"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {repos.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl">
                Belum ada repositori. Buat repositori pertama Anda untuk mulai mendokumentasikan kegiatan.
              </div>
            ) : (
              repos.map((repo) => (
                <Link
                  key={repo.id}
                  href={`/repos/${repo.id}`}
                  className="p-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl transition flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-semibold text-sm text-zinc-200 group-hover:text-emerald-400 transition truncate">
                        {repo.name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          repo.status === "COMPLETED"
                            ? "bg-blue-950 text-blue-400 border border-blue-800"
                            : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        }`}
                      >
                        {repo.status === "COMPLETED" ? "Selesai" : "Aktif"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {repo.description || "Tidak ada deskripsi"}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" /> {repo._count.files} file
                    </span>
                    <span>{new Date(repo.updatedAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Right: Live Activity Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Aktivitas Terbaru
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 divide-y divide-zinc-800/60 max-h-[460px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                Belum ada aktivitas tercatat.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="py-2.5 first:pt-1 last:pb-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-medium text-emerald-400 truncate">
                      {act.repository ? act.repository.name : "System"}
                    </span>
                    <span className="text-[10px] text-zinc-500 shrink-0">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{act.title}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
