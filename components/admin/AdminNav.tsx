"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();

  const isClubs = pathname?.startsWith("/admin/clubs");
  const isComps = pathname?.startsWith("/admin/competitions");

  return (
    <header style={s.header}>
      <div style={s.container}>
        <nav style={s.nav}>
          <Link href="/" style={s.mapBtn}>
            🗺️ Volver al Mapa
          </Link>
          <Link
            href="/admin/clubs"
            style={{
              ...s.tab,
              ...(isClubs ? s.activeTab : {}),
            }}
          >
            🛡️ Gestor de Clubes
          </Link>
          <Link
            href="/admin/competitions"
            style={{
              ...s.tab,
              ...(isComps ? s.activeTab : {}),
            }}
          >
            🏆 Torneos y Competencias
          </Link>
        </nav>

        <div style={s.brand}>
          <span style={s.logoIcon}>⚽</span>
          <div>
            <h1 style={s.brandTitle}>Panel de Administración</h1>
            <p style={s.brandSub}>Plataforma Mapa de Clubes de Fútbol</p>
          </div>
        </div>
      </div>
    </header>
  );
}

const s: Record<string, React.CSSProperties> = {
  header: {
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    padding: "0.85rem 1.25rem",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  container: {
    maxWidth: 960,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  logoIcon: {
    fontSize: "1.75rem",
  },
  brandTitle: {
    fontSize: "1.1rem",
    fontWeight: 700,
    color: "#0f172a",
    margin: 0,
    lineHeight: 1.2,
  },
  brandSub: {
    fontSize: "0.75rem",
    color: "#64748b",
    margin: 0,
  },
  nav: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  tab: {
    padding: "0.5rem 0.9rem",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#475569",
    textDecoration: "none",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    transition: "all 0.15s ease",
  },
  activeTab: {
    color: "#0f172a",
    background: "#ffffff",
    borderColor: "#0f172a",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  mapBtn: {
    padding: "0.5rem 0.9rem",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#2563eb",
    textDecoration: "none",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
};
