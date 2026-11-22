"""Cliente HTTP do Enrollment Service (este serviço é o consumidor)."""

import os

import httpx
from fastapi import HTTPException, status

ENROLLMENT_SERVICE_URL = os.getenv("ENROLLMENT_SERVICE_URL", "http://localhost:8001").rstrip("/")
TIMEOUT = float(os.getenv("ENROLLMENT_SERVICE_TIMEOUT", "5"))


def get_enrollment_status(student_id: int) -> dict:
    try:
        response = httpx.get(
            f"{ENROLLMENT_SERVICE_URL}/students/{student_id}/enrollment-status", timeout=TIMEOUT
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, f"Enrollment Service indisponível: {exc}"
        ) from exc

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
