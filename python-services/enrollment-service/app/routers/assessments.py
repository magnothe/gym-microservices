from datetime import date

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import PhysicalAssessment
from ..schemas import AssessmentCreate, AssessmentOut
from ..services import calculate_bmi, classify_bmi
from .students import get_student_or_404

router = APIRouter(prefix="/students/{student_id}/assessments", tags=["Avaliação física"])


def to_out(a: PhysicalAssessment) -> AssessmentOut:
    return AssessmentOut(
        id=a.id,
        student_id=a.student_id,
        assessed_at=a.assessed_at,
        weight_kg=a.weight_kg,
        height_m=a.height_m,
        bmi=a.bmi,
        bmi_classification=classify_bmi(a.bmi),
        body_fat_pct=a.body_fat_pct,
        notes=a.notes,
        trainer_id=a.trainer_id,
        created_at=a.created_at,
    )


@router.post("", response_model=AssessmentOut, status_code=status.HTTP_201_CREATED)
def create_assessment(student_id: int, payload: AssessmentCreate, db: Session = Depends(get_db)):
    get_student_or_404(db, student_id)
    data = payload.model_dump()
    data["assessed_at"] = data["assessed_at"] or date.today()
    assessment = PhysicalAssessment(
        student_id=student_id,
        bmi=calculate_bmi(payload.weight_kg, payload.height_m),
        **data,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return to_out(assessment)


@router.get("", response_model=list[AssessmentOut])
def list_assessments(student_id: int, db: Session = Depends(get_db)):
    return [to_out(a) for a in get_student_or_404(db, student_id).assessments]
