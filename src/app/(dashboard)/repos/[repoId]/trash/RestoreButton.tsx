"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

export function RestoreButton({
  fileId,
  fileName,
}: {
  fileId: string;
  fileName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRestore() {
    setLoading(true);
    const res = await fetch(`/api/files/${fileId}/restore`, { method: "POST" });
    if (res.ok) {
      alert(`"${fileName}" berhasil dipulihkan ke folder /bin!`);
      router.refresh();
    } else {
      alert("Gagal memulihkan file.");
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleRestore}
      disabled={loading}
      className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      {loading ? "Memulihkan..." : "Pulihkan ke /bin"}
    </button>
  );
}
