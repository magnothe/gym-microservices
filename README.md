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

## No ar

**Aplicação:** https://gym-microservices.vercel.app

| Parte | Hospedagem | Link |
|---|---|---|
| Frontend + API Gateway | Vercel | https://gym-microservices.vercel.app |
| Enrollment Service (Python) | Railway | https://enrollment-service-production-60640b11.up.railway.app/docs |
| Attendance Service (Python) | Railway | https://attendance-service-production-b2ad6971.up.railway.app/docs |
| MySQL 8.4 (`enrollment_db`, `attendance_db`) | Railway | acesso só pelos serviços |

Os links `/docs` abrem a documentação interativa (Swagger) de cada serviço.

## Frontend

React + Vite em [`frontend/`](frontend/). O frontend acessa os serviços só pelo API Gateway
(`/api/<servico>/`), e uma barra lateral mostra a comunicação entre os serviços em tempo real.

## Branches

Monorepo com uma branch por integrante; as entregas são integradas na `main` via pull request.

- `main` — frontend compartilhado
- `rodrigo` — serviços Node.js
- `artur` — serviços Java
- `magno` — serviços Python
