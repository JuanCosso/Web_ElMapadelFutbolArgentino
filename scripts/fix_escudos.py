import os
import sys
import json
from PIL import Image

# ─── Rutas relativas a la ubicación del script ────────────────────────────────
_HERE         = os.path.dirname(os.path.abspath(__file__))   # carpeta scripts/
_ROOT         = os.path.dirname(_HERE)                        # raíz del proyecto

GEOJSON_FILE  = os.path.join(_HERE, 'clubs.updated.v3.geojson')
BADGES_FOLDER = os.path.join(_ROOT, 'public', 'badges')
TARGET_SIZE   = 256
# ──────────────────────────────────────────────────────────────────────────────


def build_id_to_src(geojson_path: str) -> dict:
    """Lee el GeoJSON y devuelve {club_id: ruta_fuente_normalizada}."""
    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    result = {}
    for feature in data.get('features', []):
        props = feature.get('properties', {})
        cid   = props.get('club_id')
        src   = props.get('badge_src_rar_path')
        if cid and src:
            result[cid] = os.path.normpath(src)
    return result


def fit_and_center(src_path: str, size: int) -> Image.Image:
    """Escala la imagen para que al menos un lado toque el borde,
    y la centra sobre un canvas transparente de exactamente size×size."""
    with Image.open(src_path) as img:
        img = img.convert("RGBA")
        img.thumbnail((size, size), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        ox = (size - img.width)  // 2
        oy = (size - img.height) // 2
        canvas.paste(img, (ox, oy), img)
        return canvas


def needs_fix(path: str, size: int, tol: int = 2) -> bool:
    """True si el webp no es size×size O si ningún lado toca el borde."""
    try:
        with Image.open(path) as img:
            w, h = img.size
            return (w != size or h != size) or (w < size - tol and h < size - tol)
    except Exception:
        return True


def fix_badges(ids_to_fix=None):
    if not os.path.exists(GEOJSON_FILE):
        print(f"[ERROR] No se encuentra el GeoJSON: {GEOJSON_FILE}")
        print("        Corré el script desde la raíz del proyecto.")
        return

    if not os.path.isdir(BADGES_FOLDER):
        print(f"[ERROR] No se encuentra la carpeta: {BADGES_FOLDER}")
        return

    id_to_src = build_id_to_src(GEOJSON_FILE)

    fixed = skipped = errors = 0

    for fname in sorted(os.listdir(BADGES_FOLDER)):
        if not fname.endswith('.webp'):
            continue

        club_id   = fname[:-5]
        webp_path = os.path.join(BADGES_FOLDER, fname)

        # Filtro por lista explícita si se proveyó
        if ids_to_fix and club_id not in ids_to_fix:
            continue

        # ¿Realmente necesita corrección?
        if not needs_fix(webp_path, TARGET_SIZE):
            skipped += 1
            continue

        # Buscar fuente original
        src_path = id_to_src.get(club_id)
        if not src_path:
            print(f"[WARN] Sin entrada en GeoJSON: {club_id}")
            errors += 1
            continue
        if not os.path.exists(src_path):
            print(f"[WARN] Archivo fuente no encontrado: {src_path}")
            errors += 1
            continue

        try:
            canvas = fit_and_center(src_path, TARGET_SIZE)
            canvas.save(webp_path, "WEBP", quality=90)
            fixed += 1
            print(f"[OK] {fname}")
        except Exception as e:
            print(f"[ERROR] {fname}: {e}")
            errors += 1

    print(f"\n─── Resumen ─────────────────────────────────")
    print(f"  Corregidos          : {fixed}")
    print(f"  Ya estaban bien     : {skipped}")
    print(f"  Errores / sin fuente: {errors}")


# ─── Punto de entrada ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Corré siempre desde la RAÍZ del proyecto:
    #
    #   python public/badges/fix_escudos.py
    #       → revisa y corrige todos los que fallen
    #
    #   python public/badges/fix_escudos.py id1 id2 ...
    #       → corrige solo esos club_ids
    #
    #   python public/badges/fix_escudos.py --file lista.txt
    #       → lee club_ids de un .txt (uno por línea)
    #         útil para pegar la lista de "DIMENSIONES INCORRECTAS" del control.py

    ids = None

    if len(sys.argv) > 1:
        if sys.argv[1] == '--file':
            with open(sys.argv[2], 'r', encoding='utf-8') as f:
                ids = {line.strip() for line in f if line.strip()}
            print(f"Leyendo {len(ids)} IDs desde '{sys.argv[2]}'...")
        else:
            ids = set(sys.argv[1:])
            print(f"Corrigiendo {len(ids)} IDs especificados...")
    else:
        print("Revisando todos los badges en public/badges/...")

    fix_badges(ids)