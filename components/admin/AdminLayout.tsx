"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Trophy,
  ArrowLeft,
  Plus,
  Compass,
} from "lucide-react";

type AdminLayoutProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
};

export function AdminLayout({
  children,
  title,
  subtitle,
  onPrimaryAction,
  primaryActionLabel,
}: AdminLayoutProps) {
  const pathname = usePathname();

  const isClubs = pathname?.startsWith("/admin/clubs");
  const isComps = pathname?.startsWith("/admin/competitions");

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          height: 60,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
          borderBottomColor: "#e2e8f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          position: "sticky",
          top: 0,
          zIndex: 40,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <Compass size={20} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#0f172a", letterSpacing: "-0.01em" }}>
            El Mapa del Fútbol Argentino
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/"
            style={{
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
            }}
          >
            <ArrowLeft size={15} />
            <span>Volver al mapa</span>
          </Link>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Left Sidebar */}
        <aside
          style={{
            width: 250,
            backgroundColor: "#ffffff",
            borderRightWidth: 1,
            borderRightStyle: "solid",
            borderRightColor: "#e2e8f0",
            display: "flex",
            flexDirection: "column",
            padding: "1.25rem 1rem",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* User Info Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 10px",
                borderRadius: 10,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#e2e8f0",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                A
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  Gestión Admin
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Administrador Central</div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Link
                href="/admin/clubs"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: isClubs ? 700 : 500,
                  color: isClubs ? "#1d4ed8" : "#64748b",
                  backgroundColor: isClubs ? "#eff6ff" : "transparent",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: isClubs ? "#bfdbfe" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Shield size={18} />
                <span>Clubes</span>
              </Link>

              <Link
                href="/admin/competitions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: isComps ? 700 : 500,
                  color: isComps ? "#1d4ed8" : "#64748b",
                  backgroundColor: isComps ? "#eff6ff" : "transparent",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: isComps ? "#bfdbfe" : "transparent",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                }}
              >
                <Trophy size={18} />
                <span>Competencias</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: "1.75rem 2rem", minWidth: 0 }}>
          {title && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1.5rem",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                  {title}
                </h1>
                {subtitle && <p style={{ fontSize: "0.875rem", color: "#64748b", marginTop: 4, margin: 0 }}>{subtitle}</p>}
              </div>

              {onPrimaryAction && (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 18px",
                    borderRadius: 10,
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 14,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
                  }}
                >
                  <Plus size={18} />
                  <span>{primaryActionLabel || "Crear Nuevo"}</span>
                </button>
              )}
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
