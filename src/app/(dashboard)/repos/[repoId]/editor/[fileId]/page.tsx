"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Check } from "lucide-react";
import Link from "next/link";

export default function TextEditorPage({
  params,
}: {
  params: { repoId: string; fileId: string };
}) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadContent() {
      const res = await fetch(`/api/files/content/${params.fileId}`);
      if (res.ok) {
        const text = await res.text();
        setContent(text);
      }
      setLoading(false);
    }
    loadContent();
  }, [params.fileId]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/files/content/${params.fileId}`, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: content,
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert("Gagal menyimpan perubahan.");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-500 animate-pulse">
        Memuat editor file...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/repos/${params.repoId}`}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm font-semibold text-zinc-200">
            Inline Code & Text Editor
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Tersimpan
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={28}
          className="w-full bg-zinc-950 text-zinc-100 font-mono text-xs p-4 rounded-lg border border-zinc-800 focus:outline-none focus:border-emerald-500 resize-y"
          placeholder="Tulis kode atau catatan di sini..."
        />
      </div>
    </div>
  );
}
