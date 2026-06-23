# VIA Agricultural Frontend

Frontend React para el usuario agricola de VIA. Esta aplicacion queda enfocada en las acciones de productores, tecnicos o usuarios que registran parcelas y consultan evaluaciones de viabilidad.

El panel tecnico/admin fue separado a otro proyecto local:

```text
C:\Users\fmall\Downloads\Prototipo web AgroDesicions Admin
```

## Alcance de este repo

Este repo contiene solo la experiencia del Usuario Agricola:

- Login.
- Dashboard agricola.
- Registro/creacion de parcelas.
- Inicio de evaluaciones.
- Seguimiento de estado de evaluacion.
- Resultados MCDA.
- Detalle de cultivo recomendado.
- Recomendaciones consultadas por evaluacion.
- Reporte visual provisional.

No debe contener funcionalidades de administracion como carga de rulebooks, documentos RAG, indexacion o configuracion tecnica.

## Como levantar

Instalar dependencias:

```bash
npm i
```

Levantar desarrollo:

```bash
npm run dev
```

Build:

```bash
npm run build
```

El proxy de Vite esta configurado asi:

```text
/api -> http://127.0.0.1:8000
```

Por eso el backend debe estar corriendo en `http://127.0.0.1:8000`.

## Backend esperado

Usuario local usado en pruebas:

```text
admin@via.local
Admin123456
```

Seeds esperados en backend:

```bash
python scripts/seed_admin_user.py
python scripts/seed_diagnostic_rulebooks.py
```

Cultivos demo alineados con backend:

- `demo_papa`
- `demo_maiz`
- `demo_quinua`
- `demo_palta`
- `demo_arandano`

## Conectado al backend

### Auth

- `POST /auth/login`
- Guarda sesion JWT en `sessionStorage`.
- Usa Bearer token para endpoints protegidos.

### Parcelas

- `GET /parcelas`
- `POST /parcelas`

Uso actual:

- Dashboard lista parcelas reales.
- Nueva evaluacion crea parcela real.
- Nueva evaluacion permite dibujar poligonos con Leaflet.
- El poligono se convierte a GeoJSON en orden `[lng, lat]`, como espera el backend.
- Tambien se puede cargar un archivo GeoJSON con `Polygon` o `MultiPolygon`.

Limitacion:

- La seleccion de parcelas existentes queda pendiente.
- KML queda pendiente de parser; por ahora se acepta GeoJSON.
- El area se calcula de forma aproximada en frontend para ayudar al usuario.

### Evaluaciones

- `POST /evaluaciones`
- `GET /evaluaciones/{evaluation_id}/estado`
- `GET /evaluaciones/{evaluation_id}/resultado-mcda`

Uso actual:

- `NewEvaluation` inicia evaluacion.
- `Processing` consulta estado.
- `Results` muestra ranking MCDA real.
- `CropDetail` muestra brechas y factores limitantes reales.

Limitacion:

- El frontend no procesa Outbox/GEE/MCDA.
- Si el backend no completa la saga, la UI queda esperando resultado.

### Recomendaciones

- `GET /evaluaciones/{evaluation_id}/recomendacion-final`

Estado:

- Parcial.
- La pantalla consulta el endpoint real.
- Si no hay recomendacion persistida, muestra acciones derivadas de brechas MCDA.
- El backend actualmente no devuelve secciones/texto completo de recomendacion.

## Mock o provisional

- Cards visuales de procesamiento: `processingData.ts`.
- Reporte: `Report.tsx` todavia es visual/prototipo.
- Algunas referencias de RAG en resultados/reporte son informativas hasta que backend exponga datos completos.

## Delimitacion con Leaflet y Google Earth Engine

La delimitacion de parcela se realiza en frontend con Leaflet:

- El usuario hace click sobre el mapa para agregar vertices.
- Con 3 o mas vertices se arma un poligono.
- Leaflet trabaja con coordenadas `[lat, lng]`.
- El frontend convierte la geometria a GeoJSON `[lng, lat]`.
- El GeoJSON se envia a `POST /parcelas`.

Google Earth Engine no se usa desde React. Las credenciales GEE deben vivir solo en backend. El frontend solo envia la geometria; el backend usa GEE para extraer variables agroambientales y luego calcular MCDA.

## Separacion realizada

Se removio de este repo:

- Ruta `admin`.
- Import de `Admin`.
- Boton "Panel tecnico" del Dashboard.
- Seccion Admin del Sidebar.
- Carpeta `src/features/admin`.

El `package.json` fue renombrado a:

```json
"name": "via-agricultural-frontend"
```

## Siguientes pasos

- Permitir seleccionar parcelas existentes al iniciar evaluacion.
- Mejorar la edicion de vertices del poligono.
- Agregar busqueda por lugar/distrito en el mapa.
- Agregar endpoint/listado historico de evaluaciones cuando backend lo tenga.
- Conectar Report a datos reales o endpoint de reporte.
- Revisar roles cuando backend distinga Usuario Agricola vs Admin.
