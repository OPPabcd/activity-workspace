import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, Folder, File } from "lucide-react";
import { RestoreButton } from "./RestoreButton";

export const dynamic = "force-dynamic";

export default async function TrashPage({
  params,
}: {
  params: { repoId: string };
}) {
  const repo = await prisma.repository.findUnique({
    where: { id: params.repoId },
    include: {
      files: {
        where: { isDeleted: true },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!repo) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/repos/${repo.id}`}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-400" />
              Recycle Bin - {repo.name}
            </h1>
            <p className="text-xs text-zinc-400">
              File yang dihapus dapat dipulihkan ke folder /bin repositori.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/60">
        {repo.files.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-500">
            Recycle bin kosong. Tidak ada file yang dihapus.
          </div>
        ) : (
          repo.files.map((file) => (
            <div
              key={file.id}
              className="p-4 flex items-center justify-between text-xs hover:bg-zinc-800/30 transition"
            >
              <div className="flex items-center gap-3">
                {file.type === "FOLDER" ? (
                  <Folder className="w-4 h-4 text-emerald-400" />
                ) : (
                  <File className="w-4 h-4 text-zinc-400" />
                )}
                <div>
                  <span className="font-medium text-zinc-200 block">{file.name}</span>
                  <span className="text-[11px] text-zinc-500">
                    Dihapus pada {new Date(file.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <RestoreButton fileId={file.id} fileName={file.name} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
