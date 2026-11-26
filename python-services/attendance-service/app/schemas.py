from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .models import AppointmentStatus


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Check-in ----------
class CheckInCreate(BaseModel):
    student_id: int
    activity: str | None = Field(default=None, max_length=80, examples=["musculação"])


class CheckInOut(ORMModel):
    id: int
    student_id: int
    activity: str | None
    check_in_at: datetime
    check_out_at: datetime | None
    duration_minutes: int | None = None


class AttendanceSummary(BaseModel):
    student_id: int
    period_days: int
    total_checkins: int
    days_attended: int
    avg_duration_minutes: float | None
    last_check_in: datetime | None


# ---------- Agenda ----------
class AppointmentCreate(BaseModel):
    trainer_id: int
    student_id: int
    scheduled_at: datetime
    duration_minutes: int = Field(default=60, ge=15, le=240)
    notes: str | None = None


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentOut(ORMModel):
    id: int
    trainer_id: int
    student_id: int
    scheduled_at: datetime
    duration_minutes: int
    status: AppointmentStatus
    notes: str | None
    created_at: datetime


# ---------- Histórico ----------
class HistoryItem(BaseModel):
    type: Literal["checkin", "atendimento"]
    at: datetime
    description: str
    reference_id: int
