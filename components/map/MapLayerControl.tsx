"use client";

import React from "react";
import type { BasemapId } from "./style";

function SegBtn({
  active,
  isDark,
  children,
  onClick,
}: {
  active?: boolean;
  isDark?: boolean;
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
          ? "bg-blue-600 text-white shadow-sm font-semibold"
          : isDark
          ? "bg-gray-800/80 hover:bg-gray-700 text-gray-200"
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
  onZoomIn,
  onZoomOut,
  isDark,
}: {
  basemap: BasemapId;
  setBasemap: (v: BasemapId) => void;
  roads: boolean;
  setRoads: (v: boolean) => void;
  onHome: (() => void) | null;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  isDark?: boolean;
}) {
  return (
    // Mobile & Desktop: bottom-right
    <div className="absolute bottom-8 sm:bottom-6 right-3 sm:right-4 left-auto translate-x-0 z-20 flex flex-col items-end gap-2.5">
      {/* Botones de Zoom (+ / -) ubicados por encima del bloque de capas en el extremo derecho */}
      <div
        className={[
          "flex flex-col rounded-xl backdrop-blur-md shadow-lg border overflow-hidden transition-colors shrink-0",
          isDark
            ? "bg-gray-900/90 border-white/20 text-white"
            : "bg-white/90 border-black/10 text-gray-900",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onZoomIn}
          className={[
            "w-9 h-9 flex items-center justify-center font-bold text-base transition-colors border-b",
            isDark
              ? "border-white/10 hover:bg-gray-800 text-white"
              : "border-black/10 hover:bg-gray-100 text-gray-900",
          ].join(" ")}
          aria-label="Acercar zoom"
        >
          +
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          className={[
            "w-9 h-9 flex items-center justify-center font-bold text-base transition-colors",
            isDark ? "hover:bg-gray-800 text-white" : "hover:bg-gray-100 text-gray-900",
          ].join(" ")}
          aria-label="Alejar zoom"
        >
          −
        </button>
      </div>

      {/* Bloque de Capas */}
      <div
        className={[
          "rounded-2xl backdrop-blur-md shadow-xl p-2 sm:p-3 space-y-2 border transition-colors",
          isDark
            ? "bg-gray-900/90 border-white/20 text-white"
            : "bg-white/90 border-black/10 text-gray-900",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold tracking-wide text-gray-400 hidden sm:block uppercase">
            Capas
          </div>

          <button
            type="button"
            onClick={() => onHome?.()}
            disabled={!onHome}
            className={[
              "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5",
              onHome
                ? isDark
                  ? "bg-gray-800 hover:bg-gray-700 text-white border border-white/10"
                  : "bg-white/70 hover:bg-white text-gray-900 border border-black/5"
                : "opacity-40 cursor-not-allowed",
            ].join(" ")}
            aria-label="Volver a inicio"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">Inicio</span>
          </button>
        </div>

        <div className="flex gap-1 flex-wrap">
          <SegBtn active={basemap === "streets"} isDark={isDark} onClick={() => setBasemap("streets")}>
            Claro
          </SegBtn>
          <SegBtn active={basemap === "dark"} isDark={isDark} onClick={() => setBasemap("dark")}>
            Oscuro
          </SegBtn>
          <SegBtn active={basemap === "satellite"} isDark={isDark} onClick={() => setBasemap("satellite")}>
            Satélite
          </SegBtn>
          <SegBtn active={basemap === "relief"} isDark={isDark} onClick={() => setBasemap("relief")}>
            Relieve
          </SegBtn>
        </div>

        <label className="flex items-center gap-2 text-xs select-none cursor-pointer">
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