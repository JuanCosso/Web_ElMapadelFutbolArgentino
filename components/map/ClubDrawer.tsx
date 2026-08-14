"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  Calendar,
  Tag,
  Download,
  Clock,
  Trophy,
  Navigation,
  Shield,
  Map as MapIcon
} from "lucide-react";
import type { ClubInfo } from "./MapView";
import Link from "next/link";

type NearbyClub = {
  name: string;
  slug: string;
  crestUrl: string | null;
  distance_km: number;
};

type ClubDetail = {
  club_id: string;
  name?: string;
  full_name?: string;
  founded?: number;
  nickname?: string[] | string;
  province?: string;
  city?: string;
  league?: string;
  stadium?: string;
  stadiumCapacity?: number;
  badgeUrl?: string;
  honours?: { title: string; count?: number; years?: number[] }[];
  short_history?: string;
  history?: string;
  nearby?: NearbyClub[];
};

// --- Componentes UI adaptados a la imagen de referencia ---
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) {
  if (!value || value === "") return null;
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-gray-700">
        {icon}
      </div>
      <div className="min-w-0 pt-0.5 flex-1">
        <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-0.5 font-medium">{label}</div>
        <div className="text-sm font-semibold text-gray-900 whitespace-normal break-words leading-snug">
          {value}
        </div>
      </div>
    </div>
  );
}

type TabType = "info" | "historia" | "palmares";

export default function ClubDrawer({
  open,
  club,
  onClose,
}: {
  open: boolean;
  club: ClubInfo | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("info");

  // Caché en memoria para carga 0ms al abrir o cambiar entre clubes
  const clubCache = useRef<Map<string, ClubDetail>>(new Map());

  // Fetch de datos optimizado
  useEffect(() => {
    if (!open || !club?.clubId) {
      setData(null);
      return;
    }
    const cid = club.clubId;
    let ignore = false;

    setActiveTab("info");

    if (clubCache.current.has(cid)) {
      setData(clubCache.current.get(cid)!);
      setLoading(false);
      return;
    }

    // Limpiar el estado anterior para evitar que parpadee la ficha del club previo durante la carga
    setData(null);
    setLoading(true);

    fetch(`/api/clubs/${encodeURIComponent(cid)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!ignore && j) {
          const detail = { ...j, club_id: j.club_id || j.slug || cid };
          clubCache.current.set(cid, detail);
          setData(detail);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [open, club?.clubId]);

  // Manejo de la URL silenciosa para SEO y Compartir
  useEffect(() => {
    if (open && club?.clubId) {
      window.history.pushState(null, "", `/club/${club.clubId}`);
    } else {
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/club/")) {
        window.history.pushState(null, "", "/");
      }
    }
  }, [open, club?.clubId]);

  const validData = useMemo(() => {
    if (!data || !club?.clubId) return null;
    return (data.club_id === club.clubId || (data as any).slug === club.clubId) ? data : null;
  }, [data, club?.clubId]);

  const capacity = useMemo(() => {
    if (!validData) return undefined;
    return validData.stadiumCapacity;
  }, [validData]);

  const finalBadgeUrl = validData?.badgeUrl || club?.badgeUrl || (club?.clubId ? `/badges/${club.clubId}.webp` : "");

  if (!open || !club) return null;

  const title = validData?.full_name || validData?.name || club.fullName || club.name || "Club";
  const downloadName = `${club.clubId ?? "escudo"}.webp`;

  const hasHistory = !!(validData?.short_history || validData?.history);
  const hasHonours = !!(validData?.honours && validData.honours.length > 0);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <button
        className="absolute inset-0 bg-black/30 pointer-events-auto"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <aside className="
        absolute bottom-0 left-0 right-0 rounded-t-3xl pointer-events-auto
        sm:bottom-auto sm:top-0 sm:left-auto sm:right-0 sm:rounded-none sm:rounded-l-none
        h-[90vh] sm:h-full
        w-full sm:w-[380px] md:w-[400px] lg:w-[420px] max-w-full overflow-x-hidden
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
            Ficha del Club
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

        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-w-0 drawer-scroll-container overscroll-contain touch-pan-y">
          {/* Hero Section */}
          <div className="px-6 pb-6 pt-2 flex flex-col items-center text-center min-w-0">
            {finalBadgeUrl ? (
              <img
                key={`${club.clubId}-${finalBadgeUrl}`}
                src={finalBadgeUrl}
                alt={`Escudo de ${club.name}`}
                className="w-32 h-32 sm:w-40 sm:h-40 object-contain drop-shadow-sm"
                loading="eager"
                onError={(e) => {
                  const target = e.currentTarget;
                  const fallback = club?.clubId ? `/badges/${club.clubId}.webp` : "";
                  if (fallback && target.src !== new URL(fallback, window.location.href).href) {
                    target.src = fallback;
                  } else {
                    target.style.display = "none";
                  }
                }}
              />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
                <Shield size={48} strokeWidth={1.5} />
              </div>
            )}

            <div className="mt-4 text-2xl font-extrabold text-gray-900 leading-tight break-words max-w-full">
              {title}
            </div>

            <div className="mt-4 flex gap-2 justify-center w-full">
              <a
                href={finalBadgeUrl}
                download={downloadName}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-900 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                <Download size={16} />
                Descargar escudo
              </a>
            </div>
          </div>

          {/* Sistema de Pestañas Dinámicas */}
          <div className="flex border-b border-gray-200 px-2 min-w-0">
            <button 
              onClick={() => setActiveTab("info")}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "info" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              Información
            </button>
            {hasHistory && (
              <button 
                onClick={() => setActiveTab("historia")}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "historia" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Historia
              </button>
            )}
            {hasHonours && (
              <button 
                onClick={() => setActiveTab("palmares")}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === "palmares" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"}`}
              >
                Palmarés
              </button>
            )}
          </div>

          {/* Contenedor de Contenido según Pestaña */}
          <div className="p-4 flex-1 bg-white min-w-0">
            
            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-gray-400">
                <span className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-gray-800 animate-spin"></span>
                <span className="text-sm font-medium">Cargando datos...</span>
              </div>
            ) : (
              <>
                {/* PESTAÑA: INFORMACIÓN */}
                {activeTab === "info" && (
                  <div className="space-y-4 animate-in fade-in duration-150 min-w-0">
                    
                    {/* Caja de Datos Generales */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 min-w-0">
                      <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                        <Shield size={16} className="text-gray-900" /> Datos Generales
                      </div>
                      
                      <div className="space-y-3 min-w-0">
                        <InfoRow icon={<MapPin size={18} />} label="Ciudad" value={validData?.city || club.city ? `${validData?.city || club.city}, ${validData?.province || club.province}` : undefined} />
                        <InfoRow icon={<Trophy size={18} />} label="Liga" value={validData?.league || club.league} />
                        {validData?.founded && (
                          <InfoRow icon={<Calendar size={18} />} label="Fundación" value={validData.founded} />
                        )}
                        {validData?.stadium && (
                          <InfoRow icon={<MapIcon size={18} />} label="Estadio" value={capacity ? `${validData.stadium} (${capacity.toLocaleString("es-AR")})` : validData.stadium} />
                        )}
                        {validData?.nickname && (
                          <InfoRow icon={<Tag size={18} />} label="Apodo" value={Array.isArray(validData.nickname) ? validData.nickname.join(", ") : validData.nickname} />
                        )}
                      </div>
                    </div>

                    {/* Clubes Cercanos */}
                    {validData?.nearby && validData.nearby.length > 0 && (
                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 min-w-0">
                        <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                          <Navigation size={16} className="text-gray-900" /> Clubes Cercanos
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          {validData.nearby.map((c, i) => (
                            <Link 
                              key={i} 
                              href={`/club/${c.slug}`}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-all cursor-pointer group min-w-0"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img 
                                  src={c.crestUrl || `/badges/${c.slug}.webp`} 
                                  alt="" 
                                  className="w-8 h-8 object-contain drop-shadow-sm shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden" }}
                                />
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{c.name}</span>
                              </div>
                              <span className="text-[11px] font-bold text-gray-500 bg-gray-200/50 px-2 py-1 rounded-md shrink-0">
                                {c.distance_km} km
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PESTAÑA: HISTORIA */}
                {activeTab === "historia" && (validData?.short_history || validData?.history) && (
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 animate-in fade-in duration-150 min-w-0">
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                      <Clock size={16} className="text-gray-900" /> Reseña Histórica
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium break-words">
                      {validData.short_history || validData.history}
                    </p>
                  </div>
                )}

                {/* PESTAÑA: PALMARÉS */}
                {activeTab === "palmares" && validData?.honours && (
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 animate-in fade-in duration-150 min-w-0">
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                      <Trophy size={16} className="text-gray-900" /> Títulos Obtenidos
                    </div>
                    <ul className="space-y-3 min-w-0">
                      {validData.honours.map((h, i) => (
                        <li key={i} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm min-w-0">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Trophy size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-gray-900 text-sm break-words">
                              {h.title}{" "}
                              {h.count != null && (
                                <span className="notranslate whitespace-nowrap text-blue-600 ml-1 font-semibold" translate="no">
                                  ({h.count})
                                </span>
                              )}
                            </div>
                            {h.years && h.years.length > 0 && (
                              <div className="text-xs font-medium text-gray-500 mt-0.5 leading-relaxed break-words">
                                {h.years.join(", ")}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
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