# Frontend VIA / AgroDecisions

Frontend React para el sistema VIA, orientado a evaluar la viabilidad agricola de parcelas mediante integracion con el backend FastAPI.

El proyecto nacio como prototipo Figma Make y fue reorganizado progresivamente para acercarse a Clean Architecture y Domain Driven Design, siguiendo la separacion por contextos del backend.

## Estado general

Actualizado al avance local del 2026-06-20.

El frontend ya no es solo maqueta: varias pantallas consumen el backend local en `http://127.0.0.1:8000` mediante el proxy de Vite `/api`.

Sin embargo, todavia conviven tres niveles:

- Conectado a backend real.
- Parcialmente conectado con fallback visual.
- Mock temporal heredado del prototipo.

## Como levantar el frontend

Instalar dependencias:

```bash
npm i
```

Levantar servidor de desarrollo:

```bash
npm run dev
```

Por defecto Vite usa el proxy configurado en `vite.config.ts`:

```ts
/api -> http://127.0.0.1:8000
```

Por eso el backend debe estar corriendo localmente antes de probar login, parcelas o evaluaciones.

Build de produccion:

```bash
npm run build
```

El build pasa correctamente. Actualmente Vite muestra un warning de bundle grande, pero no bloquea la compilacion.

## Backend esperado

El frontend asume el backend VIA corriendo en:

```text
http://127.0.0.1:8000
```

Usuario local usado en pruebas:

```text
admin@via.local
Admin123456
```

Ese usuario debe existir en backend mediante el seed:

```bash
python scripts/seed_admin_user.py
```

Para evaluaciones MCDA se espera que backend tenga rulebooks demo sembrados:

```bash
python scripts/seed_diagnostic_rulebooks.py
```

Cultivos demo alineados con backend:

- `demo_papa`
- `demo_maiz`
- `demo_quinua`
- `demo_palta`
- `demo_arandano`

Estos son fixtures de validacion funcional, no datos agronomicos reales.

## Arquitectura frontend

La estructura principal esta organizada por features:

```text
src/
  app/
  shared/
  features/
    auth/
    dashboard/
    evaluations/
    admin/
```

Cada feature sigue esta separacion:

- `domain`: tipos y reglas propias del contexto.
- `application`: casos de uso, puertos y contratos.
- `infrastructure`: adaptadores API, storage y mocks temporales.
- `presentation`: paginas y componentes React.

Documento complementario:

```text
src/ARCHITECTURE.md
```

## Lo que ya esta conectado al backend

### Auth / IAM

Estado: conectado.

Pantalla:

- `src/features/auth/presentation/pages/Login.tsx`

Backend:

- `POST /auth/login`

Implementado:

- Login real contra backend.
- Guardado de sesion en `sessionStorage`.
- Uso de JWT Bearer para endpoints protegidos.
- Manejo basico de errores de credenciales o backend.

### Parcelas

Estado: conectado.

Backend:

- `GET /parcelas`
- `POST /parcelas`
- `GET /parcelas/{id}`
- `PATCH /parcelas/{id}`

Implementado en frontend:

- Creacion de parcela desde el flujo de nueva evaluacion.
- Listado real de parcelas en Dashboard.
- Uso de token de sesion para consultar parcelas.

Archivos relevantes:

- `src/features/evaluations/domain/parcel.ts`
- `src/features/evaluations/infrastructure/api/parcelApiRepository.ts`
- `src/features/dashboard/presentation/pages/Dashboard.tsx`
- `src/features/evaluations/presentation/pages/NewEvaluation.tsx`

Limitacion actual:

- La delimitacion todavia no usa Leaflet real.
- Se usa una geometria demo interna para enviar GeoJSON valido al backend.
- Falta cargar o dibujar parcelas desde UI.

### Evaluaciones

Estado: conectado.

Backend:

- `POST /evaluaciones`
- `GET /evaluaciones/{evaluation_id}/estado`
- `GET /evaluaciones/{evaluation_id}/resultado-mcda`

Implementado:

- Inicio de evaluacion desde `NewEvaluation`.
- Guardado de evaluacion activa en `sessionStorage`.
- Polling de estado desde `Processing`.
- Lectura de resultado MCDA desde `Results`.
- Detalle de cultivo desde resultado MCDA real en `CropDetail`.

Archivos relevantes:

- `src/features/evaluations/domain/evaluation.ts`
- `src/features/evaluations/application/startEvaluationWorkflow.ts`
- `src/features/evaluations/infrastructure/api/evaluationApiRepository.ts`
- `src/features/evaluations/infrastructure/session/currentEvaluationStorage.ts`
- `src/features/evaluations/presentation/pages/Processing.tsx`
- `src/features/evaluations/presentation/pages/Results.tsx`
- `src/features/evaluations/presentation/pages/CropDetail.tsx`

Limitacion actual:

- El frontend no procesa Outbox, GEE ni MCDA por si mismo.
- El backend o sus scripts/workers deben completar la evaluacion.
- Si el backend queda en `INICIADA`, la pantalla de procesamiento seguira esperando.

### Resultado MCDA

Estado: conectado.

Implementado:

- Ranking de cultivos.
- Score por cultivo.
- Categoria de viabilidad.
- Condicion de calculo.
- Brechas agronomicas.
- Factores limitantes.

Pantallas:

- `Results`
- `CropDetail`
- `Recommendations` usa brechas MCDA como fallback.

## Parcialmente conectado

### Recomendaciones

Estado: parcialmente conectado.

Backend:

- `GET /evaluaciones/{evaluation_id}/recomendacion-final`
- `GET /evaluaciones/{evaluation_id}/recomendaciones`

Implementado:

- `Recommendations` consulta la recomendacion final real.
- Si backend responde pendiente, la UI muestra acciones derivadas desde brechas MCDA reales.
- Si backend devuelve recomendacion persistida, se muestran metadatos como titulo, estado, proveedor y evidencias.

Limitacion actual:

- El router backend actualmente devuelve `sections=[]`.
- No llega texto completo de recomendacion al frontend.
- RAG/LLM final esta marcado en backend como fase posterior.

Por eso la pantalla no debe considerarse recomendacion agronomica final todavia.

### Dashboard

Estado: parcialmente conectado.

Conectado:

- Conteo y listado de parcelas reales desde `/parcelas`.
- Indicadores simples derivados localmente.

No conectado por falta de endpoint:

- Historico real de evaluaciones.
- Metricas agregadas por mes.
- Alertas agronomicas globales.
- Ranking historico de cultivos priorizados.

## Lo que sigue mockeado

### Admin

Estado: mock temporal.

Pantalla:

- `src/features/admin/presentation/pages/Admin.tsx`

Datos:

- `src/features/admin/infrastructure/mock/adminData.ts`

Motivo:

- Aunque backend tiene codigo de rulebooks y documentos, los servicios de rulebooks/documentos no estan completamente expuestos para uso estable desde frontend.
- El endpoint de rulebooks existe en codigo, pero no conviene depender de el hasta que backend cablee sus dependencias reales en la app principal.

Incluye mock de:

- Rulebooks.
- Documentos RAG.
- Fragmentos RAG.
- Estadisticas de administracion.

### Reporte

Estado: mock temporal.

Pantalla:

- `src/features/evaluations/presentation/pages/Report.tsx`

Motivo:

- El backend demo genera reportes de trazabilidad en `artifacts/demo_runs/` cuando se ejecuta `scripts/run_traceable_e2e_demo.py`.
- No existe aun un endpoint frontend-oriented para descargar PDF o reporte final desde la UI.

### Procesamiento visual detallado

Estado: mixto.

Conectado:

- Estado real de evaluacion desde `/evaluaciones/{id}/estado`.

Mock:

- Cards visuales de variables como NDVI, pH, humedad, temperatura, pendiente, etc.
- Fuentes visuales del procesamiento.

Motivo:

- El backend expone resultado MCDA, gaps y factores limitantes, pero no un endpoint detallado de variables crudas por parcela para pintar todas las cards del prototipo.

Archivo mock:

- `src/features/evaluations/infrastructure/mock/processingData.ts`

### Geometria de parcela

Estado: mock tecnico temporal.

Archivo:

- `src/features/evaluations/infrastructure/mock/demoParcelGeometry.ts`

Motivo:

- Permite probar el flujo real de backend sin implementar todavia Leaflet.
- El README del backend advierte que Leaflet usa `[lat, lng]`, pero GeoJSON requiere `[lng, lat]`.

Pendiente:

- Implementar mapa real.
- Convertir correctamente coordenadas Leaflet a GeoJSON.
- Permitir cargar GeoJSON, por ejemplo los archivos del backend:
  - `examples/parcels/parcela_humalla.geojson`
  - `examples/parcels/parcela_oyon.geojson`

## Demo E2E del backend vs frontend

El README del backend describe una demo E2E con:

```bash
python scripts/run_traceable_e2e_demo.py
```

Esa demo:

- Registra una parcela desde un archivo GeoJSON.
- Inicia una evaluacion.
- Procesa Outbox.
- Usa Google Earth Engine real.
- Calcula MCDA.
- Genera archivos JSON de trazabilidad.
- Genera `trace_report.md`.

Eso es una prueba automatizada del backend, no una pantalla frontend.

El frontend implementa el equivalente interactivo solo hasta:

- Login.
- Crear parcela.
- Iniciar evaluacion.
- Consultar estado.
- Consultar resultado MCDA.
- Mostrar ranking y brechas.
- Consultar recomendacion final si existe.

No implementa todavia:

- Ejecucion del script E2E.
- Lectura de `artifacts/demo_runs/`.
- Visualizacion de los 15 JSON de trazabilidad.
- Descarga de `trace_report.md`.

## Variables de entorno frontend

El cliente HTTP usa:

```ts
VITE_API_BASE_URL
```

Si no se define, usa `/api`.

En desarrollo local se recomienda no definirla y dejar que Vite use el proxy:

```text
/api -> http://127.0.0.1:8000
```

Si se despliega sin proxy, definir:

```text
VITE_API_BASE_URL=http://127.0.0.1:8000
```

o la URL real del backend.

## Validacion realizada

Comando ejecutado:

```bash
npm.cmd run build
```

Resultado:

- Build OK.
- Warning no bloqueante: bundle JS mayor a 500 kB.

Tambien se probo contra backend local:

- Login OK con usuario admin.
- `GET /parcelas` OK, devolviendo parcelas reales.

## Siguientes pasos sugeridos

Prioridad alta:

- Implementar mapa real con Leaflet.
- Convertir `[lat, lng]` a GeoJSON `[lng, lat]`.
- Permitir seleccionar o cargar parcelas GeoJSON.
- Mejorar `NewEvaluation` para seleccionar parcelas existentes.
- Agregar endpoint/backend o flujo para listar evaluaciones historicas.
- Completar Report con datos reales o endpoint de reporte.

Prioridad media:

- Consumir texto/secciones reales de recomendaciones cuando backend las exponga.
- Reemplazar cards mock de procesamiento por endpoint de variables extraidas.
- Agregar estados vacios, errores y reintentos mas finos.
- Code splitting para reducir warning de bundle grande.

Prioridad posterior:

- Conectar Admin a rulebooks reales cuando backend estabilice esos servicios.
- Conectar documentos/RAG reales.
- Descargar o visualizar trazabilidad generada por backend.

## Notas para desarrollo

- No asumir que todos los endpoints declarados en backend estan listos para UI.
- Si un endpoint existe pero no esta cableado en `main.py`, mantener mock o fallback.
- Mantener mocks dentro de `infrastructure/mock`.
- Nuevas integraciones deben entrar por `infrastructure/api` y contratos en `application`.
- Evitar llamadas HTTP directas desde componentes si se puede crear un adaptador.
