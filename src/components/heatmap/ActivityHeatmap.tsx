"use client";

import { useMemo, useState } from "react";

interface HeatmapDay {
  date: string;
  count: number;
}

export function ActivityHeatmap({
  data,
  onSelectDate,
}: {
  data: HeatmapDay[];
  onSelectDate?: (date: string | null) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { days, dateMap } = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => map.set(d.date, d.count));

    const today = new Date();
    const list: { date: string; count: number }[] = [];
    for (let i = 180; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split("T")[0];
      list.push({ date: str, count: map.get(str) || 0 });
    }
    return { days: list, dateMap: map };
  }, [data]);

  function getColorClass(count: number) {
    if (count === 0) return "bg-zinc-800/80 hover:ring-1 hover:ring-zinc-600";
    if (count <= 2) return "bg-emerald-950 text-emerald-300 border border-emerald-800";
    if (count <= 5) return "bg-emerald-700 text-emerald-100";
    return "bg-emerald-400 text-emerald-950 font-bold";
  }

  function handleDayClick(date: string) {
    const next = selectedDate === date ? null : date;
    setSelectedDate(next);
    onSelectDate?.(next);
  }

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3">
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Kontribusi Aktivitas (6 Bulan Terakhir)</span>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span>Kurang</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-zinc-800"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-950"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></div>
          <span>Banyak</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {days.map((item) => (
          <button
            key={item.date}
            onClick={() => handleDayClick(item.date)}
            title={`${item.date}: ${item.count} aktivitas`}
            className={`w-3 h-3 rounded-sm transition ${getColorClass(item.count)} ${
              selectedDate === item.date ? "ring-2 ring-emerald-400" : ""
            }`}
          />
        ))}
      </div>

      {selectedDate && (
        <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-800">
          <span>Menampilkan filter tanggal: <strong className="text-zinc-200">{selectedDate}</strong> ({dateMap.get(selectedDate) || 0} aktivitas)</span>
          <button
            onClick={() => handleDayClick(selectedDate)}
            className="text-emerald-400 hover:underline"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
