-- Keep future databases self-contained: PostGIS is required by the geometry
-- columns declared in the Prisma schema.
CREATE EXTENSION IF NOT EXISTS postgis;

-- The column starts nullable so this migration is safe for an already
-- populated database. The import script fills every province boundary before
-- the NOT NULL constraint is applied.
ALTER TABLE "Province" ADD COLUMN "boundary" geometry(MultiPolygon,4326);

ALTER TABLE "LocalLeague"
  ADD COLUMN "slug" TEXT,
  ALTER COLUMN "localityId" DROP NOT NULL,
  ALTER COLUMN "organizer" DROP NOT NULL;

CREATE UNIQUE INDEX "LocalLeague_slug_key" ON "LocalLeague"("slug");
CREATE INDEX "Province_boundary_idx" ON "Province" USING GIST ("boundary");
