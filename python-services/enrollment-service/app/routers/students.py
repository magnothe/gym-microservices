from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ExperienceLevel, Goal, Student
from ..schemas import EnrollmentCheck, StudentCreate, StudentOut, StudentUpdate
from ..services import current_enrollment, effective_status

router = APIRouter(prefix="/students", tags=["Alunos"])


def get_student_or_404(db: Session, student_id: int) -> Student:
    student = db.get(Student, student_id)
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aluno não encontrado")
    return student


def to_out(student: Student) -> StudentOut:
    out = StudentOut.model_validate(student)
    out.enrollment_status = effective_status(current_enrollment(student))
    return out


def commit_or_409(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "E-mail ou user_id já cadastrado")


@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    student = Student(**payload.model_dump())
    db.add(student)
    commit_or_409(db)
    db.refresh(student)
    return to_out(student)


@router.get("", response_model=list[StudentOut])
def list_students(
    trainer_id: int | None = None,
    goal: Goal | None = None,
    experience_level: ExperienceLevel | None = None,
    q: str | None = Query(default=None, description="Busca por nome ou e-mail"),
    db: Session = Depends(get_db),
):
    stmt = select(Student).order_by(Student.name)
    if trainer_id is not None:
        stmt = stmt.where(Student.trainer_id == trainer_id)
    if goal is not None:
        stmt = stmt.where(Student.goal == goal)
    if experience_level is not None:
        stmt = stmt.where(Student.experience_level == experience_level)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Student.name.like(like), Student.email.like(like)))
    return [to_out(s) for s in db.scalars(stmt).all()]


@router.get("/by-user/{user_id}", response_model=StudentOut)
def get_student_by_user(user_id: int, db: Session = Depends(get_db)):
    student = db.scalar(select(Student).where(Student.user_id == user_id))
    if student is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Aluno não encontrado para este usuário")
    return to_out(student)


@router.get("/{student_id}", response_model=StudentOut)
def get_student(student_id: int, db: Session = Depends(get_db)):
    return to_out(get_student_or_404(db, student_id))


@router.patch("/{student_id}", response_model=StudentOut)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = get_student_or_404(db, student_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(student, field, value)
    commit_or_409(db)
    db.refresh(student)
    return to_out(student)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = get_student_or_404(db, student_id)
    db.delete(student)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{student_id}/enrollment-status", response_model=EnrollmentCheck)
def enrollment_status(student_id: int, db: Session = Depends(get_db)):
    """Endpoint consumido pelo Attendance Service para validar a matrícula."""
    student = get_student_or_404(db, student_id)
    enrollment = current_enrollment(student)
    return EnrollmentCheck(
        student_id=student.id,
        student_name=student.name,
        trainer_id=student.trainer_id,
        active=bool(enrollment and enrollment.is_active()),
        enrollment_id=enrollment.id if enrollment else None,
        plan=enrollment.plan if enrollment else None,
        end_date=enrollment.end_date if enrollment else None,
        status=effective_status(enrollment),
    )
