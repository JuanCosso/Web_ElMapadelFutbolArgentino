import fs from "node:fs";
import path from "node:path";
import * as turf from "@turf/turf";

const PROV_PATH = path.join("public", "data", "provincias.geojson");
const DEP_PATH = path.join("public", "data", "departamentos.geojson");
const OUT_PATH = path.join("public", "data", "argentina_outline.geojson");

const prov = JSON.parse(fs.readFileSync(PROV_PATH, "utf8"));
const dep = JSON.parse(fs.readFileSync(DEP_PATH, "utf8"));

function getProp(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  return null;
}

// 1) Unir todas las provincias (multipolygon)
let outline = null;
for (const f of prov.features) {
  const geom = f?.geometry;
  if (!geom) continue;
  outline = outline ? turf.union(outline, f) : f;
}

// 2) Buscar “Islas del Atlántico Sur” en departamentos (para incluir Malvinas)
const malvinasCandidates = dep.features.filter((f) => {
  const p = f.properties || {};
  const nombre = getProp(p, ["nombre", "name", "NOMBRE"]);
  // Georef suele usar "nombre". Si cambia, este fallback lo captura.
  return typeof nombre === "string" && nombre.toLowerCase().includes("islas del atlántico sur");
});

if (malvinasCandidates.length > 0) {
  // Unir todos los candidatos (por si viene multipartido)
  let malv = null;
  for (const f of malvinasCandidates) {
    malv = malv ? turf.union(malv, f) : f;
  }
  outline = turf.union(outline, malv);
} else {
  console.warn(
    "No se encontró 'Islas del Atlántico Sur' en departamentos.geojson. " +
      "Igual se generó el outline con provincias."
  );
}

// Guardar resultado
const fc = {
  type: "FeatureCollection",
  features: [outline],
};

fs.writeFileSync(OUT_PATH, JSON.stringify(fc));
console.log("OK:", OUT_PATH);
