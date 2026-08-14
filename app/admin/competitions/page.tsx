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
  autoMergeDuplicateLocalLeagues,
  addClubTitleFromAdmin,
  setClubTitleCountFromAdmin,
  mergeDuplicateLeagues,
  getClubsByLeagueId,
  CompetitionItem,
  LocalLeagueItem,
} from "@/app/actions/competitions";
import { CompetitionType } from "@prisma/client";
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

  const [competitions, setCompetitions] = useState<CompetitionItem[]>([]);
  const [localLeagues, setLocalLeagues] = useState<LocalLeagueItem[]>([]);
  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [compMode, setCompMode] = useState<"IDLE" | "CREATE" | "EDIT">("IDLE");
  const [compEditingId, setCompEditingId] = useState<string | null>(null);
  const [compName, setCompName] = useState("");
  const [compManualSlug, setCompManualSlug] = useState("");
  const [compType, setCompType] = useState<CompetitionType>("LEAGUE");
  const [compLevel, setCompLevel] = useState<string>(""); // 🟢 Empezamos vacío por defecto
  const [compParentId, setCompParentId] = useState<string>("");
  const [compFoundation, setCompFoundation] = useState<string>("");
  const [compLogoUrl, setCompLogoUrl] = useState<string>("");
  const [compLogoData, setCompLogoData] = useState<string | null>(null);
  const [compLogoFileName, setCompLogoFileName] = useState("");
  const compFileInputRef = useRef<HTMLInputElement>(null);

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

  const [titleModalOpen, setTitleModalOpen] = useState(false);
  const [selectedLeagueForTitles, setSelectedLeagueForTitles] = useState<LocalLeagueItem | null>(null);
  const [leagueClubsForTitles, setLeagueClubsForTitles] = useState<{
    id: string;
    fullName: string;
    shortName: string | null;
    slug: string;
    crestUrl: string | null;
    locality?: { name: string; province?: { name: string } } | null;
    titles?: { id: string; name: string; count: number }[];
  }[]>([]);
  const [selectedClubForTitle, setSelectedClubForTitle] = useState("");
  const [clubSearchInModal, setClubSearchInModal] = useState("");
  const [titleNameInput, setTitleNameInput] = useState("");
  const [titleCountInput, setTitleCountInput] = useState(1);
  const [titleSaving, setTitleSaving] = useState(false);

  // Estado para la fusión manual de ligas
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [sourceLeagueToMerge, setSourceLeagueToMerge] = useState<LocalLeagueItem | null>(null);
  const [targetLeagueIdToMerge, setTargetLeagueIdToMerge] = useState("");
  const [mergeSaving, setMergeSaving] = useState(false);

  const handleOpenTitleModal = async (l: LocalLeagueItem) => {
    setSelectedLeagueForTitles(l);
    setTitleNameInput(l.name);
    setSelectedClubForTitle("");
    setClubSearchInModal("");
    setTitleCountInput(1);
    setTitleModalOpen(true);
    const clubs = await getClubsByLeagueId(l.id);
    setLeagueClubsForTitles(clubs);
  };

  const handleSelectClubInTitleModal = (clubId: string) => {
    setSelectedClubForTitle(clubId);
    const club = leagueClubsForTitles.find((c) => c.id === clubId);
    if (club && selectedLeagueForTitles) {
      const matchTitle = club.titles?.find(
        (t) => t.name.toLowerCase().trim() === selectedLeagueForTitles.name.toLowerCase().trim()
      );
      setTitleCountInput(matchTitle ? matchTitle.count : 1);
    }
  };

  const handleSaveTitle = async (mode: "SET" | "ADD" = "SET") => {
    if (!selectedClubForTitle || !titleNameInput) {
      alert("Selecciona un club e ingresa el nombre del título.");
      return;
    }
    setTitleSaving(true);
    const countToApply = mode === "SET" ? Number(titleCountInput) : 1;
    const res = await setClubTitleCountFromAdmin(
      selectedClubForTitle,
      titleNameInput,
      countToApply,
      mode
    );
    setTitleSaving(false);
    if (res.error) {
      alert(res.error);
    } else {
      // Recargar clubes de la liga para actualizar las cantidades en tiempo real
      if (selectedLeagueForTitles) {
        const updatedClubs = await getClubsByLeagueId(selectedLeagueForTitles.id);
        setLeagueClubsForTitles(updatedClubs);
      }
      refreshAllData();
    }
  };

  const handleOpenMergeModal = (l: LocalLeagueItem) => {
    setSourceLeagueToMerge(l);
    setTargetLeagueIdToMerge("");
    setMergeModalOpen(true);
  };

  const handleExecuteMerge = async () => {
    if (!sourceLeagueToMerge || !targetLeagueIdToMerge) {
      alert("Selecciona la liga destino hacia donde transferir los clubes.");
      return;
    }
    const targetLeague = localLeagues.find((l) => l.id === targetLeagueIdToMerge);
    if (!confirm(`¿Confirmas fusionar "${sourceLeagueToMerge.name}" hacia "${targetLeague?.name}"?\nTodos los clubes de "${sourceLeagueToMerge.name}" se transferirán a "${targetLeague?.name}". Sus provincias reales (localidades) se mantendrán intactas.`)) {
      return;
    }

    setMergeSaving(true);
    const res = await mergeDuplicateLeagues(targetLeagueIdToMerge, sourceLeagueToMerge.id);
    setMergeSaving(false);

    if (res.error) {
      alert(res.error);
    } else {
      alert(`🔀 ¡Fusión realizada con éxito! Los clubes ahora pertenecen a "${targetLeague?.name}".`);
      setMergeModalOpen(false);
      refreshAllData();
    }
  };

  const handleAutoMerge = async () => {
    if (!confirm("¿Deseas fusionar automáticamente todas las ligas regionales duplicadas? Los clubes se asociarán a la liga principal y los registros sobrantes se eliminarán.")) return;
    setLoading(true);
    const res = await autoMergeDuplicateLocalLeagues();
    setLoading(false);
    if (res.error) alert(res.error);
    else {
      alert(`⚡ ¡Fusionadas ${res.mergedCount} ligas duplicadas con éxito!`);
      refreshAllData();
    }
  };

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

  const compAutoSlug = slugify(compName);
  const compFinalSlug = compManualSlug.trim() || compAutoSlug;

  const leagueAutoSlug = slugify(leagueName);
  const leagueFinalSlug = leagueManualSlug.trim() || leagueAutoSlug;

  const resetCompForm = () => {
    setCompEditingId(null);
    setCompName("");
    setCompManualSlug("");
    setCompType("LEAGUE");
    setCompLevel("");
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

  const handleEditComp = (c: CompetitionItem) => {
    resetCompForm();
    setCompEditingId(c.id);
    setCompName(c.name);
    setCompManualSlug(c.slug);
    setCompType(c.type);
    setCompLevel(c.level !== null && c.level !== undefined ? String(c.level) : "");
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
        try {
          const uploadRes = await fetch("/api/upload-logo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: compFinalSlug, folder: "competitions", data: compLogoData }),
          });
          if (uploadRes.ok) {
            const uploadJson = await uploadRes.json();
            finalLogo = uploadJson.logo_url;
          }
        } catch (uploadErr) {
          console.warn("Error en subida de logo, continuando con la URL existente:", uploadErr);
        }
      }

      const res = await upsertCompetition({
        id: compMode === "EDIT" ? compEditingId : null,
        name: compName,
        slug: compFinalSlug,
        type: compType,
        // 🟢 Solo mandamos parseInt si hay valor, sino null (ideal para organizaciones)
        level: compLevel && compLevel.trim() !== "" && !isNaN(Number(compLevel)) ? parseInt(compLevel, 10) : null,
        parentId: compParentId && compParentId.trim() !== "" ? compParentId.trim() : null,
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
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "Error de conexión" });
    } finally {
      setSaving(false);
    }
  };

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

  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("");
  const [sortBy, setSortBy] = useState<"teams-desc" | "teams-asc" | "name-asc" | "name-desc" | "level-asc" | "level-desc">("level-asc");

  const filteredCompetitions = competitions.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedTypeFilter || c.type === selectedTypeFilter;
    const matchesLevel = !selectedLevelFilter || String(c.level) === selectedLevelFilter;
    return matchesSearch && matchesType && matchesLevel;
  }).sort((a, b) => {
    if (sortBy === "teams-desc") return (b._count?.clubs ?? 0) - (a._count?.clubs ?? 0);
    if (sortBy === "teams-asc") return (a._count?.clubs ?? 0) - (b._count?.clubs ?? 0);
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "level-desc") return (b.level ?? 0) - (a.level ?? 0);
    return (a.level ?? 99) - (b.level ?? 99);
  });

  const filteredLeagues = localLeagues.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.province?.name && l.province.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProv = !selectedProvinceFilter || l.provinceId === selectedProvinceFilter || l.province?.name === selectedProvinceFilter;
    return matchesSearch && matchesProv;
  }).sort((a, b) => {
    if (sortBy === "teams-desc") return (b._count?.clubs ?? 0) - (a._count?.clubs ?? 0);
    if (sortBy === "teams-asc") return (a._count?.clubs ?? 0) - (b._count?.clubs ?? 0);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    return a.name.localeCompare(b.name);
  });

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

        {activeTab === "COMPETITIONS" && (
          <>
            {compMode === "IDLE" && (
              <div style={s.section}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    style={{ ...s.input, flex: 1, minWidth: 200, fontSize: 14, padding: "10px 14px" }}
                    placeholder="Buscar competencia por nombre o slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <select
                    style={{ ...s.select, width: "auto", fontSize: 13, padding: "10px 12px" }}
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  >
                    <option value="">-- Todos los formatos --</option>
                    <option value="ORGANIZATION">Entes / Federaciones</option>
                    <option value="LEAGUE">Ligas</option>
                    <option value="CUP">Copas</option>
                    <option value="TOURNAMENT">Torneos</option>
                  </select>

                  <select
                    style={{ ...s.select, width: "auto", fontSize: 13, padding: "10px 12px" }}
                    value={selectedLevelFilter}
                    onChange={(e) => setSelectedLevelFilter(e.target.value)}
                  >
                    <option value="">-- Todos los niveles --</option>
                    <option value="1">Nivel 1 (Internacional)</option>
                    <option value="2">Nivel 2 (Primera Div - LPF)</option>
                    <option value="3">Nivel 3 (Primera Nacional)</option>
                    <option value="4">Nivel 4 (Federal A)</option>
                    <option value="5">Nivel 5 (Regional Amateur)</option>
                    <option value="6">Nivel 6 (Promocional)</option>
                    <option value="7">Nivel 7 (Copas Prov)</option>
                    <option value="8">Nivel 8 (Ligas Regionales)</option>
                  </select>

                  <select
                    style={{ ...s.select, width: "auto", fontSize: 13, padding: "10px 12px" }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="level-asc">Jerarquía (1 → 8)</option>
                    <option value="level-desc">Jerarquía (8 → 1)</option>
                    <option value="teams-desc">Más equipos primero</option>
                    <option value="teams-asc">Menos equipos primero</option>
                    <option value="name-asc">Nombre (A-Z)</option>
                    <option value="name-desc">Nombre (Z-A)</option>
                  </select>

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
                                    c.type === "ORGANIZATION"
                                      ? "#dcfce7"
                                      : c.type === "CUP"
                                      ? "#fef3c7"
                                      : c.type === "LEAGUE"
                                      ? "#e0f2fe"
                                      : "#f3e8ff",
                                  color:
                                    c.type === "ORGANIZATION"
                                      ? "#166534"
                                      : c.type === "CUP"
                                      ? "#92400e"
                                      : c.type === "LEAGUE"
                                      ? "#075985"
                                      : "#6b21a8",
                                }}
                              >
                                {c.type === "ORGANIZATION" ? "FEDERACIÓN" : c.type === "CUP" ? "COPA" : c.type === "LEAGUE" ? "LIGA" : "TORNEO"}
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

            {compMode !== "IDLE" && (
              <form onSubmit={handleSubmitComp} style={s.form}>
                <div style={s.formHeader}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                    {compMode === "CREATE" ? "Crear Nueva Competencia / Ente" : `Editando: ${compName}`}
                  </h3>
                  <button type="button" onClick={() => setCompMode("IDLE")} style={s.btnSecondary}>
                    Volver a la lista
                  </button>
                </div>

                <section style={s.section}>
                  <h4 style={s.sectionTitle}>Información Principal</h4>
                  <div style={s.grid2}>
                    <div style={s.field}>
                      <label style={s.label}>Nombre de la Competencia / Ente *</label>
                      <input
                        style={s.input}
                        placeholder="Ej: AFA, Copa Entre Ríos, LPF..."
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
                      <label style={s.label}>Tipo de Formato / Organización</label>
                      <select
                        style={s.select}
                        value={compType}
                        onChange={(e) => setCompType(e.target.value as CompetitionType)}
                      >
                        <option value="ORGANIZATION">ENTE / FEDERACIÓN (Ej: AFA, Conmebol, Consejo Federal)</option>
                        <option value="LEAGUE">LIGA (Liga / Torneo largo o de puntos)</option>
                        <option value="CUP">COPA (Copa de eliminación directa o mixta)</option>
                        <option value="TOURNAMENT">TORNEO (Torneo corto / Zonal / Regional)</option>
                      </select>
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Nivel de Jerarquía Oficial</label>
                      <select
                        style={s.select}
                        value={compLevel}
                        onChange={(e) => setCompLevel(e.target.value)}
                      >
                        <option value="">-- Sin nivel (Ideal para Entes / Federaciones) --</option>
                        <option value="1">1 - Internacional (Copa Libertadores, Copa Sudamericana)</option>
                        <option value="2">2 - Primera División (Liga Profesional AFA - LPF)</option>
                        <option value="3">3 - Segunda División (Primera Nacional, Copa Argentina)</option>
                        <option value="4">4 - Tercera División (Torneo Federal A, Primera B Metro)</option>
                        <option value="5">5 - Cuarta División (Torneo Regional Federal Amateur, Primera C)</option>
                        <option value="6">6 - Quinta División (Torneo Promocional Amateur)</option>
                        <option value="7">7 - Sexta División (Copas Provinciales: Copa Santa Fe, Copa Entre Ríos)</option>
                        <option value="8">8 - Séptima División (Ligas Regionales y Locales)</option>
                      </select>
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Año o Fecha de Fundación / Creación</label>
                      <input
                        style={s.input}
                        placeholder="Ej: 13 de marzo de 1890, 2017..."
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
                              {c.name} {c.level ? `(Nivel ${c.level})` : "(Federación)"}
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
                        Por ejemplo, podés crear la <strong>AFA</strong> como Federación (sin padre) y luego crear la <i>Liga Profesional</i> asignándole a la AFA como padre.
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
                    {saving ? "Guardando..." : "Guardar Registro"}
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
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    style={{ ...s.input, flex: 1, minWidth: 200, fontSize: 14, padding: "10px 14px" }}
                    placeholder="Buscar liga regional por nombre, provincia o slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />

                  <select
                    style={{ ...s.select, width: "auto", fontSize: 13, padding: "10px 12px" }}
                    value={selectedProvinceFilter}
                    onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                  >
                    <option value="">-- Todas las provincias --</option>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <select
                    style={{ ...s.select, width: "auto", fontSize: 13, padding: "10px 12px" }}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="name-asc">Nombre (A-Z)</option>
                    <option value="name-desc">Nombre (Z-A)</option>
                    <option value="teams-desc">Más equipos primero</option>
                    <option value="teams-asc">Menos equipos primero</option>
                  </select>

                  <button
                    style={s.btnPrimary}
                    onClick={() => {
                      resetLeagueForm();
                      setLeagueMode("CREATE");
                    }}
                  >
                    + Nueva Liga Regional
                  </button>

                  <button
                    style={{ ...s.btnSecondary, background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" }}
                    onClick={handleAutoMerge}
                    title="Busca y fusiona ligas con nombres idénticos/duplicados reasignando sus clubes"
                  >
                    ⚡ Auto-Fusionar Ligas Duplicadas
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
                              <button
                                onClick={() => handleOpenTitleModal(l)}
                                style={{ ...s.btnSmall, background: "#fef9c3", color: "#854d0e", borderColor: "#fef08a" }}
                                title="Asignar un título/campeonato directamente a un club de esta liga"
                              >
                                🏆 Títulos
                              </button>
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

        {/* Modal de Carga de Títulos */}
        {titleModalOpen && selectedLeagueForTitles && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="font-bold text-gray-900 text-base">
                  Asignar Título a un Club
                </div>
                <button
                  onClick={() => setTitleModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await handleSaveTitle("SET");
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Liga / Torneo
                  </label>
                  <input
                    type="text"
                    readOnly
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 font-semibold"
                    value={selectedLeagueForTitles.name}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Seleccionar Club Campeón *
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar club por nombre..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={clubSearchInModal}
                    onChange={(e) => setClubSearchInModal(e.target.value)}
                  />
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 bg-gray-50 p-1">
                    {leagueClubsForTitles.length === 0 ? (
                      <div className="p-3 text-xs text-center text-gray-400">Cargando clubes de la liga...</div>
                    ) : (
                      leagueClubsForTitles
                        .filter((c) => {
                          const q = clubSearchInModal.toLowerCase();
                          return (
                            !q ||
                            c.fullName.toLowerCase().includes(q) ||
                            (c.shortName && c.shortName.toLowerCase().includes(q))
                          );
                        })
                        .map((c) => {
                          const isSelected = selectedClubForTitle === c.id;
                          const titleMatch = c.titles?.find(
                            (t) => t.name.toLowerCase().trim() === selectedLeagueForTitles.name.toLowerCase().trim()
                          );
                          const titleCount = titleMatch ? titleMatch.count : 0;

                          return (
                            <div
                              key={c.id}
                              onClick={() => handleSelectClubInTitleModal(c.id)}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white font-bold shadow-sm"
                                  : "hover:bg-white text-gray-900 font-medium"
                              }`}
                            >
                              <img
                                src={c.crestUrl || `/badges/${c.slug}.webp`}
                                alt=""
                                className="w-8 h-8 object-contain shrink-0 bg-white rounded-full p-0.5"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.visibility = "hidden";
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs truncate font-semibold">{c.fullName}</div>
                                {c.shortName && c.shortName !== c.fullName && (
                                  <div className={`text-[10px] truncate ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
                                    {c.shortName}
                                  </div>
                                )}
                              </div>

                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded ${
                                  isSelected ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {titleCount} títulos
                              </span>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Cantidad de Títulos
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={titleCountInput}
                    onChange={(e) => setTitleCountInput(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={titleSaving}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-sm"
                  >
                    {titleSaving ? "Guardando..." : "Guardar Título en el Club"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTitleModalOpen(false)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
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
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#cbd5e1",
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