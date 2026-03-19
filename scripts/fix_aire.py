"""
fix_aire.py  —  Corrige badges con "aire" (contenido no toca ningún margen)
Ubicalo en: scripts/

Lógica:
  1. Abre el .webp y recorta el área transparente (getbbox).
  2. Calcula el "fill ratio": qué % del lado mayor ocupa el contenido.
  3. Si fill_ratio >= UMBRAL  → upscale automático (centra en canvas 256×256).
  4. Si fill_ratio <  UMBRAL  → lo lista para revisión manual.

Ajustá UMBRAL según tu criterio (default 80 = el contenido ya ocupa ≥80%).
"""

import os
import sys
from PIL import Image

_HERE         = os.path.dirname(os.path.abspath(__file__))
_ROOT         = os.path.dirname(_HERE)
BADGES_FOLDER = os.path.join(_ROOT, 'public', 'badges')
TARGET_SIZE   = 256
UMBRAL        = 80   # % mínimo para arreglo automático (ajustable)


def get_content_bbox(img: Image.Image):
    """Devuelve el bounding box del contenido no-transparente."""
    rgba = img.convert("RGBA")
    bbox = rgba.getbbox()
    return bbox   # (left, top, right, bottom) o None si imagen vacía


def fill_ratio(bbox, canvas_size: int) -> float:
    """% que ocupa el lado mayor del contenido respecto al canvas."""
    if not bbox:
        return 0.0
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    return round(max(w, h) / canvas_size * 100, 1)


def upscale_to_fit(img: Image.Image, size: int) -> Image.Image:
    """Recorta el aire, escala para tocar al menos un borde, centra."""
    bbox = get_content_bbox(img)
    if bbox:
        img = img.crop(bbox)
    scale = size / max(img.width, img.height)
    new_w = round(img.width * scale)
    new_h = round(img.height * scale)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = (size - img.width)  // 2
    oy = (size - img.height) // 2
    canvas.paste(img, (ox, oy), img)
    return canvas


def has_air(img: Image.Image, size: int, tol: int = 2) -> bool:
    """True si el contenido NO toca ningún borde del canvas."""
    bbox = get_content_bbox(img)
    if not bbox:
        return True
    left, top, right, bottom = bbox
    touches_left   = left   <= tol
    touches_top    = top    <= tol
    touches_right  = right  >= size - tol
    touches_bottom = bottom >= size - tol
    return not (touches_left or touches_top or touches_right or touches_bottom)


# ─── Obtener lista de IDs a revisar ───────────────────────────────────────────
if len(sys.argv) > 1:
    # IDs pasados por argumento o --file
    if sys.argv[1] == '--file':
        with open(sys.argv[2], 'r', encoding='utf-8') as f:
            ids_input = [l.strip().replace('.webp','') for l in f if l.strip()]
    else:
        ids_input = [a.replace('.webp','') for a in sys.argv[1:]]
else:
    # Sin argumentos: escanea toda la carpeta
    ids_input = [f[:-5] for f in os.listdir(BADGES_FOLDER) if f.endswith('.webp')]

# ─── Procesar ─────────────────────────────────────────────────────────────────
auto_fixed   = []
manual_list  = []
already_ok   = 0
errors       = []

for club_id in sorted(ids_input):
    path = os.path.join(BADGES_FOLDER, club_id + '.webp')
    if not os.path.exists(path):
        errors.append(f"  [!] No existe: {club_id}.webp")
        continue

    try:
        with Image.open(path) as img:
            img = img.convert("RGBA")
            if not has_air(img, TARGET_SIZE):
                already_ok += 1
                continue

            ratio = fill_ratio(get_content_bbox(img), TARGET_SIZE)

            if ratio >= UMBRAL:
                canvas = upscale_to_fit(img, TARGET_SIZE)
                canvas.save(path, "WEBP", quality=90)
                auto_fixed.append(f"  [OK] {club_id}.webp  (contenido={ratio}%)")
            else:
                manual_list.append(f"  [MANUAL] {club_id}.webp  (contenido={ratio}%)")
    except Exception as e:
        errors.append(f"  [ERROR] {club_id}.webp → {e}")

# ─── Reporte ──────────────────────────────────────────────────────────────────
print(f"\n{'='*50}")
print(f"  UMBRAL automático: ≥{UMBRAL}%")
print(f"{'='*50}")

print(f"\n✅ Corregidos automáticamente ({len(auto_fixed)}):")
print('\n'.join(auto_fixed) if auto_fixed else "  Ninguno.")

print(f"\n🔧 Requieren revisión manual ({len(manual_list)}):")
print('\n'.join(manual_list) if manual_list else "  Ninguno.")

if errors:
    print(f"\n⚠️  Errores ({len(errors)}):")
    print('\n'.join(errors))

print(f"\n  Ya estaban bien (sin aire): {already_ok}")
print(f"{'='*50}\n")