"use client";

import React from "react";
import type { ProvinceInfo, ClubInfo } from "./MapView";

export default function MapPanel({
  provinceInfo,
  activeClub,
  isHover,
}: {
  provinceInfo: ProvinceInfo | null;
  activeClub: ClubInfo | null;
  isHover: boolean;
}) {
  // En mobile este panel no tiene utilidad (no hay hover), se oculta
  return (
    <div className="hidden sm:block absolute top-4 left-4 z-20 w-[300px] lg:w-[320px] rounded-2xl bg-white/80 backdrop-blur border border-black/5 shadow-xl p-3">
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
            Tocá una provincia para ver sus datos.
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-black/5">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wide text-gray-500">Club</div>
            {activeClub && !isHover && (
              <span className="text-[10px] font-bold tracking-wide bg-gray-900 text-white rounded-md px-1.5 py-0.5">
                SELECCIONADO
              </span>
            )}
          </div>

          {activeClub ? (
            <div className="mt-2 flex gap-3 items-center">
              {activeClub.badgeUrl ? (
                <img
                  src={activeClub.badgeUrl}
                  className="w-10 h-10 object-contain flex-shrink-0"
                  alt=""
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gray-200 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 line-clamp-2 leading-tight">
                  {activeClub.name}
                </div>
                {activeClub.city && (
                  <div className="text-sm text-gray-700 line-clamp-1">{activeClub.city}</div>
                )}
                {activeClub.league && (
                  <div className="text-xs text-gray-500 line-clamp-2 leading-tight mt-0.5">
                    {activeClub.league}
                  </div>
                )}
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