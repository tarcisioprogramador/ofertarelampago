"use client";

import { useMemo, useState } from "react";
import { formatBRL, formatDate } from "@/lib/utils";

type Point = { date: string; price: number };

const RANGES = [
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "6 meses", days: 182 },
  { label: "1 ano", days: 365 },
];

export function PriceChart({ data, currentPrice, high, low, average }: { data: Point[]; currentPrice: number; high: number; low: number; average: number }) {
  const [range, setRange] = useState(90);
  const [hover, setHover] = useState<Point | null>(null);

  const sliced = useMemo(() => data.filter((p) => Date.now() - new Date(p.date).getTime() <= range * 86400000), [data, range]);
  const series = sliced.length ? sliced : data;

  const W = 640;
  const H = 240;
  const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

  const min = Math.min(...series.map((p) => p.price));
  const max = Math.max(...series.map((p) => p.price));
  const span = Math.max(max - min, 1);

  const x = (i: number) => PAD.left + (i / Math.max(series.length - 1, 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - min) / span) * (H - PAD.top - PAD.bottom);

  const path = series.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join(" ");
  const area = `${path} L${x(series.length - 1).toFixed(1)},${H - PAD.bottom} L${x(0).toFixed(1)},${H - PAD.bottom} Z`;

  const last = series[series.length - 1];
  const hovered = hover ?? last;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRange(r.days)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === r.days ? "bg-ink-950 text-white" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
          <span>
            Maior: <strong className="text-ink-900">{formatBRL(high, 0)}</strong>
          </span>
          <span>
            Menor: <strong className="text-emerald-600">{formatBRL(low, 0)}</strong>
          </span>
          <span>
            Média: <strong className="text-ink-900">{formatBRL(average, 0)}</strong>
          </span>
          <span>
            Atual: <strong className="text-brand-600">{formatBRL(currentPrice, 0)}</strong>
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-ink-100 bg-white">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Gráfico de histórico de preço">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#ff6b00" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0.25, 0.5, 0.75].map((f) => (
            <g key={f}>
              <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + f * (H - PAD.top - PAD.bottom)} y2={PAD.top + f * (H - PAD.top - PAD.bottom)} stroke="#eef1f6" strokeWidth="1" />
              <text x={PAD.left - 8} y={PAD.top + f * (H - PAD.top - PAD.bottom) + 3} textAnchor="end" fontSize="10" fill="#8492ad">
                {formatBRL(min + f * span, 0)}
              </text>
            </g>
          ))}

          <path d={area} fill="url(#areaGrad)" />
          <path d={path} fill="none" stroke="#ff6b00" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

          {/* Ponto do hover/último */}
          <circle cx={x(series.indexOf(hovered))} cy={y(hovered.price)} r="5" fill="#fff" stroke="#ff6b00" strokeWidth="2.5" />

          {/* Datas extremas */}
          <text x={PAD.left} y={H - 8} fontSize="10" fill="#8492ad">{formatDate(series[0].date)}</text>
          <text x={W - PAD.right} y={H - 8} fontSize="10" fill="#8492ad" textAnchor="end">{formatDate(last.date)}</text>
        </svg>

        {/* Hover overlay */}
        <div
          className="pointer-events-none absolute inset-y-2 w-px bg-ink-200"
          style={{ left: `${((x(series.indexOf(hovered)) - PAD.left) / (W - PAD.left - PAD.right)) * 100}%` }}
        />
        <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-lg border border-ink-100 bg-white px-3 py-1.5 shadow-card">
          <p className="text-[11px] font-semibold text-ink-500">{formatDate(hovered.date)}</p>
          <p className="font-display text-sm font-extrabold text-ink-950">{formatBRL(hovered.price)}</p>
        </div>
      </div>
    </div>
  );
}
