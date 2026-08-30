// components/map/style.ts
import type { StyleSpecification } from "maplibre-gl";

export type BasemapId = "streets" | "satellite" | "relief" | "dark";

const CLUBS_MINZOOM = 3;

export const STYLE: StyleSpecification = {
  version: 8,

  sources: {
    carto_voyager_nolabels: {
      type: "raster",
      tileSize: 256,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      attribution:
        '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    },

    esri_world_dark_gray: {
      type: "raster",
      tileSize: 256,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      ],
      attribution:
        '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    },

    esri_world_imagery: {
      type: "raster",
      tileSize: 256,
      tiles: [
        "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      attribution: "Esri",
    },

    esri_shaded_relief: {
      type: "raster",
      tileSize: 256,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",
      ],
      attribution: "Esri",
    },

    esri_transportation_overlay: {
      type: "raster",
      tileSize: 256,
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
      ],
      attribution: "Esri",
    },

    provincias: { type: "geojson", data: "/api/map/provinces", generateId: true },

    clubs: {
      type: "geojson",
      data: "/api/map/clubs",
    },
  },

  layers: [
    // Basemaps
    { id: "bm_streets", type: "raster", source: "carto_voyager_nolabels", layout: { visibility: "visible" } },
    { id: "bm_dark", type: "raster", source: "esri_world_dark_gray", layout: { visibility: "none" } },
    { id: "bm_satellite", type: "raster", source: "esri_world_imagery", layout: { visibility: "none" } },
    { id: "bm_relief", type: "raster", source: "esri_shaded_relief", layout: { visibility: "none" } },
    {
      id: "overlay_roads",
      type: "raster",
      source: "esri_transportation_overlay",
      layout: { visibility: "none" },
      paint: { "raster-opacity": 0.85 },
    },

    // Provincias
    {
      id: "prov_fill",
      type: "fill",
      source: "provincias",
      paint: {
        "fill-color": "#111827",
        "fill-opacity": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          0.16,
          ["boolean", ["feature-state", "hover"], false],
          0.10,
          0.05,
        ],
      },
    },
    {
      id: "prov_outline",
      type: "line",
      source: "provincias",
      paint: {
        "line-color": "#111827",
        "line-opacity": 0.65,
        "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 2, 1],
      },
    },

    // Mostrar escudos recién desde un zoom cercano:
    {
      id: "clubs_icons",
      type: "symbol",
      source: "clubs",
      minzoom: CLUBS_MINZOOM,
      layout: {
        "icon-image": ["get", "club_id"],
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          CLUBS_MINZOOM,
          0.12,
          9,
          0.22,
          12,
          0.35,
          15,
          0.50,
        ],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-anchor": "center",
        "symbol-sort-key": ["coalesce", ["get", "sort_order"], 0],
        "symbol-z-order": "auto",
      },
    },
  ],
};
