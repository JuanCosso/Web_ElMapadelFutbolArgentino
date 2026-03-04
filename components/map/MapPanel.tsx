"use client";

import React from "react";
import type { ProvinceInfo, ClubInfo } from "./MapView";

export default function MapPanel({
  provinceInfo,
  activeClub,
}: {
  provinceInfo: ProvinceInfo | null;
  activeClub: ClubInfo | null;
}) {
  return (
    <div className="absolute top-4 left-4 z-20 w-[280px] sm:w-[320px] rounded-2xl bg-white/80 backdrop-blur border border-black/5 shadow-xl p-3">
      <div className="text-sm font-semibold text-gray-900 mb-3">Información</div>

      <div className="rounded-2xl bg-white/70 border border-black/5 p-3">
        <div className="text-xs uppercase tracking-wide text-gray-500">Provincia</div>

        {provinceInfo ? (
          <div className="mt-1">
            <div className="font-semibold text-gray-900">{provinceInfo.name}</div>
            <div className="text-sm text-gray-700">
              Ligas: <b>{provinceInfo.leagues}</b> · Equipos: <b>{provinceInfo.clubs}</b>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600 mt-1">
            Pasá el mouse o tocá una provincia.
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-black/5">
          <div className="text-xs uppercase tracking-wide text-gray-500">Club</div>

          {activeClub ? (
            <div className="mt-2 flex gap-3 items-center">
              {activeClub.badgeUrl ? (
                <img
                  src={activeClub.badgeUrl}
                  className="w-10 h-10 object-contain"
                  alt=""
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
              )}

              <div className="min-w-0">
                <div className="font-semibold text-gray-900 line-clamp-2">
                  {activeClub.name}
                </div>
                <div className="text-sm text-gray-700 line-clamp-2">
                  {activeClub.city}
                </div>
                <div className="text-xs text-gray-600 line-clamp-2">
                  {activeClub.league}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 mt-1">
              Pasá el mouse sobre un club.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
