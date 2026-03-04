import os
import zipfile
from PIL import Image

def corregir_y_empaquetar():
    # Detecta la ubicación del script
    directorio_actual = os.path.dirname(os.path.abspath(__file__))
    carpeta_salida = os.path.join(directorio_actual, "corregidas")
    nombre_zip = os.path.join(directorio_actual, "escudos_corregidos.zip")
    
    if not os.path.exists(carpeta_salida):
        os.makedirs(carpeta_salida)

    formatos_validos = ('.png', '.jpg', '.jpeg', '.webp', '.bmp')
    # Corregido: Nombre de variable consistente
    imagenes_listas_para_zip = []

    print(f"🚀 Iniciando corrección en: {directorio_actual}")

    for archivo in os.listdir(directorio_actual):
        if archivo.lower().endswith(formatos_validos):
            try:
                ruta_input = os.path.join(directorio_actual, archivo)
                with Image.open(ruta_input) as img:
                    img_rgba = img.convert("RGBA")
                    
                    # 1. Encontrar el contenido real
                    bbox = img_rgba.getbbox()
                    if not bbox:
                        continue
                    
                    # 2. Recortar exceso
                    contenido = img_rgba.crop(bbox)
                    w, h = contenido.size
                    
                    # 3. Calcular escala (lado mayor = 256)
                    ratio = min(256/w, 256/h)
                    nuevo_w, nuevo_h = int(w * ratio), int(h * ratio)
                    
                    # 4. Redimensionar
                    contenido_resizado = contenido.resize((nuevo_w, nuevo_h), Image.LANCZOS)
                    
                    # 5. Crear lienzo y centrar
                    nuevo_lienzo = Image.new("RGBA", (256, 256), (0, 0, 0, 0))
                    offset = ((256 - nuevo_w) // 2, (256 - nuevo_h) // 2)
                    nuevo_lienzo.paste(contenido_resizado, offset)
                    
                    # 6. Guardar como PNG (mejor para escudos de ligas)
                    nombre_base = os.path.splitext(archivo)[0]
                    ruta_output = os.path.join(carpeta_salida, f"{nombre_base}.png")
                    nuevo_lienzo.save(ruta_output, "PNG")
                    
                    imagenes_listas_para_zip.append(ruta_output)

            except Exception as e:
                print(f"❌ Error con {archivo}: {e}")

    # 7. Crear el archivo ZIP (más universal en Python que RAR)
    if imagenes_listas_para_zip:
        with zipfile.ZipFile(nombre_zip, 'w') as zipf:
            for ruta_img in imagenes_listas_para_zip:
                zipf.write(ruta_img, os.path.basename(ruta_img))
        
        print("\n" + "="*40)
        print(f"✅ ¡LISTO! Proceso completado.")
        print(f"📦 Se procesaron {len(imagenes_listas_para_zip)} escudos.")
        print(f"📂 Archivo creado: {os.path.basename(nombre_zip)}")
        print("="*40)
    else:
        print("\n⚠️ No se encontraron imágenes válidas para procesar.")

if __name__ == "__main__":
    corregir_y_empaquetar()