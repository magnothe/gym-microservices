import calendar
from datetime import date

from .models import Enrollment, EnrollmentStatus, Student


def add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def calculate_bmi(weight_kg: float, height_m: float) -> float:
    return round(weight_kg / (height_m**2), 2)


def classify_bmi(bmi: float) -> str:
    if bmi < 18.5:
        return "Abaixo do peso"
    if bmi < 25:
        return "Peso normal"
    if bmi < 30:
        return "Sobrepeso"
    if bmi < 35:
        return "Obesidade grau I"
    if bmi < 40:
        return "Obesidade grau II"
    return "Obesidade grau III"


def current_enrollment(student: Student) -> Enrollment | None:
    """Matrícula ativa hoje ou, na falta dela, a mais recente."""
    today = date.today()
    for enrollment in student.enrollments:
        if enrollment.is_active(today):
            return enrollment
    return student.enrollments[0] if student.enrollments else None


def effective_status(enrollment: Enrollment | None) -> EnrollmentStatus | None:
    if enrollment is None:
        return None
    if enrollment.status == EnrollmentStatus.ativa and enrollment.end_date < date.today():
        return EnrollmentStatus.expirada
    return enrollment.status
