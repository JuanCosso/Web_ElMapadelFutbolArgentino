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
import { formatUpdateDate } from "@/utils/formatDate";

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
  founded?: number | string;
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
  updatedAt?: string;
};

// --- Componentes UI adaptados a la imagen de referencia ---
function InfoRow({
  icon,
  label,
  value,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  isDark?: boolean;
}) {
  if (!value || value === "") return null;
  return (
    <div className="flex items-start gap-3 min-w-0">
      <div
        className={[
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isDark
            ? "bg-gray-800 text-gray-200 border border-gray-700"
            : "bg-white shadow-sm text-gray-700",
        ].join(" ")}
      >
        {icon}
      </div>
      <div className="min-w-0 pt-0.5 flex-1">
        <div
          className={[
            "text-[11px] uppercase tracking-wide mb-0.5 font-medium",
            isDark ? "text-gray-400" : "text-gray-500",
          ].join(" ")}
        >
          {label}
        </div>
        <div
          className={[
            "text-sm font-semibold whitespace-normal break-words leading-snug",
            isDark ? "text-white" : "text-gray-900",
          ].join(" ")}
        >
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
  isDark,
}: {
  open: boolean;
  club: ClubInfo | null;
  onClose: () => void;
  isDark?: boolean;
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
        className="absolute inset-0 bg-transparent pointer-events-auto"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <aside
        className={[
          "absolute bottom-0 left-0 right-0 rounded-t-3xl pointer-events-auto",
          "sm:bottom-auto sm:top-0 sm:left-auto sm:right-0 sm:rounded-none sm:rounded-l-none",
          "h-[90vh] sm:h-full",
          "w-full sm:w-[380px] md:w-[400px] lg:w-[420px] max-w-full overflow-x-hidden",
          "shadow-2xl border-t sm:border-t-0 sm:border-l flex flex-col min-w-0 transition-colors",
          isDark
            ? "bg-gray-900 text-white border-white/10"
            : "bg-white text-gray-900 border-black/10",
        ].join(" ")}
      >
        {/* Handle visual mobile */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className={isDark ? "w-10 h-1 rounded-full bg-gray-700" : "w-10 h-1 rounded-full bg-gray-300"} />
        </div>

        {/* Header Superior */}
        <div
          className={[
            "px-4 py-2 flex items-center justify-between pt-10 sm:pt-4 border-b transition-colors",
            isDark ? "border-white/10" : "border-gray-100",
          ].join(" ")}
        >
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Ficha del Club
          </div>
          <button
            onClick={onClose}
            type="button"
            className={[
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
            ].join(" ")}
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
              <div
                className={[
                  "w-32 h-32 rounded-3xl flex items-center justify-center",
                  isDark ? "bg-gray-800 text-gray-500" : "bg-gray-50 text-gray-300",
                ].join(" ")}
              >
                <Shield size={48} strokeWidth={1.5} />
              </div>
            )}

            <div
              className={[
                "mt-4 text-2xl font-extrabold leading-tight break-words max-w-full",
                isDark ? "text-white" : "text-gray-900",
              ].join(" ")}
            >
              {title}
            </div>

            <div className="mt-4 flex gap-2 justify-center w-full">
              <a
                href={finalBadgeUrl}
                download={downloadName}
                className={[
                  "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                  isDark
                    ? "bg-gray-800 text-white hover:bg-gray-700 border border-white/10"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200",
                ].join(" ")}
              >
                <Download size={16} />
                Descargar escudo
              </a>
            </div>
          </div>

          {/* Sistema de Pestañas Dinámicas */}
          <div
            className={[
              "flex border-b px-2 min-w-0 transition-colors",
              isDark ? "border-white/10 bg-gray-900" : "border-gray-200 bg-white",
            ].join(" ")}
          >
            <button 
              onClick={() => setActiveTab("info")}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === "info"
                  ? isDark
                    ? "border-blue-500 text-white"
                    : "border-gray-900 text-gray-900"
                  : isDark
                  ? "border-transparent text-gray-400 hover:text-gray-200"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Información
            </button>
            {hasHistory && (
              <button 
                onClick={() => setActiveTab("historia")}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === "historia"
                    ? isDark
                      ? "border-blue-500 text-white"
                      : "border-gray-900 text-gray-900"
                    : isDark
                    ? "border-transparent text-gray-400 hover:text-gray-200"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Historia
              </button>
            )}
            {hasHonours && (
              <button 
                onClick={() => setActiveTab("palmares")}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === "palmares"
                    ? isDark
                      ? "border-blue-500 text-white"
                      : "border-gray-900 text-gray-900"
                    : isDark
                    ? "border-transparent text-gray-400 hover:text-gray-200"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Palmarés
              </button>
            )}
          </div>

          {/* Contenedor de Contenido según Pestaña */}
          <div
            className={[
              "p-4 flex-1 min-w-0 transition-colors",
              isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900",
            ].join(" ")}
          >
            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-gray-400">
                <span
                  className={[
                    "w-6 h-6 rounded-full border-2 animate-spin",
                    isDark
                      ? "border-gray-700 border-t-white"
                      : "border-gray-200 border-t-gray-800",
                  ].join(" ")}
                ></span>
                <span className="text-sm font-medium">Cargando datos...</span>
              </div>
            ) : (
              <>
                {/* PESTAÑA: INFORMACIÓN */}
                {activeTab === "info" && (
                  <div className="space-y-4 animate-in fade-in duration-150 min-w-0">
                    
                    {/* Caja de Datos Generales */}
                    <div
                      className={[
                        "rounded-2xl p-5 border min-w-0 transition-colors",
                        isDark
                          ? "bg-gray-800/80 border-white/10 text-white"
                          : "bg-gray-50 border-gray-100 text-gray-900",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        <Shield size={16} className={isDark ? "text-white" : "text-gray-900"} /> Datos Generales
                      </div>
                      
                      <div className="space-y-3 min-w-0">
                        <InfoRow icon={<MapPin size={18} />} label="Ciudad" value={validData?.city || club.city ? `${validData?.city || club.city}, ${validData?.province || club.province}` : undefined} isDark={isDark} />
                        <InfoRow icon={<Trophy size={18} />} label="Liga" value={validData?.league || club.league} isDark={isDark} />
                        {validData?.founded && (
                          <InfoRow icon={<Calendar size={18} />} label="Fundación" value={validData.founded} isDark={isDark} />
                        )}
                        {validData?.stadium && (
                          <InfoRow icon={<MapIcon size={18} />} label="Estadio" value={capacity ? `${validData.stadium} (${capacity.toLocaleString("es-AR")})` : validData.stadium} isDark={isDark} />
                        )}
                        {validData?.nickname && (
                          <InfoRow icon={<Tag size={18} />} label="Apodo" value={Array.isArray(validData.nickname) ? validData.nickname.join(", ") : validData.nickname} isDark={isDark} />
                        )}
                      </div>
                    </div>

                    {/* Clubes Cercanos */}
                    {validData?.nearby && validData.nearby.length > 0 && (
                      <div
                        className={[
                          "rounded-2xl p-5 border min-w-0 transition-colors",
                          isDark
                            ? "bg-gray-800/80 border-white/10 text-white"
                            : "bg-gray-50 border-gray-100 text-gray-900",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                          <Navigation size={16} className={isDark ? "text-white" : "text-gray-900"} /> Clubes Cercanos
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          {validData.nearby.map((c, i) => (
                            <Link 
                              key={i} 
                              href={`/club/${c.slug}`}
                              className={[
                                "flex items-center justify-between p-2 rounded-xl border border-transparent transition-all cursor-pointer group min-w-0",
                                isDark
                                  ? "hover:bg-gray-700/80 hover:border-gray-600"
                                  : "hover:bg-white hover:border-gray-200",
                              ].join(" ")}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img 
                                  src={c.crestUrl || `/badges/${c.slug}.webp`} 
                                  alt="" 
                                  className="w-8 h-8 object-contain drop-shadow-sm shrink-0"
                                  onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden" }}
                                />
                                <span
                                  className={[
                                    "text-sm font-semibold transition-colors truncate",
                                    isDark
                                      ? "text-white group-hover:text-blue-400"
                                      : "text-gray-900 group-hover:text-blue-600",
                                  ].join(" ")}
                                >
                                  {c.name}
                                </span>
                              </div>
                              <span
                                className={[
                                  "text-[11px] font-bold px-2 py-1 rounded-md shrink-0",
                                  isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200/50 text-gray-500",
                                ].join(" ")}
                              >
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
                  <div
                    className={[
                      "rounded-2xl p-5 border animate-in fade-in duration-150 min-w-0 transition-colors",
                      isDark
                        ? "bg-gray-800/80 border-white/10 text-white"
                        : "bg-gray-50 border-gray-100 text-gray-900",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      <Clock size={16} className={isDark ? "text-white" : "text-gray-900"} /> Reseña Histórica
                    </div>
                    <p
                      className={[
                        "text-sm leading-relaxed whitespace-pre-wrap font-medium break-words",
                        isDark ? "text-gray-300" : "text-gray-700",
                      ].join(" ")}
                    >
                      {validData.short_history || validData.history}
                    </p>
                  </div>
                )}

                {/* PESTAÑA: PALMARÉS */}
                {activeTab === "palmares" && validData?.honours && (
                  <div
                    className={[
                      "rounded-2xl p-5 border animate-in fade-in duration-150 min-w-0 transition-colors",
                      isDark
                        ? "bg-gray-800/80 border-white/10 text-white"
                        : "bg-gray-50 border-gray-100 text-gray-900",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2 mb-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                      <Trophy size={16} className={isDark ? "text-white" : "text-gray-900"} /> Títulos Obtenidos
                    </div>
                    <ul className="space-y-3 min-w-0">
                      {validData.honours.map((h, i) => (
                        <li
                          key={i}
                          className={[
                            "flex items-start gap-3 p-3 rounded-xl border min-w-0 transition-colors",
                            isDark
                              ? "bg-gray-800 border-gray-700 text-white"
                              : "bg-white border-gray-100 shadow-sm text-gray-900",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              isDark
                                ? "bg-yellow-950/80 text-yellow-400 border border-yellow-800/60"
                                : "bg-yellow-100 text-yellow-600",
                            ].join(" ")}
                          >
                            <Trophy size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={isDark ? "font-bold text-white text-sm break-words" : "font-bold text-gray-900 text-sm break-words"}>
                              {h.title}{" "}
                              {h.count != null && (
                                <span className={isDark ? "notranslate whitespace-nowrap text-blue-400 ml-1 font-semibold" : "notranslate whitespace-nowrap text-blue-600 ml-1 font-semibold"} translate="no">
                                  ({h.count})
                                </span>
                              )}
                            </div>
                            {h.years && h.years.length > 0 && (
                              <div className={isDark ? "text-xs font-medium text-gray-400 mt-0.5 leading-relaxed break-words" : "text-xs font-medium text-gray-500 mt-0.5 leading-relaxed break-words"}>
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

        {/* Footer: Última actualización */}
        {validData?.updatedAt && (
          <div
            className={[
              "px-4 py-2.5 border-t text-center text-[11px] font-medium flex items-center justify-center gap-1.5 shrink-0 transition-colors",
              isDark ? "border-white/10 bg-gray-950/60 text-gray-400" : "border-gray-100 bg-gray-50 text-gray-500",
            ].join(" ")}
          >
            <Clock size={12} />
            <span>Última actualización: {formatUpdateDate(validData.updatedAt)}</span>
          </div>
        )}
      </aside>
    </div>
  );
}