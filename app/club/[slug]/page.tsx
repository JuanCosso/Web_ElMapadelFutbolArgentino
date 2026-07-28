import { notFound } from "next/navigation";
import {prisma} from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

// 1. Generamos los Metadata para SEO (Para que quede lindo al pasarlo por WhatsApp)
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const club = await prisma.club.findUnique({ where: { slug }, select: { fullName: true, crestUrl: true } });
  
  if (!club) return { title: "Club no encontrado" };
  return {
    title: `${club.fullName} | Mapa del Fútbol Argentino`,
    description: `Toda la información, ubicación e historia de ${club.fullName}.`,
    openGraph: { images: [club.crestUrl || ""] }
  };
}

// 2. La página (Server Component)
export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      locality: { include: { province: true } },
      localLeague: true,
      competitions: true,
      titles: true
    }
  });

  if (!club) notFound();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar Simple */}
      <header className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <Link href="/" className="font-bold">⬅ Volver al Mapa</Link>
        <span className="text-sm">El Mapa del Fútbol Argentino</span>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
          
          <img 
            src={club.crestUrl || `/badges/${club.slug}.webp`} 
            alt={`Escudo de ${club.fullName}`} 
            className="w-48 h-48 object-contain"
          />
          
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h1 className="text-4xl font-extrabold text-gray-900">{club.fullName}</h1>
            
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                📍 {club.locality.name}, {club.locality.province.name}
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                ⚽ {club.localLeague?.name || "Directamente Afiliado a AFA"}
              </span>
            </div>

            {/* Datos extras (Estadio, Fundación, etc) */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Fundación</p>
                <p className="text-gray-900">{club.foundation || "Desconocida"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Apodo</p>
                <p className="text-gray-900">{club.nickname || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Estadio</p>
                <p className="text-gray-900">{club.stadiumName || "No posee"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Capacidad</p>
                <p className="text-gray-900">{club.stadiumCapacity ? club.stadiumCapacity.toLocaleString("es-AR") : "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección Historia */}
        {club.history && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mt-6">
            <h2 className="text-xl font-bold mb-4">Historia</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{club.history}</p>
          </div>
        )}
      </main>
    </div>
  );
}