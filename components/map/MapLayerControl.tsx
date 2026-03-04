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
        "px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors",
        active ? "bg-gray-900 text-white shadow-sm" : "bg-white/70 hover:bg-white text-gray-900",
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
    <div className="absolute bottom-4 right-4 z-20">
      <div className="rounded-2xl bg-white/80 backdrop-blur border border-black/5 shadow-xl p-2 sm:p-3 space-y-2 max-w-[92vw]">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] sm:text-xs font-semibold tracking-wide text-gray-700">
            Capas
          </div>

          <button
            type="button"
            onClick={() => onHome?.()}
            disabled={!onHome}
            className={[
              "px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2",
              onHome
                ? "bg-white/70 hover:bg-white text-gray-900 border border-black/5"
                : "bg-white/40 text-gray-400 border border-black/5 cursor-not-allowed",
            ].join(" ")}
            title="Volver a inicio"
            aria-label="Volver a inicio"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"></path>
            </svg>
            Inicio
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

        <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-800 select-none">
          <input
            type="checkbox"
            checked={roads}
            onChange={(e) => setRoads(e.target.checked)}
          />
          Rutas
        </label>
      </div>
    </div>
  );
}
