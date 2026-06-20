# Frontend Architecture

Este frontend queda organizado por bounded contexts para alinearse con el backend VIA.

## Capas por feature

- `domain`: tipos, entidades y reglas propias del contexto, sin React ni llamadas HTTP.
- `application`: casos de uso, puertos y orquestacion de la feature.
- `infrastructure`: adaptadores concretos, clientes API y mocks temporales.
- `presentation`: paginas, componentes y estado de UI.

## Contextos actuales

- `auth`: autenticacion y sesion.
- `dashboard`: resumen inicial y metricas.
- `evaluations`: parcelas, procesamiento, resultados, reportes y recomendaciones.
- `admin`: panel tecnico, rulebooks y documentos.

## Shared

`shared` contiene UI reutilizable, layouts, estilos, contratos comunes e infraestructura transversal como el cliente HTTP.

Los archivos en `infrastructure/mock` son datos temporales del prototipo Figma Make. Deben reemplazarse gradualmente por adaptadores en `infrastructure/api`.
