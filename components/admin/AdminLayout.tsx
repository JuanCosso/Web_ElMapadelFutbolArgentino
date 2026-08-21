"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  Trophy,
  ArrowLeft,
  Sun,
  Moon,
  Plus,
  Compass,
} from "lucide-react";

export type AdminTheme = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  bgMain: string;
  bgSidebar: string;
  bgTop: string;
  bgCard: string;
  bgInput: string;
  borderCol: string;
  textPrimary: string;
  textMuted: string;
};

const AdminThemeContext = createContext<AdminTheme>({
  darkMode: false,
  toggleDarkMode: () => {},
  bgMain: "#f8fafc",
  bgSidebar: "#ffffff",
  bgTop: "#ffffff",
  bgCard: "#ffffff",
  bgInput: "#ffffff",
  borderCol: "#e2e8f0",
  textPrimary: "#0f172a",
  textMuted: "#64748b",
});

export const useAdminTheme = () => useContext(AdminThemeContext);

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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("emdfa_admin_theme");
    if (saved === "dark") {
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("emdfa_admin_theme", next ? "dark" : "light");
      return next;
    });
  };

  const isClubs = pathname?.startsWith("/admin/clubs");
  const isComps = pathname?.startsWith("/admin/competitions");

  const themeValues: AdminTheme = {
    darkMode,
    toggleDarkMode,
    bgMain: darkMode ? "#0f172a" : "#f8fafc",
    bgSidebar: darkMode ? "#1e293b" : "#ffffff",
    bgTop: darkMode ? "#1e293b" : "#ffffff",
    bgCard: darkMode ? "#1e293b" : "#ffffff",
    bgInput: darkMode ? "#0f172a" : "#ffffff",
    borderCol: darkMode ? "#334155" : "#e2e8f0",
    textPrimary: darkMode ? "#f8fafc" : "#0f172a",
    textMuted: darkMode ? "#94a3b8" : "#64748b",
  };

  return (
    <AdminThemeContext.Provider value={themeValues}>
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: themeValues.bgMain,
          color: themeValues.textPrimary,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          flexDirection: "column",
          transition: "background-color 0.2s ease, color 0.2s ease",
        }}
      >
        {/* Top Navbar */}
        <header
          style={{
            height: 60,
            backgroundColor: themeValues.bgTop,
            borderBottomWidth: 1,
            borderBottomStyle: "solid",
            borderBottomColor: themeValues.borderCol,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.5rem",
            position: "sticky",
            top: 0,
            zIndex: 40,
            boxShadow: darkMode ? "0 1px 3px rgba(0,0,0,0.3)" : "0 1px 2px rgba(0,0,0,0.03)",
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
            <span style={{ fontWeight: 700, fontSize: 16, color: themeValues.textPrimary, letterSpacing: "-0.01em" }}>
              El Mapa del Fútbol Argentino
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              onClick={toggleDarkMode}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: themeValues.borderCol,
                backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                color: themeValues.textPrimary,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                transition: "all 0.15s ease",
              }}
              title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {darkMode ? <Sun size={15} style={{ color: "#fbbf24" }} /> : <Moon size={15} style={{ color: "#64748b" }} />}
              <span>{darkMode ? "Modo Claro" : "Modo Oscuro"}</span>
            </button>

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
                borderColor: themeValues.borderCol,
                backgroundColor: darkMode ? "#334155" : "#ffffff",
                color: themeValues.textPrimary,
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
              backgroundColor: themeValues.bgSidebar,
              borderRightWidth: 1,
              borderRightStyle: "solid",
              borderRightColor: themeValues.borderCol,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
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
                  backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: themeValues.borderCol,
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
                  <div style={{ fontWeight: 700, fontSize: 14, color: themeValues.textPrimary, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    Gestión Admin
                  </div>
                  <div style={{ fontSize: 11, color: themeValues.textMuted }}>Administrador Central</div>
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
                    color: isClubs ? (darkMode ? "#ffffff" : "#1d4ed8") : themeValues.textMuted,
                    backgroundColor: isClubs ? (darkMode ? "#1e40af" : "#eff6ff") : "transparent",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: isClubs ? (darkMode ? "#3b82f6" : "#bfdbfe") : "transparent",
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
                    color: isComps ? (darkMode ? "#ffffff" : "#1d4ed8") : themeValues.textMuted,
                    backgroundColor: isComps ? (darkMode ? "#1e40af" : "#eff6ff") : "transparent",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: isComps ? (darkMode ? "#3b82f6" : "#bfdbfe") : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Trophy size={18} />
                  <span>Competencias</span>
                </Link>
              </nav>
            </div>

            {/* Bottom Primary Sidebar Action */}
            {onPrimaryAction && (
              <button
                type="button"
                onClick={onPrimaryAction}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "11px 16px",
                  borderRadius: 12,
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(37,99,235,0.25)",
                  transition: "background-color 0.15s ease",
                }}
              >
                <Plus size={18} />
                <span>{primaryActionLabel || "Crear Nuevo"}</span>
              </button>
            )}
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
                  <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: themeValues.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>
                    {title}
                  </h1>
                  {subtitle && <p style={{ fontSize: "0.875rem", color: themeValues.textMuted, marginTop: 4, margin: 0 }}>{subtitle}</p>}
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
    </AdminThemeContext.Provider>
  );
}
