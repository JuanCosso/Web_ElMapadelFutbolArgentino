"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { AdminLayout, useAdminTheme } from "@/components/admin/AdminLayout";
import { getAdminFormData, searchFullClubsForAdmin, getClubLocation } from "@/app/actions/admin";
import {
  Search,
  MapPin,
  Shield,
  Trophy,
  Plus,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Building2,
  Award,
  Upload,
} from "lucide-react";

// --- Helpers ---
function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function buildId(province: string, league: string, name: string) {
  return [slugify(province), slugify(league), slugify(name)].filter(Boolean).join("__");
}

function highlight(text: string, query: string, highlightColor: string = "#2563eb") {
  if (!query) return <>{text}</>;
  const idx = norm(text).indexOf(norm(query));
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ fontWeight: 700, color: highlightColor }}>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}

async function imageFileToWebp256(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, 256, 256);
        const scale = Math.min(256 / img.width, 256 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (256 - w) / 2, (256 - h) / 2, w, h);
        resolve(canvas.toDataURL("image/webp", 0.95));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- Componente AutoField ---
type Option = { id: string; name: string };
function AutoField({
  label,
  valueId,
  options,
  onChange,
  disabled = false,
  allowCustom = false,
  customValue = "",
  onCustomChange,
}: {
  label: string;
  valueId: string;
  options: Option[];
  onChange: (id: string) => void;
  disabled?: boolean;
  allowCustom?: boolean;
  customValue?: string;
  onCustomChange?: (val: string) => void;
}) {
  const theme = useAdminTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  const selectedName = options.find((o) => o.id === valueId)?.name || "";

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) {
        if (valueId && selectedName) {
          setQuery(selectedName);
        } else if (allowCustom && customValue) {
          setQuery(customValue);
        } else if (!valueId && !customValue) {
          setQuery("");
        }
      }
    });
    return () => {
      ignore = true;
    };
  }, [selectedName, valueId, customValue, allowCustom]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const matches = options.filter((o) => norm(o.name).includes(norm(query))).slice(0, 10);
  const exactMatch = options.some((o) => norm(o.name) === norm(query.trim()));
  const displayVal = open ? query : (selectedName || (allowCustom ? customValue : ""));

  return (
    <div ref={wrap} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        style={{
          width: "100%",
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: theme.borderCol,
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 14,
          color: disabled ? theme.textMuted : theme.textPrimary,
          backgroundColor: disabled ? (theme.darkMode ? "#1e293b" : "#f1f5f9") : theme.bgInput,
          outline: "none",
        }}
        value={displayVal}
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          setOpen(true);

          const matchOpt = options.find((o) => norm(o.name) === norm(val.trim()));
          if (matchOpt) {
            onChange(matchOpt.id);
            if (allowCustom && onCustomChange) onCustomChange("");
          } else {
            onChange("");
            if (allowCustom && onCustomChange) onCustomChange(val);
          }
        }}
        onFocus={() => {
          if (!disabled) {
            setQuery(displayVal);
            setOpen(true);
          }
        }}
        autoComplete="off"
        disabled={disabled}
      />
      {open && !disabled && (matches.length > 0 || (allowCustom && query.trim() !== "" && !exactMatch)) && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: theme.bgCard,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: theme.borderCol,
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 50,
            maxHeight: 180,
            overflowY: "auto",
            marginTop: 4,
          }}
        >
          {matches.map((m) => (
            <div
              key={m.id}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                color: theme.textPrimary,
                cursor: "pointer",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(m.id);
                if (allowCustom && onCustomChange) onCustomChange("");
                setQuery(m.name);
                setOpen(false);
              }}
            >
              {m.name}
            </div>
          ))}
          {allowCustom && query.trim() !== "" && !exactMatch && (
            <div
              style={{
                padding: "8px 12px",
                fontSize: 13,
                color: "#2563eb",
                fontWeight: 600,
                borderTopWidth: matches.length > 0 ? 1 : 0,
                borderTopStyle: "solid",
                borderTopColor: theme.borderCol,
                cursor: "pointer",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange("");
                if (onCustomChange) onCustomChange(query.trim());
                setQuery(query.trim());
                setOpen(false);
              }}
            >
              + Usar/Crear ciudad &quot;{query.trim()}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type CompetitionOption = Option & { type?: string; level?: number | null };
type TitleEntry = { name: string; count: number };

type ClubAdminItem = {
  id: string;
  shortName?: string | null;
  fullName: string;
  locality?: { name?: string; provinceId?: string; province?: { name?: string } } | null;
  localityId?: string | null;
  localLeagueId?: string | null;
  slug: string;
  competitions: { id: string; name?: string; level?: number | null }[];
  titles?: { name: string; count: number }[];
  crestUrl?: string | null;
  nickname?: string | null;
  foundation?: string | null;
  stadiumName?: string | null;
  stadiumCapacity?: number | null;
  history?: string | null;
  verified?: boolean;
};

export default function ClubManagerPage() {
  const theme = useAdminTheme();

  const [mode, setMode] = useState<"IDLE" | "CREATE" | "EDIT">("IDLE");

  const [provinces, setProvinces] = useState<Option[]>([]);
  const [localities, setLocalities] = useState<{ id: string; name: string; provinceId: string }[]>([]);
  const [leagues, setLeagues] = useState<Option[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionOption[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClubAdminItem[]>([]);
  const [initialClubs, setInitialClubs] = useState<ClubAdminItem[]>([]);
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState("");
  const [selectedCompFilter, setSelectedCompFilter] = useState("");

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [activeFormTab, setActiveFormTab] = useState<"LOCATION" | "IDENTITY" | "STADIUM" | "TITLES">("LOCATION");

  // Form State
  const [clubId, setClubId] = useState("");
  const [name, setName] = useState("");
  const [fullName, setFullName] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [localityCustom, setLocalityCustom] = useState("");
  const [isDirectAfa, setIsDirectAfa] = useState(false);
  const [leagueId, setLeagueId] = useState("");
  const [manualSlug, setManualSlug] = useState("");
  const [selectedComps, setSelectedComps] = useState<string[]>([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [verified, setVerified] = useState(false);

  const [nickname, setNickname] = useState("");
  const [foundation, setFoundation] = useState("");
  const [stadiumName, setStadiumName] = useState("");
  const [stadiumCapacity, setStadiumCapacity] = useState("");
  const [history, setHistory] = useState("");

  const [titles, setTitles] = useState<TitleEntry[]>([]);
  const [newTitleName, setNewTitleName] = useState("");
  const [newTitleCount, setNewTitleCount] = useState("1");

  const [badgeUrl, setBadgeUrl] = useState("");
  const [badgeData, setBadgeData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAdminFormData().then((data) => {
      setProvinces(data.provinces);
      setLocalities(data.localities);
      setLeagues(data.leagues);
      setCompetitions(data.competitions as CompetitionOption[]);
    });

    searchFullClubsForAdmin("a").then((results) => {
      if (results && results.length > 0) {
        setInitialClubs(results as ClubAdminItem[]);
      }
    });
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await searchFullClubsForAdmin(searchQuery);
        setSearchResults(results as ClubAdminItem[]);
        setCurrentPage(1);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const activeClubsList = searchQuery.length >= 2 ? searchResults : initialClubs;

  const filteredClubs = useMemo(() => {
    return activeClubsList.filter((c) => {
      const matchProv = !selectedProvinceFilter || c.locality?.provinceId === selectedProvinceFilter;
      const matchComp =
        !selectedCompFilter ||
        (selectedCompFilter === "AFA"
          ? !c.localLeagueId
          : c.competitions?.some((comp) => comp.id === selectedCompFilter || String(comp.level) === selectedCompFilter));
      return matchProv && matchComp;
    });
  }, [activeClubsList, selectedProvinceFilter, selectedCompFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredClubs.length / itemsPerPage));
  const paginatedClubs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredClubs.slice(start, start + itemsPerPage);
  }, [filteredClubs, currentPage]);

  const filteredLocalities = localities.filter((l) => l.provinceId === provinceId);

  const provName = provinces.find((p) => p.id === provinceId)?.name || "";
  const leagueName = isDirectAfa ? "afa" : leagues.find((l) => l.id === leagueId)?.name || "";
  const autoSlug = buildId(provName, leagueName, name);
  const finalSlug = manualSlug.trim() || autoSlug;

  const handleCreateNew = () => {
    resetForm();
    setActiveFormTab("LOCATION");
    setMode("CREATE");
  };

  const handleEdit = async (club: ClubAdminItem) => {
    resetForm();
    setMode("EDIT");
    setActiveFormTab("LOCATION");
    setClubId(club.id);
    setName(club.shortName || club.fullName);
    setFullName(club.fullName);
    setProvinceId(club.locality?.provinceId || "");
    setLocalityId(club.localityId || "");
    setLocalityCustom("");

    if (!club.localLeagueId) {
      setIsDirectAfa(true);
      setLeagueId("");
    } else {
      setIsDirectAfa(false);
      setLeagueId(club.localLeagueId);
    }

    setManualSlug(club.slug);
    setSelectedComps(club.competitions.map((c) => c.id));
    setBadgeUrl(club.crestUrl || `/badges/${club.slug}.webp`);
    setVerified(club.verified ?? false);

    setNickname(club.nickname || "");
    setFoundation(club.foundation || "");
    setStadiumName(club.stadiumName || "");
    setStadiumCapacity(club.stadiumCapacity ? String(club.stadiumCapacity) : "");
    setHistory(club.history || "");

    if (club.titles && Array.isArray(club.titles)) {
      setTitles(club.titles.map((t) => ({ name: t.name, count: Number(t.count) || 1 })));
    }

    setLat("Cargando...");
    setLng("Cargando...");

    const loc = await getClubLocation(club.id);
    if (loc) {
      setLat(String(loc.lat));
      setLng(String(loc.lng));
    } else {
      setLat("");
      setLng("");
    }
  };

  const resetForm = () => {
    setClubId("");
    setName("");
    setFullName("");
    setProvinceId("");
    setLocalityId("");
    setLocalityCustom("");
    setLeagueId("");
    setIsDirectAfa(false);
    setManualSlug("");
    setSelectedComps([]);
    setLat("");
    setLng("");
    setVerified(false);
    setNickname("");
    setFoundation("");
    setStadiumName("");
    setStadiumCapacity("");
    setHistory("");
    setTitles([]);
    setNewTitleName("");
    setNewTitleCount("1");
    setBadgeUrl("");
    setBadgeData(null);
    setStatus({ type: "idle", msg: "" });
  };

  const handleAddTitle = () => {
    if (!newTitleName.trim()) return;
    setTitles((prev) => [
      ...prev,
      { name: newTitleName.trim(), count: Math.max(1, parseInt(newTitleCount, 10) || 1) },
    ]);
    setNewTitleName("");
    setNewTitleCount("1");
  };

  const handleRemoveTitle = (index: number) => {
    setTitles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webpData = await imageFileToWebp256(file);
      setBadgeData(webpData);
    } catch {
      setStatus({ type: "error", msg: "No se pudo procesar la imagen" });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!localityId && !localityCustom.trim()) || !lat || !lng || (!isDirectAfa && !leagueId)) {
      setStatus({ type: "error", msg: "Completá los campos obligatorios (*) en la sección Ubicación & Identidad" });
      return;
    }
    setLoading(true);
    setStatus({ type: "idle", msg: "" });

    try {
      const res = await fetch("/admin/clubs/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mode === "EDIT" ? clubId : null,
          slug: finalSlug,
          name,
          fullName,
          provinceId,
          localityId: localityId || null,
          localityCustom: localityCustom || null,
          localLeagueId: isDirectAfa ? null : leagueId,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          competitions: selectedComps,
          badge_url: badgeUrl,
          badgeData: badgeData || null,
          nickname,
          foundation: foundation || null,
          stadiumName,
          stadiumCapacity: stadiumCapacity ? parseInt(stadiumCapacity, 10) : null,
          history,
          verified,
          titles,
        }),
      });

      const resText = await res.text();
      let data: { error?: string; slug?: string } = {};
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error("El servidor devolvió un error inesperado al guardar los datos.");
      }
      if (!res.ok) throw new Error(data.error || "Fallo al guardar el club.");

      searchFullClubsForAdmin(searchQuery || "a").then((results) => {
        if (results) setInitialClubs(results as ClubAdminItem[]);
      });

      setStatus({ type: "success", msg: `Club guardado exitosamente: ${data.slug}` });
      if (mode === "CREATE") resetForm();
    } catch (err: unknown) {
      const e = err as Error;
      setStatus({ type: "error", msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (club: ClubAdminItem) => {
    const minLvl = club.competitions && club.competitions.length > 0
      ? Math.min(...club.competitions.map((c) => c.level ?? 8))
      : 8;
    if (minLvl === 1 || minLvl === 2) return "#eab308";
    if (minLvl === 3) return "#2563eb";
    if (minLvl === 4 || minLvl === 5) return "#9333ea";
    return "#64748b";
  };

  const activeProvinceName = provinces.find((p) => p.id === selectedProvinceFilter)?.name || "";
  const activeCompName = competitions.find((c) => c.id === selectedCompFilter)?.name || "";

  return (
    <AdminLayout
      title="Directorio de Clubes"
      subtitle="Gestiona la información, escudos y datos institucionales de todos los clubes registrados."
      onPrimaryAction={handleCreateNew}
      primaryActionLabel="Crear nuevo club"
    >
      {/* Vista Principal */}
      {mode === "IDLE" && (
        <div>
          {/* Card de Filtros */}
          <div
            style={{
              backgroundColor: theme.bgCard,
              borderRadius: 14,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: theme.borderCol,
              padding: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {/* Buscador */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 2, minWidth: 260 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Buscar Club
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: theme.bgInput,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: theme.borderCol,
                    borderRadius: 10,
                    padding: "8px 12px",
                  }}
                >
                  <Search size={17} style={{ color: theme.textMuted, flexShrink: 0 }} />
                  <input
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      color: theme.textPrimary,
                      backgroundColor: "transparent",
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nombre, alias o siglas..."
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      style={{ border: "none", background: "transparent", cursor: "pointer", color: theme.textMuted, display: "flex" }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtro Provincia */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Provincia
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: theme.bgInput,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: theme.borderCol,
                    borderRadius: 10,
                    padding: "8px 12px",
                  }}
                >
                  <MapPin size={16} style={{ color: theme.textMuted, flexShrink: 0 }} />
                  <select
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      color: theme.textPrimary,
                      backgroundColor: "transparent",
                      cursor: "pointer",
                    }}
                    value={selectedProvinceFilter}
                    onChange={(e) => {
                      setSelectedProvinceFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="" style={{ backgroundColor: theme.bgCard, color: theme.textPrimary }}>
                      Todas las provincias
                    </option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id} style={{ backgroundColor: theme.bgCard, color: theme.textPrimary }}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filtro Categoría / Torneo */}
              <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 180 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Categoría / Torneo
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: theme.bgInput,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: theme.borderCol,
                    borderRadius: 10,
                    padding: "8px 12px",
                  }}
                >
                  <Trophy size={16} style={{ color: theme.textMuted, flexShrink: 0 }} />
                  <select
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      color: theme.textPrimary,
                      backgroundColor: "transparent",
                      cursor: "pointer",
                    }}
                    value={selectedCompFilter}
                    onChange={(e) => {
                      setSelectedCompFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="" style={{ backgroundColor: theme.bgCard, color: theme.textPrimary }}>
                      Todas las categorías
                    </option>
                    <option value="AFA" style={{ backgroundColor: theme.bgCard, color: theme.textPrimary }}>
                      Directamente Afiliados a AFA
                    </option>
                    <optgroup label="Torneos Oficiales">
                      {competitions.map((c) => (
                        <option key={c.id} value={c.id} style={{ backgroundColor: theme.bgCard, color: theme.textPrimary }}>
                          {c.name} {c.level ? `(Nivel ${c.level})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* Barra de Filtros Activos & Cambiador de Vista */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 14,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopStyle: "solid",
                borderTopColor: theme.borderCol,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {(selectedProvinceFilter || selectedCompFilter || searchQuery) && (
                  <>
                    <span style={{ fontSize: 12, fontWeight: 600, color: theme.textMuted }}>Filtros activos:</span>

                    {activeProvinceName && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 10px",
                          borderRadius: 20,
                          backgroundColor: theme.darkMode ? "#1e3a8a" : "#eff6ff",
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: theme.darkMode ? "#3b82f6" : "#bfdbfe",
                          color: theme.darkMode ? "#93c5fd" : "#1e40af",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {activeProvinceName}
                        <button
                          type="button"
                          onClick={() => setSelectedProvinceFilter("")}
                          style={{ border: "none", background: "transparent", cursor: "pointer", color: "inherit", display: "flex" }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    {selectedCompFilter && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 10px",
                          borderRadius: 20,
                          backgroundColor: theme.darkMode ? "#1e3a8a" : "#eff6ff",
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: theme.darkMode ? "#3b82f6" : "#bfdbfe",
                          color: theme.darkMode ? "#93c5fd" : "#1e40af",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {selectedCompFilter === "AFA" ? "Directo AFA" : activeCompName || "Torneo"}
                        <button
                          type="button"
                          onClick={() => setSelectedCompFilter("")}
                          style={{ border: "none", background: "transparent", cursor: "pointer", color: "inherit", display: "flex" }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    {searchQuery && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "3px 10px",
                          borderRadius: 20,
                          backgroundColor: theme.darkMode ? "#1e3a8a" : "#eff6ff",
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: theme.darkMode ? "#3b82f6" : "#bfdbfe",
                          color: theme.darkMode ? "#93c5fd" : "#1e40af",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        &quot;{searchQuery}&quot;
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          style={{ border: "none", background: "transparent", cursor: "pointer", color: "inherit", display: "flex" }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedProvinceFilter("");
                        setSelectedCompFilter("");
                        setCurrentPage(1);
                      }}
                      style={{ border: "none", background: "transparent", color: "#2563eb", fontSize: 12, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                    >
                      Limpiar todos
                    </button>
                  </>
                )}
              </div>

              {/* Botones de Vista Grid / Lista */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 12, color: theme.textMuted, marginRight: 6 }}>
                  Mostrando <strong style={{ color: theme.textPrimary }}>{filteredClubs.length}</strong> clubes
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: theme.borderCol,
                    backgroundColor: viewMode === "grid" ? "#2563eb" : theme.bgInput,
                    color: viewMode === "grid" ? "#ffffff" : theme.textMuted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Vista en Grilla"
                >
                  <Grid size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: theme.borderCol,
                    backgroundColor: viewMode === "list" ? "#2563eb" : theme.bgInput,
                    color: viewMode === "list" ? "#ffffff" : theme.textMuted,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                  title="Vista en Lista"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Grilla / Lista de Clubes */}
          {filteredClubs.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                backgroundColor: theme.bgCard,
                borderRadius: 14,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: theme.borderCol,
              }}
            >
              <Shield size={36} style={{ color: theme.textMuted, marginBottom: 10 }} />
              <div style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary }}>No se encontraron clubes</div>
              <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
                Intenta ajustando los filtros o realizando una búsqueda distinta.
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 16 }}>
              {paginatedClubs.map((club) => {
                const accentColor = getTierColor(club);

                return (
                  <div
                    key={club.id}
                    style={{
                      backgroundColor: theme.bgCard,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: theme.borderCol,
                      borderTopWidth: 4,
                      borderTopStyle: "solid",
                      borderTopColor: accentColor,
                      padding: "1.1rem",
                      boxShadow: theme.darkMode ? "0 2px 6px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.04)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                      transition: "transform 0.15s ease",
                    }}
                    onClick={() => handleEdit(club)}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      {/* Sin contenedor cuadrado/círculo adicional - Imagen directa limpia */}
                      <img
                        src={club.crestUrl || `/badges/${club.slug}.webp`}
                        alt=""
                        style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.visibility = "hidden";
                        }}
                      />

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: theme.textPrimary, lineHeight: 1.25 }}>
                          {highlight(club.fullName, searchQuery, theme.darkMode ? "#60a5fa" : "#2563eb")}
                        </div>
                        <div style={{ fontSize: 12, color: theme.textMuted, display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <MapPin size={12} style={{ flexShrink: 0, color: theme.textMuted }} />
                          <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {club.locality?.name}, {club.locality?.province?.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingTop: 10, borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: theme.borderCol }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#2563eb" }}>
                        Editar datos →
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Tarjeta Dashed Registrar Club */}
              <div
                style={{
                  borderRadius: 14,
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: theme.darkMode ? "#3b82f6" : "#bfdbfe",
                  backgroundColor: theme.darkMode ? "#1e3a8a" : "#f0f9ff",
                  padding: "1.5rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  minHeight: 140,
                }}
                onClick={handleCreateNew}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={22} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: theme.darkMode ? "#93c5fd" : "#2563eb", marginTop: 10 }}>
                  Registrar Club
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2, textAlign: "center" }}>
                  Añade una nueva institución al sistema nacional.
                </div>
              </div>
            </div>
          ) : (
            /* Vista en Lista */
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {paginatedClubs.map((club) => (
                <div
                  key={club.id}
                  style={{
                    backgroundColor: theme.bgCard,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: theme.borderCol,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                  onClick={() => handleEdit(club)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <img
                      src={club.crestUrl || `/badges/${club.slug}.webp`}
                      alt=""
                      style={{ width: 36, height: 36, objectFit: "contain" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = "hidden";
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: theme.textPrimary }}>
                        {highlight(club.fullName, searchQuery, theme.darkMode ? "#60a5fa" : "#2563eb")}
                      </div>
                      <div style={{ fontSize: 13, color: theme.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} />
                        {club.locality?.name}, {club.locality?.province?.name}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEdit(club)}
                    style={{ border: "none", background: "transparent", color: theme.textMuted, cursor: "pointer", padding: 4, display: "flex" }}
                  >
                    <Edit3 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Paginador */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: "1.75rem" }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: theme.borderCol,
                  backgroundColor: theme.bgCard,
                  color: theme.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: currentPage === page ? "#2563eb" : theme.borderCol,
                    backgroundColor: currentPage === page ? "#2563eb" : theme.bgCard,
                    color: currentPage === page ? "#ffffff" : theme.textPrimary,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: theme.borderCol,
                  backgroundColor: theme.bgCard,
                  color: theme.textMuted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Formulario Estructurado por Pestañas */}
      {mode !== "IDLE" && (
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: theme.bgCard,
            borderRadius: 16,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: theme.borderCol,
            padding: "1.5rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.25rem",
              paddingBottom: "1rem",
              borderBottomWidth: 1,
              borderBottomStyle: "solid",
              borderBottomColor: theme.borderCol,
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: theme.textPrimary }}>
                {mode === "CREATE" ? "Registrar Nuevo Club" : `Editando: ${fullName}`}
              </h2>
              <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                Identificador: <code style={{ color: "#2563eb", fontWeight: 600 }}>{finalSlug || "auto-slug"}</code>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMode("IDLE")}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: theme.borderCol,
                backgroundColor: theme.bgInput,
                color: theme.textPrimary,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Volver al directorio
            </button>
          </div>

          {status.msg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
                backgroundColor: status.type === "error" ? "#fef2f2" : "#f0fdf4",
                color: status.type === "error" ? "#dc2626" : "#166534",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: status.type === "error" ? "#fca5a5" : "#bbf7d0",
              }}
            >
              {status.msg}
            </div>
          )}

          {/* Navegación de Pestañas del Formulario */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: "1.25rem",
              borderBottomWidth: 1,
              borderBottomStyle: "solid",
              borderBottomColor: theme.borderCol,
              paddingBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setActiveFormTab("LOCATION")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                backgroundColor: activeFormTab === "LOCATION" ? (theme.darkMode ? "#1e3a8a" : "#eff6ff") : "transparent",
                color: activeFormTab === "LOCATION" ? "#2563eb" : theme.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <MapPin size={15} /> 1. Ubicación & Afiliación
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab("IDENTITY")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                backgroundColor: activeFormTab === "IDENTITY" ? (theme.darkMode ? "#1e3a8a" : "#eff6ff") : "transparent",
                color: activeFormTab === "IDENTITY" ? "#2563eb" : theme.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Shield size={15} /> 2. Identidad & Escudo
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab("STADIUM")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                backgroundColor: activeFormTab === "STADIUM" ? (theme.darkMode ? "#1e3a8a" : "#eff6ff") : "transparent",
                color: activeFormTab === "STADIUM" ? "#2563eb" : theme.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Building2 size={15} /> 3. Estadio & Torneos
            </button>

            <button
              type="button"
              onClick={() => setActiveFormTab("TITLES")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                backgroundColor: activeFormTab === "TITLES" ? (theme.darkMode ? "#1e3a8a" : "#eff6ff") : "transparent",
                color: activeFormTab === "TITLES" ? "#2563eb" : theme.textMuted,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Award size={15} /> 4. Palmarés & Historia
            </button>
          </div>

          {/* Contenido Pestaña 1: Ubicación & Afiliación */}
          {activeFormTab === "LOCATION" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Ubicación Geográfica & Liga de Origen
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                <AutoField
                  label="Provincia *"
                  valueId={provinceId}
                  options={provinces}
                  onChange={(id) => {
                    setProvinceId(id);
                    setLocalityId("");
                    setLocalityCustom("");
                  }}
                />
                <AutoField
                  label="Ciudad / Localidad *"
                  valueId={localityId}
                  options={filteredLocalities}
                  onChange={setLocalityId}
                  allowCustom
                  customValue={localityCustom}
                  onCustomChange={setLocalityCustom}
                />
              </div>

              <div style={{ marginTop: 16, backgroundColor: theme.darkMode ? "#0f172a" : "#f8fafc", padding: 14, borderRadius: 10, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", color: theme.textPrimary }}>
                  <input
                    type="checkbox"
                    checked={isDirectAfa}
                    onChange={(e) => {
                      setIsDirectAfa(e.target.checked);
                      if (e.target.checked) setLeagueId("");
                    }}
                    style={{ width: 16, height: 16 }}
                  />
                  Directamente Afiliado a AFA (No pertenece a Liga Regional)
                </label>

                <div style={{ marginTop: 12 }}>
                  <AutoField
                    label="Liga Local (Origen) *"
                    valueId={leagueId}
                    options={leagues}
                    onChange={setLeagueId}
                    disabled={isDirectAfa}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("IDENTITY")}
                  style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                >
                  Siguiente: Identidad & Escudo →
                </button>
              </div>
            </div>
          )}

          {/* Contenido Pestaña 2: Identidad & Escudo */}
          {activeFormTab === "IDENTITY" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Nombres & Escudo Oficial
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre Corto *</label>
                  <input
                    style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                    placeholder="Ej: Colón, River, Boca"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre Completo u Oficial</label>
                  <input
                    style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                    placeholder="Ej: Club Atlético Colón"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Apodo o Sobrenombre</label>
                  <input
                    style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                    placeholder="Ej: Sabalero, Millonario, Xeneize"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Identificador Slug (Opcional para forzar)</label>
                  <input
                    style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                    placeholder={autoSlug}
                    value={manualSlug}
                    onChange={(e) => setManualSlug(e.target.value)}
                  />
                </div>
              </div>

              {/* Selección de Escudo con botón destacado para examinar de la PC */}
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Escudo Institucional
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 10 }}>
                  <img
                    src={badgeData || badgeUrl || `/badges/${finalSlug || "default"}.webp`}
                    alt=""
                    style={{ width: 64, height: 64, objectFit: "contain", flexShrink: 0 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "9px 16px",
                        borderRadius: 8,
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        fontWeight: 600,
                        fontSize: 13,
                        border: "none",
                        cursor: "pointer",
                        width: "fit-content",
                      }}
                    >
                      <Upload size={16} />
                      <span>Seleccionar archivo desde tu PC</span>
                    </button>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>
                      Subí una imagen PNG, JPG o WEBP. El sistema la procesará y optimizará automáticamente.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("LOCATION")}
                  style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, cursor: "pointer" }}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("STADIUM")}
                  style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                >
                  Siguiente: Estadio & Torneos →
                </button>
              </div>
            </div>
          )}

          {/* Contenido Pestaña 3: Estadio & Torneos */}
          {activeFormTab === "STADIUM" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Datos Institucionales, Cancha & Torneos Activos
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre del Estadio / Cancha</label>
                  <input
                    style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                    placeholder="Ej: Estadio Brigadier General Estanislao López"
                    value={stadiumName}
                    onChange={(e) => setStadiumName(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Capacidad de Espectadores</label>
                  <input
                    style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                    type="number"
                    placeholder="Ej: 40000"
                    value={stadiumCapacity}
                    onChange={(e) => setStadiumCapacity(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha / Año de Fundación</label>
                  <input
                    style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                    placeholder="Ej: 5 de mayo de 1905"
                    value={foundation}
                    onChange={(e) => setFoundation(e.target.value)}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Coordenadas Mapa (Latitud / Longitud) *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      style={{ flex: 1, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                      placeholder="Latitud (ej: -31.65)"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                    />
                    <input
                      style={{ flex: 1, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                      placeholder="Longitud (ej: -60.71)"
                      value={lng}
                      onChange={(e) => setLng(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Categorías y Torneos Activos */}
              <div style={{ marginTop: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Torneos y Competencias Nacionales Activas</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8, marginTop: 8 }}>
                  {competitions
                    .filter((c) => c.type !== "ORGANIZATION" && c.level !== null)
                    .map((c) => (
                      <label
                        key={c.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: 8,
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: theme.borderCol,
                          backgroundColor: selectedComps.includes(c.id) ? (theme.darkMode ? "#1e3a8a" : "#eff6ff") : theme.bgInput,
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedComps.includes(c.id)}
                          onChange={() =>
                            setSelectedComps((prev) =>
                              prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                            )
                          }
                          style={{ width: 16, height: 16 }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: theme.textPrimary }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: theme.textMuted }}>Nivel {c.level ?? "-"}</div>
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("IDENTITY")}
                  style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, cursor: "pointer" }}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("TITLES")}
                  style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}
                >
                  Siguiente: Palmarés & Historia →
                </button>
              </div>
            </div>
          )}

          {/* Contenido Pestaña 4: Palmarés & Historia */}
          {activeFormTab === "TITLES" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                Palmarés Conseguido & Historia Institucional
              </h3>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Títulos y Campeonatos Conseguidos</label>
                {titles.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "8px 0 12px 0" }}>
                    {titles.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          backgroundColor: theme.bgInput,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderStyle: "solid",
                          borderColor: theme.borderCol,
                          fontSize: 13,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: theme.textPrimary }}>
                          🏆 {t.name} <strong style={{ color: "#2563eb", marginLeft: 6 }}>({t.count})</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTitle(i)}
                          style={{ background: "transparent", border: "none", color: "#dc2626", fontWeight: 600, cursor: "pointer", fontSize: 12 }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  <select
                    style={{ flex: 2, minWidth: 200, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                    value={newTitleName}
                    onChange={(e) => setNewTitleName(e.target.value)}
                  >
                    <option value="" style={{ backgroundColor: theme.bgCard }}>Seleccionar Torneo / Competencia Registrada</option>
                    <optgroup label="Torneos Nacionales e Internacionales">
                      {competitions.map((c) => (
                        <option key={c.id} value={c.name} style={{ backgroundColor: theme.bgCard }}>
                          {c.name} (Nivel {c.level ?? "-"})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Ligas Regionales">
                      {leagues.map((l) => (
                        <option key={l.id} value={l.name} style={{ backgroundColor: theme.bgCard }}>
                          {l.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <input
                    style={{ width: 100, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }}
                    type="number"
                    min="1"
                    placeholder="Cantidad"
                    value={newTitleCount}
                    onChange={(e) => setNewTitleCount(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={handleAddTitle}
                    style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, cursor: "pointer" }}
                  >
                    + Añadir Título
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Reseña Histórica del Club</label>
                <textarea
                  style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none", minHeight: 120, resize: "vertical" }}
                  placeholder="Reseña del origen, logros e hitos del club..."
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setActiveFormTab("STADIUM")}
                  style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, cursor: "pointer" }}
                >
                  ← Anterior
                </button>

                <button type="submit" disabled={loading} style={{ padding: "10px 24px", borderRadius: 8, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                  {loading ? "Guardando datos..." : mode === "CREATE" ? "Guardar y Crear Club" : "Guardar Cambios del Club"}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </AdminLayout>
  );
}
