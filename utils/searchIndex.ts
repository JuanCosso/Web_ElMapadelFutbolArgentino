// utils/searchIndex.ts
export type BBox = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

export type SearchItem =
  | {
      type: "province";
      key: string;
      label: string;
      center: [number, number];
      bbox: BBox;
      countCities: number;
      countClubs: number;
    }
  | {
      type: "city";
      key: string; // `${city}||${province}`
      label: string; // city
      sublabel: string; // province
      center: [number, number];
      bbox: BBox;
      countClubs: number;
      province: string;
      city: string;
    }
  | {
      type: "league";
      key: string;
      label: string;
      sublabel?: string;
      league_id: string;
      logo_url?: string;
      foundation?: string;
      province?: string;
      center?: [number, number];
      bbox?: BBox;
    }
  | {
      type: "club";
      key: string; // club_id
      label: string; // name
      sublabel: string; // city, province
      center: [number, number];
      club_id: string;
      badge_url?: string;
      full_name?: string;
      nickname?: string;
      province?: string;
      city?: string;
      league?: string;
      level?: number;
    };

export type ClubProperties = {
  province?: string;
  provincia?: string;
  city?: string;
  ciudad?: string;
  league?: string;
  liga?: string;
  name?: string;
  nombre?: string;
  full_name?: string;
  fullName?: string;
  nombre_completo?: string;
  nickname?: string;
  apodo?: string;
  club_id?: string | number;
  id?: string | number;
  clubId?: string | number;
  slug?: string;
  badge_url?: string;
  badgeUrl?: string;
  badge?: string;
  level?: number | string;
};

export type ClubFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: ClubProperties;
};

function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function avgCenter(coords: [number, number][]): [number, number] {
  let sx = 0,
    sy = 0;
  for (const [lng, lat] of coords) {
    sx += lng;
    sy += lat;
  }
  const n = Math.max(coords.length, 1);
  return [sx / n, sy / n];
}

function bboxOf(coords: [number, number][]): BBox {
  let minLng = Infinity,
    minLat = Infinity,
    maxLng = -Infinity,
    maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  if (!Number.isFinite(minLng)) return [-64, -38.5, -64, -38.5]; // fallback
  return [minLng, minLat, maxLng, maxLat];
}

export function buildSearchIndex(features: ClubFeature[], leagues: SearchItem[] = []): SearchItem[] {
  const provinceCoords = new Map<string, [number, number][]>();
  const provinceCities = new Map<string, Set<string>>();

  const cityCoords = new Map<string, [number, number][]>();
  const cityCounts = new Map<string, number>();

  const clubs: SearchItem[] = (features || [])
    .filter((f) => f?.geometry?.type === "Point" && Array.isArray(f?.geometry?.coordinates))
    .map((f) => {
      const p = f.properties || {};
      const province = String(p.province || p.provincia || "");
      const city = String(p.city || p.ciudad || "");
      const league = String(p.league || p.liga || "");
      const name = String(p.name || p.nombre || "Club");
      const full_name = p.full_name || p.fullName || p.nombre_completo || undefined;
      const nickname = p.nickname || p.apodo || undefined;
      const level = p.level !== undefined ? Number(p.level) : 8;

      const club_id = String(p.club_id || p.id || p.clubId || p.slug || "");
      const badge_url = p.badge_url || p.badgeUrl || p.badge || (club_id ? `/badges/${club_id}.webp` : undefined);

      const c = f.geometry.coordinates as [number, number];

      // Provincia
      if (province) {
        if (!provinceCoords.has(province)) provinceCoords.set(province, []);
        provinceCoords.get(province)!.push(c);

        if (!provinceCities.has(province)) provinceCities.set(province, new Set());
        if (city) provinceCities.get(province)!.add(city);
      }

      // Ciudad (key por provincia)
      if (province && city) {
        const cityKey = `${city}||${province}`;
        if (!cityCoords.has(cityKey)) cityCoords.set(cityKey, []);
        cityCoords.get(cityKey)!.push(c);
        cityCounts.set(cityKey, (cityCounts.get(cityKey) || 0) + 1);
      }

      return {
        type: "club",
        key: club_id || `${name}-${city}-${province}`,
        club_id: club_id || `${name}-${city}-${province}`,
        label: name,
        full_name: full_name ? String(full_name) : undefined,
        nickname: nickname ? String(nickname) : undefined,
        sublabel: [city, province].filter(Boolean).join(", "),
        center: c,
        badge_url: badge_url ? String(badge_url) : undefined,
        province: province || undefined,
        city: city || undefined,
        league: league || undefined,
        level,
      };
    });

  const provinces: SearchItem[] = Array.from(provinceCoords.entries()).map(([province, coords]) => {
    const citiesSet = provinceCities.get(province) || new Set<string>();
    return {
      type: "province",
      key: province,
      label: province,
      center: avgCenter(coords),
      bbox: bboxOf(coords),
      countCities: citiesSet.size,
      countClubs: coords.length,
    };
  });

  const cities: SearchItem[] = Array.from(cityCoords.entries()).map(([key, coords]) => {
    const [city, province] = key.split("||");
    return {
      type: "city",
      key,
      label: city,
      sublabel: province,
      province,
      city,
      center: avgCenter(coords),
      bbox: bboxOf(coords),
      countClubs: cityCounts.get(key) || coords.length,
    };
  });

  return [...provinces, ...cities, ...leagues, ...clubs];
}

/**
 * Búsqueda avanzada:
 * - Ordena clubes considerando su jerarquía oficial (nivel de torneo)
 * - Incluye provincias, ciudades, ligas y clubes
 */
export function searchItems(index: SearchItem[], query: string, limit = 400): SearchItem[] {
  const q = normalize(query);
  if (!q) return [];

  const provinces = index.filter((x) => x.type === "province") as Extract<SearchItem, { type: "province" }>[];
  const cities = index.filter((x) => x.type === "city") as Extract<SearchItem, { type: "city" }>[];
  const leagues = index.filter((x) => x.type === "league") as Extract<SearchItem, { type: "league" }>[];
  const clubs = index.filter((x) => x.type === "club") as Extract<SearchItem, { type: "club" }>[];

  // 1) match exacto de provincia -> listado “completo” por provincia
  const exactProv = provinces.find((p) => normalize(p.label) === q);
  if (exactProv) {
    const provName = exactProv.label;

    const provCities = cities
      .filter((c) => c.province === provName)
      .sort((a, b) => a.label.localeCompare(b.label));

    const provClubs = clubs
      .filter((c) => c.province === provName)
      .sort((a, b) => (a.level ?? 8) - (b.level ?? 8) || a.label.localeCompare(b.label));

    return [exactProv, ...provCities, ...provClubs];
  }

  // Helpers
  const contains = (field: string) => field.includes(q);
  const starts = (field: string) => field.startsWith(q);

  const passGate = (item: SearchItem) => {
    const label = normalize(item.label);

    if (item.type === "club") {
      const sub = normalize(item.sublabel || "");
      const full = normalize(item.full_name || "");
      const nick = normalize(item.nickname || "");
      return contains(label) || contains(full) || contains(sub) || contains(nick);
    }

    if (item.type === "league") {
      const sub = normalize(item.sublabel || "");
      return contains(label) || contains(sub);
    }

    if (item.type === "city") {
      const sub = normalize(item.sublabel || "");
      return contains(label) || contains(sub);
    }

    return contains(label);
  };

  const scoreText = (field: string, wStarts: number, wWordMatch: number, wIncl: number) => {
    if (!field) return 0;
    if (starts(field)) return wStarts;
    const words = field.split(/\s+/);
    if (words.some((w) => w.startsWith(q))) return wWordMatch;
    if (contains(field)) return wIncl;
    return 0;
  };

  // 2) Score + threshold + bonificación fuerte por jerarquía de torneo
  const scored = index
    .filter(passGate)
    .map((item) => {
      const label = normalize(item.label);
      let score = 0;

      if (item.type === "club") {
        const sub = normalize(item.sublabel || "");
        const full = normalize(item.full_name || "");
        const nick = normalize(item.nickname || "");

        score = Math.max(score, scoreText(label, 320, 280, 150));
        score = Math.max(score, scoreText(full, 280, 250, 130));
        score = Math.max(score, scoreText(nick, 260, 240, 120));
        score = Math.max(score, scoreText(sub, 70, 60, 40));

        // 🌟 Bonificación fuerte por jerarquía de torneo (menor nivel = mayor categoría)
        // Nivel 1: +800 pts, Nivel 2: +700 pts, Nivel 3: +600 pts... Nivel 8: +100 pts
        const lvl = Math.min(Math.max(item.level ?? 8, 1), 8);
        const hierarchyBonus = (9 - lvl) * 100;
        score += hierarchyBonus;
      } else if (item.type === "league") {
        const sub = normalize(item.sublabel || "");
        score = Math.max(score, scoreText(label, 220, 180, 140));
        score = Math.max(score, scoreText(sub, 80, 60, 50));
        score += 50;
      } else if (item.type === "city") {
        const sub = normalize(item.sublabel || "");
        score = Math.max(score, scoreText(label, 190, 150, 110));
        score = Math.max(score, scoreText(sub, 90, 70, 55));
        score += 20;
      } else {
        score = Math.max(score, scoreText(label, 170, 130, 95));
      }

      return { item, score };
    })
    .filter((x) => x.score >= 80)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.item);

  return scored;
}


