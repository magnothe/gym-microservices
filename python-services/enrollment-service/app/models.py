import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Goal(str, enum.Enum):
    emagrecimento = "emagrecimento"
    hipertrofia = "hipertrofia"
    condicionamento = "condicionamento"
    forca = "forca"
    saude = "saude"
    reabilitacao = "reabilitacao"


class ExperienceLevel(str, enum.Enum):
    iniciante = "iniciante"
    intermediario = "intermediario"
    avancado = "avancado"


class Plan(str, enum.Enum):
    mensal = "mensal"
    trimestral = "trimestral"
    semestral = "semestral"
    anual = "anual"


PLAN_MONTHS = {Plan.mensal: 1, Plan.trimestral: 3, Plan.semestral: 6, Plan.anual: 12}


class EnrollmentStatus(str, enum.Enum):
    ativa = "ativa"
    suspensa = "suspensa"
    cancelada = "cancelada"
    expirada = "expirada"


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # Referência ao usuário no User Service (Node.js)
    user_id: Mapped[int | None] = mapped_column(Integer, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    birth_date: Mapped[date | None] = mapped_column(Date)
    goal: Mapped[Goal] = mapped_column(Enum(Goal))
    experience_level: Mapped[ExperienceLevel] = mapped_column(Enum(ExperienceLevel))
    # Referência ao personal trainer (usuário com perfil de personal no User Service)
    trainer_id: Mapped[int | None] = mapped_column(Integer, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    enrollments: Mapped[list["Enrollment"]] = relationship(
        back_populates="student", cascade="all, delete-orphan", order_by="Enrollment.start_date.desc()"
    )
    assessments: Mapped[list["PhysicalAssessment"]] = relationship(
        back_populates="student", cascade="all, delete-orphan", order_by="PhysicalAssessment.assessed_at.desc()"
    )


class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    plan: Mapped[Plan] = mapped_column(Enum(Plan))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    status: Mapped[EnrollmentStatus] = mapped_column(Enum(EnrollmentStatus), default=EnrollmentStatus.ativa)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    student: Mapped[Student] = relationship(back_populates="enrollments")

    def is_active(self, today: date | None = None) -> bool:
        today = today or date.today()
        return self.status == EnrollmentStatus.ativa and self.start_date <= today <= self.end_date


class PhysicalAssessment(Base):
    __tablename__ = "physical_assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    assessed_at: Mapped[date] = mapped_column(Date)
    weight_kg: Mapped[float] = mapped_column(Float)
    height_m: Mapped[float] = mapped_column(Float)
    bmi: Mapped[float] = mapped_column(Float)
    body_fat_pct: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    trainer_id: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    student: Mapped[Student] = relationship(back_populates="assessments")
