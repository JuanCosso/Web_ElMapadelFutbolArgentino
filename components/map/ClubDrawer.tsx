"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Globe,
  Calendar,
  Tag,
  Download,
  Clock,
  Trophy,
  Images,
  Link2,
  Shield,
} from "lucide-react";
import type { ClubInfo } from "./MapView";

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
  stadium_capacity?: number;
  capacity?: number;
  estadio_capacidad?: number;
  capacidad_estadio?: number;
  stadiumCapacity?: number;
  honours?: { title: string; count?: number; years?: number[] }[];
  images?: { url: string; caption?: string }[];
  short_history?: string;
  links?: { label: string; url: string }[];
};

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-9 h-9 rounded-xl bg-gray-900/5 border border-black/5 flex items-center justify-center flex-shrink-0 text-gray-600">
      {children}
    </span>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-3">
      <IconBox>{icon}</IconBox>
      <div className="min-w-0 pt-1">
        <div className="text-xs text-gray-500 leading-none mb-0.5">{label}</div>
        <div className="text-sm font-medium text-gray-900 whitespace-normal break-words leading-snug">
          {value}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
        <div className="text-xs uppercase tracking-widest text-gray-700 font-semibold">
          {title}
        </div>
      </div>
      {children}
    </section>
  );
}

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

  useEffect(() => {
    if (!open || !club?.clubId) return;
    setLoading(true);
    setData(null);
    fetch(`/clubs/${club.clubId}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setData(j))
      .finally(() => setLoading(false));
  }, [open, club?.clubId]);

  const capacity = useMemo(() => {
    if (!data) return undefined;
    return (
      data.stadium_capacity ??
      data.capacity ??
      data.estadio_capacidad ??
      data.capacidad_estadio ??
      data.stadiumCapacity
    );
  }, [data]);

  if (!open || !club) return null;

  const title = club.fullName || club.name || club.clubId || "Club";
  const downloadName = `${club.clubId ?? "escudo"}.webp`;

  return (
    <div className="fixed inset-0 z-40">
      <button
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Cerrar"
      />

    <aside className="
      absolute bottom-0 left-0 right-0 rounded-t-3xl
      sm:bottom-auto sm:top-0 sm:left-auto sm:right-0 sm:rounded-none sm:rounded-l-none
      h-[90vh] sm:h-full
      w-full sm:w-[460px]
      bg-gray-50 shadow-2xl border-t sm:border-t-0 sm:border-l border-black/10
      flex flex-col
    ">
      {/* Handle visual solo en mobile */}
      <div className="flex justify-center pt-3 pb-1 sm:hidden">
        <div className="w-10 h-1 rounded-full bg-gray-300" />
      </div>

      {/* Header */}
      <div className="px-3 py-2 border-b border-black/10 bg-white flex items-center justify-end min-h-[52px] pt-14 sm:pt-2">
        <button
          onClick={onClose}
          type="button"
          className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center flex-shrink-0"
          aria-label="Cerrar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-4 space-y-4">

          {/* Hero */}
          <div className="rounded-3xl bg-white border border-black/10 p-5">
            <div className="flex flex-col items-center text-center">
              {club.badgeUrl ? (
                <img
                  src={club.badgeUrl}
                  alt={`Escudo de ${club.name}`}
                  className="w-36 h-36 sm:w-44 sm:h-44 object-contain"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="w-36 h-36 rounded-3xl bg-gray-100 flex items-center justify-center text-gray-300">
                  <Shield size={48} strokeWidth={1.5} />
                </div>
              )}

              <div className="mt-4 text-xl font-extrabold text-gray-900 leading-tight">
                {title}
              </div>

              {club.badgeUrl && (
                <a
                  href={club.badgeUrl}
                  download={downloadName}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  <Download size={15} />
                  Descargar escudo
                </a>
              )}
            </div>
          </div>

          {/* Datos */}
          <Section title="Datos" icon={<Shield size={15} />}>
            <div className="space-y-3">
              <Row icon={<MapPin size={15} />}    label="Ciudad"    value={club.city || undefined} />
              <Row icon={<Globe size={15} />}      label="Liga"      value={club.league || undefined} />
              {data?.founded && (
                <Row icon={<Calendar size={15} />} label="Fundación" value={data.founded} />
              )}
              {data?.nickname && (
                <Row
                  icon={<Tag size={15} />}
                  label="Apodo"
                  value={Array.isArray(data.nickname) ? data.nickname.join(", ") : data.nickname}
                />
              )}
              {data?.stadium && (
                <Row
                  icon={<Trophy size={15} />}
                  label="Estadio"
                  value={
                    capacity
                      ? `${data.stadium} · ${capacity.toLocaleString("es-AR")} espectadores`
                      : data.stadium
                  }
                />
              )}
            </div>
          </Section>

          {/* Historia */}
          {data?.short_history && (
            <Section title="Historia" icon={<Clock size={15} />}>
              <p className="text-sm text-gray-700 leading-relaxed">{data.short_history}</p>
            </Section>
          )}

          {/* Palmarés */}
          {data?.honours && data.honours.length > 0 && (
            <Section title="Palmarés" icon={<Trophy size={15} />}>
              <ul className="space-y-1.5">
                {data.honours.map((h, i) => (
                  <li key={i} className="text-sm text-gray-800 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">·</span>
                    <span>
                      <span className="font-medium">{h.title}</span>
                      {h.count != null && (
                        <span className="text-gray-500 ml-1">({h.count}×)</span>
                      )}
                      {h.years && h.years.length > 0 && (
                        <span className="text-gray-400 ml-1 text-xs">{h.years.join(", ")}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Galería */}
          {data?.images && data.images.length > 0 && (
            <Section title="Galería" icon={<Images size={15} />}>
              <div className="grid grid-cols-2 gap-2">
                {data.images.map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={img.url}
                      alt={img.caption ?? ""}
                      className="w-full h-32 object-cover"
                      loading="lazy"
                    />
                    {img.caption && (
                      <div className="px-2 py-1 text-xs text-gray-500">{img.caption}</div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Enlaces */}
          {data?.links && data.links.length > 0 && (
            <Section title="Enlaces" icon={<Link2 size={15} />}>
              <div className="flex flex-wrap gap-2">
                {data.links.map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-800 bg-gray-100 border border-black/10 rounded-lg px-3 py-1.5 hover:bg-gray-200 transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </Section>
          )}

          {loading && (
            <div className="rounded-2xl bg-white border border-black/10 p-4 text-sm text-gray-500 text-center">
              Cargando datos adicionales…
            </div>
          )}

        </div>
      </aside>
    </div>
  );
}