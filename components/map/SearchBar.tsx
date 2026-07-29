"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchItem } from "@/utils/searchIndex";
import { searchItems } from "@/utils/searchIndex";
import { Trophy, MapPin, Building2 } from "lucide-react";

type Props = {
  index: SearchItem[];
  onSelect: (item: SearchItem) => void;
  isDrawerOpen?: boolean;
};

function TypePill({ t }: { t: SearchItem["type"] }) {
  const label =
    t === "club"
      ? "Club"
      : t === "city"
      ? "Ciudad"
      : t === "league"
      ? "Liga"
      : "Provincia";
  return (
    <span className="text-[10px] font-bold tracking-wide text-gray-600 bg-gray-100 border border-black/10 rounded-lg px-2 py-0.5">
      {label}
    </span>
  );
}

function SearchClubBadge({
  badgeUrl,
  clubId,
  name,
}: {
  badgeUrl?: string;
  clubId?: string;
  name: string;
}) {
  const initialSrc = badgeUrl || (clubId ? `/badges/${clubId}.webp` : "");

  return (
    <img
      key={`${clubId}-${badgeUrl}`}
      src={initialSrc}
      alt={name}
      width={24}
      height={24}
      className="w-6 h-6 rounded-md object-contain shrink-0"
      onError={(e) => {
        const target = e.currentTarget;
        const fallback = clubId ? `/badges/${clubId}.webp` : "";
        if (fallback && target.src !== new URL(fallback, window.location.href).href) {
          target.src = fallback;
        } else {
          target.style.display = "none";
        }
      }}
    />
  );
}

export default function SearchBar({ index, onSelect, isDrawerOpen }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

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

  const hasProv = results.some((r) => r.type === "province");
  const hasCity = results.some((r) => r.type === "city");
  const hasLeague = results.some((r) => r.type === "league");
  const hasClub = results.some((r) => r.type === "club");

  return (
    <div
      ref={ref}
      className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-[92vw] sm:w-[500px] lg:w-[560px] max-w-[calc(100vw-2rem)]"
    >
      <div className="rounded-2xl border border-black/10 bg-white/90 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-2.5 px-3 py-2">
          {/* Lupa con el mismo tono y efecto hover que el botón X del panel */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0 cursor-pointer"
            aria-label="Buscar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar provincia, ciudad, liga o club…"
            className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400 py-2 font-medium"
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
        <div className="mt-2 rounded-2xl border border-black/10 bg-white shadow-xl overflow-hidden">
          <div className="max-h-[420px] overflow-auto">
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-black/5">
              Mostrando <span className="font-semibold text-gray-700">{results.length}</span>{" "}
              resultados
            </div>

            {hasProv && (
              <div className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wide text-gray-600">
                PROVINCIAS
              </div>
            )}

            {results.map((r, i) => {
              const showHeader =
                (r.type === "city" && hasCity && results.findIndex((x) => x.type === "city") === i) ||
                (r.type === "league" && hasLeague && results.findIndex((x) => x.type === "league") === i) ||
                (r.type === "club" && hasClub && results.findIndex((x) => x.type === "club") === i);

              const headerTitle =
                r.type === "city"
                  ? "CIUDADES"
                  : r.type === "league"
                  ? "LIGAS Y TORNEOS"
                  : "CLUBES";

              return (
                <div key={`${r.type}:${r.key}`}>
                  {showHeader && (
                    <div className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wide text-gray-600">
                      {headerTitle}
                    </div>
                  )}

                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(i)}
                    className={[
                      "w-full text-left px-3 py-2 flex items-center gap-3",
                      "hover:bg-gray-50 transition-colors",
                      i === active ? "bg-gray-50" : "",
                    ].join(" ")}
                  >
                    <TypePill t={r.type} />

                    {r.type === "club" ? (
                      <SearchClubBadge
                        badgeUrl={r.badge_url}
                        clubId={r.club_id}
                        name={r.label}
                      />
                    ) : r.type === "league" ? (
                      r.logo_url ? (
                        <img
                          src={r.logo_url}
                          alt=""
                          className="w-6 h-6 rounded-md object-contain shrink-0"
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-600 flex items-center justify-center shrink-0">
                          <Trophy size={13} />
                        </span>
                      )
                    ) : r.type === "province" ? (
                      <span className="w-6 h-6 rounded-md bg-gray-100 border border-black/10 flex items-center justify-center shrink-0 text-gray-500">
                        <MapPin size={13} />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-md bg-gray-100 border border-black/10 flex items-center justify-center shrink-0 text-gray-500">
                        <Building2 size={13} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-gray-900 leading-tight flex items-center gap-2">
                        <span>{r.label}</span>
                        {r.type === "province" ? (
                          <span className="text-xs font-medium text-gray-500">
                            ({r.countCities} ciudades · {r.countClubs} clubes)
                          </span>
                        ) : r.type === "city" ? (
                          <span className="text-xs font-medium text-gray-500">
                            ({r.countClubs} clubes)
                          </span>
                        ) : null}
                      </div>

                      {"sublabel" in r && r.sublabel ? (
                        <div className="text-xs text-gray-500 truncate">{r.sublabel}</div>
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

