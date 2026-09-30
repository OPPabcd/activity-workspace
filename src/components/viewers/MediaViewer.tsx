"use client";

import { X, ExternalLink, Edit } from "lucide-react";
import Link from "next/link";

interface MediaViewerProps {
  file: {
    id: string;
    repoId: string;
    name: string;
    mimeType: string | null;
  };
  onClose: () => void;
}

export function MediaViewer({ file, onClose }: MediaViewerProps) {
  const streamUrl = `/api/files/stream/${file.id}`;
  const isImage = file.mimeType?.startsWith("image/");
  const isVideo = file.mimeType?.startsWith("video/");
  const isPdf = file.mimeType?.includes("pdf") || file.name.endsWith(".pdf");
  const isText =
    file.mimeType?.startsWith("text/") ||
    /\.(txt|md|json|js|ts|tsx|jsx|css|html|py|sh|yaml|yml)$/i.test(file.name);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <span className="font-medium text-sm text-zinc-200 truncate">{file.name}</span>
          <div className="flex items-center gap-2">
            {isText && (
              <Link
                href={`/repos/${file.repoId}/editor/${file.id}`}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs flex items-center gap-1"
              >
                <Edit className="w-3 h-3" /> Edit File
              </Link>
            )}
            <a
              href={streamUrl}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-400 hover:text-zinc-200 p-1"
              title="Buka di tab baru"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px] bg-zinc-950/50">
          {isImage && (
            <img src={streamUrl} alt={file.name} className="max-w-full max-h-[70vh] object-contain rounded" />
          )}

          {isVideo && (
            <video controls autoPlay className="w-full max-h-[70vh] rounded">
              <source src={streamUrl} type={file.mimeType || "video/mp4"} />
              Browser tidak mendukung tag video.
            </video>
          )}

          {isPdf && (
            <iframe src={streamUrl} className="w-full h-[70vh] rounded border border-zinc-800" title={file.name} />
          )}

          {!isImage && !isVideo && !isPdf && (
            <div className="text-center text-zinc-400 space-y-3">
              <p className="text-sm">Preview langsung tidak tersedia untuk format ini.</p>
              {isText ? (
                <Link
                  href={`/repos/${file.repoId}/editor/${file.id}`}
                  className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs"
                >
                  Buka di Text Editor
                </Link>
              ) : (
                <a
                  href={streamUrl}
                  download={file.name}
                  className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs"
                >
                  Download File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
