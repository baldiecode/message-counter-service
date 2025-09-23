# Message Counter Service

Servicio HTTP construido con NestJS para:

- Recibir webhooks de mensajes y contarlos por hora.
- Consultar conteos por rango (hasta 30 días).
- Documentación OpenAPI/Swagger en /docs.

Archivos clave:

- Código app: [src/main.ts](src/main.ts), [src/infrastructure/infrastructure.module.ts](src/infrastructure/infrastructure.module.ts), [src/infrastructure/http/webhook.controller.ts](src/infrastructure/http/webhook.controller.ts), [src/infrastructure/http/counts.controller.ts](src/infrastructure/http/counts.controller.ts)
- DTOs: [src/infrastructure/http/dtos/webhook-message.dto.ts](src/infrastructure/http/dtos/webhook-message.dto.ts), [src/infrastructure/http/dtos/get-counts.query.dto.ts](src/infrastructure/http/dtos/get-counts.query.dto.ts)
- Requests de ejemplo: [src/requests/message-counter.http](src/requests/message-counter.http)
- Swagger habilitado en: [src.main.ts](src/main.ts)

Infraestructura y CI/CD:

- Docker: [Dockerfile](Dockerfile), [.dockerignore](.dockerignore)
- Railway config: [railway.json](railway.json)
- GitHub Actions CI/CD: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

Requisitos

- Node.js 22+
- pnpm 8+ (corepack recomendado)
- MongoDB Atlas (URI mongodb+srv) o MongoDB local
- GitHub (para CI/CD) y cuenta en Railway

Variables de entorno

- MONGO_URI: URI de conexión a Mongo (preferente Atlas, formato mongodb+srv://…/message_counter?…)
- PORT: puerto HTTP (default 3000)

Importante: nunca publiques tu MONGO_URI (con usuario/contraseña) en el repositorio. Usa variables de entorno locales y secretos en tu plataforma (Railway/GitHub).

Ejecución local (usando Atlas)

1. Crea un usuario de DB y habilita tu IP en Atlas (o 0.0.0.0/0 temporal para demo).
2. Asegúrate de codificar la contraseña si tiene caracteres especiales:
   - @ → %40, ! → %21, # → %23, & → %26, + → %2B, / → %2F, : → %3A, ? → %3F
3. Arranca:
   - macOS/Linux (zsh/bash):
     MONGO_URI='mongodb+srv://USUARIO:PASSWORD_URLENCODED@cluster.mongodb.net/message_counter?retryWrites=true&w=majority' pnpm start:dev
   - Si el puerto 3000 está ocupado:
     PORT=3001 MONGO_URI='...' pnpm start:dev
4. En los logs deberías ver:
   Connecting to MongoDB at mongodb+srv://…

Swagger / OpenAPI

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
    { "account_id": "acc_...", "datetime": "2025-09-18T10:00:00.000Z", "count_messages": 1 },
    ...
    ]

cURL de prueba

- POST /webhook:
  ts=$(date -u +%s)
  curl -X POST http://localhost:3000/webhook \
   -H "Content-Type: application/json" \
   -d '{"message_id":"msg_demo_01","account_id":"acc_11111111-1111-4111-8111-111111111111","created_at":"2025-09-18T10:15:00Z","metadata":{"source":"whatsapp","channel":"inbound"}}'
- GET /counts:
  curl "http://localhost:3000/counts?account_id=acc_11111111-1111-4111-8111-111111111111&from=2025-09-18T10:00:00Z&to=2025-09-18T12:00:00Z"

Docker (local)

- Build:
  docker build -t message-counter:latest .
- Run (usando Atlas):
  docker run --rm -p 3000:3000 \
   -e PORT=3000 \
   -e MONGO_URI="mongodb+srv://USUARIO:PASSWORD_URLENCODED@cluster.mongodb.net/message_counter?retryWrites=true&w=majority" \
   message-counter:latest
- Abre http://localhost:3000/docs

Despliegue en Railway con CI/CD (GitHub)
Tenemos dos caminos compatibles: conectar el repo a Railway (auto-deploy) y/o usar el workflow de GitHub Actions que ya incluye la CLI de Railway.

A) Auto-deploy conectando GitHub en Railway (más sencillo)

1. En Railway, crea un proyecto.
2. Conecta tu repositorio de GitHub.
3. Selecciona que use Dockerfile (auto-detectado por Railway). Si te pide config, el archivo [railway.json](railway.json) indica builder DOCKERFILE.
4. En Railway > Variables, define:
   - MONGO_URI (obligatorio) → tu URI de Atlas
   - PORT (opcional) → 3000 (Railway asigna un puerto, pero solemos exponer 3000 dentro del contenedor)
5. Ajusta IPs en Atlas:
   - Para demos públicas, puedes permitir 0.0.0.0/0 temporalmente (no recomendado en prod).
   - Ideal: permitir solo egress del PaaS (Railway); consulta su documentación de IPs salientes.
6. Dale “Deploy”. Railway construirá la imagen con [Dockerfile](Dockerfile) y levantará el servicio.
7. Prueba la URL pública de Railway:
   - https://TU-SUBDOMINIO.up.railway.app/docs

B) GitHub Actions + Railway CLI (ya incluido)
Este repositorio trae un workflow en [.github/workflows/deploy.yml](.github/workflows/deploy.yml) que:

- Instala dependencias, compila y usa la CLI de Railway para desplegar.
- Para usarlo, agrega los siguientes secretos en GitHub (Settings > Secrets and variables > Actions):
  - RAILWAY_TOKEN (obligatorio) → desde Railway (Account Settings > API Tokens).
  - RAILWAY_PROJECT_ID (recomendado) → railway project list.
  - RAILWAY_ENVIRONMENT_ID (opcional) → railway environment list.
  - RAILWAY_SERVICE_NAME (recomendado) → nombre del servicio en Railway.
- En Railway, define las variables de entorno de la app:
  - MONGO_URI (obligatorio)
  - PORT (opcional)
- Cada push a la rama main dispara el deploy:
  - on: push: branches: [ main ]

Notas de seguridad

- MONGO_URI debe vivir como secreto en Railway; no lo subas al repo.
- Si vas a compartir públicamente el servicio, considera:
  - Rate limiting básico y validaciones (futuro plus: firma HMAC del webhook).
  - Rotación de credenciales de Atlas y evitar 0.0.0.0/0 en producción.

Troubleshooting Atlas

- IP no permitida:
  - Agrega tu IP pública en Atlas → Network Access, espera 1–3 min y reintenta.
- bad auth:
  - Verifica usuario/contraseña y URL-encoding.
  - Prueba con:
    mongosh "mongodb+srv://user:pass@cluster.mongodb.net/message_counter?retryWrites=true&w=majority" --eval 'db.runCommand({ ping: 1 })'
- DNS SRV:
  - Asegúrate de usar mongodb+srv (driver maneja TLS/dns automáticamente).

Roadmap (plus)

- Verificación de firma en /webhook (HMAC timestamped, anti-replay).
- Docker Compose de entorno local con variables preconfiguradas.
- Observabilidad (p. ej., logs estructurados, metrics endpoint).
- Tests E2E CI.

Licencia

- UNLICENSED (ver package.json).
