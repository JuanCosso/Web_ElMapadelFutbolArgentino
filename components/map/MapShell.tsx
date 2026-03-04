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

  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedBadgeUrl, setSelectedBadgeUrl] = useState<string | undefined>(undefined);
  const [selectedClubName, setSelectedClubName] = useState<string | undefined>(undefined);
  const [selectedClubFullName, setSelectedClubFullName] = useState<string | undefined>(undefined);

  const [hoverClub, setHoverClub] = useState<ClubInfo | null>(null);

  const [goHome, setGoHome] = useState<(() => void) | null>(null);
  const handleHomeReady = (fn: (() => void) | null) => setGoHome(fn ? () => fn : null);

  const clearClubClick = () => {
    setClubInfo(null);
    setDrawerOpen(false);
    setSelectedClubId(null);
    setSelectedBadgeUrl(undefined);
    setSelectedClubName(undefined);
    setSelectedClubFullName(undefined);
  };

  const activeClub = hoverClub ?? clubInfo;

  const onSearchSelect = (item: SearchItem) => {
    if (!mapApi) return;

    if (item.type === "club") {
      mapApi.flyTo(item.center, 13);
      setSelectedClubId(item.club_id);
      setSelectedBadgeUrl(item.badge_url);
      setSelectedClubName(item.label);
      setSelectedClubFullName(item.full_name);
      setDrawerOpen(true);
      return;
    }

    // ✅ provincia/ciudad: encuadrar, pero NO “seleccionar provincia”
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
          setClubInfo(info);

          if (info) {
            setSelectedClubId(info.clubId);
            setSelectedBadgeUrl(info.badgeUrl);
            setSelectedClubName(info.name);
            setSelectedClubFullName(info.fullName);
            setDrawerOpen(true);
          } else {
            clearClubClick();
          }
        }}
        onHomeReady={handleHomeReady}
        onMapApiReady={setMapApi}
      />

      <MapPanel provinceInfo={provinceInfo} activeClub={activeClub} />

      <MapLayerControl
        basemap={basemap}
        setBasemap={setBasemap}
        roads={roads}
        setRoads={setRoads}
        onHome={goHome}
      />

      <ClubDrawer
        open={drawerOpen}
        clubId={selectedClubId}
        badgeUrl={selectedBadgeUrl}
        clubName={selectedClubName}
        clubFullName={selectedClubFullName}
        onClose={clearClubClick}
      />
    </div>
  );
}
