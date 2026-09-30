import prisma from "@/lib/db";
import Link from "next/link";
import { FolderGit2, HardDrive, Calendar } from "lucide-react";
import { CreateRepoButton } from "./CreateRepoButton";

export const dynamic = "force-dynamic";

export default async function ReposPage() {
  const repos = await prisma.repository.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { files: { where: { isDeleted: false } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-emerald-400" />
            Daftar Repositori
          </h1>
          <p className="text-xs text-zinc-400">
            Kelola arsip project, folder bertingkat, dan dokumentasi aktivitas.
          </p>
        </div>
        <CreateRepoButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repos.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl">
            Belum ada repositori dibuat. Klik &quot;Buat Repositori&quot; untuk memulai.
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
                    {repo.status === "COMPLETED" ? "Selesai" : "In Progress"}
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
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(repo.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
