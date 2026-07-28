"use server";

import { prisma } from "@/lib/prisma";

export type CompetitionType = "LEAGUE" | "CUP" | "TOURNAMENT";

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

export async function upsertCompetition(data: {
  id?: string | null;
  name: string;
  slug?: string;
  type: CompetitionType;
  level?: number | null;
  parentId?: string | null;
  logoUrl?: string | null;
  foundation?: string | null;
}) {
  try {
    const name = data.name.trim();
    if (!name) {
      return { error: "El nombre de la competencia es obligatorio" };
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
      type: data.type,
      level: data.level !== undefined && data.level !== null && !isNaN(Number(data.level)) ? Number(data.level) : null,
      parentId: data.parentId || null,
      logoUrl: data.logoUrl || null,
      foundation: data.foundation || null,
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
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "P2002") {
      return { error: "Ya existe una competencia con este slug/identificador." };
    }
    return { error: err.message || "Error al guardar la competencia." };
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

// --- Regional / Local Leagues ---

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
      logoUrl: data.logoUrl || null,
      foundation: data.foundation || null,
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
