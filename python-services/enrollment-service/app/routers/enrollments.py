from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PLAN_MONTHS, Enrollment, EnrollmentStatus
from ..schemas import EnrollmentCreate, EnrollmentOut, EnrollmentStatusUpdate
from ..services import add_months
from .students import get_student_or_404

router = APIRouter(tags=["Matrículas"])


@router.post(
    "/students/{student_id}/enrollments",
    response_model=EnrollmentOut,
    status_code=status.HTTP_201_CREATED,
)
def create_enrollment(student_id: int, payload: EnrollmentCreate, db: Session = Depends(get_db)):
    student = get_student_or_404(db, student_id)
    start = payload.start_date or date.today()
    end = payload.end_date or add_months(start, PLAN_MONTHS[payload.plan])
    if end <= start:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "end_date deve ser posterior a start_date")

    overlapping = [
        e
        for e in student.enrollments
        if e.status == EnrollmentStatus.ativa and e.start_date <= end and start <= e.end_date
    ]
    if overlapping:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Aluno já possui matrícula ativa no período (id {overlapping[0].id})",
        )

    enrollment = Enrollment(student_id=student.id, plan=payload.plan, start_date=start, end_date=end)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/students/{student_id}/enrollments", response_model=list[EnrollmentOut])
def list_student_enrollments(student_id: int, db: Session = Depends(get_db)):
    return get_student_or_404(db, student_id).enrollments


@router.get("/enrollments", response_model=list[EnrollmentOut])
def list_enrollments(
    status_filter: EnrollmentStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    stmt = select(Enrollment).order_by(Enrollment.start_date.desc())
    if status_filter is not None:
        stmt = stmt.where(Enrollment.status == status_filter)
    return db.scalars(stmt).all()


@router.patch("/enrollments/{enrollment_id}/status", response_model=EnrollmentOut)
def update_enrollment_status(
    enrollment_id: int, payload: EnrollmentStatusUpdate, db: Session = Depends(get_db)
):
    enrollment = db.get(Enrollment, enrollment_id)
    if enrollment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Matrícula não encontrada")
    enrollment.status = payload.status
    db.commit()
    db.refresh(enrollment)
    return enrollment
