import json
import os
import re
import unicodedata

def slugify(text):
    text = unicodedata.normalize('NFD', text).encode('ascii', 'ignore').decode('utf-8')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def update_geojson():
    input_file = 'clubs.updated.v2.geojson'
    output_file = 'clubs.updated.v3.geojson'
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Lista de nuevas imágenes encontradas por tu diagnóstico
    # Formato: (Ruta del archivo, Provincia, Liga, Nombre del Club)
    nuevos_clubes = [
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Concordiense de Fútbol\\Constitución.png", "Entre Ríos", "Liga Concordiense de Fútbol", "Constitución"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga de Fútbol de Concepción del Uruguay\\San Martín.jpg", "Entre Ríos", "Liga de Fútbol de Concepción del Uruguay", "San Martín"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga de Fútbol de Paraná Campaña\\Union Alcaraz.png", "Entre Ríos", "Liga de Fútbol de Paraná Campaña", "Unión Alcaraz"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga de Fútbol de Paraná Campaña\\Viale FBC.png", "Entre Ríos", "Liga de Fútbol de Paraná Campaña", "Viale FBC"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Departamental de Fútbol de Colón\\Costa del Uruguay.png", "Entre Ríos", "Liga Departamental de Fútbol de Colón", "Costa del Uruguay"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Departamental de Fútbol de Gualeguaychú\\Camioneros.png", "Entre Ríos", "Liga Departamental de Fútbol de Gualeguaychú", "Camioneros"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Departamental de Fútbol de Gualeguaychú\\Defensores del Oeste.png", "Entre Ríos", "Liga Departamental de Fútbol de Gualeguaychú", "Defensores del Oeste"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Departamental de Fútbol de Gualeguaychú\\Defensores del Sur.png", "Entre Ríos", "Liga Departamental de Fútbol de Gualeguaychú", "Defensores del Sur"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Departamental de Fútbol de Gualeguaychú\\Independiente.png", "Entre Ríos", "Liga Departamental de Fútbol de Gualeguaychú", "Independiente"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Departamental de Fútbol de Gualeguaychú\\Juventud Unida.png", "Entre Ríos", "Liga Departamental de Fútbol de Gualeguaychú", "Juventud Unida"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Departamental de Fútbol de Gualeguaychú\\Sarmiento.png", "Entre Ríos", "Liga Departamental de Fútbol de Gualeguaychú", "Sarmiento"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Departamental de Fútbol de Gualeguaychú\\Sporting.png", "Entre Ríos", "Liga Departamental de Fútbol de Gualeguaychú", "Sporting"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Departamental de Fútbol de Rosario del Tala\\Ferro de Mansilla.png", "Entre Ríos", "Liga Departamental de Fútbol de Rosario del Tala", "Ferro de Mansilla"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Federaense de Fútbol\\Almafuerte.png", "Entre Ríos", "Liga Federaense de Fútbol", "Almafuerte"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Paceña de Fútbol\\San Ramon.png", "Entre Ríos", "Liga Paceña de Fútbol", "San Ramón"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Paceña de Fútbol\\Union.png", "Entre Ríos", "Liga Paceña de Fútbol", "Unión"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Paranaense de Fútbol\\Filial River.png", "Entre Ríos", "Liga Paranaense de Fútbol", "Filial River"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Regional de Fútbol de Basavilbaso\\Juventud de Caseros.png", "Entre Ríos", "Liga Regional de Fútbol de Basavilbaso", "Juventud de Caseros"),
        ("escudos arg\\Consejo Federal\\Entre Ríos\\Liga Victoriense de Fútbol\\Sportivo Peñarol.png", "Entre Ríos", "Liga Victoriense de Fútbol", "Sportivo Peñarol"),
        ("escudos arg\\Consejo Federal\\Santa Fe\\Liga Rafaelina de Fútbol\\Argentino Humberto Primo.png", "Santa Fe", "Liga Rafaelina de Fútbol", "Argentino Humberto Primo"),
        ("escudos arg\\Consejo Federal\\Santa Fe\\Liga Rafaelina de Fútbol\\Independiente San Cristobal.png", "Santa Fe", "Liga Rafaelina de Fútbol", "Independiente San Cristóbal"),
        ("escudos arg\\Consejo Federal\\Santa Fe\\Liga Rafaelina de Fútbol\\Sportivo Libertad.png", "Santa Fe", "Liga Rafaelina de Fútbol", "Sportivo Libertad"),
        ("escudos arg\\Consejo Federal\\Santa Fe\\Liga Santafesina de Fútbol\\Colón de San Justo.png", "Santa Fe", "Liga Santafesina de Fútbol", "Colón de San Justo"),
    ]

    # 1. Corregir o Eliminar registros obsoletos (como el de Juventud de Caseros en Colón)
    data['features'] = [f for f in data['features'] if f['properties'].get('club_id') != 'entre-rios__liga-departamental-de-futbol-de-colon__juventud-de-caseros']

    # 2. Añadir los nuevos clubes
    for ruta, prov, liga, club in nuevos_clubes:
        cid = f"{slugify(prov)}__{slugify(liga)}__{slugify(club)}"
        
        new_feature = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [0, 0]}, # Coordenadas temporales
            "properties": {
                "club_id": cid,
                "name": club,
                "province": prov,
                "league": liga,
                "badge_url": f"/badges/{cid}.webp",
                "badge_src_rar_path": ruta.replace('\\', '/') # Normalizamos a barras de URL
            }
        }
        data['features'].append(new_feature)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Hecho! Se ha creado {output_file} con los nuevos clubes y correcciones.")

if __name__ == "__main__":
    update_geojson()