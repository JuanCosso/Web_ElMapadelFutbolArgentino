-- CreateEnum
CREATE TYPE "LocalityType" AS ENUM ('CITY', 'TOWN');

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('LEAGUE', 'CUP', 'TOURNAMENT');

-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Province" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isoCode" TEXT,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locality" (
    "id" UUID NOT NULL,
    "provinceId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "LocalityType" NOT NULL,
    "location" geometry(Point,4326) NOT NULL,

    CONSTRAINT "Locality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocalLeague" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" UUID NOT NULL,
    "localityId" UUID NOT NULL,
    "organizer" TEXT NOT NULL,

    CONSTRAINT "LocalLeague_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" UUID NOT NULL,
    "localityId" UUID NOT NULL,
    "localLeagueId" UUID,
    "fullName" TEXT NOT NULL,
    "shortName" TEXT,
    "slug" TEXT NOT NULL,
    "nickname" TEXT,
    "foundedYear" INTEGER,
    "crestUrl" TEXT,
    "stadiumName" TEXT,
    "stadiumCapacity" INTEGER,
    "location" geometry(Point,4326) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "CompetitionType" NOT NULL,
    "level" INTEGER,
    "parentId" UUID,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Title" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Title_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClubToCompetition" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_ClubToCompetition_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Province_slug_key" ON "Province"("slug");

-- CreateIndex
CREATE INDEX "Locality_provinceId_idx" ON "Locality"("provinceId");

-- CreateIndex
CREATE INDEX "Locality_location_idx" ON "Locality" USING GIST ("location");

-- CreateIndex
CREATE UNIQUE INDEX "Locality_provinceId_slug_key" ON "Locality"("provinceId", "slug");

-- CreateIndex
CREATE INDEX "LocalLeague_provinceId_idx" ON "LocalLeague"("provinceId");

-- CreateIndex
CREATE INDEX "LocalLeague_localityId_idx" ON "LocalLeague"("localityId");

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");

-- CreateIndex
CREATE INDEX "Club_localityId_idx" ON "Club"("localityId");

-- CreateIndex
CREATE INDEX "Club_localLeagueId_idx" ON "Club"("localLeagueId");

-- CreateIndex
CREATE INDEX "Club_verified_idx" ON "Club"("verified");

-- CreateIndex
CREATE INDEX "Club_location_idx" ON "Club" USING GIST ("location");

-- CreateIndex
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");

-- CreateIndex
CREATE INDEX "Competition_parentId_idx" ON "Competition"("parentId");

-- CreateIndex
CREATE INDEX "Competition_type_idx" ON "Competition"("type");

-- CreateIndex
CREATE INDEX "Title_clubId_idx" ON "Title"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "Title_clubId_name_key" ON "Title"("clubId", "name");

-- CreateIndex
CREATE INDEX "Suggestion_clubId_status_idx" ON "Suggestion"("clubId", "status");

-- CreateIndex
CREATE INDEX "Suggestion_createdAt_idx" ON "Suggestion"("createdAt");

-- CreateIndex
CREATE INDEX "_ClubToCompetition_B_index" ON "_ClubToCompetition"("B");

-- AddForeignKey
ALTER TABLE "Locality" ADD CONSTRAINT "Locality_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalLeague" ADD CONSTRAINT "LocalLeague_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocalLeague" ADD CONSTRAINT "LocalLeague_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "Locality"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_localLeagueId_fkey" FOREIGN KEY ("localLeagueId") REFERENCES "LocalLeague"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Title" ADD CONSTRAINT "Title_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClubToCompetition" ADD CONSTRAINT "_ClubToCompetition_A_fkey" FOREIGN KEY ("A") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClubToCompetition" ADD CONSTRAINT "_ClubToCompetition_B_fkey" FOREIGN KEY ("B") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
