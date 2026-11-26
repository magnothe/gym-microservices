import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class CheckIn(Base):
    """Registro de presença do aluno na academia."""

    __tablename__ = "checkins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(Integer, index=True)  # aluno no Enrollment Service
    activity: Mapped[str | None] = mapped_column(String(80))
    check_in_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, index=True)
    check_out_at: Mapped[datetime | None] = mapped_column(DateTime)


class AppointmentStatus(str, enum.Enum):
    agendado = "agendado"
    concluido = "concluido"
    cancelado = "cancelado"
    faltou = "faltou"


class Appointment(Base):
    """Agenda de atendimento do personal trainer com um aluno."""

    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trainer_id: Mapped[int] = mapped_column(Integer, index=True)  # personal no User Service
    student_id: Mapped[int] = mapped_column(Integer, index=True)  # aluno no Enrollment Service
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus), default=AppointmentStatus.agendado
    )
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
