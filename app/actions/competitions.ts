"use server";

import { prisma } from "@/lib/prisma";
import { CompetitionType } from "@prisma/client";

export type CompetitionItem = {
  id: string;
  name: string;
  slug: string;
  type: CompetitionType;
  level: number | null;
  parentId: string | null;
  logoUrl?: string | null;
  foundation?: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { clubs: number };
};

export type LocalLeagueItem = {
  id: string;
  name: string;
  slug: string;
  provinceId: string;
  localityId?: string | null;
  organizer?: string | null;
  logoUrl?: string | null;
  foundation?: string | null;
  province?: { id: string; name: string };
  locality?: { id: string; name: string } | null;
  _count?: { clubs: number };
};

export interface UpsertCompetitionInput {
  id?: string | null;
  name: string;
  slug?: string;
  type: CompetitionType;
  level?: number | null;
  parentId?: string | null;
  foundation?: string | null;
  logoUrl?: string | null;
}

export async function getCompetitions(): Promise<CompetitionItem[]> {
  try {
    const competitions = await prisma.competition.findMany({
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { clubs: true } },
      },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });
    return competitions as CompetitionItem[];
  } catch (error) {
    console.error("Error fetching competitions:", error);
    return [];
  }
}

export async function upsertCompetition(data: UpsertCompetitionInput) {
  try {
    const name = data.name?.trim();
    if (!name) {
      return { error: "El nombre de la competencia es obligatorio." };
    }

    const slug =
      data.slug?.trim() ||
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    if (!slug) return { error: "El slug identificador no puede estar vacío." };

    const parentId =
      data.parentId && data.parentId.trim() !== "" && data.parentId.trim() !== "null"
        ? data.parentId.trim()
        : null;

    const level =
      data.level !== undefined && data.level !== null && !isNaN(Number(data.level))
        ? Number(data.level)
        : null;

    const existingSlug = await prisma.competition.findUnique({ where: { slug } });
    if (existingSlug && existingSlug.id !== data.id) {
      return { error: `Ya existe una competencia con el slug "${slug}".` };
    }

    if (parentId) {
      if (data.id && parentId === data.id) {
        return { error: "Una competencia no puede ser su propio padre." };
      }
      const parentExists = await prisma.competition.findUnique({ where: { id: parentId } });
      if (!parentExists) {
        return { error: "La competencia padre seleccionada no existe en la base de datos." };
      }
    }

    const payload = {
      name,
      slug,
      type: data.type,
      level,
      parentId, 
      // 🟢 Forzamos conversión segura a string
      foundation: data.foundation ? String(data.foundation).trim() : null,
      logoUrl: data.logoUrl ? String(data.logoUrl).trim() : null,
    };

    if (data.id) {
      const updated = await prisma.competition.update({
        where: { id: data.id },
        data: payload,
      });
      return { success: true, competition: updated }; 
    } else {
      const created = await prisma.competition.create({
        data: payload,
      });
      return { success: true, competition: created };
    }
  } catch (error: any) {
    console.error("Error al guardar competencia en Prisma:", error);
    if (error.code === "P2002") {
      return { error: "Ya existe un registro con ese slug único." };
    }
    if (error.code === "P2003") {
      return { error: "El ID del padre no existe en la base de datos." };
    }
    return { error: error.message || "Error al guardar la competencia." };
  }
}

export async function deleteCompetition(id: string) {
  try {
    await prisma.competition.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "No se pudo eliminar la competencia." };
  }
}

export async function getLocalLeagues(): Promise<LocalLeagueItem[]> {
  try {
    const leagues = await prisma.localLeague.findMany({
      include: {
        province: { select: { id: true, name: true } },
        locality: { select: { id: true, name: true } },
        _count: { select: { clubs: true } },
      },
      orderBy: { name: "asc" },
    });
    return leagues as LocalLeagueItem[];
  } catch (error) {
    console.error("Error fetching local leagues:", error);
    return [];
  }
}

export async function upsertLocalLeague(data: {
  id?: string | null;
  name: string;
  slug?: string;
  provinceId: string;
  localityId?: string | null;
  organizer?: string | null;
  logoUrl?: string | null;
  foundation?: string | null;
}) {
  try {
    const name = data.name.trim();
    if (!name || !data.provinceId) {
      return { error: "El nombre y la provincia de la liga regional son obligatorios." };
    }

    const slug =
      data.slug?.trim() ||
      name
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const payload = {
      name,
      slug,
      provinceId: data.provinceId,
      localityId: data.localityId || null,
      organizer: data.organizer || null,
      logoUrl: data.logoUrl ? String(data.logoUrl).trim() : null,
      foundation: data.foundation ? String(data.foundation).trim() : null,
    };

    if (data.id) {
      const updated = await prisma.localLeague.update({
        where: { id: data.id },
        data: payload,
      });
      return { success: true, league: updated };
    } else {
      const created = await prisma.localLeague.create({
        data: payload,
      });
      return { success: true, league: created };
    }
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "P2002") {
      return { error: "Ya existe una liga regional con este slug/identificador." };
    }
    return { error: err.message || "Error al guardar la liga regional." };
  }
}

export async function deleteLocalLeague(id: string) {
  try {
    await prisma.localLeague.delete({
      where: { id },
    });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "No se pudo eliminar la liga regional." };
  }
}

export async function mergeDuplicateLeagues(targetLeagueId: string, sourceLeagueId: string) {
  try {
    // 1. Reasignar todos los clubes de la liga duplicada hacia la liga principal
    await prisma.club.updateMany({
      where: { localLeagueId: sourceLeagueId },
      data: { localLeagueId: targetLeagueId },
    });
    // 2. Eliminar el registro duplicado sobrante
    await prisma.localLeague.delete({
      where: { id: sourceLeagueId },
    });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "Error al fusionar las ligas duplicadas." };
  }
}

export async function autoMergeDuplicateLocalLeagues() {
  try {
    const leagues = await prisma.localLeague.findMany({
      include: { province: true, clubs: true },
    });

    const groups: Record<string, typeof leagues> = {};
    for (const l of leagues) {
      const norm = l.name.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
      if (!groups[norm]) groups[norm] = [];
      groups[norm].push(l);
    }

    let mergedCount = 0;
    for (const norm in groups) {
      const list = groups[norm];
      if (list.length > 1) {
        list.sort((a, b) => b.clubs.length - a.clubs.length);
        const main = list[0];
        const duplicates = list.slice(1);

        for (const dup of duplicates) {
          await prisma.club.updateMany({
            where: { localLeagueId: dup.id },
            data: { localLeagueId: main.id },
          });
          await prisma.localLeague.delete({ where: { id: dup.id } });
          mergedCount++;
        }
      }
    }
    return { success: true, mergedCount };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "Error al auto-fusionar ligas duplicadas." };
  }
}

export async function setClubTitleCountFromAdmin(
  clubId: string,
  titleName: string,
  count: number,
  mode: "SET" | "ADD" = "SET"
) {
  try {
    if (!clubId || !titleName) return { error: "Faltan datos requeridos para registrar el título." };
    const cleanTitle = titleName.trim();
    const finalCount = Math.max(0, count);

    const existing = await prisma.title.findFirst({
      where: { clubId, name: cleanTitle },
    });

    if (finalCount === 0 && existing) {
      // Si la cantidad se fija en 0, eliminar el título
      await prisma.title.delete({ where: { id: existing.id } });
      return { success: true };
    }

    if (existing) {
      const newCount = mode === "SET" ? finalCount : (existing.count || 1) + finalCount;
      await prisma.title.update({
        where: { id: existing.id },
        data: { count: newCount },
      });
    } else if (finalCount > 0) {
      await prisma.title.create({
        data: { clubId, name: cleanTitle, count: finalCount },
      });
    }
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "Error al actualizar el título." };
  }
}

export async function addClubTitleFromAdmin(clubId: string, titleName: string, count: number = 1) {
  return setClubTitleCountFromAdmin(clubId, titleName, count, "ADD");
}

export async function getClubsByLeagueId(localLeagueId: string) {
  try {
    const clubs = await prisma.club.findMany({
      where: { localLeagueId },
      select: {
        id: true,
        fullName: true,
        shortName: true,
        slug: true,
        crestUrl: true,
        locality: {
          select: {
            name: true,
            province: { select: { name: true } }
          }
        },
        titles: {
          select: { id: true, name: true, count: true }
        }
      },
      orderBy: { fullName: "asc" },
    });
    return clubs;
  } catch (error) {
    return [];
  }
}

export async function getClubsByCompetitionId(competitionId: string) {
  try {
    const comp = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: {
        clubs: {
          select: {
            id: true,
            fullName: true,
            shortName: true,
            slug: true,
            crestUrl: true,
            locality: {
              select: {
                name: true,
                province: { select: { name: true } },
              },
            },
          },
          orderBy: { fullName: "asc" },
        },
      },
    });
    return comp?.clubs || [];
  } catch (error) {
    console.error("Error fetching clubs for competition:", error);
    return [];
  }
}

export async function addClubToCompetition(competitionId: string, clubId: string) {
  try {
    if (!competitionId || !clubId) return { error: "Identificadores inválidos." };
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        clubs: {
          connect: { id: clubId },
        },
      },
    });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "Error al agregar el club a la competencia." };
  }
}

export async function removeClubFromCompetition(competitionId: string, clubId: string) {
  try {
    if (!competitionId || !clubId) return { error: "Identificadores inválidos." };
    await prisma.competition.update({
      where: { id: competitionId },
      data: {
        clubs: {
          disconnect: { id: clubId },
        },
      },
    });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "Error al remover el club de la competencia." };
  }
}

export async function addClubToLocalLeague(localLeagueId: string, clubId: string) {
  try {
    if (!localLeagueId || !clubId) return { error: "Identificadores inválidos." };
    await prisma.club.update({
      where: { id: clubId },
      data: { localLeagueId },
    });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "Error al agregar el club a la liga regional." };
  }
}

export async function removeClubFromLocalLeague(clubId: string) {
  try {
    if (!clubId) return { error: "Identificador de club inválido." };
    await prisma.club.update({
      where: { id: clubId },
      data: { localLeagueId: null },
    });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "Error al remover el club de la liga regional." };
  }
}

export async function searchClubsForSelection(query: string) {
  if (!query || query.trim().length < 2) return [];

  const qNorm = query.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();

  try {
    const rawClubs = await prisma.$queryRaw<{ id: string }[]>`
      SELECT c.id
      FROM "Club" c
      INNER JOIN "Locality" l ON l.id = c."localityId"
      INNER JOIN "Province" p ON p.id = l."provinceId"
      WHERE translate(LOWER(c."fullName"), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(COALESCE(c."shortName", '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(COALESCE(c.nickname, '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(c.slug), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(l.name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
         OR translate(LOWER(p.name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') LIKE ${'%' + qNorm + '%'}
      ORDER BY c."fullName" ASC
      LIMIT 15
    `;

    const clubIds = rawClubs.map((c) => c.id);
    if (!clubIds || clubIds.length === 0) return [];

    const fullClubs = await prisma.club.findMany({
      where: { id: { in: clubIds } },
      select: {
        id: true,
        fullName: true,
        shortName: true,
        slug: true,
        crestUrl: true,
        localLeagueId: true,
        locality: {
          select: {
            name: true,
            province: { select: { name: true } },
          },
        },
      },
    });

    const map = new Map(fullClubs.map((c) => [c.id, c]));
    return clubIds.map((id) => map.get(id)).filter(Boolean);
  } catch (e) {
    console.warn("Fallback to prisma findMany for club selection search:", e);
    return prisma.club.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: "insensitive" } },
          { shortName: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        shortName: true,
        slug: true,
        crestUrl: true,
        localLeagueId: true,
        locality: {
          select: {
            name: true,
            province: { select: { name: true } },
          },
        },
      },
      take: 15,
    });
  }
}

export async function getCompetitionChampions(targetName: string) {
  try {
    if (!targetName) return [];
    const titles = await prisma.title.findMany({
      where: {
        name: { equals: targetName.trim(), mode: "insensitive" },
      },
      include: {
        club: {
          select: {
            id: true,
            fullName: true,
            shortName: true,
            slug: true,
            crestUrl: true,
            locality: {
              select: {
                name: true,
                province: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { count: "desc" },
    });

    return titles.map((t) => ({
      titleId: t.id,
      clubId: t.club.id,
      clubSlug: t.club.slug,
      clubName: t.club.shortName || t.club.fullName,
      clubFullName: t.club.fullName,
      crestUrl: t.club.crestUrl || `/badges/${t.club.slug}.webp`,
      titleName: t.name,
      count: t.count,
      locality: t.club.locality,
    }));
  } catch (error) {
    return [];
  }
}

export async function deleteTitleById(titleId: string) {
  try {
    if (!titleId) return { error: "ID de título no especificado." };
    await prisma.title.delete({ where: { id: titleId } });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return { error: err.message || "Error al eliminar el título." };
  }
}