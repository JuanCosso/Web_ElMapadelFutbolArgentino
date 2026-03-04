import os
from PIL import Image

def auditar_imagenes_locales():
    # Obtiene la ruta donde está guardado este script
    directorio_actual = os.path.dirname(os.path.abspath(__file__))
    nombre_script = os.path.basename(__file__)
    
    reporte = {
        "tamano_incorrecto": [], # No son 256x256
        "mal_escaladas": [],     # Son 256x256 pero sobra espacio
        "perfectas": []          # Optimizadas al límite
    }

    formatos_validos = ('.png', '.jpg', '.jpeg', '.webp', '.bmp')

    for archivo in os.listdir(directorio_actual):
        # Ignorar el propio script y archivos que no sean imágenes
        if archivo == nombre_script or not archivo.lower().endswith(formatos_validos):
            continue

        try:
            ruta = os.path.join(directorio_actual, archivo)
            with Image.open(ruta) as img:
                # Convertimos a RGBA para asegurar que getbbox detecte transparencia
                img_rgba = img.convert("RGBA")
                width, height = img_rgba.size
                
                # 1. Validar dimensiones físicas
                if width != 256 or height != 256:
                    reporte["tamano_incorrecto"].append(f"{archivo} ({width}x{height})")
                    continue

                # 2. Validar aprovechamiento del espacio (Bounding Box)
                bbox = img_rgba.getbbox() 

                if bbox:
                    left, top, right, bottom = bbox
                    # Criterio: Debe tocar al menos un borde horizontal Y uno vertical
                    # O al menos estar en los límites 0 o 256
                    toca_horizontal = (left == 0 or right == 256)
                    toca_vertical = (top == 0 or bottom == 256)

                    if not (toca_horizontal or toca_vertical):
                        reporte["mal_escaladas"].append(archivo)
                    else:
                        reporte["perfectas"].append(archivo)
                else:
                    reporte["mal_escaladas"].append(f"{archivo} (Imagen vacía/transparente)")

        except Exception as e:
            print(f"Error procesando {archivo}: {e}")

    # Mostrar Resultados
    print("="*40)
    print("      REPORTE DE OPTIMIZACIÓN")
    print("="*40)
    
    print(f"\n❌ DIMENSIONES INCORRECTAS ({len(reporte['tamano_incorrecto'])}):")
    for item in reporte['tamano_incorrecto']: print(f"  - {item}")
    
    print(f"\n⚠️ MAL AGRANDADAS / CON AIRE ({len(reporte['mal_escaladas'])}):")
    for item in reporte['mal_escaladas']: print(f"  - {item}")
    
    print(f"\n✅ PERFECTAS ({len(reporte['perfectas'])}):")
    print(f"  Total: {len(reporte['perfectas'])} imágenes.")
    print("="*40)

if __name__ == "__main__":
    auditar_imagenes_locales()