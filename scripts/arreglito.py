import json
import os

def clean_geojson():
    # Usamos el V3 que es el que tiene el error
    FILE_PATH = 'clubs.updated.v3.geojson'
    
    if not os.path.exists(FILE_PATH):
        print(f"No se encuentra {FILE_PATH}")
        return

    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # El ID que está molestando es el de la liga de Colón
    id_a_eliminar = "entre-rios__liga-departamental-de-futbol-de-colon__juventud-de-caseros"
    
    # Filtramos: nos quedamos con todo lo que NO sea ese ID
    original_count = len(data['features'])
    data['features'] = [
        f for f in data['features'] 
        if f['properties'].get('club_id') != id_a_eliminar
    ]
    new_count = len(data['features'])

    if original_count != new_count:
        with open(FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"¡Éxito! Se eliminó el registro obsoleto de Juventud de Caseros en Colón.")
    else:
        print("No se encontró el registro. Quizás ya fue eliminado o el ID es diferente.")

if __name__ == "__main__":
    clean_geojson()