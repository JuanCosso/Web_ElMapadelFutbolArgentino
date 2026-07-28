import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // 1. Buscamos las coordenadas exactas del club principal
    const centerClub: any[] = await prisma.$queryRaw`
      SELECT id, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
      FROM "Club" WHERE slug = ${slug} LIMIT 1
    `;

    if (!centerClub.length) return NextResponse.json({ error: "Club no encontrado" }, { status: 404 });
    const { id: clubId, lng, lat } = centerClub[0];

    // 2. PostGIS busca los 5 más cercanos usando el operador "<->" (distancia espacial)
    // ST_Distance con ::geography calcula la distancia real tomando en cuenta la curvatura de la Tierra.
    const nearbyClubs = await prisma.$queryRaw`
      SELECT 
        "fullName" as name, 
        "slug", 
        "crestUrl",
        ROUND((ST_Distance(location::geography, ST_MakePoint(${lng}, ${lat})::geography) / 1000)::numeric, 1) as distance_km
      FROM "Club"
      WHERE id != ${clubId}
      ORDER BY location <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      LIMIT 5
    `;

    // Convertimos BigInts a Number por las dudas (Prisma a veces devuelve BigInt en count/round)
    const formatted = (nearbyClubs as any[]).map(c => ({
      ...c,
      distance_km: Number(c.distance_km)
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Error PostGIS Nearby:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}