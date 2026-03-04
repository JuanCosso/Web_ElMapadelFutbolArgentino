"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchItem } from "@/utils/searchIndex";
import { searchItems } from "@/utils/searchIndex";

type Props = {
  index: SearchItem[];
  onSelect: (item: SearchItem) => void;
};

function TypePill({ t }: { t: SearchItem["type"] }) {
  const label = t === "club" ? "CLUB" : t === "city" ? "CIUDAD" : "PROVINCIA";
  return (
    <span className="text-[10px] font-bold tracking-wide text-gray-600 bg-gray-100 border border-black/10 rounded-lg px-2 py-1">
      {label}
    </span>
  );
}

export default function SearchBar({ index, onSelect }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  // grande por defecto (scrolleable). Si te preocupa performance: bajalo a 150.
  const results = useMemo(() => searchItems(index, q, 400), [index, q]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  function pick(i: number) {
    const item = results[i];
    if (!item) return;
    onSelect(item);
    setOpen(false);
  }

  // headers por tipo (sin reordenar)
  const hasProv = results.some((r) => r.type === "province");
  const hasCity = results.some((r) => r.type === "city");
  const hasClub = results.some((r) => r.type === "club");

  return (
    <div
      ref={ref}
      className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[560px] max-w-[92vw]"
    >
      <div className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2 px-3 py-2">
          <span className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M10 18a8 8 0 1 1 5.3-14.1A8 8 0 0 1 10 18z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M21 21l-4.3-4.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar provincia, ciudad o club…"
            className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 py-2"
            onKeyDown={(e) => {
              if (!open) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter") {
                e.preventDefault();
                pick(active);
              }
              if (e.key === "Escape") setOpen(false);
            }}
          />
        </div>
      </div>

      {open && q.trim() && results.length > 0 && (
        <div className="mt-2 rounded-2xl border border-black/10 bg-white shadow-lg overflow-hidden">
          <div className="max-h-[420px] overflow-auto">
            {/* Tips / contador */}
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-black/5">
              Mostrando <span className="font-semibold text-gray-700">{results.length}</span>{" "}
              resultados
              {results[0]?.type === "province" && (
                <span className="ml-2 text-gray-500">
                  (si escribís exactamente una provincia, se listan todas sus ciudades y clubes)
                </span>
              )}
            </div>

            {/* Render simple con headers */}
            {hasProv && (
              <div className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wide text-gray-600">
                PROVINCIAS
              </div>
            )}

            {results.map((r, i) => {
              const showHeader =
                (r.type === "city" && hasCity && results.findIndex((x) => x.type === "city") === i) ||
                (r.type === "club" && hasClub && results.findIndex((x) => x.type === "club") === i);

              return (
                <div key={`${r.type}:${r.key}`}>
                  {showHeader && (
                    <div className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wide text-gray-600">
                      {r.type === "city" ? "CIUDADES" : "CLUBES"}
                    </div>
                  )}

                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(i)}
                    className={[
                      "w-full text-left px-3 py-2 flex items-center gap-3",
                      "hover:bg-gray-50",
                      i === active ? "bg-gray-50" : "",
                    ].join(" ")}
                  >
                    <TypePill t={r.type} />

                    {"badge_url" in r && r.badge_url ? (
                      <img
                        src={r.badge_url}
                        alt=""
                        width={24}
                        height={24}
                        className="rounded-md object-contain"
                      />
                    ) : (
                      <span className="w-6 h-6 rounded-md bg-gray-100 border border-black/10" />
                    )}

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 leading-tight">
                        {r.label}
                        {r.type === "province" ? (
                          <span className="ml-2 text-xs font-medium text-gray-500">
                            ({r.countCities} ciudades · {r.countClubs} clubes)
                          </span>
                        ) : r.type === "city" ? (
                          <span className="ml-2 text-xs font-medium text-gray-500">
                            ({r.countClubs} clubes)
                          </span>
                        ) : null}
                      </div>

                      {"sublabel" in r && r.sublabel ? (
                        <div className="text-xs text-gray-500">{r.sublabel}</div>
                      ) : null}

                      {"full_name" in r && r.full_name ? (
                        <div className="text-xs text-gray-400 truncate">{r.full_name}</div>
                      ) : null}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
