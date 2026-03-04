// components/map/style.ts
import type { StyleSpecification } from "maplibre-gl";

export type BasemapId = "streets" | "satellite" | "relief";

// Expresión robusta para sacar el ID del club desde properties
const CLUB_ID_EXPR = [
  "to-string",
  ["coalesce", ["get", "club_id"], ["get", "clubId"], ["get", "id"], ["get", "slug"]],
] as any;

const CLUBS_MINZOOM = 6; // probá 6 o 7

export const STYLE: StyleSpecification = {
  version: 8,

  sources: {
    carto_voyager_nolabels: {
      type: "raster",
      tileSize: 256,
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",
      ],
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
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

    provincias: { type: "geojson", data: "/data/provincias.geojson", generateId: true },

    clubs: {
      type: "geojson",
      data: "/data/clubs.geojson",
    },
  },

  layers: [
    // Basemaps
    { id: "bm_streets", type: "raster", source: "carto_voyager_nolabels", layout: { visibility: "visible" } },
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
      "interpolate", ["linear"], ["zoom"],
      CLUBS_MINZOOM, 0.45,
      9, 0.70,
      12, 0.95
    ],
    "icon-allow-overlap": true,
    "icon-ignore-placement": true,
    "icon-anchor": "center",
    "symbol-z-order": "source",
  },
}

  ],
};
