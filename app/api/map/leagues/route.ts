import { getLeaguesForSearch } from "@/lib/services/map";

export const dynamic = "force-dynamic";

export async function GET() {
  const leagues = await getLeaguesForSearch();
  return Response.json(leagues);
}
