import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { key, folder, data } = await req.json();

    if (!key || !data) {
      return NextResponse.json({ error: "Faltan parámetros requeridos (key, data)" }, { status: 400 });
    }

    // Clean key for file name
    const safeKey = key
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9_-]+/g, "-");

    const targetFolder = folder === "leagues" ? "leagues" : folder === "competitions" ? "competitions" : "badges";
    const dirPath = path.join(process.cwd(), "public", targetFolder);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Extract base64
    const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const fileName = `${safeKey}.webp`;
    const filePath = path.join(dirPath, fileName);

    fs.writeFileSync(filePath, buffer);

    const logoUrl = `/${targetFolder}/${fileName}`;

    return NextResponse.json({ success: true, logo_url: logoUrl });
  } catch (error: unknown) {
    console.error("Error al guardar logo/escudo:", error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || "Error al guardar el archivo" }, { status: 500 });
  }
}
