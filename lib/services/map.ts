import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

function normKey(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

type ClubMapRow = {
  id: string;
  slug: string;
  fullName: string;
  shortName: string | null;
  crestUrl: string | null;
  province: string;
  city: string;
  league: string | null;
  longitude: number;
  latitude: number;
};

type ProvinceMapRow = {
  id: string;
  name: string;
  slug: string;
  geometry: GeoJSON.Geometry;
  clubCount: number;
  leagueCount: number;
};

export type ClubFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  {
    club_id: string;
    name: string;
    full_name: string;
    province: string;
    city: string;
    league: string | null;
    badge_url: string | null;
  }
>;

export async function getClubFeatureCollection(): Promise<ClubFeatureCollection> {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await prisma.$queryRaw<ClubMapRow[]>`
        SELECT
          c."id",
          c."slug",
          c."fullName",
          c."shortName",
          c."crestUrl",
          p."name" AS "province",
          l."name" AS "city",
          ll."name" AS "league",
          ST_X(c."location")::double precision AS "longitude",
          ST_Y(c."location")::double precision AS "latitude",
          COALESCE(MIN(comp."level"), 8)::integer AS "level"
        FROM "Club" c
        INNER JOIN "Locality" l ON l."id" = c."localityId"
        INNER JOIN "Province" p ON p."id" = l."provinceId"
        LEFT JOIN "LocalLeague" ll ON ll."id" = c."localLeagueId"
        LEFT JOIN "_ClubToCompetition" c2comp ON c2comp."B" = c."id"
        LEFT JOIN "Competition" comp ON comp."id" = c2comp."A" AND comp."type" != 'ORGANIZATION' AND comp."level" IS NOT NULL
        GROUP BY c."id", c."slug", c."fullName", c."shortName", c."crestUrl", p."name", l."name", ll."name", c."location"
        ORDER BY COALESCE(MIN(comp."level"), 8) DESC, c."fullName" ASC
      `;

      if (rows && rows.length > 0) {
        return {
          type: "FeatureCollection",
          features: rows.map((club: any) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [Number(club.longitude), Number(club.latitude)],
            },
            properties: {
              club_id: club.slug,
              name: club.shortName ?? club.fullName,
              full_name: club.fullName,
              province: club.province,
              city: club.city,
              league: club.league,
              badge_url: club.crestUrl || `/badges/${club.slug}.webp`,
              level: Number(club.level ?? 8),
              sort_order: 100 - Number(club.level ?? 8),
            },
          })),
        };
      }
    } catch (e) {
      console.warn("DB query for clubs failed, using fallback GeoJSON:", e);
    }
  }

  // Fallback to static GeoJSON file in /public/data/clubs.geojson
  try {
    const filePath = path.join(process.cwd(), "public", "data", "clubs.geojson");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed?.features) {
        parsed.features.forEach((f: any) => {
          const p = f.properties || {};
          const level = p.level !== undefined ? Number(p.level) : 8;
          p.level = level;
          p.sort_order = 100 - level;
        });
        parsed.features.sort((a: any, b: any) => (a.properties?.sort_order ?? 0) - (b.properties?.sort_order ?? 0));
      }
      return parsed;
    }
  } catch (err) {
    console.error("Failed to read fallback clubs.geojson:", err);
  }

  return { type: "FeatureCollection", features: [] };
}

export async function getProvinceFeatureCollection(): Promise<GeoJSON.FeatureCollection> {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await prisma.$queryRaw<ProvinceMapRow[]>`
        SELECT
          p."id",
          p."name",
          p."slug",
          ST_AsGeoJSON(p."boundary")::json AS "geometry",
          (
            SELECT COUNT(DISTINCT c."id")::integer
            FROM "Locality" l
            JOIN "Club" c ON c."localityId" = l."id"
            WHERE l."provinceId" = p."id"
          ) AS "clubCount",
          (
            SELECT COUNT(DISTINCT ll."id")::integer
            FROM "LocalLeague" ll
            WHERE ll."provinceId" = p."id"
          ) AS "leagueCount"
        FROM "Province" p
        ORDER BY p."name"
      `;

      if (rows && rows.length > 0) {
        return {
          type: "FeatureCollection",
          features: rows.map((province) => ({
            type: "Feature",
            id: province.id,
            geometry: province.geometry,
            properties: {
              id: province.id,
              name: province.name,
              slug: province.slug,
              club_count: Number(province.clubCount),
              league_count: Number(province.leagueCount),
            },
          })),
        };
      }
    } catch (e) {
      console.warn("DB query for provinces failed, using fallback GeoJSON:", e);
    }
  }

  // Fallback to static GeoJSON file in /public/data/provincias.geojson
  try {
    const filePath = path.join(process.cwd(), "public", "data", "provincias.geojson");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read fallback provincias.geojson:", err);
  }

  return { type: "FeatureCollection", features: [] };
}

export async function getClubDetail(slug: string) {
  if (process.env.DATABASE_URL) {
    try {
      const club = await prisma.club.findUnique({
        where: { slug },
        include: {
          locality: { include: { province: true } },
          localLeague: true,
          titles: { orderBy: { name: "asc" } },
        },
      });

      if (club) {
        return {
          club_id: club.slug,
          name: club.shortName ?? club.fullName,
          full_name: club.fullName,
          founded: club.foundation,
          nickname: club.nickname,
          province: club.locality.province.name,
          city: club.locality.name,
          league: club.localLeague?.name ?? null,
          stadium: club.stadiumName,
          stadiumCapacity: club.stadiumCapacity,
          stadium_capacity: club.stadiumCapacity,
          badgeUrl: club.crestUrl,
          badge_url: club.crestUrl,
          short_history: club.history,
          history: club.history,
          honours: club.titles.map((title) => ({ title: title.name, count: title.count })),
        };
      }
    } catch (e) {
      console.warn("DB query for club detail failed, searching fallback:", e);
    }
  }

  // Fallback: check /public/clubs/[slug].json
  try {
    const filePath = path.join(process.cwd(), "public", "clubs", `${slug}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return {
        ...data,
        short_history: data.short_history || data.history,
        history: data.history || data.short_history,
        badgeUrl: data.badgeUrl || data.badge_url || data.crestUrl,
        stadiumCapacity: data.stadiumCapacity || data.stadium_capacity,
      };
    }
  } catch {}

  return null;
}

export async function getLeaguesForSearch() {
  if (!process.env.DATABASE_URL) return [];
  try {
    const [leagues, competitions] = await Promise.all([
      prisma.localLeague.findMany({
        include: { province: { select: { name: true } } },
      }),
      prisma.competition.findMany(),
    ]);

    const leagueItems = leagues.map((l) => ({
      type: "league" as const,
      key: `league-${l.slug}`,
      league_id: l.slug,
      label: l.name,
      sublabel: l.province ? `Liga Regional · ${l.province.name}` : "Liga Regional",
      province: l.province?.name,
      logo_url: l.logoUrl || undefined,
      foundation: l.foundation || undefined,
    }));

    const compItems = competitions.map((c) => ({
      type: "league" as const,
      key: `comp-${c.slug}`,
      league_id: c.slug,
      label: c.name,
      sublabel: c.level ? `Torneo Oficial · Nivel ${c.level}` : "Torneo / Ente Oficial",
      logo_url: c.logoUrl || undefined,
      foundation: c.foundation || undefined,
    }));

    return [...leagueItems, ...compItems];
  } catch (e) {
    console.warn("Failed to fetch leagues for search index:", e);
    return [];
  }
}

export async function getLeagueDetail(slug: string) {
  if (process.env.DATABASE_URL) {
    try {
      // 1. Probar en LocalLeague
      const league = await prisma.localLeague.findUnique({
        where: { slug },
        include: {
          province: true,
          clubs: {
            include: { titles: true },
          },
        },
      });

      if (league) {
        const targetName = normKey(league.name);
        const champions = league.clubs
          .map((c) => {
            // Filtrar títulos pertenecientes específicamente a esta liga
            const leagueTitles = c.titles.filter((t) => {
              const tName = normKey(t.name);
              return tName.includes(targetName) || targetName.includes(tName);
            });
            const titleCount = leagueTitles.reduce((acc, t) => acc + (t.count || 1), 0);
            return {
              clubId: c.slug,
              name: c.shortName || c.fullName,
              fullName: c.fullName,
              crestUrl: c.crestUrl || `/badges/${c.slug}.webp`,
              titleCount,
            };
          })
          .sort((a, b) => b.titleCount - a.titleCount);

        return {
          type: "league" as const,
          league_id: league.slug,
          name: league.name,
          slug: league.slug,
          province: league.province.name,
          organizer: league.organizer,
          foundation: league.foundation,
          logoUrl: league.logoUrl,
          champions,
        };
      }

      // 2. Probar en Competition
      const comp = await prisma.competition.findUnique({
        where: { slug },
        include: {
          clubs: {
            include: { titles: true },
          },
        },
      });

      if (comp) {
        const targetName = normKey(comp.name);
        const champions = comp.clubs
          .map((c) => {
            // Filtrar títulos pertenecientes específicamente a esta competencia
            const compTitles = c.titles.filter((t) => {
              const tName = normKey(t.name);
              return tName.includes(targetName) || targetName.includes(tName);
            });
            const titleCount = compTitles.reduce((acc, t) => acc + (t.count || 1), 0);
            return {
              clubId: c.slug,
              name: c.shortName || c.fullName,
              fullName: c.fullName,
              crestUrl: c.crestUrl || `/badges/${c.slug}.webp`,
              titleCount,
            };
          })
          .sort((a, b) => b.titleCount - a.titleCount);

        return {
          type: "competition" as const,
          league_id: comp.slug,
          name: comp.name,
          slug: comp.slug,
          level: comp.level,
          foundation: comp.foundation,
          logoUrl: comp.logoUrl,
          champions,
        };
      }
    } catch (e) {
      console.warn("Error fetching league detail:", e);
    }
  }

  return null;
}


