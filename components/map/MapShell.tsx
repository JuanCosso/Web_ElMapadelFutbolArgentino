// components/map/MapShell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import MapView, { ClubInfo, ProvinceInfo } from "./MapView";
import type { BasemapId } from "./style";
import ClubDrawer from "./ClubDrawer";
import LeagueDrawer, { LeagueInfo } from "./LeagueDrawer";
import MapPanel from "./MapPanel";
import MapLayerControl from "./MapLayerControl";
import SearchBar from "./SearchBar";
import { buildSearchIndex, ClubFeature } from "@/utils/searchIndex";
import type { SearchItem } from "@/utils/searchIndex";
import { useSearchParams } from "next/navigation";

type FeatureCollection = { type: "FeatureCollection"; features: ClubFeature[] };

export default function MapShell() {
  const searchParams = useSearchParams();
  const [basemap, setBasemap] = useState<BasemapId>("streets");
  const [roads, setRoads] = useState(false);

  const [clubsGeojson, setClubsGeojson] = useState<FeatureCollection | null>(null);
  const [leaguesList, setLeaguesList] = useState<SearchItem[]>([]);

  useEffect(() => {
    fetch("/api/map/clubs")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.type === "FeatureCollection" ? setClubsGeojson(j) : null))
      .catch(() => {});

    fetch("/api/map/leagues")
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => (Array.isArray(j) ? setLeaguesList(j) : null))
      .catch(() => {});
  }, []);

  const searchIndex = useMemo(() => {
    if (!clubsGeojson) return [];
    return buildSearchIndex(clubsGeojson.features, leaguesList);
  }, [clubsGeojson, leaguesList]);

  const [mapApi, setMapApi] = useState<{
    flyTo: (center: [number, number], zoom?: number) => void;
    fitBBox: (bbox: [number, number, number, number]) => void;
    clearFilter: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
  } | null>(null);

  const [provinceInfo, setProvinceInfo] = useState<ProvinceInfo | null>(null);

  // Club seleccionado
  const [selectedClub, setSelectedClub] = useState<ClubInfo | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Liga seleccionada
  const [selectedLeague, setSelectedLeague] = useState<LeagueInfo | null>(null);
  const [leagueDrawerOpen, setLeagueDrawerOpen] = useState(false);

  // Club bajo el cursor
  const [hoverClub, setHoverClub] = useState<ClubInfo | null>(null);

  const [goHome, setGoHome] = useState<(() => void) | null>(null);
  const handleHomeReady = (fn: (() => void) | null) => setGoHome(fn ? () => fn : null);

  const openClub = (info: ClubInfo) => {
    setSelectedLeague(null);
    setLeagueDrawerOpen(false);
    setSelectedClub(info);
    setDrawerOpen(true);
  };

  const closeClub = () => {
    setSelectedClub(null);
    setDrawerOpen(false);
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/club/")) {
      window.history.pushState(null, "", "/");
    }
  };

  const openLeague = (info: LeagueInfo) => {
    setSelectedClub(null);
    setDrawerOpen(false);
    setSelectedLeague(info);
    setLeagueDrawerOpen(true);
  };

  const closeLeague = () => {
    setSelectedLeague(null);
    setLeagueDrawerOpen(false);
  };

  // URL lat/lng handler al cargar el mapa
  useEffect(() => {
    if (!mapApi || !searchParams) return;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (lat && lng) {
      mapApi.flyTo([parseFloat(lng), parseFloat(lat)], 14);
      window.history.replaceState(null, "", "/");
    }
  }, [mapApi, searchParams]);

  // El panel muestra hover si existe, si no el seleccionado
  const panelClub = hoverClub ?? selectedClub;

  const onSearchSelect = (item: SearchItem) => {
    if (!mapApi) return;
    mapApi.clearFilter();

    if (item.type === "club") {
      mapApi.flyTo(item.center, 13);
      openClub({
        clubId: item.club_id,
        name: item.label,
        fullName: item.full_name,
        province: item.province ?? "",
        city: item.city ?? "",
        league: item.league ?? "",
        badgeUrl: item.badge_url,
      });
      return;
    }

    if (item.type === "league") {
      openLeague({
        leagueId: item.league_id,
        name: item.label,
        province: item.province,
        logoUrl: item.logo_url,
      });
      return;
    }

    if (item.bbox) {
      mapApi.fitBBox(item.bbox);
    }
  };

  const handleSelectClubFromLeague = (clubSlug: string) => {
    const foundClub = clubsGeojson?.features.find(
      (f) => String(f.properties?.club_id || f.properties?.slug) === clubSlug
    );

    if (foundClub) {
      const p = foundClub.properties;
      const c = foundClub.geometry.coordinates;
      if (mapApi && c) {
        mapApi.flyTo([c[0], c[1]], 13);
      }
      openClub({
        clubId: clubSlug,
        name: String(p.name || clubSlug),
        fullName: p.full_name ? String(p.full_name) : undefined,
        province: String(p.province || ""),
        city: String(p.city || ""),
        league: String(p.league || ""),
        badgeUrl: p.badge_url ? String(p.badge_url) : undefined,
      });
    } else {
      openClub({
        clubId: clubSlug,
        name: clubSlug,
        province: "",
        city: "",
        league: "",
      });
    }
  };

  const isDark = basemap === "dark";

  return (
    <div className="relative h-[100dvh] w-screen max-w-full overflow-hidden">
      <SearchBar
        index={searchIndex}
        onSelect={onSearchSelect}
        isDrawerOpen={drawerOpen || leagueDrawerOpen}
        isDark={isDark}
      />

      <MapView
        basemap={basemap}
        showRoads={roads}
        onProvinceInfo={setProvinceInfo}
        onClubHover={setHoverClub}
        onClubInfo={(info) => {
          if (info) openClub(info);
          else closeClub();
        }}
        onHomeReady={handleHomeReady}
        onMapApiReady={setMapApi}
      />

      <MapPanel
        provinceInfo={provinceInfo}
        activeClub={panelClub}
        isHover={!!hoverClub}
        isDark={isDark}
      />

      <MapLayerControl
        basemap={basemap}
        setBasemap={setBasemap}
        roads={roads}
        setRoads={setRoads}
        onHome={goHome}
        onZoomIn={() => mapApi?.zoomIn()}
        onZoomOut={() => mapApi?.zoomOut()}
        isDark={isDark}
      />

      <ClubDrawer
        open={drawerOpen}
        club={selectedClub}
        onClose={closeClub}
        isDark={isDark}
      />

      <LeagueDrawer
        open={leagueDrawerOpen}
        league={selectedLeague}
        onClose={closeLeague}
        onSelectClub={handleSelectClubFromLeague}
        isDark={isDark}
      />
    </div>
  );
}

