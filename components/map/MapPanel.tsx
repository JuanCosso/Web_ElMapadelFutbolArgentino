"use client";

import React from "react";
import type { ProvinceInfo, ClubInfo } from "./MapView";

function MapPanelBadge({ badgeUrl, clubId, name }: { badgeUrl?: string; clubId?: string; name: string }) {
  const initialSrc = badgeUrl || (clubId ? `/badges/${clubId}.webp` : "");

  return (
    <img
      key={`${clubId}-${badgeUrl}`}
      src={initialSrc}
      className="w-10 h-10 object-contain flex-shrink-0"
      alt={name}
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

export default function MapPanel({
  provinceInfo,
  activeClub,
  isHover,
  isDark,
}: {
  provinceInfo: ProvinceInfo | null;
  activeClub: ClubInfo | null;
  isHover: boolean;
  isDark?: boolean;
}) {
  return (
    <div
      className={[
        "hidden sm:block absolute top-4 left-4 z-20 w-[300px] lg:w-[320px] rounded-2xl backdrop-blur shadow-xl p-3 border transition-colors",
        isDark
          ? "bg-gray-900/90 border-white/20 text-white"
          : "bg-white/80 border-black/5 text-gray-900",
      ].join(" ")}
    >
      <div
        className={[
          "rounded-2xl p-3 border transition-colors",
          isDark
            ? "bg-gray-800/80 border-white/10"
            : "bg-white/70 border-black/5",
        ].join(" ")}
      >
        <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Provincia</div>

        {provinceInfo ? (
          <div className="mt-1">
            <div className={isDark ? "font-semibold text-white" : "font-semibold text-gray-900"}>
              {provinceInfo.name}
            </div>
            <div className={isDark ? "text-sm text-gray-300" : "text-sm text-gray-700"}>
              Ligas: <b>{provinceInfo.leagues}</b> · Equipos: <b>{provinceInfo.clubs}</b>
            </div>
          </div>
        ) : (
          <div className={isDark ? "text-sm text-gray-400 mt-1" : "text-sm text-gray-600 mt-1"}>
            Tocá una provincia para ver sus datos.
          </div>
        )}

        <div className={isDark ? "mt-3 pt-3 border-t border-white/10" : "mt-3 pt-3 border-t border-black/5"}>
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Club</div>
            {activeClub && !isHover && (
              <span className="text-[10px] font-bold tracking-wide bg-blue-600 text-white rounded-md px-1.5 py-0.5">
                SELECCIONADO
              </span>
            )}
          </div>

          {activeClub ? (
            <div className="mt-2 flex gap-3 items-center">
              <MapPanelBadge
                badgeUrl={activeClub.badgeUrl}
                clubId={activeClub.clubId}
                name={activeClub.name}
              />
              <div className="min-w-0">
                <div className={isDark ? "font-semibold text-white line-clamp-2 leading-tight" : "font-semibold text-gray-900 line-clamp-2 leading-tight"}>
                  {activeClub.name}
                </div>
                {activeClub.city && (
                  <div className={isDark ? "text-sm text-gray-300 line-clamp-1" : "text-sm text-gray-700 line-clamp-1"}>
                    {activeClub.city}
                  </div>
                )}
                {activeClub.league && (
                  <div className="text-xs text-gray-400 line-clamp-2 leading-tight mt-0.5">
                    {activeClub.league}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={isDark ? "text-sm text-gray-400 mt-1" : "text-sm text-gray-600 mt-1"}>
              Pasá el mouse sobre un club.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}