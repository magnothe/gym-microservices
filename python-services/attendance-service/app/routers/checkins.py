from datetime import date, datetime, time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..enrollment_client import require_active_enrollment
from ..models import CheckIn
from ..schemas import CheckInCreate, CheckInOut

router = APIRouter(prefix="/checkins", tags=["Check-in / Frequência"])


def to_out(c: CheckIn) -> CheckInOut:
    out = CheckInOut.model_validate(c)
    if c.check_out_at:
        out.duration_minutes = int((c.check_out_at - c.check_in_at).total_seconds() // 60)
    return out


@router.post("", response_model=CheckInOut, status_code=status.HTTP_201_CREATED)
def check_in(payload: CheckInCreate, db: Session = Depends(get_db)):
    open_checkin = db.scalar(
        select(CheckIn).where(CheckIn.student_id == payload.student_id, CheckIn.check_out_at.is_(None))
    )
    if open_checkin:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Aluno já possui check-in em aberto (id {open_checkin.id})",
        )

    # Comunicação síncrona com o Enrollment Service (provedor)
    require_active_enrollment(payload.student_id)

    checkin = CheckIn(student_id=payload.student_id, activity=payload.activity, check_in_at=datetime.now())
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    return to_out(checkin)


@router.patch("/{checkin_id}/checkout", response_model=CheckInOut)
def check_out(checkin_id: int, db: Session = Depends(get_db)):
    checkin = db.get(CheckIn, checkin_id)
    if checkin is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Check-in não encontrado")
    if checkin.check_out_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Check-out já registrado")
    checkin.check_out_at = datetime.now()
    db.commit()
    db.refresh(checkin)
    return to_out(checkin)


@router.get("", response_model=list[CheckInOut])
def list_checkins(
    student_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    open_only: bool = False,
    db: Session = Depends(get_db),
):
    stmt = select(CheckIn).order_by(CheckIn.check_in_at.desc())
    if student_id is not None:
        stmt = stmt.where(CheckIn.student_id == student_id)
    if date_from is not None:
        stmt = stmt.where(CheckIn.check_in_at >= datetime.combine(date_from, time.min))
    if date_to is not None:
        stmt = stmt.where(CheckIn.check_in_at <= datetime.combine(date_to, time.max))
    if open_only:
        stmt = stmt.where(CheckIn.check_out_at.is_(None))
    return [to_out(c) for c in db.scalars(stmt).all()]
