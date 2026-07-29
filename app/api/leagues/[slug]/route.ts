import { getLeagueDetail } from "@/lib/services/map";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const league = await getLeagueDetail(slug);

  if (!league) {
    return Response.json({ error: "Liga no encontrada" }, { status: 404 });
  }

  return Response.json(league);
}
