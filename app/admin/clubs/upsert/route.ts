import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, slug, name, fullName, provinceId, localityId, localityCustom, localLeagueId, lat, lng, competitions, badge_url, badgeData,
      nickname, foundation, stadiumName, stadiumCapacity, history, verified, titles
    } = body;

    let targetLocalityId = localityId || null;
    let localityName = localityCustom ? String(localityCustom).trim() : "";

    if (!targetLocalityId && localityCustom && provinceId && lat !== undefined && lng !== undefined) {
      const locSlug = slugify(localityCustom);
      const existing = await prisma.$queryRaw<{ id: string; name: string }[]>`
        SELECT id, name FROM "Locality" 
        WHERE "provinceId" = CAST(${provinceId} AS UUID) 
          AND "slug" = ${locSlug} 
        LIMIT 1
      `;
      if (existing.length > 0) {
        targetLocalityId = existing[0].id;
        localityName = existing[0].name;
      } else {
        const created = await prisma.$queryRaw<{ id: string }[]>`
          INSERT INTO "Locality" ("id", "provinceId", "name", "slug", "type", "location")
          VALUES (
            gen_random_uuid(),
            CAST(${provinceId} AS UUID),
            ${localityName},
            ${locSlug},
            'CITY'::"LocalityType",
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
          )
          RETURNING id;
        `;
        targetLocalityId = created[0].id;
      }
    } else if (targetLocalityId && !localityName) {
      const loc = await prisma.locality.findUnique({
        where: { id: targetLocalityId },
        select: { name: true },
      });
      if (loc) localityName = loc.name;
    }

    if (!name || !targetLocalityId || lat === undefined || lat === null || lng === undefined || lng === null) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    let finalId = id;
    let finalSlug = slug || slugify(name);

    // Verificar si el slug ya existe para OTRO club
    const conflictingClub = await prisma.club.findFirst({
      where: {
        slug: finalSlug,
        ...(finalId ? { NOT: { id: finalId } } : {}),
      },
      select: { id: true },
    });

    // Si ya existe un club con ese slug exacto, desambiguar anexando _ciudad
    if (conflictingClub) {
      const citySuffix = slugify(localityName);
      if (citySuffix) {
        finalSlug = `${finalSlug}_${citySuffix}`;
      }
    }

    const dbLeagueId = localLeagueId || null;
    const dbFullName = fullName || name;
    let dbCrestUrl = badge_url || `/badges/${finalSlug}.webp`;
    const dbVerified = typeof verified === "boolean" ? verified : false;

    if (finalId) {
      await prisma.$executeRaw`
        UPDATE "Club"
        SET 
          "fullName" = ${dbFullName},
          "shortName" = ${name},
          "slug" = ${finalSlug},
          "localityId" = CAST(${targetLocalityId} AS UUID),
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
          gen_random_uuid(), ${dbFullName}, ${name}, ${finalSlug}, 
          CAST(${targetLocalityId} AS UUID), CAST(${dbLeagueId} AS UUID), 
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

    // Si se adjuntó una nueva imagen en base64, guardarla en disco de forma segura ahora que el registro en BD está asegurado
    if (badgeData && typeof badgeData === "string") {
      try {
        const safeKey = finalSlug
          .toLowerCase()
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .replace(/[^a-z0-9_-]+/g, "-");

        const dirPath = path.join(process.cwd(), "public", "badges");
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        const base64Data = badgeData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const fileName = `${safeKey}.webp`;
        const filePath = path.join(dirPath, fileName);

        fs.writeFileSync(filePath, buffer);
        dbCrestUrl = `/badges/${fileName}`;

        // Actualizar crestUrl con la ruta final guardada
        await prisma.$executeRaw`
          UPDATE "Club"
          SET "crestUrl" = ${dbCrestUrl}
          WHERE id = CAST(${finalId} AS UUID)
        `;
      } catch (fileErr) {
        console.error("Error al guardar el archivo del escudo en disco:", fileErr);
      }
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

    return NextResponse.json({ success: true, clubId: finalId, slug: finalSlug });
  } catch (error: unknown) {
    console.error("Error crítico en upsert:", error);
    const err = error as { code?: string; message?: string };
    
    if (err.code === 'P2002' || err.message?.includes('Unique violation')) {
      return NextResponse.json({ error: "El identificador (slug) ya está en uso." }, { status: 409 });
    }
    
    return NextResponse.json({ error: err.message || "Fallo interno de la base de datos." }, { status: 500 });
  }
}