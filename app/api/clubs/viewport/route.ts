import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get("bbox");

  if (!bbox) {
    return NextResponse.json({ error: "Falta el bounding box" }, { status: 400 });
  }

  // bbox = minLng, minLat, maxLng, maxLat
  const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number);

  try {
    // 1. ST_MakeEnvelope filtra geométricamente solo lo visible en pantalla.
    // 2. ORDER BY tier DESC asegura que los clubes más importantes (ej: tier 1) 
    //    vengan al final del JSON, por lo que MapLibre los dibujará ARRIBA de los demás.
    const clubs = await prisma.$queryRaw<
      {
        club_id: string;
        name: string;
        slug: string;
        badge_url: string | null;
        league: string | null;
        city: string | null;
        province: string | null;
        lng: number;
        lat: number;
        tier: number;
      }[]
    >`
      SELECT 
        id as club_id, 
        "fullName" as name, 
        "slug", 
        "crestUrl" as badge_url,
        "league",
        "city",
        "province",
        ST_X(location::geometry) as lng, 
        ST_Y(location::geometry) as lat,
        -- Si ya tenés un campo para la división (ej: Primera=1, Amateur=5), usalo acá.
        -- Si no, por ahora forzamos un valor por defecto.
        COALESCE("level", 99) as tier 
      FROM "Club"
      WHERE ST_Intersects(location, ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326))
      ORDER BY tier DESC
    `;

    // Convertir el resultado de SQL a GeoJSON válido para MapLibre
    const geojson = {
      type: "FeatureCollection",
      features: clubs.map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        properties: {
          club_id: c.club_id,
          name: c.name,
          slug: c.slug,
          badge_url: c.badge_url,
          league: c.league,
          city: c.city,
          province: c.province,
          tier: c.tier,
        },
      })),
    };

    return NextResponse.json(geojson);
  } catch (error) {
    console.error("Error en PostGIS BBox:", error);
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }
}