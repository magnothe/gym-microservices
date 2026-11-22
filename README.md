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
- **Docker:** o Nginx serve o build e faz o papel do gateway (`frontend/nginx.conf`).

Uma barra lateral mostra o log de comunicação: cada requisição do frontend e, quando houver, as chamadas
que um serviço fez a outro (lidas do header `X-Upstream-Calls`). A aba *Visão geral* tem um diagrama
que acende o caminho percorrido pela última requisição.

Para incluir um novo serviço no frontend:

1. Adicione-o em `SERVICES` (`frontend/src/api.js`).
2. Crie a rota correspondente em `vite.config.js` e em `nginx.conf`.

## Como executar

Tudo com Docker (frontend em http://localhost:8080):

```bash
docker compose up --build
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
