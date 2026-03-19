// components/map/MapShell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import MapView, { ClubInfo, ProvinceInfo } from "./MapView";
import type { BasemapId } from "./style";
import ClubDrawer from "./ClubDrawer";
import MapPanel from "./MapPanel";
import MapLayerControl from "./MapLayerControl";
import SearchBar from "./SearchBar";
import { buildSearchIndex, ClubFeature } from "@/utils/searchIndex";
import type { SearchItem } from "@/utils/searchIndex";

type FeatureCollection = { type: "FeatureCollection"; features: ClubFeature[] };

export default function MapShell() {
  const [basemap, setBasemap] = useState<BasemapId>("streets");
  const [roads, setRoads] = useState(false);

  const [clubsGeojson, setClubsGeojson] = useState<FeatureCollection | null>(null);
  useEffect(() => {
    fetch("/data/clubs.geojson")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => (j?.type === "FeatureCollection" ? setClubsGeojson(j) : null))
      .catch(() => {});
  }, []);

  const searchIndex = useMemo(() => {
    if (!clubsGeojson) return [];
    return buildSearchIndex(clubsGeojson.features);
  }, [clubsGeojson]);

  const [mapApi, setMapApi] = useState<{
    flyTo: (center: [number, number], zoom?: number) => void;
    fitBBox: (bbox: [number, number, number, number]) => void;
  } | null>(null);

  const [provinceInfo, setProvinceInfo] = useState<ProvinceInfo | null>(null);

  // ✅ Un solo objeto para el club seleccionado
  const [selectedClub, setSelectedClub] = useState<ClubInfo | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Club bajo el cursor
  const [hoverClub, setHoverClub] = useState<ClubInfo | null>(null);

  const [goHome, setGoHome] = useState<(() => void) | null>(null);
  const handleHomeReady = (fn: (() => void) | null) => setGoHome(fn ? () => fn : null);

  const openClub = (info: ClubInfo) => {
    setSelectedClub(info);
    setDrawerOpen(true);
  };
  const closeClub = () => {
    setSelectedClub(null);
    setDrawerOpen(false);
  };

  // El panel muestra hover si existe, si no el seleccionado
  const panelClub = hoverClub ?? selectedClub;

  const onSearchSelect = (item: SearchItem) => {
    if (!mapApi) return;
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
    mapApi.fitBBox(item.bbox);
  };

  return (
    <div className="relative h-screen w-screen">
      <SearchBar index={searchIndex} onSelect={onSearchSelect} />

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
      />

      <MapLayerControl
        basemap={basemap}
        setBasemap={setBasemap}
        roads={roads}
        setRoads={setRoads}
        onHome={goHome}
      />

      {/* ✅ Ahora recibe el objeto completo */}
      <ClubDrawer
        open={drawerOpen}
        club={selectedClub}
        onClose={closeClub}
      />
    </div>
  );
}