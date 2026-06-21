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

Limitacion:

- Todavia no hay mapa Leaflet real.
- Se usa `demoParcelGeometry.ts` para enviar GeoJSON valido.

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

- Geometria demo de parcela: `src/features/evaluations/infrastructure/mock/demoParcelGeometry.ts`.
- Cards visuales de procesamiento: `processingData.ts`.
- Reporte: `Report.tsx` todavia es visual/prototipo.
- Algunas referencias de RAG en resultados/reporte son informativas hasta que backend exponga datos completos.

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

- Implementar mapa real con Leaflet.
- Convertir coordenadas Leaflet `[lat, lng]` a GeoJSON `[lng, lat]`.
- Permitir cargar GeoJSON de ejemplo o dibujar parcela.
- Permitir seleccionar parcelas existentes al iniciar evaluacion.
- Agregar endpoint/listado historico de evaluaciones cuando backend lo tenga.
- Conectar Report a datos reales o endpoint de reporte.
- Revisar roles cuando backend distinga Usuario Agricola vs Admin.
