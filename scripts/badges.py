import json

def sync_badges():
    # Rutas de archivos
    GEOJSON_FILE = 'clubs.updated.v3.geojson'
    BADGES_OLD = 'badges.v2.canonical.json'
    BADGES_NEW = 'badges.v3.canonical.json'

    # 1. Leer IDs del GeoJSON
    with open(GEOJSON_FILE, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    geojson_ids = {f['properties']['club_id'] for f in geojson_data['features'] if 'club_id' in f['properties']}

    # 2. Leer badges actuales
    try:
        with open(BADGES_OLD, 'r', encoding='utf-8') as f:
            badges_data = json.load(f)
    except FileNotFoundError:
        badges_data = {}

    # 3. Crear nuevo diccionario sincronizado
    updated_badges = {}
    for cid in geojson_ids:
        if cid in badges_data:
            # Mantener datos existentes si ya estaba
            updated_badges[cid] = badges_data[cid]
        else:
            # Crear entrada nueva si es club nuevo
            updated_badges[cid] = {
                "suggested_url": f"/badges/{cid}.webp"
            }

    # 4. Ordenar y Guardar
    sorted_badges = {k: updated_badges[k] for k in sorted(updated_badges.keys())}
    
    with open(BADGES_NEW, 'w', encoding='utf-8') as f:
        json.dump(sorted_badges, f, indent=2, ensure_ascii=False)
    
    print(f"Sincronización terminada: {len(sorted_badges)} escudos registrados.")

if __name__ == "__main__":
    sync_badges()