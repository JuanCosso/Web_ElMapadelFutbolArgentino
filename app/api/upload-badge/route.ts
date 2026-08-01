import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const key = body.key || body.club_id;
    const data = body.data;
    const folder = body.folder || "badges";

    if (!key || !data) {
      return NextResponse.json({ error: "Faltan parámetros requeridos (key/club_id, data)" }, { status: 400 });
    }

    const safeKey = String(key)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9_-]+/g, "-");

    const targetFolder = folder === "leagues" ? "leagues" : folder === "competitions" ? "competitions" : "badges";
    const dirPath = path.join(process.cwd(), "public", targetFolder);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const fileName = `${safeKey}.webp`;
    const filePath = path.join(dirPath, fileName);

    fs.writeFileSync(filePath, buffer);

    const logoUrl = `/${targetFolder}/${fileName}`;

    return NextResponse.json({ success: true, logo_url: logoUrl, badge_url: logoUrl });
  } catch (error: unknown) {
    console.error("Error al guardar escudo:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Error al guardar el archivo" }, { status: 500 });
  }
}
