"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function CreateRepoButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const res = await fetch("/api/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });

    if (res.ok) {
      const data = await res.json();
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/repos/${data.id}`);
      router.refresh();
    } else {
      alert("Gagal membuat repositori.");
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
      >
        <Plus className="w-3.5 h-3.5" />
        Buat Repositori
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-semibold text-zinc-100 mb-1">
              Buat Repositori Baru
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              Repositori berfungsi sebagai ruang kerja dan folder root aktivitas Anda.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Nama Repositori</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. project-iot-gateway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Deskripsi (Opsional)</label>
                <textarea
                  rows={3}
                  placeholder="Catatan tujuan atau cakupan dokumentasi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Buat Repositori"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
