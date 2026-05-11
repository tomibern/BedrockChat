# AI Chat Assistant

Chatbot web full-stack que usa Claude vía AWS Bedrock como motor de IA. Construido con FastAPI + Next.js y contenerizado con Docker.

## Stack

- **Backend:** Python 3.12 + FastAPI
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **IA:** AWS Bedrock — Claude (Haiku / Sonnet)
- **Contenerización:** Docker + Docker Compose

## Estructura

```
ai-chat-assistant/
├── backend/        # FastAPI + boto3 (Bedrock)
├── frontend/       # Next.js + Tailwind
└── docker-compose.yml
```

## Cómo correrlo localmente

### Requisitos

- Docker + Docker Compose
- Credenciales AWS con acceso a Bedrock (Claude habilitado en `us-east-1`)

### Pasos

1. Clonar el repo:
   ```bash
   git clone https://github.com/tomibern/BedrockChat.git
   cd BedrockChat
   ```

2. Configurar variables del backend:
   ```bash
   cp backend/.env.example backend/.env
   # Editar backend/.env con tus credenciales AWS
   ```

3. Levantar todo:
   ```bash
   docker compose up --build
   ```

4. Abrir el frontend en `http://localhost:3000`.

### Variables de entorno

**Backend (`backend/.env`):**

```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend** (inyectado por docker-compose):

```
NEXT_PUBLIC_BACKEND_URL=http://backend:8000
```

## Endpoints del backend

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/chat` | Respuesta completa (no streaming) |
| GET | `/stream` | Streaming SSE token a token |
| GET | `/models` | Lista de modelos disponibles |
| GET | `/health` | Health check |

## Desarrollo sin Docker

**Backend:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Licencia

MIT
