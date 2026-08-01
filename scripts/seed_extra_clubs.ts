import "dotenv/config";
import { prisma } from "../lib/prisma";

const features = [
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.77122, -33.00429] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__bartolome-mitre",
      "name": "Bartolomé Mitre",
      "full_name": "Club Social y Deportivo Bartolomé Mitre",
      "province": "Santa Fe",
      "city": "Pérez",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__bartolome-mitre.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.70596, -32.8931] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__el-torito",
      "name": "El Torito",
      "full_name": "Club Atlético El Torito",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__el-torito.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.68479, -32.93357] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__social-lux",
      "name": "Social Lux",
      "full_name": "Club Deportivo y Social Lux",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__social-lux.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.684943, -32.930796] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__defensores-unidos",
      "name": "Defensores Unidos",
      "full_name": "Club Atlético Defensores Unidos",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__defensores-unidos.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.61906, -33.01158] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__general-paz",
      "name": "General Paz",
      "full_name": "Club Atlético Infantil General Paz",
      "province": "Santa Fe",
      "city": "Villa Gobernador Gálvez",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__general-paz.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.81397, -32.93293] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__gran-rosario",
      "name": "Gran Rosario",
      "full_name": "Club del Gran Rosario",
      "province": "Santa Fe",
      "city": "Funes",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__gran-rosario.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.73663, -32.90956] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__7-de-setiembre",
      "name": "7 de Setiembre",
      "full_name": "Escuela de Fútbol 7 de Setiembre",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__7-de-setiembre.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.76401, -32.92897] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__fisherton",
      "name": "Fisherton",
      "full_name": "Club Atlético Fisherton",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__fisherton.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.59325, -33.05586] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__leones-de-rosario",
      "name": "Leones de Rosario",
      "full_name": "Leones de Rosario FC",
      "province": "Santa Fe",
      "city": "Alvear",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__leones-de-rosario.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.70726, -32.86613] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__botafogo",
      "name": "Botafogo",
      "full_name": "Agrupación Deportiva Botafogo",
      "province": "Santa Fe",
      "city": "Granadero Baigorria",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__botafogo.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.68388, -32.89652] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__bancario",
      "name": "Bancario",
      "full_name": "Club Bancario",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__bancario.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.76612, -32.92658] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__defensores-de-funes",
      "name": "Defensores de Funes",
      "full_name": "Club Atlético Defensores de Funes",
      "province": "Santa Fe",
      "city": "Funes",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__defensores-de-funes.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.7119, -32.88876] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__1-de-mayo",
      "name": "1° de Mayo",
      "full_name": "Club Atlético Social Deportivo y Cultural 1º de Mayo",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__1-de-mayo.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.62341, -33.00277] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__arijon",
      "name": "Arijón",
      "full_name": "Agrupación Infantil Arijón",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__arijon.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.6859, -32.95006] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__juan-xxiii",
      "name": "Juan XXIII",
      "full_name": "Asociación Deportiva Juan XXIII",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__juan-xxiii.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.71722, -32.9278] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__union-americana",
      "name": "Unión Americana",
      "full_name": "Unión Americana Fútbol Club",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__union-americana.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.69513, -32.90645] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__sparta",
      "name": "Sparta",
      "full_name": "Club Atlético Sparta",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__sparta.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.68376, -33.01699] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__san-jose",
      "name": "San José",
      "full_name": "Polideportivo Country Club San José",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__san-jose.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.71782, -32.95686] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__14-de-junio",
      "name": "14 de Junio",
      "full_name": "Club de Recreación Deportiva 14 de Junio",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__14-de-junio.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.71204, -32.96454] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__sarmiento",
      "name": "Sarmiento",
      "full_name": "Asociación Civil Sarmiento Fútbol Club",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__sarmiento.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.721, -32.917] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__maria-reina",
      "name": "María Reina",
      "full_name": "Asociación Civil Club María Reina",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__maria-reina.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.74899, -32.99711] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__estrella-azul",
      "name": "Estrella Azul",
      "full_name": "Asociación Civil Academia Estrella Azul",
      "province": "Santa Fe",
      "city": "Pérez",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__estrella-azul.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.72801, -32.92696] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__sportivo-silva",
      "name": "Sportivo Silva",
      "full_name": "Asociación Civil Sportivo Pablo Maximiliano Silva",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__sportivo-silva.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.64121, -33.01138] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__san-roque",
      "name": "San Roque",
      "full_name": "Club Atlético San Roque",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__san-roque.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.72591, -32.89699] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__olympia",
      "name": "Olympia",
      "full_name": "Escuela de Fútbol Olympia",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__olympia.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.63455, -32.99029] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__jorgito-juniors",
      "name": "Jorgito Juniors",
      "full_name": "Jorgito Juniors Fútbol Club",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__jorgito-juniors.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.68628, -32.95968] },
    "properties": {
      "club_id": "santa-fe__asociacion-rosarina-de-futbol__27-de-febrero",
      "name": "27 de Febrero",
      "full_name": "Club 27 de Febrero",
      "province": "Santa Fe",
      "city": "Rosario",
      "league": "Asociación Rosarina de Fútbol",
      "badge_url": "/badges/santa-fe__asociacion-rosarina-de-futbol__27-de-febrero.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.46729, -33.15001] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__9-de-julio",
      "name": "9 de Julio",
      "full_name": "Club Atlético 9 de Julio Mutual Social y Biblioteca",
      "province": "Santa Fe",
      "city": "Arequito",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__9-de-julio.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.46429, -33.13942] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__belgrano",
      "name": "Belgrano",
      "full_name": "Club Atlético Belgrano Mutual Social y Biblioteca",
      "province": "Santa Fe",
      "city": "Arequito",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__belgrano.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.15649, -33.05748] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__huracan-casilda",
      "name": "Huracán Casilda",
      "full_name": "Huracán Casilda Club",
      "province": "Santa Fe",
      "city": "Casilda",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__huracan-casilda.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.36226, -33.23862] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__huracan",
      "name": "Huracán",
      "full_name": "Club Atlético Huracán",
      "province": "Santa Fe",
      "city": "Chabás",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__huracan.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.04182, -33.02244] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__atletico-pujato",
      "name": "Atlético Pujato",
      "full_name": "Club Atlético Pujato Mutual, Social y Biblioteca",
      "province": "Santa Fe",
      "city": "Pujato",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__atletico-pujato.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.03589, -33.02087] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__sportivo-matienzo",
      "name": "Sportivo Matienzo",
      "full_name": "Club Atlético Sportivo Matienzo",
      "province": "Santa Fe",
      "city": "Pujato",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__sportivo-matienzo.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.18233, -33.05714] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__alumni",
      "name": "Alumni",
      "full_name": "Club Atlético Alumni",
      "province": "Santa Fe",
      "city": "Casilda",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__alumni.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.08068, -33.16882] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__alianza-deportiva",
      "name": "Alianza Deportiva",
      "full_name": "Club Social Alianza Deportiva Fuentes",
      "province": "Santa Fe",
      "city": "Fuentes",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__alianza-deportiva.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.18047, -33.04405] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__aprendices-casildenses",
      "name": "Aprendices Casildenses",
      "full_name": "Club Atlético Aprendices Casildenses",
      "province": "Santa Fe",
      "city": "Casilda",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__aprendices-casildenses.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.96866, -33.10792] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__arnold",
      "name": "Arnold",
      "full_name": "Arnold Fútbol Club",
      "province": "Santa Fe",
      "city": "Coronel Arnold",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__arnold.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.35537, -33.25037] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__atletico-chabas",
      "name": "Atlético Chabás",
      "full_name": "Club Atlético Chabás",
      "province": "Santa Fe",
      "city": "Chabás",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__atletico-chabas.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.27318, -33.14305] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__sanford",
      "name": "Sanford",
      "full_name": "Club Atlético Sanford",
      "province": "Santa Fe",
      "city": "Sanford",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__sanford.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.87856, -33.02614] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__unidos",
      "name": "Unidos",
      "full_name": "Unidos Atlético Club",
      "province": "Santa Fe",
      "city": "Zavalla",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__unidos.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.16708, -33.03444] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__union-casildense",
      "name": "Unión Casildense",
      "full_name": "Club Atlético Unión Casildense",
      "province": "Santa Fe",
      "city": "Casilda",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__union-casildense.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.33133, -33.10424] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__union-deportiva",
      "name": "Unión Deportiva",
      "full_name": "Club Unión Deportiva",
      "province": "Santa Fe",
      "city": "Los Molinos",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__union-deportiva.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.44222, -33.35133] },
    "properties": {
      "club_id": "santa-fe__liga-casildense-de-futbol__racing",
      "name": "Racing",
      "full_name": "Club Atlético Social y Deportivo Racing",
      "province": "Santa Fe",
      "city": "Villada",
      "league": "Liga Casildense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-casildense-de-futbol__racing.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.51657, -32.67227] },
    "properties": {
      "club_id": "santa-fe__liga-canadense-de-futbol__sportivo",
      "name": "Sportivo",
      "full_name": "Sportivo Atlético Club",
      "province": "Santa Fe",
      "city": "Las Parejas",
      "league": "Liga Cañadense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-canadense-de-futbol__sportivo.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.1576, -32.86414] },
    "properties": {
      "club_id": "santa-fe__liga-canadense-de-futbol__atletico-carcarana",
      "name": "Atlético Carcarañá",
      "full_name": "Club Atlético Carcarañá",
      "province": "Santa Fe",
      "city": "Carcarañá",
      "league": "Liga Cañadense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-canadense-de-futbol__atletico-carcarana.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-61.40004, -32.81004] },
    "properties": {
      "club_id": "santa-fe__liga-canadense-de-futbol__canadense",
      "name": "Cañadense",
      "full_name": "Sport Club Cañadense",
      "province": "Santa Fe",
      "city": "Cañada de Gómez",
      "league": "Liga Cañadense de Fútbol",
      "badge_url": "/badges/santa-fe__liga-canadense-de-futbol__canadense.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.55504, -31.74742] },
    "properties": {
      "club_id": "entre-rios__liga-paranaense-de-futbol__ciclon-del-sur",
      "name": "Ciclón del Sur",
      "full_name": "Club Atlético Ciclón del Sur",
      "province": "Entre Ríos",
      "city": "Paraná",
      "league": "Liga Paranaense de Fútbol",
      "badge_url": "/badges/entre-rios__liga-paranaense-de-futbol__ciclon-del-sur.webp"
    }
  },
  {
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-60.4673, -31.767] },
    "properties": {
      "club_id": "entre-rios__liga-paranaense-de-futbol__vf",
      "name": "VF",
      "full_name": "Club Atlético VF",
      "province": "Entre Ríos",
      "city": "Paraná",
      "league": "Liga Paranaense de Fútbol",
      "badge_url": "/badges/entre-rios__liga-paranaense-de-futbol__vf.webp"
    }
  }
];

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function norm(s: string) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

async function seed() {
  console.log("Iniciando importación de", features.length, "clubes extra...");

  const dbProvinces = await prisma.province.findMany();
  const dbLeagues = await prisma.localLeague.findMany();

  let insertedCount = 0;
  let updatedCount = 0;
  let localityCount = 0;

  for (const feat of features) {
    let [lng, lat] = feat.geometry.coordinates;
    // Fix typo in longitude if present (e.g., -30 instead of -60 in Rosario region)
    if (lng > -50 && lat < -30) {
      lng = lng - 30; // e.g. -30.70596 -> -60.70596
    }

    const pName = feat.properties.province;
    const prov = dbProvinces.find(
      (p) => norm(p.name) === norm(pName) || p.slug === slugify(pName)
    );
    if (!prov) {
      console.error(`Provincia no encontrada: ${pName}`);
      continue;
    }

    const lName = feat.properties.league;
    let league = dbLeagues.find(
      (l) => norm(l.name) === norm(lName) || l.slug === slugify(lName)
    );
    if (!league) {
      console.log(`Creando liga: ${lName} en provincia ${prov.name}...`);
      const createdLeague = await prisma.localLeague.create({
        data: {
          name: lName,
          slug: slugify(lName),
          provinceId: prov.id,
        },
      });
      league = createdLeague;
      dbLeagues.push(createdLeague);
    }

    // Locality check
    const cityName = feat.properties.city;
    const locSlug = slugify(cityName);
    const existingLoc = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Locality"
      WHERE "provinceId" = CAST(${prov.id} AS UUID)
        AND "slug" = ${locSlug}
      LIMIT 1
    `;

    let localityId: string;
    if (existingLoc.length > 0) {
      localityId = existingLoc[0].id;
    } else {
      console.log(`Creando localidad: ${cityName} en ${prov.name}...`);
      const newLoc = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "Locality" ("id", "provinceId", "name", "slug", "type", "location")
        VALUES (
          gen_random_uuid(),
          CAST(${prov.id} AS UUID),
          ${cityName},
          ${locSlug},
          'CITY'::"LocalityType",
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
        )
        RETURNING id;
      `;
      localityId = newLoc[0].id;
      localityCount++;
    }

    const clubSlug = feat.properties.club_id;
    const existingClub = await prisma.club.findUnique({
      where: { slug: clubSlug },
    });

    if (existingClub) {
      await prisma.$executeRaw`
        UPDATE "Club"
        SET
          "fullName" = ${feat.properties.full_name},
          "shortName" = ${feat.properties.name},
          "localityId" = CAST(${localityId} AS UUID),
          "localLeagueId" = CAST(${league.id} AS UUID),
          "crestUrl" = ${feat.properties.badge_url},
          "location" = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          "verified" = true,
          "updatedAt" = NOW()
        WHERE id = CAST(${existingClub.id} AS UUID)
      `;
      updatedCount++;
    } else {
      await prisma.$queryRaw`
        INSERT INTO "Club" (
          "id", "fullName", "shortName", "slug", "localityId", "localLeagueId",
          "crestUrl", "location", "verified", "updatedAt"
        )
        VALUES (
          gen_random_uuid(),
          ${feat.properties.full_name},
          ${feat.properties.name},
          ${clubSlug},
          CAST(${localityId} AS UUID),
          CAST(${league.id} AS UUID),
          ${feat.properties.badge_url},
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          true,
          NOW()
        );
      `;
      insertedCount++;
    }
  }

  console.log(
    `Proceso finalizado! Insertados: ${insertedCount}, Actualizados: ${updatedCount}, Localidades creadas: ${localityCount}`
  );
}

seed()
  .catch((err) => {
    console.error("Error en el seed script:", err);
  })
  .finally(async () => {
    const { getPrisma } = await import("../lib/prisma");
    const client = getPrisma();
    if (client) await client.$disconnect();
  });
