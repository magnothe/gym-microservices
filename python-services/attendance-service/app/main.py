import json
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from .database import Base, engine
from .enrollment_client import ENROLLMENT_SERVICE_URL, upstream_calls
from .routers import appointments, checkins, history

logger = logging.getLogger("attendance-service")


def init_db(retries: int = 15, delay: float = 2.0) -> None:
    for attempt in range(1, retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            return
        except OperationalError:
            logger.warning("Banco indisponível (tentativa %s/%s)", attempt, retries)
            time.sleep(delay)
    raise RuntimeError("Não foi possível conectar ao banco de dados")


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Attendance Service",
    description=(
        "Frequência (check-in/check-out), agenda de atendimento dos personal trainers "
        "e histórico de atividades. Consome o Enrollment Service para validar matrículas."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Upstream-Calls"],
)


@app.middleware("http")
async def expose_upstream_calls(request: Request, call_next):
    """Informa ao cliente quais serviços foram chamados para atender a requisição."""
    calls: list = []
    upstream_calls.set(calls)
    response = await call_next(request)
    if calls:
        response.headers["X-Upstream-Calls"] = json.dumps(calls)
    return response

app.include_router(checkins.router)
app.include_router(appointments.router)
app.include_router(history.router)


@app.get("/health", tags=["Health"])
def health():
    return {
        "service": "attendance-service",
        "status": "ok",
        "depends_on": {"enrollment-service": ENROLLMENT_SERVICE_URL},
    }
