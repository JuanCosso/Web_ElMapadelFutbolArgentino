"use client";

import { useEffect, useMemo, useState } from "react";

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

  // Para capacidad (acepta distintos keys)
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
    <span className="w-9 h-9 rounded-xl bg-gray-900/5 border border-black/5 flex items-center justify-center">
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
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
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
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center">
          {icon}
        </span>
        <div className="text-xs uppercase tracking-wide text-gray-700 font-semibold">
          {title}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function ClubDrawer({
  open,
  clubId,
  badgeUrl,
  clubName,
  clubFullName,
  onClose,
}: {
  open: boolean;
  clubId: string | null;
  badgeUrl?: string;
  clubName?: string;
  clubFullName?: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !clubId) return;

    // eslint-disable-next-line
    setLoading(true);
    setData(null);

    fetch(`/clubs/${clubId}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setData(j))
      .finally(() => setLoading(false));
  }, [open, clubId]);

  const title = clubFullName || clubName || clubId || "Club";
 
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <aside className="absolute right-0 top-0 h-full w-[460px] max-w-[92vw] bg-gray-50 shadow-2xl border-l border-black/10">
        <div className="h-full flex flex-col">
          {/* Top bar solo X */}
          <div className="p-3 border-b border-black/10 bg-white flex justify-end">
            <button
              onClick={onClose}
              type="button"
              className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="p-4 overflow-auto space-y-4">
            {/* Hero: escudo grande + nombre */}
            <div className="rounded-3xl bg-white border border-black/10 p-5">
              <div className="flex flex-col items-center text-center">
                {badgeUrl ? (
                  <img
                    src={badgeUrl}
                    alt=""
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                    loading="eager"
                    decoding="async"
                  />
                ) : (
                  <div className="w-44 h-44 rounded-3xl bg-gray-200" />
                )}

                <div className="mt-4 text-xl font-extrabold text-gray-900 leading-tight">
                  {title}
                </div>
              </div>
            </div>

            {loading && (
              <div className="rounded-2xl bg-white border border-black/10 p-4 text-sm text-gray-700">
                Cargando ficha…
              </div>
            )}

            {data && (
              <>
                <Section
                  title="Datos"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 2l9 4v6c0 5-3.8 9.7-9 10-5.2-.3-9-5-9-10V6l9-4z" fill="currentColor" />
                    </svg>
                  }
                >
                  <div className="space-y-3">
                    <Row
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M7 3v2M17 3v2M4 7h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      }
                      label="Fundación"
                      value={data.founded}
                    />

                    <Row
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 12c2.8 0 5-2.2 5-5S14.8 2 12 2 7 4.2 7 7s2.2 5 5 5z" fill="none" stroke="currentColor" strokeWidth="2" />
                          <path d="M4 22c1.6-4 5-6 8-6s6.4 2 8 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      }
                      label="Apodo"
                      value={Array.isArray(data.nickname) ? data.nickname.join(", ") : data.nickname}
                    />

                    <Row
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11z" fill="none" stroke="currentColor" strokeWidth="2" />
                          <circle cx="12" cy="10" r="2" fill="currentColor" />
                        </svg>
                      }
                      label="Ciudad"
                      value={data.city}
                    />

                    <Row
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      }
                      label="Liga"
                      value={data.league}
                    />

                    <Row
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2V10z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      }
                      label="Estadio"
                      value={data.stadium}
                    />

                    <Row
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M4 10h16M6 14h12M8 18h8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      }
                      label="Capacidad"
                      value={capacity ? `${capacity} personas` : undefined}
                    />
                  </div>
                </Section>

                {data.short_history && (
                  <Section
                    title="Resumen"
                    icon={
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 8v5l3 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M21 12a9 9 0 1 1-3-6.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    }
                  >
                    <p className="text-sm text-gray-800 leading-relaxed">{data.short_history}</p>
                  </Section>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
