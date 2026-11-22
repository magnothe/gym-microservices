from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Appointment, CheckIn
from ..schemas import AttendanceSummary, HistoryItem

router = APIRouter(prefix="/students/{student_id}", tags=["Histórico do aluno"])


@router.get("/attendance-summary", response_model=AttendanceSummary)
def attendance_summary(
    student_id: int, days: int = Query(default=30, ge=1, le=365), db: Session = Depends(get_db)
):
    since = datetime.now() - timedelta(days=days)
    checkins = db.scalars(
        select(CheckIn)
        .where(CheckIn.student_id == student_id, CheckIn.check_in_at >= since)
        .order_by(CheckIn.check_in_at.desc())
    ).all()
    durations = [
        (c.check_out_at - c.check_in_at).total_seconds() / 60 for c in checkins if c.check_out_at
    ]
    return AttendanceSummary(
        student_id=student_id,
        period_days=days,
        total_checkins=len(checkins),
        days_attended=len({c.check_in_at.date() for c in checkins}),
        avg_duration_minutes=round(sum(durations) / len(durations), 1) if durations else None,
        last_check_in=checkins[0].check_in_at if checkins else None,
    )


@router.get("/history", response_model=list[HistoryItem])
def student_history(
    student_id: int, limit: int = Query(default=50, ge=1, le=500), db: Session = Depends(get_db)
):
    """Histórico de atividades: check-ins e atendimentos com personal."""
    checkins = db.scalars(
        select(CheckIn).where(CheckIn.student_id == student_id).order_by(CheckIn.check_in_at.desc()).limit(limit)
    ).all()
    appointments = db.scalars(
        select(Appointment)
        .where(Appointment.student_id == student_id)
        .order_by(Appointment.scheduled_at.desc())
        .limit(limit)
    ).all()

    items = [
        HistoryItem(
            type="checkin",
            at=c.check_in_at,
            description=f"Check-in{f' ({c.activity})' if c.activity else ''}"
            + (f" até {c.check_out_at:%H:%M}" if c.check_out_at else " (em aberto)"),
            reference_id=c.id,
        )
        for c in checkins
    ] + [
        HistoryItem(
            type="atendimento",
            at=a.scheduled_at,
            description=f"Atendimento com personal {a.trainer_id} - {a.status.value}",
            reference_id=a.id,
        )
        for a in appointments
    ]
    items.sort(key=lambda i: i.at, reverse=True)
    return items[:limit]
