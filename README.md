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

O frontend (React + Vite) é compartilhado pela equipe e fica na branch **`main`**, na pasta `frontend/`.
Esta branch (`magno`) contém só os serviços Python.

## Como executar (serviços Python)

Com Docker (MySQL + Enrollment + Attendance):

```bash
cd python-services
docker compose up --build
```

Detalhes das rotas e variáveis de ambiente em [`python-services/README.md`](python-services/README.md).

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
| Frontend + API Gateway | Vercel (código na `main`) | https://gym-microservices.vercel.app |
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
```

## Branches

Monorepo com uma branch por integrante; as entregas são integradas na `main` via pull request.

- `main` — frontend compartilhado
- `rodrigo` — serviços Node.js
- `artur` — serviços Java
- `magno` — serviços Python
