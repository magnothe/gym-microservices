# Serviços Python (FastAPI) — Magno

Dois microsserviços em **Python 3.12 + FastAPI + SQLAlchemy**, com um servidor MySQL
que hospeda **um banco por serviço** (`enrollment_db` e `attendance_db`, cada um com usuário próprio).

| Serviço | Papel | Porta | Banco |
|---|---|---|---|
| **Enrollment Service** | Provedor | `8001` | `enrollment_db` |
| **Attendance Service** | Consumidor (chama o Enrollment) | `8002` | `attendance_db` |
| MySQL 8.4 | — | `3308` | — |

```
Frontend ─► API Gateway ─┬─► Enrollment Service ──► enrollment_db ┐
                         │          ▲                               ├─ MySQL
                         └─► Attendance Service ──► attendance_db  ┘
                                    │ GET /students/{id}/enrollment-status
                                    └──────────────────────────────┘
```

## Como executar

```bash
cd python-services
docker compose up --build
```

Documentação interativa (Swagger):

- Enrollment: http://localhost:8001/docs
- Attendance: http://localhost:8002/docs

### Sem Docker

Com um MySQL local rodando (execute `mysql/init.sql` nele antes):

```bash
cd enrollment-service
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -r requirements.txt
set DATABASE_URL=mysql+pymysql://enrollment_user:enrollment_pass@localhost:3306/enrollment_db
uvicorn app.main:app --port 8001 --reload
```

Para o Attendance, use `DATABASE_URL=...attendance_db`, `ENROLLMENT_SERVICE_URL=http://localhost:8001` e `--port 8002`.

### Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL SQLAlchemy completa. Se definida, as variáveis `DB_*` são ignoradas |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexão em partes (usada no Render) |
| `DB_SSL` | `true` para conexão TLS (obrigatória no TiDB Cloud) |
| `ENROLLMENT_SERVICE_URL`, `ENROLLMENT_SERVICE_TIMEOUT` | Só no Attendance: URL e timeout (s) do Enrollment |
| `PORT` | Porta HTTP (padrão 8000) |

Se o banco do serviço não existir, ele é criado na inicialização (`CREATE DATABASE IF NOT EXISTS`). Depois são criadas as tabelas.

## Enrollment Service (provedor)

Gestão de alunos, matrículas e avaliação física.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/students` | Cadastra aluno (dados pessoais, objetivo, nível, personal) |
| GET | `/students?trainer_id=&goal=&experience_level=&q=` | Lista/filtra alunos |
| GET | `/students/{id}` | Detalhe do aluno (inclui status da matrícula) |
| GET | `/students/by-user/{user_id}` | Aluno a partir do usuário do User Service |
| PATCH | `/students/{id}` | Atualiza dados do aluno |
| DELETE | `/students/{id}` | Remove aluno |
| GET | `/students/{id}/enrollment-status` | **Contrato consumido pelo Attendance** |
| POST | `/students/{id}/enrollments` | Nova matrícula (`mensal`, `trimestral`, `semestral`, `anual`) |
| GET | `/students/{id}/enrollments` | Matrículas do aluno |
| GET | `/enrollments?status=` | Lista matrículas |
| PATCH | `/enrollments/{id}/status` | `ativa`, `suspensa`, `cancelada`, `expirada` |
| POST | `/students/{id}/assessments` | Avaliação física (peso, altura, IMC calculado, data) |
| GET | `/students/{id}/assessments` | Histórico de avaliações |

Objetivos: `emagrecimento`, `hipertrofia`, `condicionamento`, `forca`, `saude`, `reabilitacao`.
Níveis: `iniciante`, `intermediario`, `avancado`.

## Attendance Service (consumidor)

Frequência, agenda de atendimento do personal e histórico de atividades.
Antes de registrar check-in ou agendar atendimento, consulta o Enrollment Service:
aluno inexistente → `404`; sem matrícula ativa → `403`; Enrollment fora do ar → `503`.

Toda resposta que dependeu do Enrollment traz o header `X-Upstream-Calls`, com as chamadas feitas
(serviço, método, rota, status e tempo). O frontend usa esse header para mostrar a comunicação entre os serviços.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/checkins` | Check-in do aluno (valida matrícula ativa) |
| PATCH | `/checkins/{id}/checkout` | Check-out |
| GET | `/checkins?student_id=&date_from=&date_to=&open_only=` | Lista check-ins |
| POST | `/appointments` | Agenda atendimento com personal (valida matrícula e conflito de horário) |
| GET | `/appointments?trainer_id=&student_id=&day=&status=` | Agenda |
| GET | `/appointments/{id}` | Detalhe |
| PATCH | `/appointments/{id}/status` | `agendado`, `concluido`, `cancelado`, `faltou` |
| GET | `/students/{id}/attendance-summary?days=30` | Resumo de frequência |
| GET | `/students/{id}/history` | Histórico de atividades (check-ins + atendimentos) |

## Exemplo rápido

```bash
curl -X POST localhost:8001/students -H "Content-Type: application/json" \
  -d '{"name":"Ana Souza","email":"ana@email.com","goal":"hipertrofia","experience_level":"iniciante","trainer_id":2}'
curl -X POST localhost:8001/students/1/enrollments -H "Content-Type: application/json" -d '{"plan":"mensal"}'
curl -X POST localhost:8002/checkins -H "Content-Type: application/json" -d '{"student_id":1,"activity":"musculação"}'
curl localhost:8002/students/1/history
```

## Integração com os outros serviços

- `user_id` e `trainer_id` referenciam usuários do **User Service** (Node.js).
- O Workout Service (Java) pode usar `GET /students/{id}` para obter objetivo e nível do aluno.
