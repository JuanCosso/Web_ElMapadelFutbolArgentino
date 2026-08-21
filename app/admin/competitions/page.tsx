"use client";

import React, { useState, useEffect, useRef } from "react";
import { AdminLayout, useAdminTheme } from "@/components/admin/AdminLayout";
import {
  getCompetitions,
  upsertCompetition,
  deleteCompetition,
  getLocalLeagues,
  upsertLocalLeague,
  deleteLocalLeague,
  setClubTitleCountFromAdmin,
  getClubsByLeagueId,
  getClubsByCompetitionId,
  addClubToCompetition,
  removeClubFromCompetition,
  addClubToLocalLeague,
  removeClubFromLocalLeague,
  searchClubsForSelection,
  getCompetitionChampions,
  deleteTitleById,
  CompetitionItem,
  LocalLeagueItem,
} from "@/app/actions/competitions";
import { CompetitionType } from "@prisma/client";
import { getAdminFormData } from "@/app/actions/admin";
import {
  Trophy,
  Users,
  Award,
  Edit3,
  Trash2,
  Search,
  Globe,
  Calendar,
  X,
  Upload,
} from "lucide-react";

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normSearch(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
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
  const theme = useAdminTheme();

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
  const [compLevel, setCompLevel] = useState<string>("");
  const [compParentId, setCompParentId] = useState<string>("");
  const [compFoundation, setCompFoundation] = useState<string>("");
  const [compLogoUrl, setCompLogoUrl] = useState<string>("");
  const [compLogoData, setCompLogoData] = useState<string | null>(null);
  const compLogoFileRef = useRef<HTMLInputElement>(null);

  const [leagueMode, setLeagueMode] = useState<"IDLE" | "CREATE" | "EDIT">("IDLE");
  const [leagueEditingId, setLeagueEditingId] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState("");
  const [leagueManualSlug, setLeagueManualSlug] = useState("");
  const [leagueProvinceId, setLeagueProvinceId] = useState("");
  const [leagueOrganizer, setLeagueOrganizer] = useState("");
  const [leagueFoundation, setLeagueFoundation] = useState("");
  const [leagueLogoUrl, setLeagueLogoUrl] = useState("");
  const [leagueLogoData, setLeagueLogoData] = useState<string | null>(null);
  const leagueLogoFileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  // Modal Palmarés / Campeones
  const [championsModalOpen, setChampionsModalOpen] = useState(false);
  const [championsTargetName, setChampionsTargetName] = useState("");
  const [championsList, setChampionsList] = useState<{
    titleId: string;
    clubId: string;
    clubSlug: string;
    clubName: string;
    clubFullName: string;
    crestUrl: string;
    titleName: string;
    count: number;
    locality?: { name: string; province?: { name: string } } | null;
  }[]>([]);
  const [championsLoading, setChampionsLoading] = useState(false);
  const [champSearchQuery, setChampSearchQuery] = useState("");
  const [champSearchResults, setChampSearchResults] = useState<any[]>([]);
  const [selectedClubForChamp, setSelectedClubForChamp] = useState<any | null>(null);
  const [champTitleCount, setChampTitleCount] = useState(1);
  const [champSaving, setChampSaving] = useState(false);

  // Modal Gestión de Equipos
  const [teamsModalOpen, setTeamsModalOpen] = useState(false);
  const [teamsTarget, setTeamsTarget] = useState<{
    type: "COMPETITION" | "REGIONAL_LEAGUE";
    item: CompetitionItem | LocalLeagueItem;
  } | null>(null);
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamSearchResults, setTeamSearchResults] = useState<any[]>([]);
  const [teamSearchLoading, setTeamSearchLoading] = useState(false);
  const [teamActionId, setTeamActionId] = useState<string | null>(null);

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
    refreshAllData();
  }, []);

  // Modal Campeones / Palmarés
  const handleOpenChampionsModal = async (name: string) => {
    setChampionsTargetName(name);
    setChampSearchQuery("");
    setChampSearchResults([]);
    setSelectedClubForChamp(null);
    setChampTitleCount(1);
    setChampionsModalOpen(true);
    setChampionsLoading(true);

    const champs = await getCompetitionChampions(name);
    setChampionsList(champs);
    setChampionsLoading(false);
  };

  const handleReloadChampionsList = async () => {
    if (!championsTargetName) return;
    setChampionsLoading(true);
    const champs = await getCompetitionChampions(championsTargetName);
    setChampionsList(champs);
    setChampionsLoading(false);
    refreshAllData();
  };

  useEffect(() => {
    if (champSearchQuery.trim().length < 2) {
      setChampSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      const results = await searchClubsForSelection(champSearchQuery);
      setChampSearchResults(results);
    }, 300);
    return () => clearTimeout(delay);
  }, [champSearchQuery]);

  const handleSaveChampionTitle = async () => {
    if (!selectedClubForChamp || !championsTargetName) {
      alert("Seleccioná un club para registrar el título.");
      return;
    }
    setChampSaving(true);
    const res = await setClubTitleCountFromAdmin(
      selectedClubForChamp.id,
      championsTargetName,
      champTitleCount,
      "SET"
    );
    setChampSaving(false);
    if (res.error) alert(res.error);
    else {
      setSelectedClubForChamp(null);
      setChampSearchQuery("");
      await handleReloadChampionsList();
    }
  };

  const handleDeleteChampionTitle = async (titleId: string) => {
    if (!confirm("¿Eliminar este registro de título para este club?")) return;
    const res = await deleteTitleById(titleId);
    if (res.error) alert(res.error);
    else await handleReloadChampionsList();
  };

  // Modal Gestión de Equipos
  const handleOpenTeamsModal = async (
    type: "COMPETITION" | "REGIONAL_LEAGUE",
    item: CompetitionItem | LocalLeagueItem
  ) => {
    setTeamsTarget({ type, item });
    setTeamSearchQuery("");
    setTeamSearchResults([]);
    setTeamsModalOpen(true);
    setTeamsLoading(true);

    if (type === "COMPETITION") {
      const clubs = await getClubsByCompetitionId(item.id);
      setTeamsList(clubs);
    } else {
      const clubs = await getClubsByLeagueId(item.id);
      setTeamsList(clubs);
    }
    setTeamsLoading(false);
  };

  const handleReloadTeamsList = async () => {
    if (!teamsTarget) return;
    setTeamsLoading(true);
    if (teamsTarget.type === "COMPETITION") {
      const clubs = await getClubsByCompetitionId(teamsTarget.item.id);
      setTeamsList(clubs);
    } else {
      const clubs = await getClubsByLeagueId(teamsTarget.item.id);
      setTeamsList(clubs);
    }
    setTeamsLoading(false);
    refreshAllData();
  };

  useEffect(() => {
    if (teamSearchQuery.trim().length < 2) {
      setTeamSearchResults([]);
      return;
    }
    setTeamSearchLoading(true);
    const delay = setTimeout(async () => {
      const results = await searchClubsForSelection(teamSearchQuery);
      setTeamSearchResults(results);
      setTeamSearchLoading(false);
    }, 300);
    return () => clearTimeout(delay);
  }, [teamSearchQuery]);

  const handleAddTeamToTarget = async (clubId: string) => {
    if (!teamsTarget) return;
    setTeamActionId(clubId);
    let res;
    if (teamsTarget.type === "COMPETITION") {
      res = await addClubToCompetition(teamsTarget.item.id, clubId);
    } else {
      res = await addClubToLocalLeague(teamsTarget.item.id, clubId);
    }
    setTeamActionId(null);
    if (res.error) alert(res.error);
    else await handleReloadTeamsList();
  };

  const handleRemoveTeamFromTarget = async (clubId: string) => {
    if (!teamsTarget) return;
    setTeamActionId(clubId);
    let res;
    if (teamsTarget.type === "COMPETITION") {
      res = await removeClubFromCompetition(teamsTarget.item.id, clubId);
    } else {
      res = await removeClubFromLocalLeague(clubId);
    }
    setTeamActionId(null);
    if (res.error) alert(res.error);
    else await handleReloadTeamsList();
  };

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

  async function handleCompLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webpData = await imageFileToWebp256(file);
      setCompLogoData(webpData);
    } catch {
      setStatus({ type: "error", msg: "No se pudo procesar la imagen del logo" });
    }
  }

  async function handleLeagueLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const webpData = await imageFileToWebp256(file);
      setLeagueLogoData(webpData);
    } catch {
      setStatus({ type: "error", msg: "No se pudo procesar la imagen del logo" });
    }
  }

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
        if (uploadRes.ok) {
          const uploadJson = await uploadRes.json();
          finalLogo = uploadJson.logo_url;
        }
      }

      const res = await upsertCompetition({
        id: compMode === "EDIT" ? compEditingId : null,
        name: compName,
        slug: compFinalSlug,
        type: compType,
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
        setCompMode("IDLE");
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "Error al guardar" });
    } finally {
      setSaving(false);
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
        setLeagueMode("IDLE");
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setSaving(false);
    }
  };

  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("");
  const [selectedLevelFilter, setSelectedLevelFilter] = useState("");

  const qNorm = normSearch(searchQuery);

  const filteredCompetitions = competitions
    .filter((c) => {
      const matchesSearch = normSearch(c.name).includes(qNorm) || normSearch(c.slug).includes(qNorm);
      const matchesType = !selectedTypeFilter || c.type === selectedTypeFilter;
      const matchesLevel = !selectedLevelFilter || String(c.level) === selectedLevelFilter;
      return matchesSearch && matchesType && matchesLevel;
    })
    .sort((a, b) => (a.level ?? 99) - (b.level ?? 99));

  const filteredLeagues = localLeagues
    .filter((l) => {
      const matchesSearch =
        normSearch(l.name).includes(qNorm) ||
        normSearch(l.slug).includes(qNorm) ||
        (l.province?.name && normSearch(l.province.name).includes(qNorm));
      const matchesProv =
        !selectedProvinceFilter || l.provinceId === selectedProvinceFilter || l.province?.name === selectedProvinceFilter;
      return matchesSearch && matchesProv;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleCreateNewClick = () => {
    if (activeTab === "COMPETITIONS") {
      resetCompForm();
      setCompMode("CREATE");
    } else {
      resetLeagueForm();
      setLeagueMode("CREATE");
    }
  };

  return (
    <AdminLayout
      title="Gestión de Competencias"
      subtitle="Administrá ligas, copas y torneos regionales."
      onPrimaryAction={handleCreateNewClick}
      primaryActionLabel={activeTab === "COMPETITIONS" ? "Nueva Competencia" : "Nueva Liga Regional"}
    >
      {/* Navegación de Pestañas - Estilos explícitos para evitar conflictos shorthand/longhand */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: "1.25rem",
          borderBottomWidth: 1,
          borderBottomStyle: "solid",
          borderBottomColor: theme.borderCol,
          paddingBottom: 8,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab("COMPETITIONS");
            setCompMode("IDLE");
            setLeagueMode("IDLE");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === "COMPETITIONS" ? theme.textPrimary : theme.textMuted,
            backgroundColor: activeTab === "COMPETITIONS" ? theme.bgCard : theme.bgInput,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: activeTab === "COMPETITIONS" ? "#2563eb" : theme.borderCol,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Trophy size={16} /> Torneos y Competencias ({competitions.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("REGIONAL_LEAGUES");
            setCompMode("IDLE");
            setLeagueMode("IDLE");
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            color: activeTab === "REGIONAL_LEAGUES" ? theme.textPrimary : theme.textMuted,
            backgroundColor: activeTab === "REGIONAL_LEAGUES" ? theme.bgCard : theme.bgInput,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: activeTab === "REGIONAL_LEAGUES" ? "#2563eb" : theme.borderCol,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Globe size={16} /> Ligas Regionales ({localLeagues.length})
        </button>
      </div>

      {/* Pestaña: Torneos y Competencias Nacionales */}
      {activeTab === "COMPETITIONS" && (
        <>
          {compMode === "IDLE" && (
            <div>
              {/* Filtros Card */}
              <div
                style={{
                  backgroundColor: theme.bgCard,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: theme.borderCol,
                  padding: "1.25rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 2, minWidth: 240 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Buscar Competencia
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
                      <Search size={16} style={{ color: theme.textMuted }} />
                      <input
                        style={{ width: "100%", border: "none", outline: "none", fontSize: 14, color: theme.textPrimary, backgroundColor: "transparent" }}
                        placeholder="Buscar por nombre o slug..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 160 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Formato
                    </label>
                    <select
                      style={{
                        width: "100%",
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: theme.borderCol,
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontSize: 14,
                        color: theme.textPrimary,
                        backgroundColor: theme.bgInput,
                        outline: "none",
                      }}
                      value={selectedTypeFilter}
                      onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    >
                      <option value="" style={{ backgroundColor: theme.bgCard }}>Todos los formatos</option>
                      <option value="LEAGUE" style={{ backgroundColor: theme.bgCard }}>Liga</option>
                      <option value="CUP" style={{ backgroundColor: theme.bgCard }}>Copa</option>
                      <option value="TOURNAMENT" style={{ backgroundColor: theme.bgCard }}>Torneo</option>
                      <option value="ORGANIZATION" style={{ backgroundColor: theme.bgCard }}>Federación / Ente</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 160 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Jerarquía / Nivel
                    </label>
                    <select
                      style={{
                        width: "100%",
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: theme.borderCol,
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontSize: 14,
                        color: theme.textPrimary,
                        backgroundColor: theme.bgInput,
                        outline: "none",
                      }}
                      value={selectedLevelFilter}
                      onChange={(e) => setSelectedLevelFilter(e.target.value)}
                    >
                      <option value="" style={{ backgroundColor: theme.bgCard }}>Todos los niveles</option>
                      <option value="1" style={{ backgroundColor: theme.bgCard }}>Nivel 1 (Internacional)</option>
                      <option value="2" style={{ backgroundColor: theme.bgCard }}>Nivel 2 (Primera Div - LPF)</option>
                      <option value="3" style={{ backgroundColor: theme.bgCard }}>Nivel 3 (Primera Nacional)</option>
                      <option value="4" style={{ backgroundColor: theme.bgCard }}>Nivel 4 (Federal A / B Metro)</option>
                      <option value="5" style={{ backgroundColor: theme.bgCard }}>Nivel 5 (Regional Amateur)</option>
                      <option value="6" style={{ backgroundColor: theme.bgCard }}>Nivel 6 (Promocional)</option>
                      <option value="7" style={{ backgroundColor: theme.bgCard }}>Nivel 7 (Copas Prov)</option>
                      <option value="8" style={{ backgroundColor: theme.bgCard }}>Nivel 8 (Ligas Regionales)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de Filas de Tarjeta */}
              {loading ? (
                <div style={{ padding: "3rem", textAlign: "center", backgroundColor: theme.bgCard, borderRadius: 14, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, color: theme.textMuted }}>
                  Cargando competencias...
                </div>
              ) : filteredCompetitions.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", backgroundColor: theme.bgCard, borderRadius: 14, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, color: theme.textMuted }}>
                  No se encontraron competencias.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredCompetitions.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: theme.bgCard,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: theme.borderCol,
                        padding: "1rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                        boxShadow: theme.darkMode ? "0 2px 5px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260, flex: 2 }}>
                        {/* Logo directo sin contenedor circular */}
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt="" style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }} />
                        ) : (
                          <Trophy size={28} style={{ color: "#2563eb", flexShrink: 0 }} />
                        )}

                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary, lineHeight: 1.25 }}>
                            {c.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            {c.level && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", backgroundColor: theme.darkMode ? "#1e3a8a" : "#eff6ff", borderRadius: 12, padding: "2px 8px" }}>
                                Nivel {c.level}
                              </span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, backgroundColor: theme.darkMode ? "#334155" : "#f1f5f9", borderRadius: 12, padding: "2px 8px" }}>
                              {c.type === "ORGANIZATION" ? "Federación" : c.type === "CUP" ? "Copa Nacional" : "Liga"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Columnas Metadatos (Alcance, Fundación, Clubes) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 24, flex: 1, justifyContent: "space-around", minWidth: 260 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Alcance</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: 5 }}>
                            <Globe size={13} style={{ color: theme.textMuted }} />
                            {c.level && c.level <= 3 ? "Nacional" : "Regional"}
                          </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fundación</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: 5 }}>
                            <Calendar size={13} style={{ color: theme.textMuted }} />
                            {c.foundation || "—"}
                          </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Clubes</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: 5 }}>
                            <Users size={13} style={{ color: "#2563eb" }} />
                            <strong style={{ color: theme.textPrimary }}>{c._count?.clubs ?? 0}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Botones de Acción Rápida (Iconos) */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenTeamsModal("COMPETITION", c)}
                          style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          title="Gestionar equipos participantes"
                        >
                          <Users size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenChampionsModal(c.name)}
                          style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          title="Gestionar palmarés y campeones históricos"
                        >
                          <Award size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditComp(c)}
                          style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          title="Editar competencia"
                        >
                          <Edit3 size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteComp(c.id, c.name)}
                          style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          title="Eliminar competencia"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Formulario Crear / Editar Competencia */}
          {compMode !== "IDLE" && (
            <form
              onSubmit={handleSubmitComp}
              style={{
                backgroundColor: theme.bgCard,
                borderRadius: 16,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: theme.borderCol,
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: theme.borderCol }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: theme.textPrimary, margin: 0 }}>
                  {compMode === "CREATE" ? "Crear Nueva Competencia" : `Editando: ${compName}`}
                </h3>
                <button type="button" onClick={() => setCompMode("IDLE")} style={{ padding: "8px 14px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre de la Competencia / Ente *</label>
                  <input style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }} placeholder="Ej: Liga Profesional de Fútbol, Copa Argentina" value={compName} onChange={(e) => setCompName(e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Slug (Auto-generado)</label>
                  <input style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }} placeholder={compAutoSlug} value={compManualSlug} onChange={(e) => setCompManualSlug(e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Formato / Organización</label>
                  <select style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }} value={compType} onChange={(e) => setCompType(e.target.value as CompetitionType)}>
                    <option value="LEAGUE" style={{ backgroundColor: theme.bgCard }}>LIGA (Liga / Torneo largo o de puntos)</option>
                    <option value="CUP" style={{ backgroundColor: theme.bgCard }}>COPA (Copa de eliminación directa)</option>
                    <option value="TOURNAMENT" style={{ backgroundColor: theme.bgCard }}>TORNEO (Torneo zonal / regional)</option>
                    <option value="ORGANIZATION" style={{ backgroundColor: theme.bgCard }}>FEDERACIÓN / ENTE (Ej: AFA, Conmebol)</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nivel de Jerarquía Oficial</label>
                  <select style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }} value={compLevel} onChange={(e) => setCompLevel(e.target.value)}>
                    <option value="" style={{ backgroundColor: theme.bgCard }}>Sin nivel (Ideal para Federaciones)</option>
                    <option value="1" style={{ backgroundColor: theme.bgCard }}>1 - Internacional (Copa Libertadores)</option>
                    <option value="2" style={{ backgroundColor: theme.bgCard }}>2 - Primera División (Liga Profesional AFA)</option>
                    <option value="3" style={{ backgroundColor: theme.bgCard }}>3 - Segunda División (Primera Nacional)</option>
                    <option value="4" style={{ backgroundColor: theme.bgCard }}>4 - Tercera División (Federal A / B Metro)</option>
                    <option value="5" style={{ backgroundColor: theme.bgCard }}>5 - Cuarta División (Regional Amateur)</option>
                    <option value="6" style={{ backgroundColor: theme.bgCard }}>6 - Quinta División (Promocional)</option>
                    <option value="7" style={{ backgroundColor: theme.bgCard }}>7 - Copas Provinciales</option>
                    <option value="8" style={{ backgroundColor: theme.bgCard }}>8 - Ligas Regionales y Locales</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Año de Fundación</label>
                  <input style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }} placeholder="Ej: 1891" value={compFoundation} onChange={(e) => setCompFoundation(e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Logo o Trofeo Oficial</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="file"
                      ref={compLogoFileRef}
                      accept="image/*"
                      onChange={handleCompLogoSelect}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => compLogoFileRef.current?.click()}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}
                    >
                      <Upload size={15} />
                      <span>Seleccionar logo de la PC</span>
                    </button>
                    {compLogoUrl && <span style={{ fontSize: 12, color: theme.textMuted }}>✓ Imagen asignada</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setCompMode("IDLE")} style={{ padding: "9px 18px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                  {saving ? "Guardando..." : "Guardar Competencia"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Pestaña: Ligas Regionales */}
      {activeTab === "REGIONAL_LEAGUES" && (
        <>
          {leagueMode === "IDLE" && (
            <div>
              <div
                style={{
                  backgroundColor: theme.bgCard,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: theme.borderCol,
                  padding: "1.25rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 2, minWidth: 240 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Buscar Liga Regional</label>
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
                      <Search size={16} style={{ color: theme.textMuted }} />
                      <input
                        style={{ width: "100%", border: "none", outline: "none", fontSize: 14, color: theme.textPrimary, backgroundColor: "transparent" }}
                        placeholder="Buscar por nombre, slug o provincia..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 180 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Provincia</label>
                    <select
                      style={{
                        width: "100%",
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: theme.borderCol,
                        borderRadius: 10,
                        padding: "8px 12px",
                        fontSize: 14,
                        color: theme.textPrimary,
                        backgroundColor: theme.bgInput,
                        outline: "none",
                      }}
                      value={selectedProvinceFilter}
                      onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                    >
                      <option value="" style={{ backgroundColor: theme.bgCard }}>Todas las provincias</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id} style={{ backgroundColor: theme.bgCard }}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "3rem", textAlign: "center", backgroundColor: theme.bgCard, borderRadius: 14, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, color: theme.textMuted }}>
                  Cargando ligas regionales...
                </div>
              ) : filteredLeagues.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", backgroundColor: theme.bgCard, borderRadius: 14, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, color: theme.textMuted }}>
                  No se encontraron ligas regionales.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredLeagues.map((l) => (
                    <div
                      key={l.id}
                      style={{
                        backgroundColor: theme.bgCard,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: theme.borderCol,
                        padding: "1rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                        boxShadow: theme.darkMode ? "0 2px 5px rgba(0,0,0,0.3)" : "0 1px 3px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 260, flex: 2 }}>
                        {/* Logo directo sin contenedor circular */}
                        {l.logoUrl ? (
                          <img src={l.logoUrl} alt="" style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }} />
                        ) : (
                          <Globe size={28} style={{ color: "#2563eb", flexShrink: 0 }} />
                        )}

                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary, lineHeight: 1.25 }}>
                            {l.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#166534", backgroundColor: theme.darkMode ? "#14532d" : "#dcfce7", borderRadius: 12, padding: "2px 8px" }}>
                              {l.province?.name || "Provincia"}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: theme.textMuted, backgroundColor: theme.darkMode ? "#334155" : "#f1f5f9", borderRadius: 12, padding: "2px 8px" }}>
                              Liga Regional
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 24, flex: 1, justifyContent: "space-around", minWidth: 260 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Organizador</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{l.organizer || "—"}</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fundación</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary }}>{l.foundation || "—"}</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Clubes</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: theme.textPrimary, display: "flex", alignItems: "center", gap: 5 }}>
                            <Users size={13} style={{ color: "#2563eb" }} />
                            <strong style={{ color: theme.textPrimary }}>{l._count?.clubs ?? 0}</strong>
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleOpenTeamsModal("REGIONAL_LEAGUE", l)}
                          style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          title="Gestionar clubes inscritos"
                        >
                          <Users size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenChampionsModal(l.name)}
                          style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          title="Gestionar palmarés y campeones de la liga"
                        >
                          <Award size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditLeague(l)}
                          style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          title="Editar liga regional"
                        >
                          <Edit3 size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLeague(l.id, l.name)}
                          style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                          title="Eliminar liga"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Formulario Crear / Editar Liga Regional */}
          {leagueMode !== "IDLE" && (
            <form
              onSubmit={handleSubmitLeague}
              style={{
                backgroundColor: theme.bgCard,
                borderRadius: 16,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: theme.borderCol,
                padding: "1.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: theme.borderCol }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: theme.textPrimary, margin: 0 }}>
                  {leagueMode === "CREATE" ? "Crear Nueva Liga Regional" : `Editando: ${leagueName}`}
                </h3>
                <button type="button" onClick={() => setLeagueMode("IDLE")} style={{ padding: "8px 14px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre de la Liga Regional *</label>
                  <input style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }} placeholder="Ej: Liga Santafesina de Fútbol" value={leagueName} onChange={(e) => setLeagueName(e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Provincia *</label>
                  <select style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }} value={leagueProvinceId} onChange={(e) => setLeagueProvinceId(e.target.value)}>
                    {provinces.map((p) => (
                      <option key={p.id} value={p.id} style={{ backgroundColor: theme.bgCard }}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Organizador / Ente Madre</label>
                  <input style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }} placeholder="Ej: Consejo Federal AFA" value={leagueOrganizer} onChange={(e) => setLeagueOrganizer(e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha de Fundación</label>
                  <input style={{ width: "100%", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 8, padding: "9px 12px", fontSize: 14, color: theme.textPrimary, backgroundColor: theme.bgInput, outline: "none" }} placeholder="Ej: 1 de julio de 1931" value={leagueFoundation} onChange={(e) => setLeagueFoundation(e.target.value)} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Logo Oficial de la Liga</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="file"
                      ref={leagueLogoFileRef}
                      accept="image/*"
                      onChange={handleLeagueLogoSelect}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      onClick={() => leagueLogoFileRef.current?.click()}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}
                    >
                      <Upload size={15} />
                      <span>Seleccionar logo de la PC</span>
                    </button>
                    {leagueLogoUrl && <span style={{ fontSize: 12, color: theme.textMuted }}>✓ Imagen asignada</span>}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setLeagueMode("IDLE")} style={{ padding: "9px 18px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                  {saving ? "Guardando..." : "Guardar Liga Regional"}
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* Modal 1: Gestión de Equipos Participantes */}
      {teamsModalOpen && teamsTarget && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ width: "100%", maxWidth: 640, backgroundColor: theme.bgCard, borderRadius: 16, padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: theme.borderCol }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: theme.textPrimary }}>
                  Gestión de Equipos Participantes
                </h3>
                <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                  {teamsTarget.type === "COMPETITION" ? "Competencia" : "Liga Regional"}:{" "}
                  <strong style={{ color: theme.textPrimary }}>{teamsTarget.item.name}</strong>{" "}
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1e40af", backgroundColor: theme.darkMode ? "#1e3a8a" : "#eff6ff", borderRadius: 12, padding: "2px 8px" }}>
                    ({teamsList.length} equipos)
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => setTeamsModalOpen(false)} style={{ border: "none", background: "transparent", color: theme.textMuted, cursor: "pointer", padding: 4, display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            {/* Buscador para Añadir Clubes */}
            <div style={{ backgroundColor: theme.bgInput, padding: 14, borderRadius: 10, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary, marginBottom: 6, display: "block" }}>
                Añadir Club a &quot;{teamsTarget.item.name}&quot;
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: theme.bgCard, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 10, padding: "8px 12px" }}>
                <Search size={16} style={{ color: theme.textMuted }} />
                <input
                  style={{ width: "100%", border: "none", outline: "none", fontSize: 14, color: theme.textPrimary, backgroundColor: "transparent" }}
                  placeholder="Buscar club por nombre, apodo o ciudad para agregar..."
                  value={teamSearchQuery}
                  onChange={(e) => setTeamSearchQuery(e.target.value)}
                />
              </div>

              {teamSearchLoading && <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>Buscando candidatos...</div>}

              {teamSearchResults.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                  {teamSearchResults.map((club) => {
                    const isAlreadyAdded = teamsList.some((t) => t.id === club.id);
                    return (
                      <div key={club.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", backgroundColor: theme.bgCard, borderRadius: 6, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, fontSize: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img
                            src={club.crestUrl || `/badges/${club.slug}.webp`}
                            alt=""
                            style={{ width: 24, height: 24, objectFit: "contain" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.visibility = "hidden";
                            }}
                          />
                          <div>
                            <span style={{ fontWeight: 600, color: theme.textPrimary }}>{club.fullName}</span>
                            <span style={{ fontSize: 11, color: theme.textMuted, marginLeft: 6 }}>
                              ({club.locality?.name}, {club.locality?.province?.name})
                            </span>
                          </div>
                        </div>

                        {isAlreadyAdded ? (
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#166534", backgroundColor: theme.darkMode ? "#14532d" : "#dcfce7", padding: "2px 8px", borderRadius: 4 }}>
                            ✓ Añadido
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={teamActionId === club.id}
                            onClick={() => handleAddTeamToTarget(club.id)}
                            style={{ padding: "4px 10px", borderRadius: 6, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}
                          >
                            {teamActionId === club.id ? "Añadiendo..." : "+ Añadir"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lista de Equipos Actuales */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Nómina de Equipos Inscritos ({teamsList.length})
              </h4>

              {teamsLoading ? (
                <div style={{ padding: 20, textAlign: "center", color: theme.textMuted, fontSize: 13, backgroundColor: theme.bgInput, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: theme.borderCol }}>
                  Cargando equipos...
                </div>
              ) : teamsList.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: theme.textMuted, fontSize: 13, backgroundColor: theme.bgInput, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: theme.borderCol }}>
                  No hay equipos inscritos aún. Usá el buscador de arriba para añadir los primeros.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 260, overflowY: "auto" }}>
                  {teamsList.map((club) => (
                    <div key={club.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: theme.bgCard, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, fontSize: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img
                          src={club.crestUrl || `/badges/${club.slug}.webp`}
                          alt=""
                          style={{ width: 28, height: 28, objectFit: "contain" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.visibility = "hidden";
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: theme.textPrimary }}>{club.fullName}</div>
                          <div style={{ fontSize: 11, color: theme.textMuted }}>
                            {club.locality?.name}, {club.locality?.province?.name}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={teamActionId === club.id}
                        onClick={() => handleRemoveTeamFromTarget(club.id)}
                        style={{ backgroundColor: "#fef2f2", color: "#dc2626", borderWidth: 1, borderStyle: "solid", borderColor: "#fca5a5", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        {teamActionId === club.id ? "Quitando..." : "Quitar"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" onClick={() => setTeamsModalOpen(false)} style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, cursor: "pointer" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Palmarés / Historial de Campeones */}
      {championsModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "1rem" }}>
          <div style={{ width: "100%", maxWidth: 640, backgroundColor: theme.bgCard, borderRadius: 16, padding: "1.5rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto", borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", paddingBottom: "0.75rem", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: theme.borderCol }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: theme.textPrimary }}>
                  Palmarés & Historial de Campeones
                </h3>
                <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                  Torneo / Liga: <strong style={{ color: theme.textPrimary }}>{championsTargetName}</strong>
                </div>
              </div>
              <button type="button" onClick={() => setChampionsModalOpen(false)} style={{ border: "none", background: "transparent", color: theme.textMuted, cursor: "pointer", padding: 4, display: "flex" }}>
                <X size={18} />
              </button>
            </div>

            {/* Añadir Campeón */}
            <div style={{ backgroundColor: theme.bgInput, padding: 14, borderRadius: 10, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: theme.textPrimary, marginBottom: 6, display: "block" }}>
                Registrar Club Campeón en &quot;{championsTargetName}&quot;
              </label>

              {!selectedClubForChamp ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: theme.bgCard, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, borderRadius: 10, padding: "8px 12px" }}>
                    <Search size={16} style={{ color: theme.textMuted }} />
                    <input
                      style={{ width: "100%", border: "none", outline: "none", fontSize: 14, color: theme.textPrimary, backgroundColor: "transparent" }}
                      placeholder="Buscar club para asignar título..."
                      value={champSearchQuery}
                      onChange={(e) => setChampSearchQuery(e.target.value)}
                    />
                  </div>

                  {champSearchResults.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto" }}>
                      {champSearchResults.map((club) => (
                        <div
                          key={club.id}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", backgroundColor: theme.bgCard, borderRadius: 6, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, fontSize: 13, cursor: "pointer" }}
                          onClick={() => {
                            setSelectedClubForChamp(club);
                            setChampSearchQuery("");
                            setChampSearchResults([]);
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img src={club.crestUrl || `/badges/${club.slug}.webp`} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
                            <span style={{ fontWeight: 600, fontSize: 13, color: theme.textPrimary }}>{club.fullName}</span>
                          </div>
                          <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>Seleccionar</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.bgCard, padding: "8px 12px", borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <img src={selectedClubForChamp.crestUrl || `/badges/${selectedClubForChamp.slug}.webp`} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
                    <span style={{ fontWeight: 700, fontSize: 14, color: theme.textPrimary }}>{selectedClubForChamp.fullName}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="number"
                      min="1"
                      style={{ width: 70, padding: "4px 8px", borderRadius: 6, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, backgroundColor: theme.bgInput, color: theme.textPrimary, fontSize: 13 }}
                      value={champTitleCount}
                      onChange={(e) => setChampTitleCount(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <span style={{ fontSize: 12, color: theme.textMuted }}>títulos</span>

                    <button type="button" disabled={champSaving} onClick={handleSaveChampionTitle} style={{ padding: "5px 12px", borderRadius: 6, backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
                      {champSaving ? "Guardando..." : "Guardar Título"}
                    </button>

                    <button type="button" onClick={() => setSelectedClubForChamp(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: theme.textMuted }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Campeones Registrados */}
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                Tabla de Campeones Registrados ({championsList.length})
              </h4>

              {championsLoading ? (
                <div style={{ padding: 20, textAlign: "center", color: theme.textMuted, fontSize: 13, backgroundColor: theme.bgInput, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: theme.borderCol }}>
                  Cargando palmarés...
                </div>
              ) : championsList.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", color: theme.textMuted, fontSize: 13, backgroundColor: theme.bgInput, borderRadius: 8, borderWidth: 1, borderStyle: "dashed", borderColor: theme.borderCol }}>
                  No hay campeones registrados para este torneo aún.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
                  {championsList.map((c) => (
                    <div key={c.titleId} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: theme.bgCard, borderRadius: 8, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, fontSize: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <img src={c.crestUrl} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
                        <div>
                          <div style={{ fontWeight: 700, color: theme.textPrimary, fontSize: 14 }}>{c.clubName}</div>
                          <div style={{ fontSize: 11, color: theme.textMuted }}>{c.clubFullName}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#2563eb" }}>
                          🏆 {c.count} {c.count === 1 ? "título" : "títulos"}
                        </span>
                        <button type="button" onClick={() => handleDeleteChampionTitle(c.titleId)} style={{ backgroundColor: "#fef2f2", color: "#dc2626", borderWidth: 1, borderStyle: "solid", borderColor: "#fca5a5", borderRadius: 6, padding: "4px 8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button type="button" onClick={() => setChampionsModalOpen(false)} style={{ padding: "9px 18px", borderRadius: 8, backgroundColor: theme.bgInput, color: theme.textPrimary, fontWeight: 600, fontSize: 13, borderWidth: 1, borderStyle: "solid", borderColor: theme.borderCol, cursor: "pointer" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}