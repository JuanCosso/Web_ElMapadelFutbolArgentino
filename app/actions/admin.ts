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

// Buscador unificado que devuelve la info completa del club para el form
export async function searchFullClubsForAdmin(query: string) {
  if (!query || query.trim().length < 2) return [];
  
  const clubs = await prisma.club.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { shortName: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } }
      ]
    },
    include: {
      locality: { 
        include: { province: true } // Traemos la provincia para mostrar en la UI
      },
      competitions: { select: { id: true, name: true, type: true, level: true } },
      titles: { select: { id: true, name: true, count: true } },
    },
    take: 12
  });

  return clubs;
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