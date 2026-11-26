"""Cliente HTTP do Enrollment Service (este serviço é o consumidor)."""

import os
import time
from contextvars import ContextVar

import httpx
from fastapi import HTTPException, status

ENROLLMENT_SERVICE_URL = os.getenv("ENROLLMENT_SERVICE_URL", "http://localhost:8001").rstrip("/")
TIMEOUT = float(os.getenv("ENROLLMENT_SERVICE_TIMEOUT", "5"))

# Chamadas feitas a outros serviços durante a requisição atual.
# São devolvidas ao cliente no header X-Upstream-Calls (ver main.py).
upstream_calls: ContextVar[list | None] = ContextVar("upstream_calls", default=None)


def _record(method: str, path: str, status_code: int | None, started: float) -> None:
    calls = upstream_calls.get()
    if calls is not None:
        calls.append(
            {
                "service": "enrollment-service",
                "method": method,
                "path": path,
                "status": status_code,
                "ms": round((time.perf_counter() - started) * 1000, 1),
            }
        )


def get_enrollment_status(student_id: int) -> dict:
    path = f"/students/{student_id}/enrollment-status"
    started = time.perf_counter()
    try:
        response = httpx.get(f"{ENROLLMENT_SERVICE_URL}{path}", timeout=TIMEOUT)
    except httpx.RequestError as exc:
        _record("GET", path, None, started)
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, f"Enrollment Service indisponível: {exc}"
        ) from exc
    _record("GET", path, response.status_code, started)

    if response.status_code == status.HTTP_404_NOT_FOUND:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Aluno {student_id} não encontrado")
    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            f"Resposta inesperada do Enrollment Service ({response.status_code})",
        )
    return response.json()


def require_active_enrollment(student_id: int) -> dict:
    data = get_enrollment_status(student_id)
    if not data.get("active"):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"Aluno {student_id} não possui matrícula ativa (status: {data.get('status')})",
        )
    return data
