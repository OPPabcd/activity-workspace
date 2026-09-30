"use client";

import { useState, useEffect } from "react";
import { HardDrive, Folder, ChevronRight, CheckCircle2, AlertTriangle, Play } from "lucide-react";

export default function StorageSettingsPage() {
  const [currentRoot, setCurrentRoot] = useState<string>("");
  const [parentRoot, setParentRoot] = useState<string>("");
  const [browserItems, setBrowserItems] = useState<{name: string, path: string}[]>([]);
  const [selectedDest, setSelectedDest] = useState<string>("");
  const [loadingBrowse, setLoadingBrowse] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState<{
    percent: number;
    copiedFiles: number;
    totalFiles: number;
    currentFile: string;
    status: string;
  } | null>(null);

  async function loadDirectory(targetPath: string) {
    setLoadingBrowse(true);
    try {
      const res = await fetch(`/api/storage/browse?path=${encodeURIComponent(targetPath)}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentRoot(data.current);
        setParentRoot(data.parent || "");
        setBrowserItems(data.directories || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingBrowse(false);
  }

  useEffect(() => {
    loadDirectory("");
  }, []);

  function handleSelectFolder(itemPath: string) {
    setSelectedDest(itemPath);
  }

  async function handleStartMigration() {
    if (!selectedDest) return;
    if (!confirm(`Mulai migrasi semua data media ke "${selectedDest}"?\nProses ini akan memindahkan data dengan aman.`)) return;

    setMigrating(true);
    setProgress({
      percent: 0,
      copiedFiles: 0,
      totalFiles: 0,
      currentFile: "Menyiapkan migrasi...",
      status: "RUNNING",
    });

    try {
      const res = await fetch("/api/storage/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destPath: selectedDest }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Gagal memulai migrasi: ${data.error}`);
        setMigrating(false);
        setProgress(null);
        return;
      }

      const jobId = data.id;
      const eventSource = new EventSource(`/api/storage/migrate?jobId=${jobId}`);

      eventSource.onmessage = (event) => {
        try {
          const job = JSON.parse(event.data);
          if (job.status === "COMPLETED") {
            setProgress({
              percent: 100,
              copiedFiles: job.totalFiles,
              totalFiles: job.totalFiles,
              currentFile: "Migrasi selesai!",
              status: "DONE",
            });
            setMigrating(false);
            eventSource.close();
          } else if (job.status === "FAILED") {
            alert(`Migrasi gagal: ${job.errorLog || "Terjadi kesalahan"}`);
            setMigrating(false);
            eventSource.close();
          } else if (job.status === "RUNNING") {
            const percent = job.totalFiles > 0 ? Math.round((job.movedFiles / job.totalFiles) * 100) : 100;
            setProgress({
              percent,
              copiedFiles: job.movedFiles,
              totalFiles: job.totalFiles,
              currentFile: job.currentFile || "Memindahkan data...",
              status: "RUNNING",
            });
          }
        } catch (err) {
          console.error(err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setMigrating(false);
      };
    } catch {
      alert("Koneksi ke server gagal.");
      setMigrating(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-400" />
          1-Click Disk / ROM Migration
        </h1>
        <p className="text-xs text-zinc-400">
          Pindahkan seluruh media storage ke disk eksternal atau mount point lain tanpa downtime.
        </p>
      </div>

      {/* Migration Progress Panel */}
      {progress && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
              {progress.status === "DONE" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <HardDrive className="w-4 h-4 text-emerald-400 animate-pulse" />
              )}
              {progress.status === "DONE" ? "Migrasi Berhasil" : "Proses Migrasi Berlangsung"}
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {progress.percent}%
            </span>
          </div>

          <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="truncate max-w-md">File: {progress.currentFile}</span>
            <span>
              {progress.copiedFiles} / {progress.totalFiles} file
            </span>
          </div>
        </div>
      )}

      {/* Directory Picker / Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 border-b border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-mono truncate">{currentRoot}</span>
            <button
              onClick={() => {
                if (parentRoot && parentRoot !== currentRoot) {
                  loadDirectory(parentRoot);
                }
              }}
              disabled={!parentRoot || parentRoot === currentRoot}
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] disabled:opacity-40"
            >
              Ke Folder Atas
            </button>
          </div>

          <div className="p-2 max-h-[380px] overflow-y-auto divide-y divide-zinc-800/40 text-xs">
            {loadingBrowse ? (
              <div className="p-8 text-center text-zinc-500 animate-pulse">
                Membaca direktori...
              </div>
            ) : browserItems.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                Tidak ada folder ditemukan di lokasi ini.
              </div>
            ) : (
              browserItems.map((item) => (
                <div
                  key={item.path}
                  className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition ${
                    selectedDest === item.path
                      ? "bg-emerald-950/40 border border-emerald-800 text-emerald-300"
                      : "hover:bg-zinc-800/40 text-zinc-300"
                  }`}
                  onClick={() => handleSelectFolder(item.path)}
                  onDoubleClick={() => loadDirectory(item.path)}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      loadDirectory(item.path);
                    }}
                    className="p-1 hover:text-zinc-100 text-zinc-500"
                    title="Buka Folder"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action & Instructions */}
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 text-xs">
            <h2 className="font-semibold text-zinc-200">Konfirmasi Tujuan</h2>
            <div>
              <span className="text-zinc-400 block mb-1">Target Penyimpanan Baru:</span>
              <input
                type="text"
                placeholder="Pilih folder di samping atau ketik path tujuan..."
                value={selectedDest}
                onChange={(e) => setSelectedDest(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-lg text-zinc-400 text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Catatan Keamanan:
              </div>
              <p>• Data di database menggunakan path relatif sehingga relasi tetap utuh.</p>
              <p>• File lama akan diverifikasi ukuran integritasnya sebelum dihapus dari lokasi awal.</p>
            </div>

            <button
              onClick={handleStartMigration}
              disabled={!selectedDest || migrating}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              <Play className="w-4 h-4" />
              {migrating ? "Memindahkan Data..." : "Mulai Migrasi 1-Click"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
