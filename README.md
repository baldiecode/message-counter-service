# Message Counter Service

Servicio HTTP construido con NestJS para:

- Recibir webhooks de mensajes y contarlos por hora (agregación por bucket UTC).
- Consultar conteos por rango (hasta 30 días).
- Documentación OpenAPI/Swagger en /docs.

Archivos clave

- Código app: [src/main.ts](src/main.ts:1), [src/infrastructure/infrastructure.module.ts](src/infrastructure/infrastructure.module.ts:1), [src/infrastructure/http/webhook.controller.ts](src/infrastructure/http/webhook.controller.ts:1), [src/infrastructure/http/counts.controller.ts](src/infrastructure/http/counts.controller.ts:1)
- DTOs: [src/infrastructure/http/dtos/webhook-message.dto.ts](src/infrastructure/http/dtos/webhook-message.dto.ts:1), [src/infrastructure/http/dtos/get-counts.query.dto.ts](src/infrastructure/http/dtos/get-counts.query.dto.ts:1)
- Esquemas Mongo: [src/infrastructure/persistence/schemas/message.schema.ts](src/infrastructure/persistence/schemas/message.schema.ts:1), [src/infrastructure/persistence/schemas/hourly-count.schema.ts](src/infrastructure/persistence/schemas/hourly-count.schema.ts:1)
- Docker: [Dockerfile](Dockerfile:1), [.dockerignore](.dockerignore:1)
- Decisiones de arquitectura: [Decisions.md](Decisions.md:1)

Producción (Render)

- El servicio está desplegado en Render como Web Service basado en Dockerfile.
- URL pública: https://message-counter-service.onrender.com.
- Documentación en producción:
  - UI: https://message-counter-service.onrender.com/docs
  - JSON: https://message-counter-service.onrender.com/docs-json

Infraestructura y despliegue

- Runtime del servicio: Docker multi-stage definido en [Dockerfile](Dockerfile:1) (pnpm/Corepack, non-root, healthcheck).
- Base de datos: MongoDB Atlas (Cluster administrado) o MongoDB local en contenedor.
- Render toma el puerto de la variable de entorno PORT (Render la inyecta automáticamente). El arranque del servidor está en [src/main.ts](src/main.ts:6).

Requisitos

- Node.js 22+
- pnpm 8+ (recomendado habilitar con corepack)
- MongoDB Atlas (URI mongodb+srv) o Docker para MongoDB local
- Cuenta en Render (para despliegue)

Este proyecto está preparado para que un revisor lo ejecute localmente sin crear su propia cuenta de MongoDB Atlas. Yo proporcionaré por privado una MONGO_URI preconfigurada (usuario temporal con acceso a una base de revisión en mi cluster). Con esa cadena:

- Todas las escrituras irán a la base de revisión de mi cluster (aislada de datos productivos).
- No necesitas registrar ni configurar tu propio Atlas.
- Si ves errores de “IP not allowed”, avísame para agregar tu IP pública a la allowlist o habilitar una ventana temporal.

Pasos

1. Clonar e instalar
   git clone https://github.com/baldiecode/message-counter-service.git
   cd message-counter-service
   pnpm install

2. Arrancar con la MONGO_URI proporcionada
   - macOS/Linux (zsh/bash):
     MONGO_URI='mongodb+srv://challenge_reviewer:PASSWORD_URLENCODED@TUCLUSTER.mongodb.net/message_counter_review?retryWrites=true&w=majority' pnpm start:dev

   - Windows PowerShell:
     $env:MONGO_URI="mongodb+srv://challenge_reviewer:PASSWORD_URLENCODED@TUCLUSTER.mongodb.net/message_counter_review?retryWrites=true&w=majority"; pnpm start:dev

   - Usando archivo .env (no versionado):

     # .env

     MONGO_URI=mongodb+srv://challenge_reviewer:PASSWORD_URLENCODED@TUCLUSTER.mongodb.net/message_counter_review?retryWrites=true&w=majority
     PORT=3000

     # macOS/Linux

     set -a; source .env; set +a; pnpm start:dev

3. Verificación local
   - Swagger UI: http://localhost:3000/docs
   - OpenAPI JSON: http://localhost:3000/docs-json

Notas importantes

- Password URL-encoded: si la contraseña tiene caracteres especiales, deben codificarse (@ → %40, ! → %21, # → %23, & → %26, + → %2B, / → %2F, : → %3A, ? → %3F).
- Seguridad: no publiques la MONGO_URI ni la subas al repo. Si usas .env, está ignorado en [.gitignore](.gitignore:2).
- Aislamiento: esta URI apunta a una base de revisión (por ejemplo, message_counter_review). Al finalizar la evaluación, revocaré el usuario temporal y limpiaré la base.
  Clonar y arrancar (paso a paso)

1. Clona el repositorio y entra al proyecto:
   git clone https://github.com/baldiecode/message-counter-service.git
   cd message-counter-service

2. Instala dependencias:
   pnpm install

3. Configura la base de datos (elige una):
   - Opción A: Atlas (recomendada)
     - Se proporcionara cadena mongodb+srv.
     - Asegúrate de URL-encode para caracteres especiales en la contraseña.
   - Opción B: MongoDB en Docker (local)
     - Arranca un contenedor local de Mongo:
       docker run -d --name mongo-local -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=admin \
        -e MONGO_INITDB_ROOT_PASSWORD=admin \
        mongo:7
     - URI: mongodb://admin:admin@127.0.0.1:27017/message_counter?authSource=admin

4. Arranca la app (macOS/Linux):
   - Inline con variables:
     MONGO_URI='TU_URI' pnpm start:dev
   - Usando un archivo .env:
     - Crea un archivo .env con:
       MONGO_URI=TU_URI
       PORT=3000
     - Exporta y arranca:
       set -a; source .env; set +a; pnpm start:dev
   - Windows PowerShell:
     $env:MONGO_URI="TU_URI"; $env:PORT="3000"; pnpm start:dev

5. Verifica Swagger:
   - UI: http://localhost:3000/docs
   - JSON: http://localhost:3000/docs-json

Importante: nunca publiques tu MONGO_URI (con usuario/contraseña) en el repositorio. Usa variables de entorno locales y secretos en tu plataforma (Render/GitHub).

Ejecución local con MongoDB en Docker

1. Levanta MongoDB con Docker:
   docker run -d --name mongo-local -p 27017:27017 \
    -e MONGO_INITDB_ROOT_USERNAME=admin \
    -e MONGO_INITDB_ROOT_PASSWORD=admin \
    mongo:7
2. Usa esta URI para la app (autenticación contra admin):
   MONGO_URI='mongodb://admin:admin@127.0.0.1:27017/message_counter?authSource=admin'
3. Arranca la app:
   MONGO_URI='mongodb://admin:admin@127.0.0.1:27017/message_counter?authSource=admin' pnpm start:dev

Docker del servicio (local)

- Build:
  docker build -t message-counter:latest .
- Run (usando Atlas):
  docker run --rm -p 3000:3000 \
   -e PORT=3000 \
   -e MONGO_URI="mongodb+srv://USUARIO:PASSWORD_URLENCODED@cluster.mongodb.net/message_counter?retryWrites=true&w=majority" \
   message-counter:latest
- Run (usando Mongo local en Docker):
  docker run --rm -p 3000:3000 \
   -e PORT=3000 \
   -e MONGO_URI="mongodb://admin:admin@host.docker.internal:27017/message_counter?authSource=admin" \
   message-counter:latest
- Abre http://localhost:3000/docs

Swagger / OpenAPI (local)

- UI: http://localhost:3000/docs
- JSON: http://localhost:3000/docs-json

Endpoints

- POST /webhook
  - Body:
    {
    "message_id": "msg_01HX9FZ2E0KJ8C3Q9XP",
    "account_id": "acc_11111111-1111-4111-8111-111111111111",
    "created_at": "2025-09-18T10:00:00Z",
    "metadata": { "source": "whatsapp", "channel": "inbound" }
    }
  - Respuesta: 202 Accepted (procesamiento asíncrono).
- GET /counts?account_id=...&from=...&to=...
  - Ejemplo:
    /counts?account_id=acc_1111...&from=2025-09-18T10:00:00Z&to=2025-09-18T12:00:00Z
  - Respuesta:
    [
    { "account_id": "acc_...", "datetime": "2025-09-18T10:00:00.000Z", "count_messages": 1 }
    ]

cURL de prueba (local)

- POST /webhook:
  curl -X POST http://localhost:3000/webhook \
   -H "Content-Type: application/json" \
   -d '{"message_id":"msg_demo_01","account_id":"acc_11111111-1111-4111-8111-111111111111","created_at":"2025-09-18T10:15:00Z","metadata":{"source":"whatsapp","channel":"inbound"}}'
- GET /counts:
  curl "http://localhost:3000/counts?account_id=acc_11111111-1111-4111-8111-111111111111&from=2025-09-18T10:00:00Z&to=2025-09-18T12:00:00Z"

cURL de prueba (producción en Render)

- POST /webhook:
  curl -X POST https://message-counter-service.onrender.com/webhook \
   -H "Content-Type: application/json" \
   -d '{"message_id":"msg_demo_01","account_id":"acc_11111111-1111-4111-8111-111111111111","created_at":"2025-09-18T10:15:00Z","metadata":{"source":"whatsapp","channel":"inbound"}}'
- GET /counts:
  curl "https://message-counter-service.onrender.com/counts?account_id=acc_11111111-1111-4111-8111-111111111111&from=2025-09-18T10:00:00Z&to=2025-09-18T12:00:00Z"

Notas de seguridad

- Mantén MONGO_URI como secreto en Render/GitHub; no lo subas al repo.
- Si expones el servicio públicamente, considera:
  - Rate limiting y validaciones (mejora futura: firma HMAC del webhook).
  - Rotación de credenciales de Atlas y evitar 0.0.0.0/0 en producción.

Licencia

- UNLICENSED (ver [package.json](package.json:1)).
