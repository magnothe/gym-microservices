# GYM — Arquitetura de Microsserviços

Trabalho 4 — aplicação de academia composta por seis microsserviços em três linguagens,
um frontend e um API Gateway.

## Equipe

| Integrante | Serviços | Linguagem | Pasta |
|---|---|---|---|
| Rodrigo | User Service, Payment Service | JavaScript (Node.js) | `node-services/` |
| Artur | Workout Service, Exercise Service | Java (Spring Boot) | `java-services/` |
| Magno | Enrollment Service, Attendance Service | Python (FastAPI) | `python-services/` |

## Arquitetura

```
                     Frontend
                        │
              API Gateway / Load Balancer
       ┌──────────┬─────┴─────┬──────────┬──────────┬───────────┐
     User      Payment     Workout    Exercise  Enrollment  Attendance
   (Node.js)  (Node.js)    (Java)     (Java)     (Python)    (Python)
       └── MySQL ──┘        └── MySQL ──┘         └── MySQL ───┘
```

Cada par de serviços usa um servidor MySQL próprio, com um banco de dados separado para cada serviço.

## Frontend

React + Vite (JavaScript), em [`frontend/`](frontend/). O frontend acessa os serviços só através do
API Gateway, pelo prefixo `/api/<servico>/`:

- **Desenvolvimento:** o proxy do Vite faz o papel do gateway (`frontend/vite.config.js`).
- **Produção (Vercel):** as *rewrites* do `frontend/vercel.json` fazem o papel do gateway.
- **Docker local:** o Nginx serve o build e faz o papel do gateway (`frontend/nginx/default.conf.template`).

Uma barra lateral mostra o log de comunicação: cada requisição do frontend e, quando houver, as chamadas
que um serviço fez a outro (lidas do header `X-Upstream-Calls`). A aba *Visão geral* tem um diagrama
que acende o caminho percorrido pela última requisição.

Para incluir um novo serviço no frontend:

1. Adicione-o em `SERVICES` (`frontend/src/api.js`).
2. Crie a rota correspondente em `vite.config.js`, `vercel.json` e `nginx/default.conf.template`.

## Como executar

Tudo com Docker (frontend em http://localhost:8080):

```bash
docker compose up --build
```

## Deploy na nuvem

**Aplicação no ar:** https://gym-microservices.vercel.app

```
Navegador ──► Vercel (React + API Gateway via rewrites)
                 │  /api/enrollment/*            /api/attendance/*
                 ▼                                ▼
        Railway: enrollment-service ◄──── attendance-service
                 │       (rede privada: enrollment-service.railway.internal)
                 ▼                                ▼
        Railway: MySQL 8.4 ── enrollment_db      attendance_db
```

| Parte | Onde | Endereço |
|---|---|---|
| Frontend + API Gateway | Vercel ([`frontend/vercel.json`](frontend/vercel.json)) | https://gym-microservices.vercel.app |
| Enrollment Service | Railway | https://enrollment-service-production-60640b11.up.railway.app/docs |
| Attendance Service | Railway | https://attendance-service-production-b2ad6971.up.railway.app/docs |
| MySQL 8.4 | Railway | interno: `mysql.railway.internal:3306` · público: `acela.proxy.rlwy.net:10321` |

- Os serviços leem a conexão de variáveis de referência do Railway (`DB_HOST=${{MySQL.MYSQLHOST}}` etc.).
  Nenhuma senha fica no repositório.
- Os bancos e as tabelas são criados automaticamente na inicialização, se ainda não existirem.

Para atualizar os serviços depois de mudar o código (Railway CLI):

```bash
railway up python-services/enrollment-service --path-as-root --service enrollment-service
railway up python-services/attendance-service --path-as-root --service attendance-service
cd frontend && vercel deploy --prod
```

Em desenvolvimento, com os serviços já rodando nas portas 8001 e 8002:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## Branches

Monorepo com uma branch por integrante; as entregas são integradas na `main` via pull request.

- `rodrigo` — serviços Node.js
- `artur` — serviços Java
- `magno` — serviços Python
