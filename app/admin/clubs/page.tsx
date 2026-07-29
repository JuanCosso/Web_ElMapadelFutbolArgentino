"use client";

import { useState, useRef, useEffect } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import { getAdminFormData, searchFullClubsForAdmin, getClubLocation } from "@/app/actions/admin";

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
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function buildId(province: string, league: string, name: string) {
  return [slugify(province), slugify(league), slugify(name)].filter(Boolean).join("__");
}

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const idx = norm(text).indexOf(norm(query));
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong style={{ fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</strong>
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
}: {
  label: string;
  valueId: string;
  options: Option[];
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  const selectedName = options.find((o) => o.id === valueId)?.name || "";

  useEffect(() => {
    let ignore = false;
    Promise.resolve().then(() => {
      if (!ignore) setQuery(selectedName);
    });
    return () => {
      ignore = true;
    };
  }, [selectedName, valueId]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const matches = options.filter((o) => norm(o.name).includes(norm(query))).slice(0, 10);

  return (
    <div ref={wrap} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={s.label}>{label}</label>
      <input
        style={{
          ...s.input,
          backgroundColor: disabled ? "#f8fafc" : "#ffffff",
          color: disabled ? "#94a3b8" : "#0f172a",
        }}
        value={open ? query : selectedName}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onChange("");
        }}
        onFocus={() => {
          if (!disabled) {
            setQuery("");
            setOpen(true);
          }
        }}
        autoComplete="off"
        disabled={disabled}
      />
      {open && !disabled && matches.length > 0 && (
        <div style={s.dropdown}>
          {matches.map((m) => (
            <div
              key={m.id}
              style={s.dropItem}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(m.id);
                setOpen(false);
              }}
            >
              {m.name}
            </div>
          ))}
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
  competitions: { id: string }[];
  titles?: { name: string; count: number }[];
  crestUrl?: string | null;
  nickname?: string | null;
  foundation?: string | null;
  stadiumName?: string | null;
  stadiumCapacity?: number | null;
  history?: string | null;
  verified?: boolean;
};

// --- Página Principal ---
export default function ClubManagerPage() {
  const [mode, setMode] = useState<"IDLE" | "CREATE" | "EDIT">("IDLE");

  const [provinces, setProvinces] = useState<Option[]>([]);
  const [localities, setLocalities] = useState<{ id: string; name: string; provinceId: string }[]>([]);
  const [leagues, setLeagues] = useState<Option[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionOption[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClubAdminItem[]>([]);

  // Estado del Formulario
  const [clubId, setClubId] = useState("");
  const [name, setName] = useState("");
  const [fullName, setFullName] = useState("");
  const [provinceId, setProvinceId] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [isDirectAfa, setIsDirectAfa] = useState(false);
  const [leagueId, setLeagueId] = useState("");
  const [manualSlug, setManualSlug] = useState("");
  const [selectedComps, setSelectedComps] = useState<string[]>([]);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [verified, setVerified] = useState(true);

  // Datos adicionales
  const [nickname, setNickname] = useState("");
  const [foundation, setFoundation] = useState("");
  const [stadiumName, setStadiumName] = useState("");
  const [stadiumCapacity, setStadiumCapacity] = useState("");
  const [history, setHistory] = useState("");

  // Títulos / Palmarés
  const [titles, setTitles] = useState<TitleEntry[]>([]);
  const [newTitleName, setNewTitleName] = useState("");
  const [newTitleCount, setNewTitleCount] = useState("1");

  // Escudo
  const [badgeUrl, setBadgeUrl] = useState("");
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [badgeData, setBadgeData] = useState<string | null>(null);
  const [badgeFileName, setBadgeFileName] = useState("");
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
  }, []);

  // Buscador dinámico
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await searchFullClubsForAdmin(searchQuery);
        setSearchResults(results as ClubAdminItem[]);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const filteredLocalities = localities.filter((l) => l.provinceId === provinceId);

  // Slug en tiempo real
  const provName = provinces.find((p) => p.id === provinceId)?.name || "";
  const leagueName = isDirectAfa ? "afa" : leagues.find((l) => l.id === leagueId)?.name || "";
  const autoSlug = buildId(provName, leagueName, name);
  const finalSlug = manualSlug.trim() || autoSlug;

  const handleCreateNew = () => {
    resetForm();
    setMode("CREATE");
  };

  const handleEdit = async (club: ClubAdminItem) => {
    resetForm();
    setMode("EDIT");
    setClubId(club.id);
    setName(club.shortName || club.fullName);
    setFullName(club.fullName);
    setProvinceId(club.locality?.provinceId || "");
    setLocalityId(club.localityId || "");

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
    setVerified(club.verified ?? true);

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

    setSearchResults([]);
    setSearchQuery("");
  };

  const resetForm = () => {
    setClubId("");
    setName("");
    setFullName("");
    setProvinceId("");
    setLocalityId("");
    setLeagueId("");
    setIsDirectAfa(false);
    setManualSlug("");
    setSelectedComps([]);
    setLat("");
    setLng("");
    setVerified(true);
    setNickname("");
    setFoundation("");
    setStadiumName("");
    setStadiumCapacity("");
    setHistory("");
    setTitles([]);
    setNewTitleName("");
    setNewTitleCount("1");
    setBadgeUrl("");
    setBadgePreview(null);
    setBadgeData(null);
    setBadgeFileName("");
    setStatus({ type: "idle", msg: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    setBadgeFileName(file.name);
    try {
      const webpData = await imageFileToWebp256(file);
      setBadgeData(webpData);
      setBadgePreview(webpData);
    } catch {
      setStatus({ type: "error", msg: "No se pudo procesar la imagen" });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !localityId || !lat || !lng || (!isDirectAfa && !leagueId)) {
      setStatus({ type: "error", msg: "Completá todos los campos obligatorios (*)" });
      return;
    }
    setLoading(true);
    setStatus({ type: "idle", msg: "" });

    try {
      let finalBadgeUrl = badgeUrl || `/badges/${finalSlug}.webp`;
      if (badgeData) {
        const uploadRes = await fetch("/api/upload-badge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ club_id: finalSlug, data: badgeData }),
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error);
        finalBadgeUrl = uploadJson.badge_url;
      }

      const res = await fetch("/admin/clubs/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mode === "EDIT" ? clubId : null,
          slug: finalSlug,
          name,
          fullName,
          localityId,
          localLeagueId: isDirectAfa ? null : leagueId,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          competitions: selectedComps,
          badge_url: finalBadgeUrl,
          nickname,
          foundation: foundation || null,
          stadiumName,
          stadiumCapacity: stadiumCapacity ? parseInt(stadiumCapacity, 10) : null,
          history,
          verified,
          titles,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus({ type: "success", msg: `Club guardado exitosamente. Identificador: ${data.slug}` });

      if (mode === "CREATE") resetForm();
    } catch (err: unknown) {
      const e = err as Error;
      setStatus({ type: "error", msg: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <AdminNav />

      <div style={s.container}>
        <div style={s.header}>
          <h2 style={s.title}>Gestor de Clubes</h2>
          <p style={s.subtitle}>Creación y edición de clubes en la base de datos geográfica de Argentina.</p>
        </div>

        {/* Buscador */}
        {mode === "IDLE" && (
          <div style={s.section}>
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <input
                style={{ ...s.input, flex: 1, fontSize: 15, padding: "10px 14px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button style={s.btnPrimary} onClick={handleCreateNew}>
                + Nuevo Club
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {searchResults.map((c) => (
                <div key={c.id} style={s.resultItem} onClick={() => handleEdit(c)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img
                      src={c.crestUrl || `/badges/${c.slug}.webp`}
                      alt=""
                      style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = "hidden";
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>
                        {highlight(c.fullName, searchQuery)}
                      </div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        {c.locality?.name}, {c.locality?.province?.name}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "monospace" }}>{c.slug}</span>
                </div>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                  No se encontraron clubes para la búsqueda realizada.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulario */}
        {mode !== "IDLE" && (
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={s.formHeader}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                {mode === "CREATE" ? "Creando Nuevo Club" : `Editando: ${fullName}`}
              </h3>
              <button type="button" onClick={() => setMode("IDLE")} style={s.btnSecondary}>
                Volver al buscador
              </button>
            </div>

            <section style={s.section}>
              <h4 style={s.sectionTitle}>Ubicación Geográfica</h4>
              <div style={s.grid2}>
                <AutoField
                  label="Provincia *"
                  valueId={provinceId}
                  options={provinces}
                  onChange={(id) => {
                    setProvinceId(id);
                    setLocalityId("");
                  }}
                />
                <AutoField
                  label="Ciudad / Localidad *"
                  valueId={localityId}
                  options={filteredLocalities}
                  onChange={setLocalityId}
                />
              </div>
            </section>

            <section style={s.section}>
              <h4 style={s.sectionTitle}>Identidad & Afiliación</h4>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Nombre Corto *</label>
                  <input style={s.input} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Nombre Completo u Oficial</label>
                  <input style={s.input} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>

                <div
                  style={{
                    gridColumn: "1 / -1",
                    background: "#f8fafc",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      marginBottom: 12,
                      color: "#1e293b",
                    }}
                  >
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

                  <AutoField
                    label="Liga Local (Origen) *"
                    valueId={leagueId}
                    options={leagues}
                    onChange={setLeagueId}
                    disabled={isDirectAfa}
                  />
                </div>
              </div>
            </section>

            <section style={s.section}>
              <h4 style={s.sectionTitle}>Identificador del Sistema (Slug)</h4>
              <div style={s.idBox}>
                <span style={s.idLabel}>Identificador Único Generado</span>
                <span style={s.idValue}>{finalSlug || "—"}</span>
              </div>
              <div style={{ ...s.field, marginTop: 10 }}>
                <label style={s.label}>Forzar Slug Personalizado</label>
                <input style={s.input} value={manualSlug} onChange={(e) => setManualSlug(e.target.value)} />
              </div>
            </section>

            <section style={s.section}>
              <h4 style={s.sectionTitle}>Torneos y Categorías Activas</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
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
                        border: "1px solid #e2e8f0",
                        background: selectedComps.includes(c.id) ? "#f0f9ff" : "#ffffff",
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
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          Nivel {c.level ?? "-"} ({c.type})
                        </div>
                      </div>
                    </label>
                  ))}
              </div>
            </section>

            <section style={s.section}>
              <h4 style={s.sectionTitle}>Datos Institucionales & Estadio</h4>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Apodo o Sobrenombre</label>
                  <input style={s.input} value={nickname} onChange={(e) => setNickname(e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Fecha / Año de Fundación</label>
                  <input style={s.input} value={foundation} onChange={(e) => setFoundation(e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Nombre del Estadio / Cancha</label>
                  <input style={s.input} value={stadiumName} onChange={(e) => setStadiumName(e.target.value)} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Capacidad de Espectadores</label>
                  <input
                    style={s.input}
                    type="number"
                    value={stadiumCapacity}
                    onChange={(e) => setStadiumCapacity(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section style={s.section}>
              <h4 style={s.sectionTitle}>Palmarés / Títulos Conseguidos</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {titles.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {titles.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: "#f8fafc",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          🏆 {t.name} <span style={{ color: "#2563eb", marginLeft: 6 }}>({t.count})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTitle(i)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                  <select
                    style={{ ...s.input, flex: 2, minWidth: 200 }}
                    value={newTitleName}
                    onChange={(e) => setNewTitleName(e.target.value)}
                  >
                    <option value="">-- Seleccionar Torneo Registrado --</option>
                    <optgroup label="Competencias / Torneos Nacionales e Internacionales">
                      {competitions.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} (Nivel {c.level ?? "-"})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Ligas Regionales / Locales">
                      {leagues.map((l) => (
                        <option key={l.id} value={l.name}>
                          {l.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <input
                    style={{ ...s.input, flex: 1, minWidth: 80 }}
                    type="number"
                    placeholder="Cantidad"
                    value={newTitleCount}
                    onChange={(e) => setNewTitleCount(e.target.value)}
                  />
                  <button type="button" onClick={handleAddTitle} style={s.btnSecondary}>
                    + Agregar Título
                  </button>
                </div>
              </div>
            </section>

            <section style={s.section}>
              <h4 style={s.sectionTitle}>Reseña Histórica</h4>
              <div style={s.field}>
                <textarea
                  style={{ ...s.input, minHeight: 120, resize: "vertical", fontFamily: "inherit" }}
                  value={history}
                  onChange={(e) => setHistory(e.target.value)}
                />
              </div>
            </section>

            <section style={s.section}>
              <h4 style={s.sectionTitle}>Ubicación Geográfica (PostGIS)</h4>
              <div style={s.grid2}>
                <div style={s.field}>
                  <label style={s.label}>Latitud *</label>
                  <input
                    style={s.input}
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                  />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Longitud *</label>
                  <input
                    style={s.input}
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section style={s.section}>
              <h4 style={s.sectionTitle}>Escudo Institucional</h4>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={s.badgeBox}>
                  {badgePreview ? (
                    <img src={badgePreview} alt="" style={s.badgeImg} />
                  ) : badgeUrl ? (
                    <img
                      src={badgeUrl}
                      alt=""
                      style={s.badgeImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 30 }}>🛡</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageSelect}
                  />
                  <button type="button" style={s.btnSecondary} onClick={() => fileInputRef.current?.click()}>
                    {badgeFileName ? "Cambiar Imagen" : "Seleccionar Archivo"}
                  </button>
                  {badgeFileName && (
                    <div style={{ marginTop: 8 }}>
                      <span style={s.sizeOk}>✓ {badgeFileName} → WebP 256×256</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section style={s.section}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Club Verificado</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Los clubes verificados se muestran prioritariamente con datos validados.
                  </div>
                </div>
              </label>
            </section>

            {status.msg && (
              <div style={status.type === "success" ? s.alertSuccess : s.alertError}>{status.msg}</div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" style={s.btnPrimary} disabled={loading}>
                {loading ? "Guardando..." : "Guardar Club"}
              </button>
              <button type="button" onClick={() => setMode("IDLE")} style={s.btnSecondary}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// --- Estilos ---
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8fafc", paddingBottom: "3rem", fontFamily: "system-ui, sans-serif" },
  container: { maxWidth: 960, margin: "0 auto", padding: "0 1rem" },
  header: { marginBottom: "1.5rem" },
  title: { fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 },
  subtitle: { fontSize: "0.875rem", color: "#64748b", marginTop: 4 },
  section: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "0.75rem",
    padding: "1.25rem",
    marginBottom: "1rem",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  },
  sectionTitle: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: "1px solid #f1f5f9",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: "0.75rem", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" },
  input: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "0.5rem",
    padding: "8px 12px",
    fontSize: "0.875rem",
    color: "#0f172a",
    outline: "none",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "0.5rem",
    zIndex: 100,
    maxHeight: 240,
    overflowY: "auto",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  dropItem: { padding: "10px 14px", fontSize: "0.875rem", cursor: "pointer", borderBottom: "1px solid #f1f5f9", color: "#1e293b" },
  btnPrimary: {
    padding: "10px 18px",
    background: "#0f172a",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  btnSecondary: {
    padding: "8px 14px",
    background: "#ffffff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "0.5rem",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "0.875rem",
  },
  resultItem: {
    padding: "12px 16px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    transition: "all 0.2s",
  },
  idBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  idLabel: { fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" },
  idValue: { fontSize: "0.875rem", fontFamily: "monospace", color: "#0f172a", fontWeight: 600, wordBreak: "break-all" },
  badgeBox: {
    width: 80,
    height: 80,
    border: "1px solid #e2e8f0",
    borderRadius: "0.75rem",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  badgeImg: { width: "100%", height: "100%", objectFit: "contain", padding: 4 },
  sizeOk: {
    fontSize: "0.75rem",
    color: "#166534",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "1rem",
    padding: "4px 12px",
    display: "inline-block",
  },
  alertSuccess: {
    padding: "12px 16px",
    background: "#f0fdf4",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "0.5rem",
    marginBottom: "1rem",
    fontSize: "0.875rem",
  },
  alertError: {
    padding: "12px 16px",
    background: "#fef2f2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    borderRadius: "0.5rem",
    marginBottom: "1rem",
    fontSize: "0.875rem",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    padding: "1rem 1.25rem",
    borderRadius: "0.75rem",
    border: "1px solid #e2e8f0",
    marginBottom: "1rem",
  },
  form: { display: "flex", flexDirection: "column", gap: "0.5rem" },
};
