# Frontend Architecture - Usuario Agricola

Este frontend queda limitado a la experiencia del Usuario Agricola de VIA.

La administracion tecnica fue movida al proyecto:

```text
C:\Users\fmall\Downloads\Prototipo web AgroDesicions Admin
```

## Capas por feature

- `domain`: tipos, entidades y reglas propias del contexto, sin React ni llamadas HTTP.
- `application`: casos de uso, puertos y orquestacion de la feature.
- `infrastructure`: adaptadores concretos, clientes API, storage y mocks temporales.
- `presentation`: paginas, componentes y estado de UI.

## Contextos actuales

- `auth`: autenticacion y sesion.
- `dashboard`: resumen agricola, parcelas reales y metricas parciales.
- `evaluations`: parcelas, procesamiento, resultados, reportes y recomendaciones.

## Shared

`shared` contiene UI reutilizable, layouts, estilos, contratos comunes e infraestructura transversal como el cliente HTTP.

Los archivos en `infrastructure/mock` son datos temporales del prototipo Figma Make. Deben reemplazarse gradualmente por adaptadores en `infrastructure/api`.

## Regla de separacion

Este repo no debe incorporar pantallas ni casos de uso de administracion tecnica, rulebooks o documentos RAG. Ese alcance pertenece al frontend Admin.
