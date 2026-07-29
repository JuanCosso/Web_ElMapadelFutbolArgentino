"use client";

import { useEffect, useState } from "react";
import { Trophy, Calendar, MapPin, Shield, Users } from "lucide-react";

export type LeagueInfo = {
  leagueId: string;
  name: string;
  province?: string;
  logoUrl?: string;
};

type ClubLeagueItem = {
  clubId: string;
  name: string;
  fullName?: string;
  crestUrl?: string;
  titleCount: number;
};

type LeagueDetail = {
  league_id: string;
  name: string;
  province?: string;
  organizer?: string;
  foundation?: string;
  logoUrl?: string;
  champions?: ClubLeagueItem[];
};

type LeagueTabType = "campeones" | "equipos";

export default function LeagueDrawer({
  open,
  league,
  onClose,
  onSelectClub,
}: {
  open: boolean;
  league: LeagueInfo | null;
  onClose: () => void;
  onSelectClub?: (clubId: string) => void;
}) {
  const [data, setData] = useState<LeagueDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<LeagueTabType>("campeones");

  useEffect(() => {
    if (!open || !league?.leagueId) return;
    let ignore = false;

    setLoading(true);
    setData(null);
    setActiveTab("campeones");

    fetch(`/api/leagues/${encodeURIComponent(league.leagueId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!ignore) setData(j);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [open, league?.leagueId]);

  if (!open || !league) return null;

  const title = data?.name || league.name || "Liga";
  const logo = data?.logoUrl || league.logoUrl;
  const rawClubs = data?.champions || [];
  const championClubs = rawClubs.filter((c) => c.titleCount > 0).sort((a, b) => b.titleCount - a.titleCount);
  const allClubs = [...rawClubs].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <button
        className="absolute inset-0 bg-black/30 pointer-events-auto"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <aside className="
        absolute bottom-0 left-0 right-0 rounded-t-3xl pointer-events-auto
        sm:bottom-auto sm:top-0 sm:left-auto sm:right-0 sm:rounded-none sm:rounded-l-none
        h-[90vh] sm:h-full
        w-full sm:w-[460px] max-w-full overflow-x-hidden
        bg-white shadow-2xl border-t sm:border-t-0 sm:border-l border-black/10
        flex flex-col min-w-0
      ">
        {/* Handle visual mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header Superior */}
        <div className="px-4 py-2 flex items-center justify-between pt-10 sm:pt-4 border-b border-gray-100">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Ficha de Competencia / Liga
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {/* Hero Section */}
          <div className="px-6 py-4 flex flex-col items-center text-center bg-white min-w-0">
            {logo ? (
              <img
                src={logo}
                alt={`Logo de ${title}`}
                className="w-28 h-28 object-contain drop-shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center border border-yellow-200">
                <Trophy size={42} />
              </div>
            )}

            <div className="mt-3 text-xl font-extrabold text-gray-900 leading-snug break-words max-w-full">
              {title}
            </div>

            {(data?.province || league.province) && (
              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-gray-500">
                <MapPin size={14} />
                <span>{data?.province || league.province}</span>
              </div>
            )}

            {data?.foundation && (
              <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600 border border-gray-200 shadow-sm">
                <Calendar size={13} className="text-gray-500" />
                <span>Fundación: {data.foundation}</span>
              </div>
            )}
          </div>

          {/* Navegación por pestañas: Campeones vs Equipos */}
          <div className="flex border-b border-gray-200 px-2 min-w-0 bg-white">
            <button
              onClick={() => setActiveTab("campeones")}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "campeones"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Campeones ({championClubs.length})
            </button>
            <button
              onClick={() => setActiveTab("equipos")}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "equipos"
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Equipos ({allClubs.length})
            </button>
          </div>

          {/* Contenido según la pestaña */}
          <div className="p-4 flex-1 bg-white min-w-0">
            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-gray-400">
                <span className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin"></span>
                <span className="text-xs font-medium">Cargando datos de la liga...</span>
              </div>
            ) : (
              <>
                {/* PESTAÑA 1: CAMPEONES (SOLO EQUIPOS CON TÍTULOS) */}
                {activeTab === "campeones" && (
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 min-w-0 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                      <Trophy size={16} className="text-yellow-600" /> Tabla de Campeones
                    </div>

                    {championClubs.length > 0 ? (
                      <div className="space-y-2.5">
                        {championClubs.map((c, i) => (
                          <div
                            key={c.clubId || i}
                            onClick={() => onSelectClub?.(c.clubId)}
                            className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-gray-300 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="text-xs font-bold text-gray-400 w-5 text-center shrink-0">
                                #{i + 1}
                              </div>
                              <img
                                src={c.crestUrl || `/badges/${c.clubId}.webp`}
                                alt=""
                                className="w-8 h-8 object-contain shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.visibility = "hidden";
                                }}
                              />
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                  {c.name}
                                </div>
                                {c.fullName && c.fullName !== c.name && (
                                  <div className="text-[11px] text-gray-400 truncate">
                                    {c.fullName}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 bg-yellow-50 text-yellow-800 border border-yellow-200 px-2.5 py-1 rounded-lg">
                              <Trophy size={13} className="text-yellow-600" />
                              <span className="text-xs font-bold">
                                {c.titleCount} {c.titleCount === 1 ? "título" : "títulos"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 py-8 text-center">
                        No hay registro de títulos para esta liga aún.
                      </div>
                    )}
                  </div>
                )}

                {/* PESTAÑA 2: TODOS LOS EQUIPOS DE LA LIGA */}
                {activeTab === "equipos" && (
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 min-w-0 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                      <Users size={16} className="text-gray-900" /> Equipos Integrantes ({allClubs.length})
                    </div>

                    {allClubs.length > 0 ? (
                      <div className="space-y-2">
                        {allClubs.map((c, i) => (
                          <div
                            key={c.clubId || i}
                            onClick={() => onSelectClub?.(c.clubId)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-gray-300 transition-all cursor-pointer group min-w-0"
                          >
                            <img
                              src={c.crestUrl || `/badges/${c.clubId}.webp`}
                              alt=""
                              className="w-8 h-8 object-contain shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.visibility = "hidden";
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                {c.name}
                              </div>
                              {c.fullName && c.fullName !== c.name && (
                                <div className="text-[11px] text-gray-400 truncate">
                                  {c.fullName}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 py-8 text-center">
                        No hay clubes registrados en esta liga.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
