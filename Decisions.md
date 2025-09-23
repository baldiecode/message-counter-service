# Decisions: Arquitectura y decisiones del Message Counter Service

Alcance: documento breve, donde describo el diseño, garantías de idempotencia/consistencia, supuestos y mejoras, y las acciones que realicé. Incluyo referencias a constructos y archivos para trazabilidad.

1. Diseño de la solución (estructura, modelo de datos, endpoints)

Estructura y patrones

- Diseñé una arquitectura Hexagonal con CQRS: separé HTTP (adaptadores), Aplicación (orquestación de casos de uso), Dominio (reglas de negocio, VOs/entidades/servicios) e Infraestructura (repositorios Mongo y notificador externo).
- Preparé el arranque y documentación: configuré ValidationPipe, CORS y Swagger (/docs) dentro de [bootstrap()](src/main.ts:6) en [src/main.ts](src/main.ts).
- Composé el aplicativo importando módulos: [AppModule](src/app.module.ts:12) importa [InfrastructureModule](src/infrastructure/infrastructure.module.ts:19) y [ApplicationModule](src/application/application.module.ts:11).
- En el módulo de infraestructura conecté Mongo, registré esquemas y providers; además añadí logging en [onModuleInit()](src/infrastructure/infrastructure.module.ts:50) de [InfrastructureModule](src/infrastructure/infrastructure.module.ts:47).

Flujo de escritura (webhook)

- Expuse POST /webhook en [WebhookController](src/infrastructure/http/webhook.controller.ts:9) y mapeé el DTO a [ProcessWebhookCommand](src/application/commands/process-webhook.command.ts:1) en [receive()](src/infrastructure/http/webhook.controller.ts:18).
- Implementé el caso de uso en [ProcessWebhookHandler](src/application/commands/process-webhook.handler.ts:10): en [execute()](src/application/commands/process-webhook.handler.ts:19) valido datos, creo VOs/entidad y llamo a [MessageProcessingService.processMessage()](src/domain/services/message-processing.service.ts:24).
- En el dominio, [MessageProcessingService](src/domain/services/message-processing.service.ts:13) aplica idempotencia, persiste el mensaje, actualiza el contador horario, calcula el total diario y notifica externamente.
- En persistencia, uso [MongoMessageRepository.save()](src/infrastructure/persistence/mongo-message.repository.ts:24) para guardar y [MongoHourlyCountRepository.incrementCount()](src/infrastructure/persistence/mongo-hourly-count.repository.ts:24) para $inc atómico con upsert.

Flujo de lectura (conteos)

- Expuse GET /counts en [CountsController](src/infrastructure/http/counts.controller.ts:10); en [getCounts()](src/infrastructure/http/counts.controller.ts:40) mapeo a [GetCountsQuery](src/application/queries/get-counts.query.ts:1).
- Implementé el caso de uso en [GetCountsHandler](src/application/queries/get-counts.handler.ts:15): en [execute()](src/application/queries/get-counts.handler.ts:25) valido el rango y consulto [HourlyCountRepository.findByRange()](src/infrastructure/persistence/mongo-hourly-count.repository.ts:35).
- Transformo la respuesta a {account_id, datetime, count_messages} y documento el esquema en Swagger.

Modelo de datos (MongoDB/Mongoose)

- Mensajes
  - Definí el esquema [MessageSchema](src/infrastructure/persistence/schemas/message.schema.ts:3).
  - Campos: \_id (message_id), accountId, createdAt, metadata.
  - Índices: compuesto {accountId, createdAt}; uso \_id único para idempotencia por message_id.
  - Repositorio: [MongoMessageRepository](src/infrastructure/persistence/mongo-message.repository.ts:17) con [findById()](src/infrastructure/persistence/mongo-message.repository.ts:48) y [save()](src/infrastructure/persistence/mongo-message.repository.ts:24).
- Contadores horarios
  - Definí el esquema [HourlyCountSchema](src/infrastructure/persistence/schemas/hourly-count.schema.ts:3).
  - Campos: accountId, hour (YYYY-MM-DDTHH:00:00Z), count, lastUpdated.
  - Índices: único {accountId, hour} y auxiliar por hour.
  - Repositorio: [MongoHourlyCountRepository](src/infrastructure/persistence/mongo-hourly-count.repository.ts:19) con [incrementCount()](src/infrastructure/persistence/mongo-hourly-count.repository.ts:24) y [findByRange()](src/infrastructure/persistence/mongo-hourly-count.repository.ts:35).
- Value Objects de tiempo e identidad
  - Hora (UTC): utilicé [HourBucket](src/domain/value-objects/hour-bucket.vo.ts:1), con validación en [ensureValidFormat()](src/domain/value-objects/hour-bucket.vo.ts:27).
  - Día (UTC): utilicé [DayBucket](src/domain/value-objects/day-bucket.vo.ts:1) con formato YYYY-MM-DD.
  - Cuenta: utilicé [AccountId](src/domain/value-objects/account-id.vo.ts:3) con prefijo acc\_ + UUID v4.

Endpoints expuestos

- POST /webhook
  - Controlador: [WebhookController.receive()](src/infrastructure/http/webhook.controller.ts:18)
  - Request DTO: [src/infrastructure/http/dtos/webhook-message.dto.ts](src/infrastructure/http/dtos/webhook-message.dto.ts)
  - Respuesta: 202 Accepted (persistencia + conteo síncronos en esta versión).
- GET /counts?account_id=...&from=...&to=...
  - Controlador: [CountsController.getCounts()](src/infrastructure/http/counts.controller.ts:40)
  - Query DTO: [src/infrastructure/http/dtos/get-counts.query.dto.ts](src/infrastructure/http/dtos/get-counts.query.dto.ts)
  - Respuesta: arreglo de buckets horarios con conteos.
- Documentación: configuré Swagger en [bootstrap()](src/main.ts:12) para /docs.

2. Idempotencia y consistencia

Idempotencia de ingesta

- Implementé una doble barrera:
  - En dominio: en [processMessage()](src/domain/services/message-processing.service.ts:24) primero llamo [findById()](src/domain/services/message-processing.service.ts:26) y retorno si ya existe.
  - En infraestructura: en [MongoMessageRepository.save()](src/infrastructure/persistence/mongo-message.repository.ts:24) trato el error 11000 (duplicado de \_id) como éxito idempotente ([src](src/infrastructure/persistence/mongo-message.repository.ts:34)).
- Resultado: reintentos/duplicados del webhook no suman conteos.

Consistencia de contadores

- Uso incremento atómico en [incrementCount()](src/infrastructure/persistence/mongo-hourly-count.repository.ts:24) con updateOne {$inc, upsert:true}, soportado por el índice único [HourlyCountSchema.index](src/infrastructure/persistence/schemas/hourly-count.schema.ts:12).
- Normalizo tiempo a UTC con VOs ([HourBucket.fromDate()](src/domain/value-objects/hour-bucket.vo.ts:6)) para evitar ambigüedades de zonas.
- Para lecturas consistentes, [findByRange()](src/infrastructure/persistence/mongo-hourly-count.repository.ts:35) traduce rangos Date→bucket y ordena por hora asc.
- Acepto eventual consistency: mensajes tardíos actualizan buckets del pasado.

Validación y saneamiento de entrada

- Activé ValidationPipe (whitelist, transform) en [bootstrap()](src/main.ts:9).
- Definí DTOs dedicados: [webhook-message.dto.ts](src/infrastructure/http/dtos/webhook-message.dto.ts) y [get-counts.query.dto.ts](src/infrastructure/http/dtos/get-counts.query.dto.ts).

3. Supuestos y mejoras propuestas

Supuestos actuales

- Dejé endpoints públicos para demo; asumo red/acceso controlado.
- Aún no valido firma HMAC de webhook; confío en el origen en este entorno.
- La notificación externa se ejecuta inline en [processMessage()](src/domain/services/message-processing.service.ts:48) con timeout global del [HttpModule](src/infrastructure/infrastructure.module.ts:23).
- No configuré TTL para mensajes; se conservan para auditoría.

Mejoras recomendadas (prioridad)

- Seguridad:
  - Verificar firma HMAC del webhook (cabecera + secreto por cuenta) en [WebhookController.receive()](src/infrastructure/http/webhook.controller.ts:18).
  - Aplicar rate limiting y CORS restringido; proteger GET /counts con API key/JWT.
- Confiabilidad:
  - Implementar patrón Outbox para notificaciones: persistir evento y despachar asíncrono con reintentos/backoff y DLQ.
  - Añadir idempotencia a notificaciones (dedupe key).
- Observabilidad:
  - Log estructurado con correlación (message_id, account_id), métricas y trazas.
- Escalabilidad y costos:
  - Considerar sharding por accountId en Mongo a gran escala.
  - Configurar TTL para mensajes si la ventana de auditoría es finita (p.ej., 90 días).
- Configuración y DX:
  - Centralizar configuración (ConfigModule) y parametrizar límites (como los 30 días en [GetCountsHandler.execute()](src/application/queries/get-counts.handler.ts:44)).
  - Validar configuración en arranque.

4. Acciones concretas que realicé

- Realicé el análisis y trazabilidad de arquitectura, mapeando capas y flujos con referencias exactas (p.ej., [execute()](src/application/commands/process-webhook.handler.ts:19), [incrementCount()](src/infrastructure/persistence/mongo-hourly-count.repository.ts:24)).
- Verifiqué y aseguré la idempotencia/consistencia: manejo de duplicados en [save()](src/infrastructure/persistence/mongo-message.repository.ts:24) e índices únicos en [HourlyCountSchema](src/infrastructure/persistence/schemas/hourly-count.schema.ts:12).
- Validé contratos y rutas: endpoints y DTOs ([CountsController.getCounts()](src/infrastructure/http/counts.controller.ts:40), [WebhookController.receive()](src/infrastructure/http/webhook.controller.ts:18)).
- Redacté este documento [Decisions.md](Decisions.md) con justificación, supuestos y hoja de ruta de mejoras.

5. Acciones adicionales que realicé con IA en especifico quise probar una herramienta nueva para mi llamada Kilo Code, integrada al IDE Visual Studio Code.

- Dockerización y optimización de imagen:
  - Implementé multi-stage con pnpm/Corepack: [Dockerfile](Dockerfile:4), [Dockerfile](Dockerfile:7), build dedicado [Dockerfile](Dockerfile:20), deps de producción [Dockerfile](Dockerfile:23), ejecución no-root [Dockerfile](Dockerfile:32).
  - Agregué healthcheck HTTP para readiness: [Dockerfile](Dockerfile:42) y mantuve coherencia de puerto en [Dockerfile](Dockerfile:39) y [Dockerfile](Dockerfile:40).
  - Curé el contexto de build con [.dockerignore](.dockerignore:1) para reducir tamaño/tiempo.
- Estabilización de build y corrección de imports:
  - Alineé imports/exports en módulos para evitar errores de compilación, respetando límites de capas y DI: [src/application/application.module.ts](src/application/application.module.ts:11), [src/infrastructure/infrastructure.module.ts](src/infrastructure/infrastructure.module.ts:21).
  - Verifiqué tokens y providers: `MESSAGE_REPOSITORY`, `HOURLY_COUNT_REPOSITORY`, `EXTERNAL_NOTIFICATION_SERVICE` en [src/infrastructure/infrastructure.module.ts](src/infrastructure/infrastructure.module.ts:34).
- Toolchain y calidad:
  - Pauté scripts y fijé el package manager en [package.json](package.json:8); configuré ESLint/TS/Prettier en [eslint.config.mjs](eslint.config.mjs:7) y [.prettierrc](.prettierrc:1).
- Robustez del arranque y DX:
  - Activé ValidationPipe y CORS en [bootstrap()](src/main.ts:9-10) y publiqué Swagger con [SwaggerModule.setup()](src/main.ts:21).
  - Añadí logging de inicio/URI de Mongo en [InfrastructureModule.onModuleInit()](src/infrastructure/infrastructure.module.ts:50).
- Idempotencia/consistencia (auditoría adicional):
  - Aseguré manejo de duplicados (código 11000) en [MongoMessageRepository.save()](src/infrastructure/persistence/mongo-message.repository.ts:34).
  - Confirmé $inc + upsert e índice único `{accountId, hour}`: [MongoHourlyCountRepository.incrementCount()](src/infrastructure/persistence/mongo-hourly-count.repository.ts:24), [HourlyCountSchema.index](src/infrastructure/persistence/schemas/hourly-count.schema.ts:12).
  - Añadí índice auxiliar para rangos: [MessageSchema.index({ accountId, createdAt })](src/infrastructure/persistence/schemas/message.schema.ts:12).
- Validaciones de negocio y contratos:
  - Apliqué validaciones de rango y errores claros en [GetCountsHandler.execute()](src/application/queries/get-counts.handler.ts:25) y logging contextual en [WebhookController.receive()](src/infrastructure/http/webhook.controller.ts:18) y [CountsController.getCounts()](src/infrastructure/http/counts.controller.ts:40).
- Observabilidad y operatividad:
  - Incorporé healthcheck en el contenedor [Dockerfile](Dockerfile:42) y logs de arranque en infraestructura.

Apéndice: Resumen visual de flujo

- Escritura: /webhook → CommandBus → Dominio → Repos Mongo ($inc upsert) → Notificación externa.
- Lectura: /counts → QueryBus → Repo hourly → respuesta JSON ordenada por hora.

Referencias clave

- Arranque/Swagger: [bootstrap()](src/main.ts:6), [SwaggerModule.setup()](src/main.ts:21)
- Módulos: [AppModule](src/app.module.ts:12), [ApplicationModule](src/application/application.module.ts:11), [InfrastructureModule](src/infrastructure/infrastructure.module.ts:47)
- Controladores: [WebhookController](src/infrastructure/http/webhook.controller.ts:9), [CountsController](src/infrastructure/http/counts.controller.ts:10)
- Handlers CQRS: [ProcessWebhookHandler](src/application/commands/process-webhook.handler.ts:10), [GetCountsHandler](src/application/queries/get-counts.handler.ts:15)
- Dominio: [MessageProcessingService](src/domain/services/message-processing.service.ts:13), [HourBucket](src/domain/value-objects/hour-bucket.vo.ts:1), [DayBucket](src/domain/value-objects/day-bucket.vo.ts:1), [AccountId](src/domain/value-objects/account-id.vo.ts:3)
- Persistencia: [MongoMessageRepository](src/infrastructure/persistence/mongo-message.repository.ts:17), [MongoHourlyCountRepository](src/infrastructure/persistence/mongo-hourly-count.repository.ts:19), [MessageSchema](src/infrastructure/persistence/schemas/message.schema.ts:3), [HourlyCountSchema](src/infrastructure/persistence/schemas/hourly-count.schema.ts:3)

Fin del documento.
