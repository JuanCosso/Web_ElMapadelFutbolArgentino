"use client";

import React from "react";
import type { BasemapId } from "./style";

function SegBtn({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
        active
          ? "bg-gray-900 text-white shadow-sm"
          : "bg-white/70 hover:bg-white text-gray-900",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function MapLayerControl({
  basemap,
  setBasemap,
  roads,
  setRoads,
  onHome,
}: {
  basemap: BasemapId;
  setBasemap: (v: BasemapId) => void;
  roads: boolean;
  setRoads: (v: boolean) => void;
  onHome: (() => void) | null;
}) {
  return (
    // Mobile: bottom-center. Desktop: bottom-right
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 z-20">
      <div className="rounded-2xl bg-white/80 backdrop-blur border border-black/5 shadow-xl p-2 sm:p-3 space-y-2">

        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold tracking-wide text-gray-700 hidden sm:block">
            Capas
          </div>

          <button
            type="button"
            onClick={() => onHome?.()}
            disabled={!onHome}
            className={[
              "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
              onHome
                ? "bg-white/70 hover:bg-white text-gray-900 border border-black/5"
                : "bg-white/40 text-gray-400 border border-black/5 cursor-not-allowed",
            ].join(" ")}
            aria-label="Volver a inicio"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">Inicio</span>
          </button>
        </div>

        <div className="flex gap-1">
          <SegBtn active={basemap === "streets"} onClick={() => setBasemap("streets")}>
            Calles
          </SegBtn>
          <SegBtn active={basemap === "satellite"} onClick={() => setBasemap("satellite")}>
            Satélite
          </SegBtn>
          <SegBtn active={basemap === "relief"} onClick={() => setBasemap("relief")}>
            Relieve
          </SegBtn>
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-800 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={roads}
            onChange={(e) => setRoads(e.target.checked)}
            className="rounded"
          />
          Rutas
        </label>
      </div>
    </div>
  );
}