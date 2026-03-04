import os
import json

def diagnostic_v3():
    # CAMBIO: Apuntar a la versión v3
    GEOJSON_FILE = 'clubs.updated.v3.geojson'
    INPUT_FOLDER = 'escudos arg'
    
    if not os.path.exists(GEOJSON_FILE):
        print("No se encuentra el archivo V3")
        return

    with open(GEOJSON_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    expected_paths = set()
    for feature in data.get('features', []):
        path = feature['properties'].get('badge_src_rar_path')
        if path:
            expected_paths.add(os.path.normpath(path).lower())

    print(f"--- VERIFICACIÓN FINAL V3 ---")
    
    # 1. Buscar imágenes en carpetas que no están registradas
    sobrantes = []
    for root, dirs, files in os.walk(INPUT_FOLDER):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                full_path = os.path.normpath(os.path.join(root, file)).lower()
                if full_path not in expected_paths:
                    sobrantes.append(full_path)

    # 2. Buscar rutas en GeoJSON que no existen físicamente
    faltantes = []
    for p in expected_paths:
        if not os.path.exists(p):
            faltantes.append(p)

    # RESULTADOS
    if not sobrantes and not faltantes:
        print("¡PERFECTO! El GeoJSON y las carpetas están 100% sincronizados.")
    else:
        if sobrantes:
            print(f"\nHay {len(sobrantes)} imágenes extra (no registradas):")
            for s in sobrantes: print(f" > {s}")
        if faltantes:
            print(f"\nHay {len(faltantes)} registros en GeoJSON sin archivo físico:")
            for f in faltantes: print(f" [!] FALTANTE: {f}")

if __name__ == "__main__":
    diagnostic_v3()