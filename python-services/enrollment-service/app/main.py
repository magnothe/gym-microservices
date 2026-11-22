import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from .database import Base, engine
from .routers import assessments, enrollments, students

logger = logging.getLogger("enrollment-service")


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
    title="Enrollment Service",
    description="Gestão de alunos, matrículas e avaliações físicas da aplicação GYM.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(students.router)
app.include_router(enrollments.router)
app.include_router(assessments.router)


@app.get("/health", tags=["Health"])
def health():
    return {"service": "enrollment-service", "status": "ok"}
