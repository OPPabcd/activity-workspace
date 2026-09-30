"use client";

import { useState } from "react";
import { FolderGit2, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RepoHeaderProps {
  repo: {
    id: string;
    name: string;
    description: string | null;
    status: "IN_PROGRESS" | "COMPLETED";
    updatedAt: Date;
  };
}

export function RepoHeader({ repo }: RepoHeaderProps) {
  const [status, setStatus] = useState(repo.status);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggleStatus() {
    const nextStatus = status === "IN_PROGRESS" ? "COMPLETED" : "IN_PROGRESS";
    setLoading(true);
    const res = await fetch(`/api/repos/${repo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (res.ok) {
      setStatus(nextStatus);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDeleteRepo() {
    if (!confirm(`Hapus repositori "${repo.name}" dan semua datanya secara permanen?`)) return;
    const res = await fetch(`/api/repos/${repo.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/repos");
      router.refresh();
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <FolderGit2 className="w-5 h-5 text-emerald-400" />
          <h1 className="text-lg font-bold text-zinc-100">{repo.name}</h1>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              status === "COMPLETED"
                ? "bg-blue-950 text-blue-400 border border-blue-800"
                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
            }`}
          >
            {status === "COMPLETED" ? "Selesai" : "In Progress"}
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          {repo.description || "Tidak ada deskripsi"}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={toggleStatus}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition border ${
            status === "COMPLETED"
              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
              : "bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {status === "COMPLETED" ? "Tandai In Progress" : "Tandai Selesai"}
        </button>

        <Link
          href={`/repos/${repo.id}/trash`}
          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Recycle Bin
        </Link>

        <button
          onClick={handleDeleteRepo}
          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
          title="Hapus Repositori"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
