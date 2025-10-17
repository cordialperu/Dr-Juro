# Meta Buscador Jurídico

Este documento describe cómo ejecutar el microservicio de metabuscador (FastAPI) y cómo integrarlo con el backend Node.js.

## Dependencias

- Python 3.10 o superior.
- Virtualenv recomendado.
- El proyecto JavaScript ya utiliza `npm install` para dependencias Node.

Instala las dependencias del microservicio:

```bash
pip install -r services/metabuscador/requirements.txt
```

## Ejecución del microservicio

```bash
uvicorn services.metabuscador.app:app --host 0.0.0.0 --port 8000
```

Esto expone `POST /search` que recibe `{ "term": "texto" }` y devuelve resultados combinados de PUCP, UNMSM y PJ/TC.

## Configuración del backend

El backend Express consulta este microservicio mediante `POST /api/metabuscador/buscar`. Asegúrate de que la variable de entorno `METABUSCADOR_SERVICE_URL` apunte a la URL del microservicio (por defecto `http://localhost:8000`).

Ejemplo de configuración temporal:

```bash
export METABUSCADOR_SERVICE_URL="http://localhost:8000"
npm run dev
```

## Pruebas manuales

Con ambos servicios corriendo:

```bash
curl -X POST http://localhost:5173/api/metabuscador/buscar \
  -H "Content-Type: application/json" \
  -d '{"termino":"responsabilidad penal"}'
```

Deberías recibir un JSON con la lista de resultados normalizados.
