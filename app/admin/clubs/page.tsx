"use client";

import { useState, useRef, useEffect } from "react";
import { getAdminFormData, searchFullClubsForAdmin, getClubLocation } from "@/app/actions/admin";

// --- Helpers ---
function slugify(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
  return <>{text.slice(0, idx)}<strong style={{ fontWeight: 600 }}>{text.slice(idx, idx + query.length)}</strong>{text.slice(idx + query.length)}</>;
}

async function imageFileToWebp256(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, 256, 256);
        const scale = Math.min(256 / img.width, 256 / img.height);
        const w = img.width * scale; const h = img.height * scale;
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

// --- Componente AutoField Mejorado ---
type Option = { id: string; name: string };
function AutoField({ label, valueId, options, onChange, disabled = false }: { label: string; valueId: string; options: Option[]; onChange: (id: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrap = useRef<HTMLDivElement>(null);

  const selectedName = options.find(o => o.id === valueId)?.name || "";

  useEffect(() => { setQuery(selectedName); }, [selectedName, valueId]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const matches = options.filter(o => norm(o.name).includes(norm(query))).slice(0, 10);

  return (
    <div ref={wrap} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={s.label}>{label}</label>
      <input 
        style={{ ...s.input, backgroundColor: disabled ? "#f5f5f0" : "#fff", color: disabled ? "#999" : "#111" }} 
        value={open ? query : selectedName}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(""); }}
        onFocus={() => { if(!disabled){ setQuery(""); setOpen(true); } }}
        placeholder={disabled ? "No aplica" : "Buscar..."}
        autoComplete="off" 
        disabled={disabled}
      />
      {open && !disabled && matches.length > 0 && (
        <div style={s.dropdown}>
          {matches.map((m) => (
            <div key={m.id} style={s.dropItem} onMouseDown={e => { e.preventDefault(); onChange(m.id); setOpen(false); }}>
              {m.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Página Principal ---
export default function ClubManagerPage() {
  const [mode, setMode] = useState<"IDLE" | "CREATE" | "EDIT">("IDLE");
  
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [localities, setLocalities] = useState<{id: string, name: string, provinceId: string}[]>([]);
  const [leagues, setLeagues] = useState<Option[]>([]);
  const [competitions, setCompetitions] = useState<Option[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Estado del Formulario
  const [clubId, setClubId] = useState(""); // El ID real UUID si editamos
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

  // Nuevos Estados Extras
  const [nickname, setNickname] = useState("");
  const [foundation, setFoundation] = useState("");
  const [stadiumName, setStadiumName] = useState("");
  const [stadiumCapacity, setStadiumCapacity] = useState("");
  const [history, setHistory] = useState("");
  
  // Estado de Escudo
  const [badgeUrl, setBadgeUrl] = useState("");
  const [badgePreview, setBadgePreview] = useState<string | null>(null);
  const [badgeData, setBadgeData] = useState<string | null>(null);
  const [badgeFileName, setBadgeFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState({ type: "idle", msg: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAdminFormData().then(data => {
      setProvinces(data.provinces);
      setLocalities(data.localities);
      setLeagues(data.leagues);
      setCompetitions(data.competitions);
    });
  }, []);

  // Buscador dinámico en tiempo real
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await searchFullClubsForAdmin(searchQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const filteredLocalities = localities.filter(l => l.provinceId === provinceId);

  // Slug en tiempo real
  const provName = provinces.find(p => p.id === provinceId)?.name || "";
  const leagueName = isDirectAfa ? "afa" : (leagues.find(l => l.id === leagueId)?.name || "");
  const autoSlug = buildId(provName, leagueName, name);
  const finalSlug = manualSlug.trim() || autoSlug || "provincia__liga__nombre";

  const handleCreateNew = () => {
    resetForm();
    setMode("CREATE");
  };

  const handleEdit = async (club: any) => {
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
    setSelectedComps(club.competitions.map((c: any) => c.id));
    setBadgeUrl(club.crestUrl || `/badges/${club.slug}.webp`);
    
    // 👇 Acá cargamos los datos adicionales
    setNickname(club.nickname || "");
    setFoundation(club.foundation || "");
    setStadiumName(club.stadiumName || "");
    setStadiumCapacity(club.stadiumCapacity ? String(club.stadiumCapacity) : "");
    setHistory(club.history || "");
    
    // 👇 ACÁ SOLUCIONAMOS LA LATITUD Y LONGITUD
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
    setClubId(""); setName(""); setFullName(""); setProvinceId(""); setLocalityId(""); 
    setLeagueId(""); setIsDirectAfa(false); setManualSlug(""); setSelectedComps([]); 
    setLat(""); setLng(""); setBadgeUrl(""); setBadgePreview(null); setBadgeData(null); 
    setBadgeFileName(""); setStatus({ type: "idle", msg: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBadgeFileName(file.name);
    try {
      const webpData = await imageFileToWebp256(file);
      setBadgeData(webpData); setBadgePreview(webpData);
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
      // 1. Lógica de imagen (si el usuario subió una nueva)
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

      // 2. Guardado en PostgreSQL
      const res = await fetch("/admin/upsert", {
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
          // 👇 ACÁ ESTÁN LOS CAMPOS NUEVOS AGREGADOS AL GUARDADO
          nickname,
          foundation: foundation || null, // AHORA SÍ TOMA EL TEXTO LIBRE
          stadiumName,
          stadiumCapacity: stadiumCapacity ? parseInt(stadiumCapacity) : null,
          history
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus({ type: "success", msg: `Club guardado exitosamente. Slug: ${data.slug}` });
      
      // Limpiamos si era nuevo, o mantenemos si estábamos editando
      if (mode === "CREATE") resetForm();
      
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.header}>
          <h1 style={s.title}>Gestor de Clubes</h1>
          <p style={s.subtitle}>Administrá la base de datos de PostgreSQL en tiempo real.</p>
        </div>

        {/* Buscador */}
        {mode === "IDLE" && (
          <div style={s.section}>
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <input 
                style={{ ...s.input, flex: 1, fontSize: 16, padding: "12px 14px" }} 
                placeholder="Buscar por nombre o slug..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
              <button style={s.btn} onClick={handleCreateNew}>+ Nuevo Club</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {searchResults.map(c => (
                <div key={c.id} style={s.resultItem} onClick={() => handleEdit(c)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <img 
                      src={c.crestUrl || `/badges/${c.slug}.webp`} 
                      alt="" 
                      style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 4 }}
                      onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden" }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: "#111" }}>
                        {highlight(c.fullName, searchQuery)}
                      </div>
                      <div style={{ fontSize: 13, color: "#666" }}>
                        {c.locality?.name}, {c.locality?.province?.name}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: "#999", fontFamily: "monospace" }}>{c.slug}</span>
                </div>
              ))}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#666" }}>No se encontraron clubes.</div>
              )}
            </div>
          </div>
        )}

        {/* Formulario */}
        {mode !== "IDLE" && (
          <form onSubmit={handleSubmit} style={s.form}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: 16, borderRadius: 12, border: "1px solid #e5e5e0" }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                {mode === "CREATE" ? "Creando Nuevo Club" : `Editando: ${fullName}`}
              </h2>
              <button type="button" onClick={() => setMode("IDLE")} style={s.btnSecondary}>Volver al buscador</button>
            </div>

            <section style={s.section}>
              <h2 style={s.sectionTitle}>Ubicación</h2>
              <div style={s.grid2}>
                <AutoField label="Provincia *" valueId={provinceId} options={provinces} onChange={(id) => { setProvinceId(id); setLocalityId(""); }} />
                <AutoField label="Ciudad *" valueId={localityId} options={filteredLocalities} onChange={setLocalityId} />
              </div>
            </section>

            <section style={s.section}>
              <h2 style={s.sectionTitle}>Identidad y Afiliación</h2>
              <div style={s.grid2}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={s.label}>Nombre corto *</label>
                  <input style={s.input} value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={s.label}>Nombre completo</label>
                  <input style={s.input} value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                
                <div style={{ gridColumn: "1 / -1", background: "#f9f9f9", padding: 12, borderRadius: 8, border: "1px solid #eee" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: 12 }}>
                    <input 
                      type="checkbox" 
                      checked={isDirectAfa}
                      onChange={(e) => {
                        setIsDirectAfa(e.target.checked);
                        if (e.target.checked) setLeagueId("");
                      }}
                      style={{ width: 16, height: 16 }}
                    />
                    Directamente afiliado a AFA (No juega Liga Regional)
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
              <h2 style={s.sectionTitle}>Identificador (Slug)</h2>
              <div style={s.idBox}>
                <span style={s.idLabel}>Slug Generado</span>
                <span style={s.idValue}>{finalSlug}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
                <label style={s.label}>Forzar Slug manual (opcional)</label>
                <input style={s.input} value={manualSlug} onChange={e => setManualSlug(e.target.value)} placeholder="ej: boca-juniors" />
              </div>
            </section>

            <section style={s.section}>
              <h2 style={s.sectionTitle}>Torneos / Categorías</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {competitions.map(c => (
                  <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={selectedComps.includes(c.id)}
                      onChange={() => setSelectedComps(prev => prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                      style={{ width: 16, height: 16 }}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </section>

            <section style={s.section}>
              <h2 style={s.sectionTitle}>Datos Adicionales & Estadio</h2>
              <div style={s.grid2}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={s.label}>Apodo</label>
                  <input style={s.input} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Ej: El Matador" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={s.label}>Fecha de Fundación</label>
                  {/* Le sacamos el type="number" para que puedas escribir lo que quieras */}
                  <input style={s.input} value={foundation} onChange={e => setFoundation(e.target.value)} placeholder="Ej: 12 de abril de 1912" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={s.label}>Nombre del Estadio</label>
                  <input style={s.input} value={stadiumName} onChange={e => setStadiumName(e.target.value)} placeholder="Ej: Coloso del Oeste" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={s.label}>Capacidad del Estadio</label>
                  <input style={s.input} type="number" value={stadiumCapacity} onChange={e => setStadiumCapacity(e.target.value)} placeholder="Ej: 15000" />
                </div>
              </div>
            </section>

            <section style={s.section}>
              <h2 style={s.sectionTitle}>Reseña Histórica</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <textarea 
                  style={{ ...s.input, minHeight: 120, resize: "vertical", fontFamily: "inherit" }} 
                  value={history} 
                  onChange={e => setHistory(e.target.value)} 
                  placeholder="Escribí o pegá acá la historia del club..." 
                />
              </div>
            </section>

            <section style={s.section}>
              <h2 style={s.sectionTitle}>Coordenadas PostGIS</h2>
              <div style={s.grid2}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={s.label}>Latitud *</label>
                  <input style={s.input} type="number" step="any" value={lat} onChange={e => setLat(e.target.value)} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={s.label}>Longitud *</label>
                  <input style={s.input} type="number" step="any" value={lng} onChange={e => setLng(e.target.value)} />
                </div>
              </div>
            </section>

            <section style={s.section}>
              <h2 style={s.sectionTitle}>Escudo</h2>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={s.badgeBox}>
                  {badgePreview 
                    ? <img src={badgePreview} alt="" style={s.badgeImg} />
                    : (badgeUrl ? <img src={badgeUrl} alt="" style={s.badgeImg} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <span style={{ fontSize: 30 }}>🛡</span>)
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageSelect} />
                  <button type="button" style={s.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                    {badgeFileName ? "Cambiar imagen" : "Seleccionar imagen"}
                  </button>
                  {badgeFileName && (
                    <div style={{ marginTop: 8 }}><span style={s.sizeOk}>✓ {badgeFileName} → WebP 256×256</span></div>
                  )}
                </div>
              </div>
            </section>

            {status.msg && (
              <div style={status.type === "success" ? s.alertSuccess : s.alertError}>{status.msg}</div>
            )}
            
            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? "Guardando..." : "Guardar Club"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// --- Estilos ---
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f5f5f0", padding: "2rem 1rem", fontFamily: "system-ui, sans-serif" },
  container: { maxWidth: 720, margin: "0 auto" },
  header: { marginBottom: "2rem" },
  title: { fontSize: 28, fontWeight: 600, color: "#111", margin: 0 },
  subtitle: { fontSize: 14, color: "#666", marginTop: 6 },
  section: { background: "#fff", border: "1px solid #e5e5e0", borderRadius: 12, padding: "1.5rem", marginBottom: "1rem" },
  sectionTitle: { fontSize: 12, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 16, paddingBottom: 10, borderBottom: "1px solid #f0f0eb" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  label: { fontSize: 12, fontWeight: 500, color: "#666", textTransform: "uppercase" },
  input: { width: "100%", border: "1px solid #ccc", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#111", outline: "none" },
  dropdown: { position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1px solid #ddd", borderRadius: 8, zIndex: 100, maxHeight: 240, overflowY: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
  dropItem: { padding: "10px 14px", fontSize: 14, cursor: "pointer", borderBottom: "1px solid #f5f5f0", color: "#333" },
  btn: { padding: "14px", background: "#111", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 15 },
  btnSecondary: { padding: "10px 16px", background: "#fff", color: "#333", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontWeight: 500 },
  resultItem: { padding: "12px 16px", background: "#fff", border: "1px solid #eee", borderRadius: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" },
  idBox: { background: "#f5f5f0", border: "1px solid #e5e5e0", borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 4 },
  idLabel: { fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: ".05em" },
  idValue: { fontSize: 14, fontFamily: "monospace", color: "#333", fontWeight: 500, wordBreak: "break-all" },
  badgeBox: { width: 80, height: 80, border: "1px solid #e5e5e0", borderRadius: 12, background: "#f5f5f0", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  badgeImg: { width: "100%", height: "100%", objectFit: "contain", padding: 4 },
  uploadBtn: { padding: "10px 16px", border: "1px solid #ccc", borderRadius: 8, background: "#fff", color: "#333", fontSize: 14, cursor: "pointer", fontWeight: 500 },
  sizeOk: { fontSize: 12, color: "#2a6a2a", background: "#f0faf0", border: "1px solid #80c080", borderRadius: 20, padding: "4px 12px", display: "inline-block" },
  alertSuccess: { padding: "14px", background: "#f0faf0", color: "#2a6a2a", border: "1px solid #80c080", borderRadius: 8, marginBottom: 16, fontWeight: 500 },
  alertError: { padding: "14px", background: "#fff0f0", color: "#8a2020", border: "1px solid #e08080", borderRadius: 8, marginBottom: 16, fontWeight: 500 },
  form: { display: "flex", flexDirection: "column", gap: "1rem" }
};