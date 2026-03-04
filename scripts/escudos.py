import os
import json
from pathlib import Path
from PIL import Image

def process_badges():
    # CAMBIO: Ahora usamos la versión v3
    GEOJSON_FILE = 'clubs.updated.v3.geojson'
    INPUT_FOLDER = 'escudos arg'
    
    if not os.path.exists(GEOJSON_FILE):
        print(f"Error: No se encuentra el archivo {GEOJSON_FILE}. ¿Corriste el script de actualización primero?")
        return

    with open(GEOJSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Mapeo robusto: normalizamos todas las rutas a minúsculas y barras del sistema
    path_to_id = {}
    for feature in data.get('features', []):
        props = feature.get('properties', {})
        rar_path = props.get('badge_src_rar_path')
        club_id = props.get('club_id')
        if rar_path and club_id:
            # Normalización total de la ruta
            norm_path = os.path.normpath(rar_path).lower()
            path_to_id[norm_path] = club_id

    sizes = {"1024px": 1024, "516px": 516, "256px": 256}
    for folder in sizes.keys():
        os.makedirs(folder, exist_ok=True)

    count = 0
    not_found = 0
    
    print("Iniciando conversión con V3...")

    for root, dirs, files in os.walk(INPUT_FOLDER):
        for file in files:
            if not file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                continue

            full_path = os.path.join(root, file)
            # Normalizamos la ruta del archivo actual para comparar
            rel_path = os.path.normpath(full_path).lower()

            if rel_path in path_to_id:
                club_id = path_to_id[rel_path]
                try:
                    with Image.open(full_path) as img:
                        img = img.convert("RGBA")
                        for name, size in sizes.items():
                            temp_img = img.copy()
                            temp_img.thumbnail((size, size), Image.Resampling.LANCZOS)
                            output_path = os.path.join(name, f"{club_id}.webp")
                            temp_img.save(output_path, "WEBP", quality=90)
                    count += 1
                    print(f"[OK] {club_id}.webp")
                except Exception as e:
                    print(f"[ERROR] En {file}: {e}")
            else:
                not_found += 1

    print(f"\n--- Resumen ---")
    print(f"Convertidos: {count}")
    print(f"Ignorados (no están en GeoJSON): {not_found}")

if __name__ == "__main__":
    process_badges()