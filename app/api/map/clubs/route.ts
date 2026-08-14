import { getClubFeatureCollection } from "@/lib/services/map";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getClubFeatureCollection());
}
