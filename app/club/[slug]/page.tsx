import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClubCrest } from "@/components/club/ClubCrest";
import {
  MapPin,
  Shield,
  Trophy,
  Award,
  Building2,
  Compass,
  ArrowLeft,
  Globe,
} from "lucide-react";

// Generamos los Metadata para SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await prisma.club.findUnique({
    where: { slug },
    select: { fullName: true, crestUrl: true, locality: { select: { name: true, province: { select: { name: true } } } } },
  });

  if (!club) return { title: "Club no encontrado" };
  const locStr = club.locality ? ` (${club.locality.name}, ${club.locality.province?.name})` : "";
  return {
    title: `${club.fullName}${locStr} | Mapa del Fútbol Argentino`,
    description: `Información oficial, ubicación en el mapa, estadio, palmarés e historia de ${club.fullName}.`,
    openGraph: { images: [club.crestUrl || ""] },
  };
}

// Server Component principal de la página del club
export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      locality: { include: { province: true } },
      localLeague: true,
      competitions: true,
      titles: { orderBy: { count: "desc" } },
    },
  });

  if (!club) return notFound();

  // Determinación de color de acento por jerarquía
  const minLvl = club.competitions && club.competitions.length > 0
    ? Math.min(...club.competitions.map((c) => c.level ?? 8))
    : 8;

  let accentColor = "#64748b";
  let tierLabel = "Liga Regional";
  if (minLvl === 1 || minLvl === 2) {
    accentColor = "#eab308";
    tierLabel = "Liga Profesional AFA";
  } else if (minLvl === 3) {
    accentColor = "#2563eb";
    tierLabel = "Primera Nacional";
  } else if (minLvl === 4 || minLvl === 5) {
    accentColor = "#9333ea";
    tierLabel = "Federal A / Regional Amateur";
  }

  return (
    <div style={s.page}>
      {/* Top Navbar */}
      <header style={s.header}>
        <div style={s.navContainer}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={s.brandIcon}>
              <Compass size={20} />
            </div>
            <span style={s.brandTitle}>El Mapa del Fútbol Argentino</span>
          </div>

          <Link href="/" style={s.backBtn}>
            <ArrowLeft size={16} />
            <span>Volver al mapa</span>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main style={s.mainContainer}>
        {/* Card Principal Hero */}
        <div style={{ ...s.heroCard, borderTopColor: accentColor }}>
          <div style={s.heroTopLayout}>
            {/* Escudo flotante limpio */}
            <div style={{ flexShrink: 0 }}>
              <ClubCrest crestUrl={club.crestUrl} slug={club.slug} fullName={club.fullName} />
            </div>

            {/* Información del Club */}
            <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ ...s.tierBadge, borderColor: accentColor, color: accentColor }}>
                  {tierLabel}
                </span>
                {club.nickname && (
                  <span style={s.nicknameBadge}>
                    &quot;{club.nickname}&quot;
                  </span>
                )}
              </div>

              <h1 style={s.clubTitle}>{club.fullName}</h1>

              {club.shortName && club.shortName !== club.fullName && (
                <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>
                  Conocido popularmente como <strong style={{ color: "#0f172a" }}>{club.shortName}</strong>
                </div>
              )}

              {/* Tags de Ubicación y Liga */}
              <div style={s.tagsRow}>
                <div style={s.tagItem}>
                  <MapPin size={15} style={{ color: "#2563eb" }} />
                  <span>
                    {club.locality.name}, {club.locality.province.name}
                  </span>
                </div>

                <div style={s.tagItem}>
                  <Shield size={15} style={{ color: "#2563eb" }} />
                  <span>
                    {club.localLeague?.name || "Directamente Afiliado a AFA"}
                  </span>
                </div>
              </div>

              {/* Pills de Competencias */}
              {club.competitions.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                    Competencias:
                  </span>
                  {club.competitions.map((comp) => (
                    <span key={comp.id} style={s.compPill}>
                      {comp.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grilla de Secciones Informativas */}
        <div style={s.infoGrid}>
          {/* Card: Estadio & Cancha */}
          <div style={s.infoCard}>
            <div style={s.cardHeader}>
              <Building2 size={20} style={{ color: "#2563eb" }} />
              <h2 style={s.cardTitle}>Estadio & Ubicación</h2>
            </div>

            <div style={s.dataList}>
              <div style={s.dataRow}>
                <span style={s.dataLabel}>Estadio</span>
                <span style={s.dataVal}>{club.stadiumName || "No posee estadio registrado"}</span>
              </div>

              <div style={s.dataRow}>
                <span style={s.dataLabel}>Capacidad</span>
                <span style={s.dataVal}>
                  {club.stadiumCapacity ? `${club.stadiumCapacity.toLocaleString("es-AR")} espectadores` : "Sin especificar"}
                </span>
              </div>

              <div style={s.dataRow}>
                <span style={s.dataLabel}>Fecha de Fundación</span>
                <span style={s.dataVal}>{club.foundation || "No registrada"}</span>
              </div>
            </div>
          </div>

          {/* Card: Palmarés & Títulos Conseguidos */}
          <div style={s.infoCard}>
            <div style={s.cardHeader}>
              <Trophy size={20} style={{ color: "#eab308" }} />
              <h2 style={s.cardTitle}>Palmarés & Campeonatos</h2>
            </div>

            {club.titles.length === 0 ? (
              <div style={s.emptyBox}>
                No hay títulos o campeonatos registrados en el palmarés de este club aún.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {club.titles.map((t) => (
                  <div key={t.id} style={s.titleRow}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Award size={18} style={{ color: "#eab308", flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>{t.name}</span>
                    </div>
                    <span style={s.titleCountBadge}>
                      🏆 {t.count} {t.count === 1 ? "título" : "títulos"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sección: Reseña Histórica */}
        {club.history && (
          <div style={{ ...s.infoCard, marginTop: "1.5rem" }}>
            <div style={s.cardHeader}>
              <Globe size={20} style={{ color: "#2563eb" }} />
              <h2 style={s.cardTitle}>Reseña Histórica del Club</h2>
            </div>

            <p style={s.historyText}>{club.history}</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Estilos limpios alineados con el Panel de Administración
const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    paddingBottom: "3rem",
  },
  header: {
    height: 60,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "sticky",
    top: 0,
    zIndex: 40,
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  },
  navContainer: {
    width: "100%",
    maxWidth: 960,
    padding: "0 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
  },
  brandTitle: {
    fontWeight: 700,
    fontSize: 16,
    color: "#0f172a",
    letterSpacing: "-0.01em",
  },
  backBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    color: "#0f172a",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  },
  mainContainer: {
    maxWidth: 960,
    margin: "1.75rem auto 0 auto",
    padding: "0 1.5rem",
  },
  heroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    borderTopWidth: 4,
    borderTopStyle: "solid",
    padding: "1.75rem",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  heroTopLayout: {
    display: "flex",
    alignItems: "flex-start",
    gap: 24,
    flexWrap: "wrap",
  },
  tierBadge: {
    fontSize: 12,
    fontWeight: 700,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 20,
    padding: "3px 10px",
    backgroundColor: "#ffffff",
  },
  nicknameBadge: {
    fontSize: 12,
    fontWeight: 600,
    color: "#475569",
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    padding: "3px 10px",
  },
  clubTitle: {
    fontSize: "2rem",
    fontWeight: 800,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.02em",
    lineHeight: 1.15,
  },
  tagsRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 4,
  },
  tagItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#334155",
    backgroundColor: "#f8fafc",
    padding: "6px 12px",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e2e8f0",
  },
  compPill: {
    fontSize: 11,
    fontWeight: 600,
    color: "#1e40af",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#bfdbfe",
    borderRadius: 12,
    padding: "2px 8px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e2e8f0",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: "1.25rem",
    paddingBottom: "0.75rem",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: "#f1f5f9",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
  },
  dataList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  dataRow: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  dataLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  dataVal: {
    fontSize: 14,
    fontWeight: 600,
    color: "#0f172a",
  },
  emptyBox: {
    padding: "1.5rem",
    textAlign: "center",
    color: "#64748b",
    fontSize: 13,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#e2e8f0",
  },
  titleCountBadge: {
    fontSize: 13,
    fontWeight: 700,
    color: "#eab308",
    backgroundColor: "#fef9c3",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#fef08a",
    padding: "3px 10px",
    borderRadius: 20,
  },
  historyText: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#334155",
    whiteSpace: "pre-wrap",
    margin: 0,
  },
};