// lib/mapStyle.ts
import type { StyleSpecification } from "maplibre-gl";

/**
 * Basemap raster sin etiquetas (ideal para evitar rótulos que no controlás).
 * Luego vos podés agregar capas propias (provincias, clubes, etc.).
 */
export function basemapStyleNoLabels(): StyleSpecification {
  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: [
          "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [
      {
        id: "carto-base",
        type: "raster",
        source: "carto",
      },
    ],
  };
}
