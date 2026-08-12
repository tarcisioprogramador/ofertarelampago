"use client";

import { useRouter } from "next/navigation";

export function SortSelect({ name, options, defaultValue, label = "Ordenar:" }: { name: string; options: { value: string; label: string }[]; defaultValue?: string; label?: string }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`sort-${name}`} className="text-xs font-semibold text-ink-500">{label}</label>
      <select
        id={`sort-${name}`}
        name={name}
        defaultValue={defaultValue ?? ""}
        onChange={(e) => {
          const url = new URL(window.location.href);
          if (e.target.value) url.searchParams.set(name, e.target.value);
          else url.searchParams.delete(name);
          router.push(url.pathname + url.search);
        }}
        className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-800 outline-none focus:border-brand-500"
      >
        <option value="">{options[0]?.label}</option>
        {options.slice(1).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
