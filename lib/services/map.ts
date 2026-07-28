import { prisma } from "@/lib/prisma";

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
      ST_Y(c."location")::double precision AS "latitude"
    FROM "Club" c
    INNER JOIN "Locality" l ON l."id" = c."localityId"
    INNER JOIN "Province" p ON p."id" = l."provinceId"
    LEFT JOIN "LocalLeague" ll ON ll."id" = c."localLeagueId"
    ORDER BY p."name", l."name", c."fullName"
  `;

  return {
    type: "FeatureCollection",
    features: rows.map((club) => ({
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
        badge_url: club.crestUrl,
      },
    })),
  };
}

export async function getProvinceFeatureCollection(): Promise<GeoJSON.FeatureCollection> {
  const rows = await prisma.$queryRaw<ProvinceMapRow[]>`
    SELECT
      p."id",
      p."name",
      p."slug",
      ST_AsGeoJSON(p."boundary")::json AS "geometry",
      COUNT(DISTINCT c."id")::integer AS "clubCount",
      COUNT(DISTINCT c."localLeagueId")::integer AS "leagueCount"
    FROM "Province" p
    LEFT JOIN "Locality" l ON l."provinceId" = p."id"
    LEFT JOIN "Club" c ON c."localityId" = l."id"
    GROUP BY p."id"
    ORDER BY p."name"
  `;

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

export async function getClubDetail(slug: string) {
  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      locality: { include: { province: true } },
      localLeague: true,
      titles: { orderBy: { name: "asc" } },
    },
  });

  if (!club) return null;

  return {
    club_id: club.slug,
    name: club.shortName ?? club.fullName,
    full_name: club.fullName,
    founded: club.foundedYear,
    nickname: club.nickname,
    province: club.locality.province.name,
    city: club.locality.name,
    league: club.localLeague?.name ?? null,
    stadium: club.stadiumName,
    stadium_capacity: club.stadiumCapacity,
    honours: club.titles.map((title) => ({ title: title.name, count: title.count })),
  };
}
