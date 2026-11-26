from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from .models import EnrollmentStatus, ExperienceLevel, Goal, Plan


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Alunos ----------
class StudentBase(BaseModel):
    user_id: int | None = None
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(max_length=160, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str | None = Field(default=None, max_length=30)
    birth_date: date | None = None
    goal: Goal
    experience_level: ExperienceLevel = ExperienceLevel.iniciante
    trainer_id: int | None = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    user_id: int | None = None
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = Field(default=None, max_length=160, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    phone: str | None = Field(default=None, max_length=30)
    birth_date: date | None = None
    goal: Goal | None = None
    experience_level: ExperienceLevel | None = None
    trainer_id: int | None = None


class StudentOut(StudentBase, ORMModel):
    id: int
    created_at: datetime
    enrollment_status: EnrollmentStatus | None = None


# ---------- Matrículas ----------
class EnrollmentCreate(BaseModel):
    plan: Plan
    start_date: date | None = None  # padrão: hoje
    end_date: date | None = None  # padrão: calculado a partir do plano


class EnrollmentStatusUpdate(BaseModel):
    status: EnrollmentStatus


class EnrollmentOut(ORMModel):
    id: int
    student_id: int
    plan: Plan
    start_date: date
    end_date: date
    status: EnrollmentStatus
    created_at: datetime


class EnrollmentCheck(BaseModel):
    """Resposta consumida pelo Attendance Service."""

    student_id: int
    student_name: str
    trainer_id: int | None
    active: bool
    enrollment_id: int | None = None
    plan: Plan | None = None
    end_date: date | None = None
    status: EnrollmentStatus | None = None


# ---------- Avaliação física ----------
class AssessmentCreate(BaseModel):
    assessed_at: date | None = None  # padrão: hoje
    weight_kg: float = Field(gt=0, lt=500)
    height_m: float = Field(gt=0.5, lt=2.8)
    body_fat_pct: float | None = Field(default=None, ge=0, le=100)
    notes: str | None = None
    trainer_id: int | None = None


class AssessmentOut(ORMModel):
    id: int
    student_id: int
    assessed_at: date
    weight_kg: float
    height_m: float
    bmi: float
    bmi_classification: str
    body_fat_pct: float | None
    notes: str | None
    trainer_id: int | None
    created_at: datetime
