from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import schemas, services
from ..activity import log_activity
from ..database import get_db
from ..dependencies import get_current_user, require_school_staff
from ..models import (
    AccountType,
    Attendance,
    Book,
    ClassEnrollment,
    GenerationJob,
    School,
    SchoolInvitation,
    SchoolMembership,
    StudentApplication,
    Subject,
    User,
)

router = APIRouter(prefix="/schools", tags=["Schools"])


@router.get("/", response_model=list[schemas.SchoolOut])
def list_schools(db: Session = Depends(get_db)):
    return db.query(School).order_by(School.name).all()


@router.post("/", response_model=schemas.SchoolOut, status_code=201)
def create_school(payload: schemas.SchoolCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.account_type not in {AccountType.SCHOOL_ADMIN, AccountType.TEACHER}:
        raise HTTPException(status_code=403, detail="Only a school admin can register a school")
    return services.create_school(db, user, payload)


@router.get("/{school_id}", response_model=schemas.SchoolOut)
def get_school(school_id: str, db: Session = Depends(get_db)):
    school = db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return school


@router.get("/{school_id}/dashboard", response_model=schemas.SchoolDashboard)
def school_dashboard(
    school_id: str,
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    school = db.get(School, school_id)
    return services.school_dashboard(db, school)


@router.get("/{school_id}/performance", response_model=schemas.SchoolPerformance)
def school_performance(
    school_id: str,
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    school = db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    return services.school_performance(db, school, membership)


@router.post("/{school_id}/invitations", response_model=schemas.InvitationOut, status_code=201)
def invite_teacher(
    school_id: str,
    payload: schemas.InvitationCreate,
    user: User = Depends(get_current_user),
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    school = db.get(School, school_id)
    invitation = services.invite_teacher(db, school, user, payload)
    teacher = db.get(User, invitation.teacher_user_id)
    return schemas.InvitationOut(
        id=invitation.id,
        school_id=invitation.school_id,
        school_name=school.name,
        teacher_user_id=invitation.teacher_user_id,
        teacher_email=teacher.email if teacher else None,
        status=invitation.status,
        message=invitation.message,
        created_at=invitation.created_at,
    )


@router.get("/{school_id}/invitations", response_model=list[schemas.InvitationOut])
def list_invitations(
    school_id: str,
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    school = db.get(School, school_id)
    items = db.query(SchoolInvitation).filter(SchoolInvitation.school_id == school_id).all()
    out = []
    for invitation in items:
        teacher = db.get(User, invitation.teacher_user_id)
        out.append(
            schemas.InvitationOut(
                id=invitation.id,
                school_id=invitation.school_id,
                school_name=school.name,
                teacher_user_id=invitation.teacher_user_id,
                teacher_email=teacher.email if teacher else None,
                status=invitation.status,
                message=invitation.message,
                created_at=invitation.created_at,
            )
        )
    return out


@router.post("/{school_id}/applications", response_model=schemas.ApplicationOut, status_code=201)
def apply(
    school_id: str,
    payload: schemas.ApplicationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    school = db.get(School, school_id)
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
    application = services.apply_to_school(db, school, user, payload.grade_level)
    return schemas.ApplicationOut(
        id=application.id,
        school_id=application.school_id,
        school_name=school.name,
        student_user_id=application.student_user_id,
        student_email=user.email,
        grade_level=application.grade_level,
        status=application.status,
        note=application.note,
        created_at=application.created_at,
    )


@router.get("/{school_id}/applications", response_model=list[schemas.ApplicationOut])
def list_applications(
    school_id: str,
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    school = db.get(School, school_id)
    items = db.query(StudentApplication).filter(StudentApplication.school_id == school_id).all()
    out = []
    for application in items:
        student = db.get(User, application.student_user_id)
        out.append(
            schemas.ApplicationOut(
                id=application.id,
                school_id=application.school_id,
                school_name=school.name,
                student_user_id=application.student_user_id,
                student_email=student.email if student else None,
                grade_level=application.grade_level,
                status=application.status,
                note=application.note,
                created_at=application.created_at,
            )
        )
    return out


@router.post("/{school_id}/applications/{application_id}/review", response_model=schemas.ApplicationOut)
def review_application(
    school_id: str,
    application_id: str,
    payload: schemas.ApplicationReview,
    user: User = Depends(get_current_user),
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    application = db.get(StudentApplication, application_id)
    if not application or application.school_id != school_id:
        raise HTTPException(status_code=404, detail="Application not found")
    application = services.review_application(db, application, user, payload)
    student = db.get(User, application.student_user_id)
    school = db.get(School, school_id)
    return schemas.ApplicationOut(
        id=application.id,
        school_id=application.school_id,
        school_name=school.name if school else None,
        student_user_id=application.student_user_id,
        student_email=student.email if student else None,
        grade_level=application.grade_level,
        status=application.status,
        note=application.note,
        created_at=application.created_at,
    )


@router.post("/{school_id}/subjects", response_model=schemas.SubjectOut, status_code=201)
def create_subject(
    school_id: str,
    payload: schemas.SubjectCreate,
    user: User = Depends(get_current_user),
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    subject = Subject(school_id=school_id, **payload.model_dump())
    db.add(subject)
    log_activity(
        db,
        actor_id=user.id,
        school_id=school_id,
        actor_role=membership.role.value,
        verb="created",
        object_type="subject",
    )
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/{school_id}/subjects", response_model=list[schemas.SubjectOut])
def list_subjects(school_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Subject).filter(Subject.school_id == school_id).all()


@router.post("/{school_id}/subjects/{subject_id}/assign-teacher")
def assign_teacher(
    school_id: str,
    subject_id: str,
    payload: schemas.AssignTeacherIn,
    user: User = Depends(get_current_user),
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    subject = db.get(Subject, subject_id)
    if not subject or subject.school_id != school_id:
        raise HTTPException(status_code=404, detail="Subject not found")
    assignment = services.assign_teacher(db, subject, payload.teacher_user_id, user)
    return {"id": assignment.id, "subject_id": subject_id, "teacher_user_id": payload.teacher_user_id}


@router.post("/{school_id}/subjects/{subject_id}/enrollments", response_model=schemas.EnrollmentOut)
def enroll_student(
    school_id: str,
    subject_id: str,
    payload: schemas.EnrollStudentIn,
    user: User = Depends(get_current_user),
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    subject = db.get(Subject, subject_id)
    if not subject or subject.school_id != school_id:
        raise HTTPException(status_code=404, detail="Subject not found")
    enrollment = services.enroll_student(db, school_id, subject_id, payload.student_user_id, user.id)
    log_activity(
        db,
        actor_id=user.id,
        school_id=school_id,
        actor_role=membership.role.value,
        verb="enrolled_student",
        object_type="subject",
        object_id=subject_id,
        extra={"student_user_id": payload.student_user_id},
    )
    db.commit()
    return _enrollment_out(db, enrollment)


@router.get("/{school_id}/enrollments", response_model=list[schemas.EnrollmentOut])
def list_enrollments(
    school_id: str,
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    items = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.school_id == school_id)
        .order_by(ClassEnrollment.created_at.desc())
        .all()
    )
    return [_enrollment_out(db, enrollment) for enrollment in items]


@router.get("/{school_id}/attendance", response_model=list[schemas.AttendanceOut])
def list_attendance(
    school_id: str,
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    items = (
        db.query(Attendance)
        .join(ClassEnrollment, Attendance.enrollment_id == ClassEnrollment.id)
        .filter(ClassEnrollment.school_id == school_id)
        .order_by(Attendance.on_date.desc())
        .limit(200)
        .all()
    )
    return [_attendance_out(db, record) for record in items]


@router.get("/{school_id}/jobs", response_model=list[schemas.JobOut])
def list_school_jobs(
    school_id: str,
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    items = (
        db.query(GenerationJob)
        .join(Book, GenerationJob.book_id == Book.id)
        .join(Subject, Book.subject_id == Subject.id)
        .filter(Subject.school_id == school_id)
        .order_by(GenerationJob.created_at.desc())
        .limit(80)
        .all()
    )
    return [_job_out(db, job) for job in items]


@router.get("/{school_id}/activity", response_model=list[schemas.ActivityOut])
def school_activity(
    school_id: str,
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    from ..models import ActivityEvent

    return (
        db.query(ActivityEvent)
        .filter(ActivityEvent.school_id == school_id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(100)
        .all()
    )


@router.post("/{school_id}/enrollments/{enrollment_id}/attendance", response_model=schemas.AttendanceOut)
def record_attendance(
    school_id: str,
    enrollment_id: str,
    payload: schemas.AttendanceIn,
    user: User = Depends(get_current_user),
    membership: SchoolMembership = Depends(require_school_staff),
    db: Session = Depends(get_db),
):
    enrollment = db.get(ClassEnrollment, enrollment_id)
    if not enrollment or enrollment.school_id != school_id:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    record = (
        db.query(Attendance)
        .filter(Attendance.enrollment_id == enrollment_id, Attendance.on_date == payload.on_date)
        .first()
    )
    if record:
        record.status = payload.status
        record.note = payload.note
        record.recorded_by = user.id
    else:
        record = Attendance(
            enrollment_id=enrollment_id,
            on_date=payload.on_date,
            status=payload.status,
            recorded_by=user.id,
            note=payload.note,
        )
        db.add(record)
    log_activity(
        db,
        actor_id=user.id,
        school_id=school_id,
        actor_role=membership.role.value,
        verb="recorded_attendance",
        object_type="enrollment",
        object_id=enrollment_id,
        extra={"status": payload.status.value, "date": str(payload.on_date)},
    )
    db.commit()
    db.refresh(record)
    return _attendance_out(db, record)


def _student_name(student: User | None) -> str | None:
    if not student:
        return None
    full = " ".join(part for part in [student.first_name, student.last_name] if part)
    return full or student.username


def _enrollment_out(db: Session, enrollment: ClassEnrollment) -> schemas.EnrollmentOut:
    student = db.get(User, enrollment.student_user_id)
    subject = db.get(Subject, enrollment.subject_id)
    return schemas.EnrollmentOut(
        id=enrollment.id,
        school_id=enrollment.school_id,
        subject_id=enrollment.subject_id,
        student_user_id=enrollment.student_user_id,
        status=enrollment.status,
        student_email=student.email if student else None,
        student_name=_student_name(student),
        subject_name=subject.name if subject else None,
    )


def _attendance_out(db: Session, record: Attendance) -> schemas.AttendanceOut:
    enrollment = db.get(ClassEnrollment, record.enrollment_id)
    student = db.get(User, enrollment.student_user_id) if enrollment else None
    subject = db.get(Subject, enrollment.subject_id) if enrollment else None
    return schemas.AttendanceOut(
        id=record.id,
        enrollment_id=record.enrollment_id,
        on_date=record.on_date,
        status=record.status,
        recorded_by=record.recorded_by,
        note=record.note,
        student_email=student.email if student else None,
        subject_name=subject.name if subject else None,
    )


def _job_out(db: Session, job: GenerationJob) -> schemas.JobOut:
    book = db.get(Book, job.book_id)
    return schemas.JobOut(
        id=job.id,
        book_id=job.book_id,
        chapter_id=job.chapter_id,
        job_type=job.job_type,
        status=job.status,
        progress_pct=job.progress_pct,
        current_step=job.current_step,
        error=job.error,
        heartbeat_at=job.heartbeat_at,
        created_at=job.created_at,
        book_title=book.title if book else None,
    )
