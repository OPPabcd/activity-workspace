"use client";

import { useState } from "react";
import { FileText, Printer, AlertCircle } from "lucide-react";

interface ReportData {
  range: { startDate: string; endDate: string; totalDays: number };
  stats: { totalActivities: number; totalWeight: number };
  activities: {
    id: string;
    actionType: string;
    title: string;
    weightScore: number;
    createdAt: string;
    repository: { name: string } | null;
  }[];
}

export default function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(sevenDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/reports/export?startDate=${startDate}&endDate=${endDate}`);
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Gagal menghasilkan laporan.");
      setReport(null);
    } else {
      setReport(data);
    }
    setLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-4">
        <div className="border-b border-zinc-800 pb-4">
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Export Laporan Aktivitas (PDF)
          </h1>
          <p className="text-xs text-zinc-400">
            Hasilkan rekapitulasi audit kegiatan berkala. Minimal rentang waktu adalah 7 hari.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-end gap-4 text-xs">
          <div>
            <label className="block text-zinc-300 mb-1 font-medium">Tanggal Mulai</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-zinc-300 mb-1 font-medium">Tanggal Selesai</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? "Menghasilkan..." : "Generate Laporan"}
          </button>

          {report && (
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-medium flex items-center gap-2 transition ml-auto"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
          )}
        </form>
      </div>

      {/* Printable Report Layout */}
      {report && (
        <div className="bg-white text-zinc-900 p-8 rounded-xl border border-zinc-200 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6">
          <div className="border-b border-zinc-200 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">LAPORAN DOKUMENTASI AKTIVITAS</h2>
                <p className="text-xs text-zinc-500">Personal Engineering & Activity Workspace</p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>Periode: <strong>{report.range.startDate}</strong> s/d <strong>{report.range.endDate}</strong></p>
                <p>Total Durasi: <strong>{report.range.totalDays} hari</strong></p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-xs text-zinc-500 block">Total Aktivitas</span>
              <span className="text-2xl font-bold text-zinc-800">{report.stats.totalActivities}</span>
            </div>
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-xs text-zinc-500 block">Akumulasi Bobot Kontribusi</span>
              <span className="text-2xl font-bold text-emerald-600">{report.stats.totalWeight}</span>
            </div>
          </div>

          {/* Audit Log Table */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-zinc-800">Detail Rekapitulasi Kegiatan</h3>
            <table className="w-full text-left text-xs border border-zinc-200 divide-y divide-zinc-200">
              <thead className="bg-zinc-50 text-zinc-600 font-semibold">
                <tr>
                  <th className="p-2.5">Waktu</th>
                  <th className="p-2.5">Repositori</th>
                  <th className="p-2.5">Aksi</th>
                  <th className="p-2.5">Detail</th>
                  <th className="p-2.5 text-right">Bobot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {report.activities.map((act) => (
                  <tr key={act.id}>
                    <td className="p-2.5 text-zinc-500 whitespace-nowrap">
                      {new Date(act.createdAt).toLocaleString("id-ID")}
                    </td>
                    <td className="p-2.5 font-medium">{act.repository?.name || "System"}</td>
                    <td className="p-2.5">{act.actionType}</td>
                    <td className="p-2.5 text-zinc-600">{act.title}</td>
                    <td className="p-2.5 text-right font-semibold text-emerald-600">{act.weightScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-6 border-t border-zinc-200 text-[11px] text-zinc-400 flex justify-between">
            <span>Digenerate otomatis oleh Personal Activity Workspace</span>
            <span>Halaman 1</span>
          </div>
        </div>
      )}
    </div>
  );
}
