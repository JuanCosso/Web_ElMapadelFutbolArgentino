import { NextResponse } from "next/server";
// ACÁ ESTABA EL ERROR: Faltaban las llaves en { prisma }
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, slug, name, fullName, localityId, localLeagueId, lat, lng, competitions, badge_url,
      nickname, foundation, stadiumName, stadiumCapacity, history, verified, titles
    } = body;

    if (!name || !localityId || !lat || !lng) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    let finalId = id;
    const dbLeagueId = localLeagueId || null;
    const dbFullName = fullName || name;
    const dbCrestUrl = badge_url || `/badges/${slug}.webp`;
    const dbVerified = typeof verified === "boolean" ? verified : true;

    if (finalId) {
      await prisma.$executeRaw`
        UPDATE "Club"
        SET 
          "fullName" = ${dbFullName},
          "shortName" = ${name},
          "slug" = ${slug},
          "localityId" = CAST(${localityId} AS UUID),
          "localLeagueId" = CAST(${dbLeagueId} AS UUID),
          "crestUrl" = ${dbCrestUrl},
          "location" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          "nickname" = ${nickname || null},
          "foundation" = ${foundation || null},
          "stadiumName" = ${stadiumName || null},
          "stadiumCapacity" = ${stadiumCapacity ? Number(stadiumCapacity) : null},
          "history" = ${history || null},
          "verified" = ${dbVerified},
          "updatedAt" = NOW()
        WHERE id = CAST(${finalId} AS UUID)
      `;
    } else {
      const result = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "Club" (
          "id", "fullName", "shortName", "slug", "localityId", "localLeagueId", 
          "crestUrl", "location", "verified", "updatedAt",
          "nickname", "foundation", "stadiumName", "stadiumCapacity", "history"
        )
        VALUES (
          gen_random_uuid(), ${dbFullName}, ${name}, ${slug}, 
          CAST(${localityId} AS UUID), CAST(${dbLeagueId} AS UUID), 
          ${dbCrestUrl}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326), 
          ${dbVerified}, NOW(),
          ${nickname || null}, ${foundation || null}, 
          ${stadiumName || null}, ${stadiumCapacity ? Number(stadiumCapacity) : null}, 
          ${history || null}
        )
        RETURNING id;
      `;
      finalId = result[0].id;
    }

    if (competitions && Array.isArray(competitions)) {
      await prisma.club.update({
        where: { id: finalId },
        data: {
          competitions: {
            set: competitions.map((compId: string) => ({ id: compId }))
          }
        }
      });
    }

    if (titles && Array.isArray(titles)) {
      await prisma.title.deleteMany({ where: { clubId: finalId } });
      const validTitles = titles
        .filter((t: { name?: string; count?: number }) => t.name && t.name.trim().length > 0)
        .map((t: { name: string; count?: number }) => ({
          clubId: finalId,
          name: t.name.trim(),
          count: Math.max(1, Number(t.count) || 1),
        }));
      if (validTitles.length > 0) {
        await prisma.title.createMany({ data: validTitles });
      }
    }

    return NextResponse.json({ success: true, clubId: finalId, slug });
  } catch (error: unknown) {
    console.error("Error crítico en upsert:", error);
    const err = error as { code?: string; message?: string };
    
    if (err.code === 'P2002' || err.message?.includes('Unique violation')) {
      return NextResponse.json({ error: "El identificador (slug) ya está en uso." }, { status: 409 });
    }
    
    return NextResponse.json({ error: err.message || "Fallo interno de la base de datos." }, { status: 500 });
  }
}