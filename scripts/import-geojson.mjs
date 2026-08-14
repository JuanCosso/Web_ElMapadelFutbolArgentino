import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const dataPath = new URL("../public/data/", import.meta.url);

function normalize(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugify(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function provinceName(properties) {
  return properties?.name ?? properties?.nombre ?? properties?.provincia ?? properties?.NOMBRE;
}

function clubProperties(feature) {
  const properties = feature.properties ?? {};
  return {
    id: String(properties.club_id ?? properties.slug ?? ""),
    name: String(properties.name ?? properties.nombre ?? "Club"),
    fullName: String(properties.full_name ?? properties.fullName ?? properties.name ?? "Club"),
    province: String(properties.province ?? properties.provincia ?? ""),
    city: String(properties.city ?? properties.ciudad ?? ""),
    league: properties.league ?? properties.liga ?? null,
    crestUrl: properties.badge_url ?? properties.badgeUrl ?? properties.badge ?? null,
    coordinates: feature.geometry?.coordinates,
  };
}

async function readGeoJson(fileName) {
  return JSON.parse(await readFile(new URL(fileName, dataPath), "utf8"));
}

async function upsertProvince(feature) {
  const name = String(provinceName(feature.properties) ?? "");
  if (!name || !feature.geometry) return null;

  const slug = slugify(name);
  const geometry = JSON.stringify(feature.geometry);
  const rows = await prisma.$queryRaw`
    INSERT INTO "Province" ("id", "name", "slug", "boundary")
    VALUES (
      ${randomUUID()}::uuid,
      ${name},
      ${slug},
      ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(${geometry}), 4326))
    )
    ON CONFLICT ("slug") DO UPDATE SET
      "name" = EXCLUDED."name",
      "boundary" = EXCLUDED."boundary"
    RETURNING "id", "name", "slug"
  `;

  return rows[0];
}

async function main() {
  const [clubsGeoJson, provincesGeoJson] = await Promise.all([
    readGeoJson("clubs.geojson"),
    readGeoJson("provincias.geojson"),
  ]);

  const provinces = new Map();
  for (const feature of provincesGeoJson.features ?? []) {
    const province = await upsertProvince(feature);
    if (province) provinces.set(normalize(province.name), province);
  }

  const clubs = (clubsGeoJson.features ?? [])
    .map(clubProperties)
    .filter(
      (club) =>
        club.id &&
        club.province &&
        club.city &&
        Array.isArray(club.coordinates) &&
        club.coordinates.length === 2,
    );

  const localities = new Map();
  for (const club of clubs) {
    const key = `${normalize(club.province)}|${normalize(club.city)}`;
    const item = localities.get(key) ?? {
      name: club.city,
      provinceName: club.province,
      coordinates: [],
    };
    item.coordinates.push(club.coordinates);
    localities.set(key, item);
  }

  const localityIds = new Map();
  for (const [key, locality] of localities) {
    const province = provinces.get(normalize(locality.provinceName));
    if (!province) throw new Error(`Provincia no encontrada: ${locality.provinceName}`);

    const [longitude, latitude] = locality.coordinates.reduce(
      ([sumLongitude, sumLatitude], [lng, lat]) => [sumLongitude + Number(lng), sumLatitude + Number(lat)],
      [0, 0],
    );
    const count = locality.coordinates.length;
    const rows = await prisma.$queryRaw`
      INSERT INTO "Locality" ("id", "provinceId", "name", "slug", "type", "location")
      VALUES (
        ${randomUUID()}::uuid,
        ${province.id}::uuid,
        ${locality.name},
        ${slugify(locality.name)},
        'CITY'::"LocalityType",
        ST_SetSRID(ST_MakePoint(${longitude / count}, ${latitude / count}), 4326)
      )
      ON CONFLICT ("provinceId", "slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "location" = EXCLUDED."location"
      RETURNING "id"
    `;
    localityIds.set(key, rows[0].id);
  }

  const leagueIds = new Map();
  for (const club of clubs) {
    if (!club.league) continue;
    const province = provinces.get(normalize(club.province));
    const key = `${normalize(club.province)}|${normalize(club.league)}`;
    if (leagueIds.has(key)) continue;

    const rows = await prisma.$queryRaw`
      INSERT INTO "LocalLeague" ("id", "name", "slug", "provinceId")
      VALUES (
        ${randomUUID()}::uuid,
        ${String(club.league)},
        ${`${province.slug}-${slugify(club.league)}`},
        ${province.id}::uuid
      )
      ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"
      RETURNING "id"
    `;
    leagueIds.set(key, rows[0].id);
  }

  for (const club of clubs) {
    const localityKey = `${normalize(club.province)}|${normalize(club.city)}`;
    const leagueKey = club.league ? `${normalize(club.province)}|${normalize(club.league)}` : null;
    const [longitude, latitude] = club.coordinates.map(Number);

    await prisma.$executeRaw`
      INSERT INTO "Club" (
        "id", "localityId", "localLeagueId", "fullName", "shortName", "slug", "crestUrl", "location", "verified", "updatedAt"
      ) VALUES (
        ${randomUUID()}::uuid,
        ${localityIds.get(localityKey)}::uuid,
        ${leagueKey ? leagueIds.get(leagueKey) : null}::uuid,
        ${club.fullName},
        ${club.name},
        ${club.id},
        ${club.crestUrl},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        false,
        NOW()
      )
      ON CONFLICT ("slug") DO UPDATE SET
        "localityId" = EXCLUDED."localityId",
        "localLeagueId" = EXCLUDED."localLeagueId",
        "fullName" = EXCLUDED."fullName",
        "shortName" = EXCLUDED."shortName",
        "crestUrl" = EXCLUDED."crestUrl",
        "location" = EXCLUDED."location",
        "updatedAt" = NOW()
    `;
  }

  await prisma.$executeRawUnsafe('ALTER TABLE "Province" ALTER COLUMN "boundary" SET NOT NULL');
  await prisma.$executeRawUnsafe('ALTER TABLE "LocalLeague" ALTER COLUMN "slug" SET NOT NULL');

  console.log(
    JSON.stringify({
      provinces: provinces.size,
      localities: localityIds.size,
      localLeagues: leagueIds.size,
      clubs: clubs.length,
    }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
