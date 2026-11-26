from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..enrollment_client import require_active_enrollment
from ..models import Appointment, AppointmentStatus
from ..schemas import AppointmentCreate, AppointmentOut, AppointmentStatusUpdate

router = APIRouter(prefix="/appointments", tags=["Agenda de atendimento"])


def _end(a_start: datetime, minutes: int) -> datetime:
    return a_start + timedelta(minutes=minutes)


@router.post("", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    start = payload.scheduled_at.replace(tzinfo=None)
    end = _end(start, payload.duration_minutes)

    # Conflito de horário na agenda do personal ou do aluno (mesmo dia)
    day_start = datetime.combine(start.date(), time.min)
    day_end = datetime.combine(start.date(), time.max)
    same_day = db.scalars(
        select(Appointment).where(
            Appointment.status == AppointmentStatus.agendado,
            Appointment.scheduled_at.between(day_start, day_end),
            (Appointment.trainer_id == payload.trainer_id) | (Appointment.student_id == payload.student_id),
        )
    ).all()
    for other in same_day:
        if other.scheduled_at < end and start < _end(other.scheduled_at, other.duration_minutes):
            who = "personal" if other.trainer_id == payload.trainer_id else "aluno"
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Conflito de horário na agenda do {who} (atendimento {other.id})",
            )

    enrollment = require_active_enrollment(payload.student_id)
    if enrollment.get("trainer_id") not in (None, payload.trainer_id):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Aluno está vinculado a outro personal (trainer_id {enrollment['trainer_id']})",
        )

    appointment = Appointment(**payload.model_dump(exclude={"scheduled_at"}), scheduled_at=start)
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@router.get("", response_model=list[AppointmentOut])
def list_appointments(
    trainer_id: int | None = None,
    student_id: int | None = None,
    day: date | None = Query(default=None, description="Filtra pela data (AAAA-MM-DD)"),
    status_filter: AppointmentStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    stmt = select(Appointment).order_by(Appointment.scheduled_at)
    if trainer_id is not None:
        stmt = stmt.where(Appointment.trainer_id == trainer_id)
    if student_id is not None:
        stmt = stmt.where(Appointment.student_id == student_id)
    if day is not None:
        stmt = stmt.where(
            Appointment.scheduled_at.between(datetime.combine(day, time.min), datetime.combine(day, time.max))
        )
    if status_filter is not None:
        stmt = stmt.where(Appointment.status == status_filter)
    return db.scalars(stmt).all()


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.get(Appointment, appointment_id)
    if appointment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Atendimento não encontrado")
    return appointment


@router.patch("/{appointment_id}/status", response_model=AppointmentOut)
def update_appointment_status(
    appointment_id: int, payload: AppointmentStatusUpdate, db: Session = Depends(get_db)
):
    appointment = get_appointment(appointment_id, db)
    appointment.status = payload.status
    db.commit()
    db.refresh(appointment)
    return appointment
