"use client";

import { useEffect, useState } from "react";

export function Countdown({ endAt, compact = false }: { endAt: string; compact?: boolean }) {
  const [left, setLeft] = useState(() => calc(endAt));

  useEffect(() => {
    const id = setInterval(() => setLeft(calc(endAt)), 1000);
    return () => clearInterval(id);
  }, [endAt]);

  if (left.expired) {
    return <span className="text-xs font-bold uppercase tracking-wide text-flash-600">Oferta encerrada</span>;
  }

  const cells = [
    { value: left.hours, label: "h" },
    { value: left.minutes, label: "min" },
    { value: left.seconds, label: "s" },
  ];

  return (
    <div className={`flex items-center gap-1 ${compact ? "" : "gap-1.5"}`} role="timer" aria-live="off" aria-label={`Tempo restante: ${left.hours} horas, ${left.minutes} minutos e ${left.seconds} segundos`}>
      {cells.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={`grid place-items-center rounded-lg bg-ink-950 font-mono font-bold tabular-nums text-white ${compact ? "h-7 min-w-7 px-1 text-xs" : "h-9 min-w-10 px-1.5 text-sm"}`}>
            {c.value}
          </span>
          {i < 2 && <span className="font-bold text-flash-500">:</span>}
        </span>
      ))}
      {!compact && <span className="ml-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">restam</span>}
    </div>
  );
}

function calc(endAt: string) {
  const end = new Date(endAt).getTime();
  const diff = Math.max(0, end - Date.now());
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return {
    hours: String(h).padStart(2, "0"),
    minutes: String(m).padStart(2, "0"),
    seconds: String(s).padStart(2, "0"),
    expired: diff <= 0,
  };
}
