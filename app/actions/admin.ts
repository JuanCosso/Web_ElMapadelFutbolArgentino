"use server";

import {prisma} from "@/lib/prisma";

export async function getAdminFormData() {
  const provinces = await prisma.province.findMany({ 
    select: { id: true, name: true },
    orderBy: { name: 'asc' } 
  });
  
  const localities = await prisma.locality.findMany({ 
    select: { id: true, name: true, provinceId: true },
    orderBy: { name: 'asc' } 
  });
  
  const leagues = await prisma.localLeague.findMany({ 
    select: { id: true, name: true },
    orderBy: { name: 'asc' } 
  });
  
  const competitions = await prisma.competition.findMany({ 
    select: { id: true, name: true, type: true, level: true },
    orderBy: [{ level: 'asc' }, { name: 'asc' }] 
  });

  return { provinces, localities, leagues, competitions };
}

// Buscador unificado que devuelve la info completa del club para el form (insensible a tildes y ordenado por jerarquía)
export async function searchFullClubsForAdmin(query: string) {
  if (!query || query.trim().length < 2) return [];

  const qNorm = query.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();

  try {
    const rawClubs = await prisma.$queryRaw<{ id: string }[]>`
      SELECT c.id
      FROM "Club" c
      INNER JOIN "Locality" l ON l.id = c."localityId"
      INNER JOIN "Province" p ON p.id = l."provinceId"
      LEFT JOIN "_ClubToCompetition" c2c ON c2c."A" = c.id
      LEFT JOIN "Competition" comp ON comp.id = c2c."B" AND comp.type != 'ORGANIZATION' AND comp.level IS NOT NULL
      WHERE translate(LOWER(c."fullName"), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(COALESCE(c."shortName", '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(COALESCE(c.nickname, '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(c.slug), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(l.name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(p.name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
      GROUP BY c.id, c."fullName"
      ORDER BY COALESCE(MIN(comp.level), 8) ASC, c."fullName" ASC
      LIMIT 20
    `;

    const clubIds = rawClubs.map((c) => c.id);
    if (!clubIds || clubIds.length === 0) return [];

    const fullClubs = await prisma.club.findMany({
      where: { id: { in: clubIds } },
      include: {
        locality: { include: { province: true } },
        competitions: { select: { id: true, name: true, type: true, level: true } },
        titles: { select: { id: true, name: true, count: true } },
      },
    });

    // Mantenemos el orden de jerarquía del query SQL
    const map = new Map(fullClubs.map((c) => [c.id, c]));
    return clubIds.map((id) => map.get(id)).filter(Boolean);
  } catch (e) {
    console.warn("Raw SQL search for admin failed, falling back to prisma findMany:", e);
    return prisma.club.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { shortName: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        locality: { include: { province: true } },
        competitions: { select: { id: true, name: true, type: true, level: true } },
        titles: { select: { id: true, name: true, count: true } },
      },
      take: 20,
    });
  }
}

export async function getClubLocation(clubId: string) {
  try {
    const res = await prisma.$queryRaw<{ lng: number; lat: number }[]>`
      SELECT ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat
      FROM "Club" WHERE id = CAST(${clubId} AS UUID) LIMIT 1
    `;
    return res.length ? { lat: res[0].lat, lng: res[0].lng } : null;
  } catch {
    return null;
  }
}