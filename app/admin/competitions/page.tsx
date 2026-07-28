"use client";

import { useState, useEffect, useRef } from "react";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  getCompetitions,
  upsertCompetition,
  deleteCompetition,
  getLocalLeagues,
  upsertLocalLeague,
  deleteLocalLeague,
  CompetitionItem,
  LocalLeagueItem,
  CompetitionType,
} from "@/app/actions/competitions";
import { getAdminFormData } from "@/app/actions/admin";

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

export default function CompetitionsAdminPage() {
  const [activeTab, setActiveTab] = useState<"COMPETITIONS" | "REGIONAL_LEAGUES">("COMPETITIONS");

  // Global Competitions Data
  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  // Regional Leagues Data
  const [localLeagues, setLocalLeagues] = useState<LocalLeagueItem[]>([]);
  // Provinces & Localities
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Competition Form State
  const [compMode, setCompMode] = useState<"IDLE" | "CREATE" | "EDIT">("IDLE");
  const [compEditingId, setCompEditingId] = useState<string | null>(null);
  const [compName, setCompName] = useState("");
  const [compManualSlug, setCompManualSlug] = useState("");
  const [compType, setCompType] = useState<CompetitionType>("LEAGUE");
  const [compLevel, setCompLevel] = useState<string>("1");
  const [compParentId, setCompParentId] = useState<string>("");
  const [compFoundation, setCompFoundation] = useState<string>("");
  const [compLogoUrl, setCompLogoUrl] = useState<string>("");
  const [compLogoData, setCompLogoData] = useState<string | null>(null);
  const [compLogoFileName, setCompLogoFileName] = useState("");
  const compFileInputRef = useRef<HTMLInputElement>(null);

  // Regional League Form State
  const [leagueMode, setLeagueMode] = useState<"IDLE" | "CREATE" | "EDIT">("IDLE");
  const [leagueEditingId, setLeagueEditingId] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState("");
  const [leagueManualSlug, setLeagueManualSlug] = useState("");
  const [leagueProvinceId, setLeagueProvinceId] = useState("");
  const [leagueOrganizer, setLeagueOrganizer] = useState("");
  const [leagueFoundation, setLeagueFoundation] = useState("");
  const [leagueLogoUrl, setLeagueLogoUrl] = useState("");
  const [leagueLogoData, setLeagueLogoData] = useState<string | null>(null);
  const [leagueLogoFileName, setLeagueLogoFileName] = useState("");
  const leagueFileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  const refreshAllData = async () => {
    setLoading(true);
    const [compsData, leaguesData, adminForm] = await Promise.all([
      getCompetitions(),
      getLocalLeagues(),
      getAdminFormData(),
    ]);
    setCompetitions(compsData);
    setLocalLeagues(leaguesData);
    setProvinces(adminForm.provinces);
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    Promise.all([getCompetitions(), getLocalLeagues(), getAdminFormData()]).then(
      ([compsData, leaguesData, adminForm]) => {
        if (active) {
          setCompetitions(compsData);
          setLocalLeagues(leaguesData);
          setProvinces(adminForm.provinces);
          setLoading(false);
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  // --- Auto Slugs ---
  const compAutoSlug = slugify(compName);
  const compFinalSlug = compManualSlug.trim() || compAutoSlug;

  const leagueAutoSlug = slugify(leagueName);
  const leagueFinalSlug = leagueManualSlug.trim() || leagueAutoSlug;

  // Resets
  const resetCompForm = () => {
    setCompEditingId(null);
    setCompName("");
    setCompManualSlug("");
    setCompType("LEAGUE");
    setCompLevel("1");
    setCompParentId("");
    setCompFoundation("");
    setCompLogoUrl("");
    setCompLogoData(null);
    setCompLogoFileName("");
    setStatus({ type: "idle", msg: "" });
  };

  const resetLeagueForm = () => {
    setLeagueEditingId(null);
    setLeagueName("");
    setLeagueManualSlug("");
    setLeagueProvinceId(provinces[0]?.id || "");
    setLeagueOrganizer("");
    setLeagueFoundation("");
    setLeagueLogoUrl("");
    setLeagueLogoData(null);
    setLeagueLogoFileName("");
    setStatus({ type: "idle", msg: "" });
  };

  // Competition Handlers
  const handleEditComp = (c: CompetitionItem) => {
    resetCompForm();
    setCompEditingId(c.id);
    setCompName(c.name);
    setCompManualSlug(c.slug);
    setCompType(c.type);
    setCompLevel(c.level !== null && c.level !== undefined ? String(c.level) : "1");
    setCompParentId(c.parentId || "");
    setCompFoundation(c.foundation || "");
    setCompLogoUrl(c.logoUrl || "");
    setCompMode("EDIT");
  };

  const handleDeleteComp = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la competencia "${name}"?`)) return;
    const res = await deleteCompetition(id);
    if (res.error) alert(res.error);
    else refreshAllData();
  };

  const handleCompLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompLogoFileName(file.name);
    try {
      const webp = await imageFileToWebp256(file);
      setCompLogoData(webp);
    } catch {
      setStatus({ type: "error", msg: "Error al procesar el logo" });
    }
  };

  const handleSubmitComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) {
      setStatus({ type: "error", msg: "El nombre de la competencia es obligatorio" });
      return;
    }

    setSaving(true);
    setStatus({ type: "idle", msg: "" });

    try {
      let finalLogo = compLogoUrl;
      if (compLogoData) {
        const uploadRes = await fetch("/api/upload-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: compFinalSlug, folder: "competitions", data: compLogoData }),
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error);
        finalLogo = uploadJson.logo_url;
      }

      const res = await upsertCompetition({
        id: compMode === "EDIT" ? compEditingId : null,
        name: compName,
        slug: compFinalSlug,
        type: compType,
        level: compLevel ? parseInt(compLevel, 10) : null,
        parentId: compParentId || null,
        foundation: compFoundation || null,
        logoUrl: finalLogo || null,
      });

      if (res.error) {
        setStatus({ type: "error", msg: res.error });
      } else {
        setStatus({ type: "success", msg: "Competencia guardada exitosamente." });
        await refreshAllData();
        if (compMode === "CREATE") resetCompForm();
      }
    } catch (err: unknown) {
      const e = err as Error;
      setStatus({ type: "error", msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  // Regional League Handlers
  const handleEditLeague = (l: LocalLeagueItem) => {
    resetLeagueForm();
    setLeagueEditingId(l.id);
    setLeagueName(l.name);
    setLeagueManualSlug(l.slug);
    setLeagueProvinceId(l.provinceId);
    setLeagueOrganizer(l.organizer || "");
    setLeagueFoundation(l.foundation || "");
    setLeagueLogoUrl(l.logoUrl || "");
    setLeagueMode("EDIT");
  };

  const handleDeleteLeague = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la liga regional "${name}"?`)) return;
    const res = await deleteLocalLeague(id);
    if (res.error) alert(res.error);
    else refreshAllData();
  };

  const handleLeagueLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLeagueLogoFileName(file.name);
    try {
      const webp = await imageFileToWebp256(file);
      setLeagueLogoData(webp);
    } catch {
      setStatus({ type: "error", msg: "Error al procesar el logo" });
    }
  };

  const handleSubmitLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueName.trim() || !leagueProvinceId) {
      setStatus({ type: "error", msg: "Nombre y Provincia son obligatorios para la liga regional." });
      return;
    }

    setSaving(true);
    setStatus({ type: "idle", msg: "" });

    try {
      let finalLogo = leagueLogoUrl;
      if (leagueLogoData) {
        const uploadRes = await fetch("/api/upload-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: leagueFinalSlug, folder: "leagues", data: leagueLogoData }),
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error);
        finalLogo = uploadJson.logo_url;
      }

      const res = await upsertLocalLeague({
        id: leagueMode === "EDIT" ? leagueEditingId : null,
        name: leagueName,
        slug: leagueFinalSlug,
        provinceId: leagueProvinceId,
        organizer: leagueOrganizer || null,
        foundation: leagueFoundation || null,
        logoUrl: finalLogo || null,
      });

      if (res.error) {
        setStatus({ type: "error", msg: res.error });
      } else {
        setStatus({ type: "success", msg: "Liga regional guardada exitosamente." });
        await refreshAllData();
        if (leagueMode === "CREATE") resetLeagueForm();
      }
    } catch (err: unknown) {
      const e = err as Error;
      setStatus({ type: "error", msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  // Filtered lists
  const filteredCompetitions = competitions.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLeagues = localLeagues.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.province?.name && l.province.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={s.page}>
      <AdminNav />

      <div style={s.container}>
        <div style={s.header}>
          <h2 style={s.title}>Gestor de Torneos, Copas y Ligas</h2>
          <p style={s.subtitle}>
            Administrá competencias nacionales, internacionales, copas provinciales y ligas regionales con logos, jerarquías y fechas de fundación.
          </p>
        </div>

        {/* Guía Estructurada de Jerarquías */}
        <div style={s.guideBox}>
          <div style={s.guideTitle}>🏆 Jerarquía Oficial de Niveles para el Mapa de Fútbol</div>
          <div style={s.guideGrid}>
            <div><strong>Nivel 1:</strong> Internacional (Copa Libertadores, Copa Sudamericana)</div>
            <div><strong>Nivel 2:</strong> Primera División (Liga Profesional de Fútbol - LPF)</div>
            <div><strong>Nivel 3:</strong> Segunda División (Primera Nacional, Copa Argentina)</div>
            <div><strong>Nivel 4:</strong> Tercera División (Federal A, Primera B Metro)</div>
            <div><strong>Nivel 5:</strong> Cuarta División (Torneo Regional Federal Amateur, Primera C)</div>
            <div><strong>Nivel 6:</strong> Quinta División (Torneo Promocional Amateur)</div>
            <div><strong>Nivel 7:</strong> Sexta División (Copas Provinciales: Copa Santa Fe, Copa Entre Ríos, etc.)</div>
            <div><strong>Nivel 8:</strong> Séptima División (Ligas Regionales / Locales de cada provincia)</div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div style={s.tabsWrap}>
          <button
            onClick={() => {
              setActiveTab("COMPETITIONS");
              setCompMode("IDLE");
              setLeagueMode("IDLE");
            }}
            style={{ ...s.tabButton, ...(activeTab === "COMPETITIONS" ? s.activeTabButton : {}) }}
          >
            🏆 Torneos y Competencias ({competitions.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("REGIONAL_LEAGUES");
              setCompMode("IDLE");
              setLeagueMode("IDLE");
            }}
            style={{ ...s.tabButton, ...(activeTab === "REGIONAL_LEAGUES" ? s.activeTabButton : {}) }}
          >
            🚩 Ligas Regionales / Locales ({localLeagues.length})
          </button>
        </div>

        {/* ----------------- TAB 1: TORNEOS Y COMPETENCIAS ----------------- */}
        {activeTab === "COMPETITIONS" && (
          <>
            {compMode === "IDLE" && (
              <div style={s.section}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <input
                    style={{ ...s.input, flex: 1, fontSize: 14, padding: "10px 14px" }}
                    placeholder="Buscar competencia por nombre o slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    style={s.btnPrimary}
                    onClick={() => {
                      resetCompForm();
                      setCompMode("CREATE");
                    }}
                  >
                    + Nueva Competencia
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>Cargando torneos...</div>
                ) : filteredCompetitions.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                    No se encontraron competencias.
                  </div>
                ) : (
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={s.th}>Logo</th>
                          <th style={s.th}>Nivel</th>
                          <th style={s.th}>Nombre</th>
                          <th style={s.th}>Tipo</th>
                          <th style={s.th}>Ente / Torneo Padre</th>
                          <th style={s.th}>Fundación</th>
                          <th style={s.th}>Clubes</th>
                          <th style={{ ...s.th, textAlign: "right" }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCompetitions.map((c) => (
                          <tr key={c.id} style={s.tr}>
                            <td style={s.td}>
                              <div style={s.miniLogoBox}>
                                {c.logoUrl ? (
                                  <img
                                    src={c.logoUrl}
                                    alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                  />
                                ) : (
                                  <span style={{ fontSize: 14 }}>🏆</span>
                                )}
                              </div>
                            </td>
                            <td style={s.td}>
                              <span style={s.levelBadge}>Nivel {c.level ?? "-"}</span>
                            </td>
                            <td style={s.td}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{c.slug}</div>
                            </td>
                            <td style={s.td}>
                              <span
                                style={{
                                  ...s.typeBadge,
                                  backgroundColor:
                                    c.type === "CUP"
                                      ? "#fef3c7"
                                      : c.type === "LEAGUE"
                                      ? "#e0f2fe"
                                      : "#f3e8ff",
                                  color:
                                    c.type === "CUP"
                                      ? "#92400e"
                                      : c.type === "LEAGUE"
                                      ? "#075985"
                                      : "#6b21a8",
                                }}
                              >
                                {c.type === "CUP" ? "COPA" : c.type === "LEAGUE" ? "LIGA" : "TORNEO"}
                              </span>
                            </td>
                            <td style={s.td}>
                              {c.parent ? c.parent.name : <span style={{ color: "#94a3b8" }}>—</span>}
                            </td>
                            <td style={s.td}>{c.foundation || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                            <td style={s.td}>{c._count?.clubs ?? 0}</td>
                            <td style={{ ...s.td, textAlign: "right" }}>
                              <button onClick={() => handleEditComp(c)} style={s.btnSmall}>
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteComp(c.id, c.name)}
                                style={{ ...s.btnSmall, color: "#dc2626", borderColor: "#fca5a5" }}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Formulario Competencia */}
            {compMode !== "IDLE" && (
              <form onSubmit={handleSubmitComp} style={s.form}>
                <div style={s.formHeader}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    {compMode === "CREATE" ? "Crear Nueva Competencia" : `Editando: ${compName}`}
                  </h3>
                  <button type="button" onClick={() => setCompMode("IDLE")} style={s.btnSecondary}>
                    Volver a la lista
                  </button>
                </div>

                <section style={s.section}>
                  <h4 style={s.sectionTitle}>Información Principal</h4>
                  <div style={s.grid2}>
                    <div style={s.field}>
                      <label style={s.label}>Nombre de la Competencia *</label>
                      <input
                        style={s.input}
                        placeholder="Ej: Copa Entre Ríos, Copa Libertadores, LPF..."
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                      />
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Slug Identificador (Auto-generado)</label>
                      <div style={s.autoSlugPreview}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", fontFamily: "monospace" }}>
                          {compFinalSlug || "slug-automatico"}
                        </span>
                      </div>
                      <input
                        style={{ ...s.input, marginTop: 4, fontSize: 12, color: "#475569" }}
                        placeholder="Forzar slug personalizado (opcional)..."
                        value={compManualSlug}
                        onChange={(e) => setCompManualSlug(e.target.value)}
                      />
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Tipo de Formato</label>
                      <select
                        style={s.select}
                        value={compType}
                        onChange={(e) => setCompType(e.target.value as CompetitionType)}
                      >
                        <option value="LEAGUE">LIGA (Liga / Torneo largo o de puntos)</option>
                        <option value="CUP">COPA (Copa de eliminación directa o mixta)</option>
                        <option value="TOURNAMENT">TORNEO (Torneo corto / Zonal / Regional)</option>
                      </select>
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Nivel de Jerarquía Oficial *</label>
                      <select
                        style={s.select}
                        value={compLevel}
                        onChange={(e) => setCompLevel(e.target.value)}
                      >
                        <option value="1">1 - Internacional (Copa Libertadores, Copa Sudamericana)</option>
                        <option value="2">2 - Primera División (Liga Profesional AFA - LPF)</option>
                        <option value="3">3 - Segunda División (Primera Nacional, Copa Argentina)</option>
                        <option value="4">4 - Tercera División (Torneo Federal A, Primera B Metro)</option>
                        <option value="5">5 - Cuarta División (Torneo Regional Federal Amateur, Primera C)</option>
                        <option value="6">6 - Quinta División (Torneo Promocional Amateur)</option>
                        <option value="7">7 - Sexta División (Copas Provinciales: Copa Santa Fe, Copa Entre Ríos, etc.)</option>
                        <option value="8">8 - Séptima División (Ligas Regionales y Locales)</option>
                      </select>
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Año o Fecha de Fundación / Creación</label>
                      <input
                        style={s.input}
                        placeholder="Ej: 1960, 2017..."
                        value={compFoundation}
                        onChange={(e) => setCompFoundation(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                <section style={s.section}>
                  <h4 style={s.sectionTitle}>Ente u Organización Madre (&quot;Torneo Padre&quot;)</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={s.field}>
                      <label style={s.label}>Torneo / Ente Padre (Opcional)</label>
                      <select
                        style={s.select}
                        value={compParentId}
                        onChange={(e) => setCompParentId(e.target.value)}
                      >
                        <option value="">Sin competencia padre (Nivel Máximo / Independiente)</option>
                        {competitions
                          .filter((c) => c.id !== compEditingId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} (Nivel {c.level ?? "-"})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div style={s.infoCard}>
                      <div style={{ fontWeight: 700, color: "#1e40af", marginBottom: 4, fontSize: 13 }}>
                        ℹ️ ¿Qué es un Torneo Padre?
                      </div>
                      <div style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 1.4 }}>
                        Es la organización o torneo superior que reglamenta o da marco a esta competencia.
                        Por ejemplo, <strong>CONMEBOL</strong> es el ente padre de la <i>Copa Libertadores</i>,
                        o <strong>AFA</strong> es el ente padre de la <i>Liga Profesional</i>. En el ámbito provincial,
                        la <strong>Federación Entrerriana</strong> es el ente de la <i>Copa Entre Ríos</i>.
                      </div>
                    </div>
                  </div>
                </section>

                <section style={s.section}>
                  <h4 style={s.sectionTitle}>Logo / Trofeo Institucional</h4>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={s.badgeBox}>
                      {compLogoData ? (
                        <img src={compLogoData} alt="" style={s.badgeImg} />
                      ) : compLogoUrl ? (
                        <img
                          src={compLogoUrl}
                          alt=""
                          style={s.badgeImg}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 30 }}>🏆</span>
                      )}
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        ref={compFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleCompLogoSelect}
                      />
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          type="button"
                          style={s.btnSecondary}
                          onClick={() => compFileInputRef.current?.click()}
                        >
                          {compLogoFileName ? "Cambiar Archivo" : "Subir Logo (Imagen)"}
                        </button>
                      </div>
                      <input
                        style={{ ...s.input, fontSize: 12 }}
                        placeholder="O ingresar URL directa del logo (ej: /logos/libertadores.webp)..."
                        value={compLogoUrl}
                        onChange={(e) => setCompLogoUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {status.msg && (
                  <div style={status.type === "success" ? s.alertSuccess : s.alertError}>{status.msg}</div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" style={s.btnPrimary} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar Competencia"}
                  </button>
                  <button type="button" onClick={() => setCompMode("IDLE")} style={s.btnSecondary}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* ----------------- TAB 2: LIGAS REGIONALES Y LOCALES ----------------- */}
        {activeTab === "REGIONAL_LEAGUES" && (
          <>
            {leagueMode === "IDLE" && (
              <div style={s.section}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <input
                    style={{ ...s.input, flex: 1, fontSize: 14, padding: "10px 14px" }}
                    placeholder="Buscar liga regional por nombre, provincia o slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    style={s.btnPrimary}
                    onClick={() => {
                      resetLeagueForm();
                      setLeagueMode("CREATE");
                    }}
                  >
                    + Nueva Liga Regional
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>Cargando ligas regionales...</div>
                ) : filteredLeagues.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: "#64748b" }}>
                    No se encontraron ligas regionales.
                  </div>
                ) : (
                  <div style={s.tableWrap}>
                    <table style={s.table}>
                      <thead>
                        <tr>
                          <th style={s.th}>Logo</th>
                          <th style={s.th}>Provincia</th>
                          <th style={s.th}>Nombre de la Liga</th>
                          <th style={s.th}>Ente Organizador</th>
                          <th style={s.th}>Fundación</th>
                          <th style={s.th}>Clubes</th>
                          <th style={{ ...s.th, textAlign: "right" }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLeagues.map((l) => (
                          <tr key={l.id} style={s.tr}>
                            <td style={s.td}>
                              <div style={s.miniLogoBox}>
                                {l.logoUrl ? (
                                  <img
                                    src={l.logoUrl}
                                    alt=""
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                  />
                                ) : (
                                  <span style={{ fontSize: 14 }}>🚩</span>
                                )}
                              </div>
                            </td>
                            <td style={s.td}>
                              <span style={s.provBadge}>{l.province?.name || "S/D"}</span>
                            </td>
                            <td style={s.td}>
                              <div style={{ fontWeight: 600, color: "#0f172a" }}>{l.name}</div>
                              <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{l.slug}</div>
                            </td>
                            <td style={s.td}>{l.organizer || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                            <td style={s.td}>{l.foundation || <span style={{ color: "#94a3b8" }}>—</span>}</td>
                            <td style={s.td}>{l._count?.clubs ?? 0}</td>
                            <td style={{ ...s.td, textAlign: "right" }}>
                              <button onClick={() => handleEditLeague(l)} style={s.btnSmall}>
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteLeague(l.id, l.name)}
                                style={{ ...s.btnSmall, color: "#dc2626", borderColor: "#fca5a5" }}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Formulario Liga Regional */}
            {leagueMode !== "IDLE" && (
              <form onSubmit={handleSubmitLeague} style={s.form}>
                <div style={s.formHeader}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    {leagueMode === "CREATE" ? "Crear Nueva Liga Regional" : `Editando: ${leagueName}`}
                  </h3>
                  <button type="button" onClick={() => setLeagueMode("IDLE")} style={s.btnSecondary}>
                    Volver a la lista
                  </button>
                </div>

                <section style={s.section}>
                  <h4 style={s.sectionTitle}>Datos de la Liga Regional</h4>
                  <div style={s.grid2}>
                    <div style={s.field}>
                      <label style={s.label}>Nombre Oficial de la Liga *</label>
                      <input
                        style={s.input}
                        placeholder="Ej: Liga Santafesina de Fútbol, Liga Sanjuanina..."
                        value={leagueName}
                        onChange={(e) => setLeagueName(e.target.value)}
                      />
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Slug Identificador (Auto-generado)</label>
                      <div style={s.autoSlugPreview}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2563eb", fontFamily: "monospace" }}>
                          {leagueFinalSlug || "slug-automatico"}
                        </span>
                      </div>
                      <input
                        style={{ ...s.input, marginTop: 4, fontSize: 12, color: "#475569" }}
                        placeholder="Forzar slug personalizado (opcional)..."
                        value={leagueManualSlug}
                        onChange={(e) => setLeagueManualSlug(e.target.value)}
                      />
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Provincia de Origen *</label>
                      <select
                        style={s.select}
                        value={leagueProvinceId}
                        onChange={(e) => setLeagueProvinceId(e.target.value)}
                      >
                        {provinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Ente u Organización (Ej: AFA / Consejo Federal)</label>
                      <input
                        style={s.input}
                        placeholder="Ej: Consejo Federal de Fútbol..."
                        value={leagueOrganizer}
                        onChange={(e) => setLeagueOrganizer(e.target.value)}
                      />
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Año de Fundación</label>
                      <input
                        style={s.input}
                        placeholder="Ej: 1931..."
                        value={leagueFoundation}
                        onChange={(e) => setLeagueFoundation(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                <section style={s.section}>
                  <h4 style={s.sectionTitle}>Escudo / Logo de la Liga Regional</h4>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={s.badgeBox}>
                      {leagueLogoData ? (
                        <img src={leagueLogoData} alt="" style={s.badgeImg} />
                      ) : leagueLogoUrl ? (
                        <img
                          src={leagueLogoUrl}
                          alt=""
                          style={s.badgeImg}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 30 }}>🚩</span>
                      )}
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        ref={leagueFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleLeagueLogoSelect}
                      />
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          type="button"
                          style={s.btnSecondary}
                          onClick={() => leagueFileInputRef.current?.click()}
                        >
                          {leagueLogoFileName ? "Cambiar Archivo" : "Subir Logo (Imagen)"}
                        </button>
                      </div>
                      <input
                        style={{ ...s.input, fontSize: 12 }}
                        placeholder="O ingresar URL directa del logo (ej: /leagues/liga-santafesina.webp)..."
                        value={leagueLogoUrl}
                        onChange={(e) => setLeagueLogoUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {status.msg && (
                  <div style={status.type === "success" ? s.alertSuccess : s.alertError}>{status.msg}</div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" style={s.btnPrimary} disabled={saving}>
                    {saving ? "Guardando..." : "Guardar Liga Regional"}
                  </button>
                  <button type="button" onClick={() => setLeagueMode("IDLE")} style={s.btnSecondary}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Estilos CSS ---
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8fafc", paddingBottom: "3rem", fontFamily: "system-ui, sans-serif" },
  container: { maxWidth: 1020, margin: "0 auto", padding: "0 1rem" },
  header: { marginBottom: "1.25rem" },
  title: { fontSize: "1.5rem", fontWeight: 700, color: "#0f172a", margin: 0 },
  subtitle: { fontSize: "0.875rem", color: "#64748b", marginTop: 4 },
  guideBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "0.75rem",
    padding: "1rem 1.25rem",
    marginBottom: "1.25rem",
  },
  guideTitle: {
    fontSize: "0.875rem",
    fontWeight: 700,
    color: "#1e40af",
    marginBottom: "0.5rem",
  },
  guideGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "0.4rem 1rem",
    fontSize: "0.8rem",
    color: "#1e3a8a",
  },
  tabsWrap: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.25rem",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "0.5rem",
  },
  tabButton: {
    padding: "0.6rem 1.1rem",
    borderRadius: "0.5rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#64748b",
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  activeTabButton: {
    color: "#0f172a",
    background: "#ffffff",
    borderColor: "#0f172a",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
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
    marginBottom: 14,
    paddingBottom: 6,
    borderBottom: "1px solid #f1f5f9",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
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
  select: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: "0.5rem",
    padding: "8px 12px",
    fontSize: "0.875rem",
    color: "#0f172a",
    backgroundColor: "#ffffff",
    outline: "none",
  },
  autoSlugPreview: {
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    padding: "6px 12px",
    display: "flex",
    alignItems: "center",
  },
  infoCard: {
    background: "#f0f9ff",
    border: "1px solid #bae6fd",
    borderRadius: "0.5rem",
    padding: "10px 14px",
  },
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
  btnSmall: {
    padding: "4px 10px",
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
    borderRadius: "0.375rem",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: 500,
    marginLeft: 6,
  },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 600,
    fontSize: "0.75rem",
    textTransform: "uppercase",
  },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "10px 12px", verticalAlign: "middle" },
  miniLogoBox: {
    width: 28,
    height: 28,
    borderRadius: 4,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  levelBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#334155",
    fontSize: "0.75rem",
    fontWeight: 700,
  },
  provBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "12px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  typeBadge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "0.7rem",
    fontWeight: 700,
  },
  badgeBox: {
    width: 72,
    height: 72,
    border: "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    background: "#f8fafc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  badgeImg: { width: "100%", height: "100%", objectFit: "contain", padding: 4 },
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
  form: { display: "flex", flexDirection: "column", gap: "0.5rem" },
};
