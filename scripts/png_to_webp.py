"""
png_to_webp.py  —  Convertí PNGs sueltos a .webp y guardalos en public/badges/
Ubicalo en: scripts/

Uso:
  1. Corré el script.
  2. Abre un selector de archivos → elegís uno o varios PNGs.
  3. Por cada archivo te pide el nombre (club_id) con el que guardarlo.
  4. Lo convierte, recorta el aire, lo escala a 256×256 y lo guarda en public/badges/.
"""

import os
import tkinter as tk
from tkinter import filedialog, simpledialog, messagebox
from PIL import Image

_HERE         = os.path.dirname(os.path.abspath(__file__))
_ROOT         = os.path.dirname(_HERE)
BADGES_FOLDER = os.path.join(_ROOT, 'public', 'badges')
TARGET_SIZE   = 256


def fit_and_center(img: Image.Image, size: int) -> Image.Image:
    """Recorta aire, escala para tocar al menos un borde, centra en canvas size×size."""
    img = img.convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    scale = size / max(img.width, img.height)
    new_w = round(img.width  * scale)
    new_h = round(img.height * scale)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = (size - img.width)  // 2
    oy = (size - img.height) // 2
    canvas.paste(img, (ox, oy), img)
    return canvas


def main():
    root = tk.Tk()
    root.withdraw()   # ventana principal oculta

    # ── 1. Seleccionar archivos ──────────────────────────────────────────────
    files = filedialog.askopenfilenames(
        title="Seleccioná los archivos PNG/JPG a convertir",
        filetypes=[("Imágenes", "*.png *.jpg *.jpeg *.webp"), ("Todos", "*.*")]
    )

    if not files:
        print("No seleccionaste ningún archivo.")
        return

    os.makedirs(BADGES_FOLDER, exist_ok=True)

    resultados = []

    for src_path in files:
        filename = os.path.basename(src_path)

        # ── 2. Pedir nombre (club_id) para este archivo ──────────────────────
        club_id = simpledialog.askstring(
            title=f"Nombre para: {filename}",
            prompt=f"Archivo: {filename}\n\nIngresá el club_id (sin .webp):",
        )

        if club_id is None:
            # El usuario canceló este archivo → lo saltea
            resultados.append(f"  [SALTEADO] {filename}")
            continue

        club_id = club_id.strip()
        if not club_id:
            resultados.append(f"  [SALTEADO] {filename} — nombre vacío")
            continue

        dest_path = os.path.join(BADGES_FOLDER, club_id + '.webp')

        # ── 3. Convertir ─────────────────────────────────────────────────────
        try:
            with Image.open(src_path) as img:
                canvas = fit_and_center(img, TARGET_SIZE)
                canvas.save(dest_path, "WEBP", quality=90)
            resultados.append(f"  [OK] {club_id}.webp")
            print(f"[OK] {club_id}.webp")
        except Exception as e:
            resultados.append(f"  [ERROR] {club_id} → {e}")
            print(f"[ERROR] {club_id}: {e}")

    # ── 4. Resumen final ─────────────────────────────────────────────────────
    resumen = "\n".join(resultados)
    messagebox.showinfo(
        "Listo",
        f"Procesados {len(files)} archivo(s):\n\n{resumen}\n\nDestino: public/badges/"
    )
    root.destroy()


if __name__ == "__main__":
    main()