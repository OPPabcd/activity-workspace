"use client";

import { useState } from "react";
import { Folder, File, Trash2, Upload, FolderUp, ChevronRight } from "lucide-react";
import { MediaViewer } from "@/components/viewers/MediaViewer";
import { useRouter } from "next/navigation";

interface FileNode {
  id: string;
  repoId: string;
  parentId: string | null;
  type: "FILE" | "FOLDER";
  name: string;
  mimeType: string | null;
  fileSize: string | null;
  updatedAt: string;
}

export function FileTree({
  repoId,
  initialFiles,
}: {
  repoId: string;
  initialFiles: FileNode[];
}) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "root" },
  ]);
  const [activePreview, setActivePreview] = useState<FileNode | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const currentFiles = initialFiles.filter((f) => f.parentId === currentFolderId);

  function openFolder(folder: FileNode) {
    setCurrentFolderId(folder.id);
    setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
  }

  function navigateToBreadcrumb(index: number) {
    const target = breadcrumbs[index];
    setCurrentFolderId(target.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("repoId", repoId);
    if (currentFolderId) formData.append("parentId", currentFolderId);

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
      const fileWithRelative = files[i] as File & { webkitRelativePath?: string };
      const relPath = fileWithRelative.webkitRelativePath || files[i].name;
      formData.append("paths", relPath);
    }

    await fetch("/api/files/upload", { method: "POST", body: formData });
    setUploading(false);
    router.refresh();
  }

  async function handleDelete(fileId: string, name: string) {
    if (!confirm(`Pindahkan "${name}" ke Recycle Bin?`)) return;
    await fetch(`/api/files/${fileId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between gap-4 flex-wrap bg-zinc-900/60">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 overflow-x-auto py-1">
          {breadcrumbs.map((b, idx) => (
            <div key={idx} className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => navigateToBreadcrumb(idx)}
                className={`hover:underline ${
                  idx === breadcrumbs.length - 1 ? "text-zinc-100 font-semibold" : ""
                }`}
              >
                {b.name}
              </button>
              {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg flex items-center gap-1.5 transition">
            <Upload className="w-3.5 h-3.5" />
            Upload File
            <input type="file" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>

          <label className="cursor-pointer px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded-lg flex items-center gap-1.5 transition">
            <FolderUp className="w-3.5 h-3.5" />
            Upload Folder
            {/* @ts-expect-error directory attributes */}
            <input type="file" webkitdirectory="" directory="" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {uploading && (
        <div className="p-2 bg-emerald-950/60 border-b border-emerald-800 text-emerald-300 text-xs text-center animate-pulse">
          Mengunggah dan mengoptimasi file...
        </div>
      )}

      <div className="divide-y divide-zinc-800/60">
        {currentFiles.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500">Folder ini kosong.</div>
        ) : (
          currentFiles.map((node) => (
            <div
              key={node.id}
              className="px-4 py-2.5 flex items-center justify-between text-xs hover:bg-zinc-800/40 transition group"
            >
              <div
                className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                onClick={() => (node.type === "FOLDER" ? openFolder(node) : setActivePreview(node))}
              >
                {node.type === "FOLDER" ? (
                  <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <File className="w-4 h-4 text-zinc-400 shrink-0" />
                )}
                <span className="truncate text-zinc-200 group-hover:text-emerald-300 transition">
                  {node.name}
                </span>
              </div>

              <div className="flex items-center gap-4 text-zinc-500">
                <span className="hidden sm:inline text-[11px]">
                  {new Date(node.updatedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(node.id, node.name)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition p-1"
                  title="Pindahkan ke Recycle Bin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {activePreview && (
        <MediaViewer file={activePreview} onClose={() => setActivePreview(null)} />
      )}
    </div>
  );
}
