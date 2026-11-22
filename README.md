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

## Branches

Monorepo com uma branch por integrante; as entregas são integradas na `main` via pull request.

- `rodrigo` — serviços Node.js
- `artur` — serviços Java
- `magno` — serviços Python
