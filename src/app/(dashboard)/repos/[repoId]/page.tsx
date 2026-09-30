import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { FileTree } from "@/components/explorer/FileTree";
import { RepoHeader } from "./RepoHeader";
import { Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RepoDetailsPage({
  params,
}: {
  params: { repoId: string };
}) {
  const repo = await prisma.repository.findUnique({
    where: { id: params.repoId },
    include: {
      files: { where: { isDeleted: false } },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!repo) notFound();

  const serializedFiles = repo.files.map((f) => ({
    ...f,
    fileSize: f.fileSize ? f.fileSize.toString() : null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    deletedAt: f.deletedAt ? f.deletedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <RepoHeader repo={repo} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: File Tree */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">File Explorer</h2>
          </div>
          <FileTree repoId={repo.id} initialFiles={serializedFiles} />
        </div>

        {/* Right: Activity Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Aktivitas Repo
            </h2>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 divide-y divide-zinc-800/60 max-h-[600px] overflow-y-auto">
            {repo.activities.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                Belum ada aktivitas.
              </div>
            ) : (
              repo.activities.map((act) => (
                <div key={act.id} className="py-2.5 first:pt-1 last:pb-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-medium text-emerald-400 truncate">
                      {act.actionType}
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
