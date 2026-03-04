"use client";

import { useEffect, useRef } from "react";
import maplibregl, { GeoJSONSource, Map } from "maplibre-gl";
import * as turf from "@turf/turf";
import { STYLE, BasemapId } from "./style";

export type ProvinceInfo = {
  name: string;
  leagues: number;
  clubs: number;
  mode: "hover" | "selected";
};

export type ClubInfo = {
  clubId: string;
  name: string;
  fullName?: string;
  province: string;
  city: string;
  league: string;
  badgeUrl?: string;
};

type ProvinceStats = Record<
  string,
  { club_count: number; league_count: number; city_count?: number }
>;

function normKey(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function getProvinceName(props: any): string {
  return props?.nombre || props?.name || props?.provincia || props?.NOMBRE || "";
}

// ===== BADGES (NO TOCO TU LÓGICA) =====
function normalizePublicUrl(u: string) {
  if (!u) return "";
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  let x = u.trim();
  x = x.replace(/^\.?\//, "");
  return `/${x}`;
}

// =====================================

export default function MapView({
  basemap,
  showRoads,
  onProvinceInfo,
  onClubInfo,
  onClubHover,
  onHomeReady,
  onMapApiReady,
}: {
  basemap: BasemapId;
  showRoads: boolean;
  onProvinceInfo: (info: ProvinceInfo | null) => void;
  onClubInfo: (info: ClubInfo | null) => void; // click
  onClubHover?: (info: ClubInfo | null) => void; // hover
  onHomeReady?: (fn: (() => void) | null) => void;

  onMapApiReady?: (api: {
    flyTo: (center: [number, number], zoom?: number) => void;
    fitBBox: (bbox: [number, number, number, number]) => void;
  } | null) => void;
}) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  const statsRef = useRef<ProvinceStats>({});
  const badgeMapRef = useRef<Record<string, string>>({});

  const hoverProvIdRef = useRef<any>(null);
  const selectedProvIdRef = useRef<any>(null);
  const selectedProvNameRef = useRef<string | null>(null);

  // (solo para evitar spam de hover al panel)
  const hoverClubIdRef = useRef<string | null>(null);

  // Vista “inicio”
  const HOME_CENTER: [number, number] = [-64.0, -38.5];
  const HOME_ZOOM = 3;

  useEffect(() => {
    fetch("/data/province_stats.json")
      .then((r) => r.json())
      .then((j) => (statsRef.current = j))
      .catch(() => {});
  
    fetch("/data/clubs.geojson")
      .then((r) => r.json())
      .then((fc) => {
        const m: Record<string, string> = {};
  
        // clubs.geojson como fuente única
        for (const f of fc.features || []) {
          const p = f.properties || {};
          const id = p.club_id || p.id || p.clubId || p.slug;
          const url = p.badge_url || p.badgeUrl || p.badge; // por si tenés variaciones
          if (!id) continue;
  
          const sid = String(id);
          if (url) m[sid] = normalizePublicUrl(String(url));
          else m[sid] = `/badges/${sid}.webp`; // fallback
        }
  
        badgeMapRef.current = m;
      })
      .catch(() => {});
  }, []);
  

  useEffect(() => {
    if (!divRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: divRef.current,
      style: STYLE,
      center: HOME_CENTER,
      zoom: HOME_ZOOM,
      minZoom: 3,
      maxZoom: 18,
      renderWorldCopies: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    
    onMapApiReady?.({
      flyTo: (center, zoom = 12.5) => {
        map.easeTo({
          center,
          zoom,
          bearing: 0,
          pitch: 0,
          duration: 450,
        });
      },
      fitBBox: (bbox) => {
        map.fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ],
          {
            padding: { top: 30, bottom: 30, left: 30, right: 30 },
            duration: 450,
            maxZoom: 10,
          }
        );
      },
    });


    const PROV_EXPR: any = [
      "coalesce",
      ["get", "province"],
      ["get", "provincia"],
      ["get", "Provincia"],
      ["get", "PROVINCIA"],
    ];

    const applyProvinceFilter = (provName: string | null) => {
      // Filtra clubs por provincia seleccionada
      if (map.getLayer("clubs_icons")) {
        map.setFilter("clubs_icons", provName ? ["==", PROV_EXPR, provName] : null);
      }
    };

    const clearClubHover = () => {
      hoverClubIdRef.current = null;
      onClubHover?.(null);
    };

    const clearProvinceSelection = () => {
      if (selectedProvIdRef.current != null && map.getSource("provincias")) {
        map.setFeatureState(
          { source: "provincias", id: selectedProvIdRef.current },
          { selected: false }
        );
      }
      selectedProvIdRef.current = null;
      selectedProvNameRef.current = null;

      applyProvinceFilter(null);
      onProvinceInfo(null);
      onClubInfo(null);
      clearClubHover();
    };

    const goHome = () => {
      clearProvinceSelection();
      map.easeTo({
        center: HOME_CENTER,
        zoom: HOME_ZOOM,
        bearing: 0,
        pitch: 0,
        duration: 450,
      });
    };

    onHomeReady?.(goHome);

    const setBasemapVisibility = () => {
      if (!map.getLayer("bm_streets")) return;
      map.setLayoutProperty("bm_streets", "visibility", basemap === "streets" ? "visible" : "none");
      map.setLayoutProperty(
        "bm_satellite",
        "visibility",
        basemap === "satellite" ? "visible" : "none"
      );
      map.setLayoutProperty("bm_relief", "visibility", basemap === "relief" ? "visible" : "none");
      map.setLayoutProperty("overlay_roads", "visibility", showRoads ? "visible" : "none");
    };

    map.on("load", async () => {
      setBasemapVisibility();

      // Provincias + stats
      try {
        const prov = await fetch("/data/provincias.geojson").then((r) => r.json());
        const idx: Record<string, { club_count: number; league_count: number }> = {};
        for (const [k, v] of Object.entries(statsRef.current)) idx[normKey(k)] = v as any;

        (prov.features || []).forEach((f: any, i: number) => {
          const name = getProvinceName(f.properties);
          const st = idx[normKey(name)];
          f.id = f.id ?? f.properties?.id ?? i;
          f.properties = {
            ...f.properties,
            name,
            league_count: st?.league_count ?? 0,
            club_count: st?.club_count ?? 0,
          };
        });

        const src = map.getSource("provincias") as GeoJSONSource;
        src.setData(prov);
      } catch {}

      // BADGES on-demand (TU BLOQUE, SIN CAMBIOS)
      const status: Record<string, "loading" | "loaded" | "failed"> = {};
      map.on("styleimagemissing", (e: any) => {
        const id = String(e?.id || "");
        if (!id) return;
        if (map.hasImage(id)) return;
        if (status[id]) return;

        const url = badgeMapRef.current[id] || `/badges/${id}.webp`;
        status[id] = "loading";

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            if (!map.hasImage(id)) map.addImage(id, img, { pixelRatio: 4 });
            status[id] = "loaded";
          } catch {
            status[id] = "failed";
          }
        };
        img.onerror = () => {
          status[id] = "failed";
          console.warn("[badges] No se pudo cargar:", { id, url });
        };
        img.src = url;
      });

      // Hover provincias
      map.on("mousemove", "prov_fill", (e: any) => {
        const f = e.features?.[0];
        if (!f) return;

        map.getCanvas().style.cursor = "pointer";
        const fid = f.id;
        if (fid == null) return;

        if (hoverProvIdRef.current != null && hoverProvIdRef.current !== fid) {
          map.setFeatureState(
            { source: "provincias", id: hoverProvIdRef.current },
            { hover: false }
          );
        }
        hoverProvIdRef.current = fid;
        map.setFeatureState({ source: "provincias", id: fid }, { hover: true });

        const name = f.properties?.name || getProvinceName(f.properties);
        onProvinceInfo({
          name,
          leagues: Number(f.properties?.league_count ?? 0),
          clubs: Number(f.properties?.club_count ?? 0),
          mode: selectedProvIdRef.current === fid ? "selected" : "hover",
        });
      });

      map.on("mouseleave", "prov_fill", () => {
        map.getCanvas().style.cursor = "";
        if (hoverProvIdRef.current != null) {
          map.setFeatureState(
            { source: "provincias", id: hoverProvIdRef.current },
            { hover: false }
          );
          hoverProvIdRef.current = null;
        }
        if (selectedProvIdRef.current == null) onProvinceInfo(null);
      });

      // ✅ Click provincia => fitBounds (pero si clickeás un club, NO entra acá)
      map.on("click", "prov_fill", (e: any) => {
        // IMPORTANTÍSIMO: si en ese punto hay un club, ignorar click de provincia
        const clubHits = map.queryRenderedFeatures(e.point, { layers: ["clubs_icons"] });
        if (clubHits.length) return;

        const f = e.features?.[0];
        if (!f) return;

        const fid = f.id;
        if (fid == null) return;

        if (selectedProvIdRef.current != null && selectedProvIdRef.current !== fid) {
          map.setFeatureState(
            { source: "provincias", id: selectedProvIdRef.current },
            { selected: false }
          );
        }
        selectedProvIdRef.current = fid;
        map.setFeatureState({ source: "provincias", id: fid }, { selected: true });

        const name = f.properties?.name || getProvinceName(f.properties);
        selectedProvNameRef.current = name;

        const bbox = turf.bbox(f as any);
        map.fitBounds(
          [
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]],
          ],
          {
            padding: { top: 30, bottom: 30, left: 360, right: 30 },
            duration: 450,
            maxZoom: 9.5,
          }
        );

        applyProvinceFilter(name);

        onProvinceInfo({
          name,
          leagues: Number(f.properties?.league_count ?? 0),
          clubs: Number(f.properties?.club_count ?? 0),
          mode: "selected",
        });

        onClubInfo(null);
        clearClubHover();
      });

      // Click en vacío => deselecciona provincia
      map.on("click", (ev) => {
        const hits = map.queryRenderedFeatures(ev.point, {
          layers: ["prov_fill", "clubs_icons"],
        });
        if (hits.length) return;
        clearProvinceSelection();
      });

      // Hover club => solo panel (SIN HALO)
      map.on("mousemove", "clubs_icons", (ev: any) => {
        const f = ev.features?.[0];
        if (!f) return;

        map.getCanvas().style.cursor = "pointer";

        const p = f.properties || {};
        const clubId = String(p.club_id || p.id || p.clubId || p.slug || "");
        if (!clubId) return;

        if (hoverClubIdRef.current === clubId) return;
        hoverClubIdRef.current = clubId;

        onClubHover?.({
          clubId,
          name: p.name || p.nombre || "Club",
          fullName: p.full_name || p.fullName || p.nombre_completo || undefined,
          province: p.province || p.provincia || "",
          city: p.city || p.ciudad || "",
          league: p.league || p.liga || "",
          badgeUrl:
           (p.badge_url && normalizePublicUrl(String(p.badge_url))) ||
           (p.badgeUrl && normalizePublicUrl(String(p.badgeUrl))) ||
           badgeMapRef.current[clubId] ||
           `/badges/${clubId}.webp`,
        });
      });

      map.on("mouseleave", "clubs_icons", () => {
        map.getCanvas().style.cursor = "";
        clearClubHover();
      });

      // ✅ Click club => drawer (aislado; no deja que se encadene con provincia)
      map.on("click", "clubs_icons", (ev: any) => {
        const oe = ev?.originalEvent as MouseEvent | undefined;
        oe?.preventDefault?.();
        oe?.stopPropagation?.();

        const f = ev.features?.[0];
        if (!f) return;

        const p = f.properties || {};
        const clubId = String(p.club_id || p.id || p.clubId || p.slug || "");
        if (!clubId) return;

        onClubInfo({
          clubId,
          name: String(p.name || clubId),
          fullName: p.full_name ? String(p.full_name) : undefined,
          province: String(p.province || ""),
          city: String(p.city || ""),
          league: String(p.league || ""),
          badgeUrl: p.badge_url ? normalizePublicUrl(String(p.badge_url)) : undefined,
        });
      });
    });

    return () => {
      onHomeReady?.(null);
      onMapApiReady?.(null);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!map.getLayer("bm_streets")) return;

    map.setLayoutProperty("bm_streets", "visibility", basemap === "streets" ? "visible" : "none");
    map.setLayoutProperty("bm_satellite", "visibility", basemap === "satellite" ? "visible" : "none");
    map.setLayoutProperty("bm_relief", "visibility", basemap === "relief" ? "visible" : "none");
    map.setLayoutProperty("overlay_roads", "visibility", showRoads ? "visible" : "none");
  }, [basemap, showRoads]);

  return <div ref={divRef} style={{ width: "100%", height: "100vh" }} />;
}
