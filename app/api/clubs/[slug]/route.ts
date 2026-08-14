import { getClubDetail } from "@/lib/services/map";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const club = await getClubDetail(slug);

  if (!club) {
    return Response.json({ error: "Club no encontrado" }, { status: 404 });
  }

  return Response.json(club);
}
