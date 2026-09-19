from __future__ import annotations

import hashlib
import hmac
import logging
import re
import shutil
from datetime import timedelta
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import schemas
from .activity import log_activity
from .clients.slidegen import slidegen_client
from .config import settings
from .models import (
    AccountType,
    ApplicationStatus,
    Attendance,
    AttendanceStatus,
    Book,
    BookStatus,
    Chapter,
    ChapterProgress,
    ChapterStatus,
    ClassEnrollment,
    EnrollmentStatus,
    GenerationJob,
    InvitationStatus,
    JobStatus,
    JobType,
    MembershipRole,
    MembershipStatus,
    Quiz,
    School,
    SchoolInvitation,
    SchoolMembership,
    StudentApplication,
    StudentProfile,
    Subject,
    TeacherProfile,
    TeacherSubjectAssignment,
    User,
    utcnow,
)
from .utils import hash as hash_password
from .utils import is_strong_password, verify

logger = logging.getLogger(__name__)

QUIZ_PASSING_SCORE = 70


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "school"


def register_user(db: Session, data: schemas.UserCreate) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered.")
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Username is already taken.")
    if not is_strong_password(data.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long and include uppercase, lowercase, digit, and special character.",
        )

    user = User(
        username=data.username,
        email=data.email,
        password=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        account_type=data.account_type,
    )
    db.add(user)
    db.flush()

    if data.account_type == AccountType.STUDENT:
        db.add(
            StudentProfile(
                user_id=user.id,
                current_grade=data.current_grade or 1,
                language=(data.language.value if data.language else "English"),
            )
        )
    elif data.account_type == AccountType.TEACHER:
        db.add(TeacherProfile(user_id=user.id, availability_open=False))

    log_activity(db, actor_id=user.id, verb="registered", object_type="user", object_id=user.id, extra={"account_type": data.account_type.value})
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify(password, user.password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")
    user.last_login = utcnow()
    db.commit()
    return user


def build_me(db: Session, user: User) -> schemas.MeOut:
    memberships = []
    for membership in db.query(SchoolMembership).filter(SchoolMembership.user_id == user.id).all():
        school = db.get(School, membership.school_id)
        memberships.append(
            schemas.MembershipOut(
                id=membership.id,
                school_id=membership.school_id,
                school_name=school.name if school else None,
                role=membership.role,
                status=membership.status,
            )
        )
    return schemas.MeOut(
        user=schemas.UserOut.model_validate(user),
        student_profile=schemas.StudentProfileOut.model_validate(user.student_profile) if user.student_profile else None,
        teacher_profile=schemas.TeacherProfileOut.model_validate(user.teacher_profile) if user.teacher_profile else None,
        memberships=memberships,
    )


def create_school(db: Session, user: User, data: schemas.SchoolCreate) -> School:
    slug = _slugify(data.slug or data.name)
    if db.query(School).filter(School.slug == slug).first():
        slug = f"{slug}-{user.id[:6]}"

    school = School(
        name=data.name,
        slug=slug,
        description=data.description,
        address=data.address,
        created_by=user.id,
    )
    db.add(school)
    db.flush()
    db.add(SchoolMembership(school_id=school.id, user_id=user.id, role=MembershipRole.OWNER))
    log_activity(db, actor_id=user.id, school_id=school.id, actor_role="owner", verb="created", object_type="school", object_id=school.id)
    db.commit()
    db.refresh(school)
    return school


def invite_teacher(db: Session, school: School, actor: User, data: schemas.InvitationCreate) -> SchoolInvitation:
    teacher = db.query(User).filter(User.email == data.email).first()
    if not teacher or teacher.account_type != AccountType.TEACHER:
        raise HTTPException(status_code=404, detail="No teacher account found for that email")
    profile = db.get(TeacherProfile, teacher.id)
    if not profile or not profile.availability_open:
        raise HTTPException(status_code=400, detail="Teacher is not available for school invitations")

    existing = (
        db.query(SchoolInvitation)
        .filter(
            SchoolInvitation.school_id == school.id,
            SchoolInvitation.teacher_user_id == teacher.id,
            SchoolInvitation.status == InvitationStatus.PENDING,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="An invitation is already pending")

    invitation = SchoolInvitation(
        school_id=school.id,
        teacher_user_id=teacher.id,
        invited_by=actor.id,
        message=data.message,
        expires_at=utcnow() + timedelta(days=14),
    )
    db.add(invitation)
    log_activity(
        db,
        actor_id=actor.id,
        school_id=school.id,
        actor_role="admin",
        verb="invited",
        object_type="teacher",
        object_id=teacher.id,
    )
    db.commit()
    db.refresh(invitation)
    return invitation


def respond_invitation(db: Session, invitation: SchoolInvitation, teacher: User, accept: bool) -> SchoolInvitation:
    if invitation.teacher_user_id != teacher.id:
        raise HTTPException(status_code=403, detail="This invitation is not for you")
    if invitation.status != InvitationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Invitation is no longer pending")

    invitation.status = InvitationStatus.ACCEPTED if accept else InvitationStatus.DECLINED
    if accept:
        existing = (
            db.query(SchoolMembership)
            .filter(SchoolMembership.school_id == invitation.school_id, SchoolMembership.user_id == teacher.id)
            .first()
        )
        if existing:
            existing.status = MembershipStatus.ACTIVE
            existing.role = MembershipRole.TEACHER
        else:
            db.add(
                SchoolMembership(
                    school_id=invitation.school_id,
                    user_id=teacher.id,
                    role=MembershipRole.TEACHER,
                )
            )
    log_activity(
        db,
        actor_id=teacher.id,
        school_id=invitation.school_id,
        actor_role="teacher",
        verb="accepted_invite" if accept else "declined_invite",
        object_type="invitation",
        object_id=invitation.id,
    )
    db.commit()
    db.refresh(invitation)
    return invitation


def apply_to_school(db: Session, school: School, student: User, grade_level: int) -> StudentApplication:
    if student.account_type != AccountType.STUDENT:
        raise HTTPException(status_code=400, detail="Only students can apply to a school")
    existing = (
        db.query(StudentApplication)
        .filter(
            StudentApplication.school_id == school.id,
            StudentApplication.student_user_id == student.id,
            StudentApplication.status == ApplicationStatus.PENDING,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending application")

    application = StudentApplication(school_id=school.id, student_user_id=student.id, grade_level=grade_level)
    db.add(application)
    log_activity(
        db,
        actor_id=student.id,
        school_id=school.id,
        actor_role="student",
        verb="applied",
        object_type="school",
        object_id=school.id,
    )
    db.commit()
    db.refresh(application)
    return application


def review_application(
    db: Session, application: StudentApplication, reviewer: User, data: schemas.ApplicationReview
) -> StudentApplication:
    if application.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=400, detail="Application is no longer pending")
    if data.status not in {ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED}:
        raise HTTPException(status_code=400, detail="Review status must be accepted or rejected")

    application.status = data.status
    application.reviewed_by = reviewer.id
    application.note = data.note

    if data.status == ApplicationStatus.ACCEPTED:
        existing = (
            db.query(SchoolMembership)
            .filter(
                SchoolMembership.school_id == application.school_id,
                SchoolMembership.user_id == application.student_user_id,
            )
            .first()
        )
        if existing:
            existing.status = MembershipStatus.ACTIVE
            existing.role = MembershipRole.STUDENT
        else:
            db.add(
                SchoolMembership(
                    school_id=application.school_id,
                    user_id=application.student_user_id,
                    role=MembershipRole.STUDENT,
                )
            )
        for subject_id in data.subject_ids:
            enroll_student(db, application.school_id, subject_id, application.student_user_id, reviewer.id, commit=False)

    log_activity(
        db,
        actor_id=reviewer.id,
        school_id=application.school_id,
        actor_role="admin",
        verb="reviewed_application",
        object_type="application",
        object_id=application.id,
        extra={"status": data.status.value},
    )
    db.commit()
    db.refresh(application)
    return application


def assign_teacher(db: Session, subject: Subject, teacher_user_id: str, actor: User) -> TeacherSubjectAssignment:
    membership = (
        db.query(SchoolMembership)
        .filter(
            SchoolMembership.school_id == subject.school_id,
            SchoolMembership.user_id == teacher_user_id,
            SchoolMembership.role == MembershipRole.TEACHER,
            SchoolMembership.status == MembershipStatus.ACTIVE,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=400, detail="Teacher is not an active member of this school")

    existing = (
        db.query(TeacherSubjectAssignment)
        .filter(
            TeacherSubjectAssignment.subject_id == subject.id,
            TeacherSubjectAssignment.teacher_user_id == teacher_user_id,
        )
        .first()
    )
    if existing:
        return existing

    assignment = TeacherSubjectAssignment(
        school_id=subject.school_id,
        subject_id=subject.id,
        teacher_user_id=teacher_user_id,
    )
    db.add(assignment)
    log_activity(
        db,
        actor_id=actor.id,
        school_id=subject.school_id,
        actor_role="admin",
        verb="assigned_teacher",
        object_type="subject",
        object_id=subject.id,
        extra={"teacher_user_id": teacher_user_id},
    )
    db.commit()
    db.refresh(assignment)
    return assignment


def enroll_student(
    db: Session, school_id: str, subject_id: str, student_user_id: str, enrolled_by: Optional[str], commit: bool = True
) -> ClassEnrollment:
    existing = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.subject_id == subject_id, ClassEnrollment.student_user_id == student_user_id)
        .first()
    )
    if existing:
        existing.status = EnrollmentStatus.ACTIVE
        if commit:
            db.commit()
        return existing

    enrollment = ClassEnrollment(
        school_id=school_id,
        subject_id=subject_id,
        student_user_id=student_user_id,
        enrolled_by=enrolled_by,
    )
    db.add(enrollment)
    db.flush()
    if commit:
        db.commit()
    db.refresh(enrollment)
    return enrollment


def teacher_can_manage_subject(db: Session, user: User, subject: Subject) -> bool:
    membership = (
        db.query(SchoolMembership)
        .filter(
            SchoolMembership.school_id == subject.school_id,
            SchoolMembership.user_id == user.id,
            SchoolMembership.status == MembershipStatus.ACTIVE,
        )
        .first()
    )
    if not membership:
        return False
    if membership.role in {MembershipRole.OWNER, MembershipRole.ADMIN}:
        return True
    if membership.role != MembershipRole.TEACHER:
        return False
    return (
        db.query(TeacherSubjectAssignment)
        .filter(
            TeacherSubjectAssignment.subject_id == subject.id,
            TeacherSubjectAssignment.teacher_user_id == user.id,
        )
        .first()
        is not None
    )


def store_book_file(book_id: str, upload: UploadFile) -> str:
    if settings.s3_books_bucket:
        import boto3

        key = f"books/{book_id}/{upload.filename}"
        client = boto3.client("s3", region_name=settings.aws_region)
        client.upload_fileobj(upload.file, settings.s3_books_bucket, key)
        return f"s3://{settings.s3_books_bucket}/{key}"

    dest_dir = Path(settings.local_upload_dir) / "books" / book_id
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / (upload.filename or "book.bin")
    with dest.open("wb") as handle:
        shutil.copyfileobj(upload.file, handle)
    return str(dest.resolve())


def create_book_from_upload(db: Session, subject: Subject, user: User, title: str, language: str, upload: UploadFile) -> Book:
    if not teacher_can_manage_subject(db, user, subject):
        raise HTTPException(status_code=403, detail="You are not assigned to this subject")

    book = Book(
        subject_id=subject.id,
        uploaded_by=user.id,
        title=title,
        language=language,
        storage_uri="pending",
        original_filename=upload.filename,
        status=BookStatus.UPLOADED,
    )
    db.add(book)
    db.flush()
    book.storage_uri = store_book_file(book.id, upload)
    log_activity(
        db,
        actor_id=user.id,
        school_id=subject.school_id,
        actor_role="teacher",
        verb="uploaded_book",
        object_type="book",
        object_id=book.id,
    )
    start_toc_job(db, book)
    db.commit()
    db.refresh(book)
    return book


def start_toc_job(db: Session, book: Book) -> GenerationJob:
    job = GenerationJob(
        book_id=book.id,
        job_type=JobType.TOC,
        status=JobStatus.QUEUED,
        current_step="queued",
    )
    db.add(job)
    db.flush()
    book.status = BookStatus.TOC_RUNNING
    dispatch_job(db, job, book)
    return job


def enqueue_next_chapter(db: Session, book: Optional[Book]) -> Optional[GenerationJob]:
    if book is None:
        return None
    in_flight = (
        db.query(Chapter)
        .filter(
            Chapter.book_id == book.id,
            Chapter.status.in_([ChapterStatus.QUEUED, ChapterStatus.GENERATING, ChapterStatus.VECTORIZING]),
        )
        .first()
    )
    if in_flight:
        return None

    chapter = (
        db.query(Chapter)
        .filter(Chapter.book_id == book.id, Chapter.status == ChapterStatus.PENDING)
        .order_by(Chapter.order_index)
        .first()
    )
    if not chapter:
        remaining = db.query(Chapter).filter(Chapter.book_id == book.id, Chapter.status != ChapterStatus.READY).count()
        book.status = BookStatus.READY if remaining == 0 else BookStatus.FAILED
        return None

    job = GenerationJob(
        book_id=book.id,
        chapter_id=chapter.id,
        job_type=JobType.GENERATE_CHAPTER,
        status=JobStatus.QUEUED,
        current_step="queued",
    )
    db.add(job)
    db.flush()
    chapter.status = ChapterStatus.QUEUED
    chapter.slidegen_job_id = job.id
    book.status = BookStatus.GENERATING
    dispatch_job(db, job, book, chapter)
    return job


def dispatch_job(db: Session, job: GenerationJob, book: Book, chapter: Optional[Chapter] = None) -> None:
    payload = {
        "job_id": job.id,
        "type": job.job_type.value,
        "book_id": book.id,
        "chapter_id": chapter.id if chapter else None,
        "source_uri": book.storage_uri,
        "callback_url": f"{settings.slidegen_callback_base_url.rstrip('/')}/internal/slidegen/webhook",
        "metadata": {
            "title": chapter.title if chapter else book.title,
            "language": book.language,
            "page_start": chapter.page_start if chapter else None,
            "page_end": chapter.page_end if chapter else None,
            "order_index": chapter.order_index if chapter else None,
        },
    }
    external_id = slidegen_client.enqueue(payload)
    if external_id:
        job.external_id = external_id
        return
    apply_local_stub(db, job, book, chapter)


def apply_local_stub(db: Session, job: GenerationJob, book: Book, chapter: Optional[Chapter]) -> None:
    """Used when slidegen/SQS is not configured so local UI can be developed."""
    if job.job_type == JobType.TOC:
        chapters = [
            {"title": f"{book.title} — Introduction", "order": 1, "page_start": 1, "page_end": 8},
            {"title": f"{book.title} — Core concepts", "order": 2, "page_start": 9, "page_end": 20},
            {"title": f"{book.title} — Practice and review", "order": 3, "page_start": 21, "page_end": 30},
        ]
        apply_toc_result(db, book, job, chapters, page_count=30)
        return

    if not chapter:
        job.status = JobStatus.FAILED
        job.error = job.error or "Chapter was not found for this generation job"
        book.status = BookStatus.FAILED
        return

    chapter.status = ChapterStatus.READY
    chapter.embed_url = f"{settings.slidegen_callback_base_url.rstrip('/')}/embed/chapters/{chapter.id}"
    chapter.vector_namespace = f"chapter:{chapter.id}"
    job.status = JobStatus.SUCCEEDED
    job.progress_pct = 100
    job.current_step = "local_stub_ready"
    db.flush()
    enqueue_next_chapter(db, book)


def apply_toc_result(db: Session, book: Optional[Book], job: GenerationJob, chapters: list[dict], page_count: Optional[int]) -> None:
    if book is None:
        job.status = JobStatus.FAILED
        job.error = job.error or "Book was not found"
        return
    book.toc_json = chapters
    book.page_count = page_count
    book.status = BookStatus.TOC_READY
    job.status = JobStatus.SUCCEEDED
    job.progress_pct = 100
    job.current_step = "toc_ready"
    job.result_json = {"chapters": chapters}

    db.query(Chapter).filter(Chapter.book_id == book.id).delete()
    for item in chapters:
        db.add(
            Chapter(
                book_id=book.id,
                title=item.get("title") or f"Chapter {item.get('order', 1)}",
                order_index=int(item.get("order") or item.get("order_index") or 0),
                page_start=item.get("page_start"),
                page_end=item.get("page_end"),
                status=ChapterStatus.PENDING,
            )
        )
    db.flush()
    enqueue_next_chapter(db, book)


def verify_slidegen_signature(body: bytes, signature: Optional[str]) -> None:
    if settings.debug and not signature:
        return
    if not signature:
        raise HTTPException(status_code=401, detail="Missing slidegen signature")
    expected = hmac.new(settings.slidegen_webhook_secret.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status_code=401, detail="Invalid slidegen signature")


def handle_slidegen_webhook(db: Session, payload: schemas.SlidegenWebhookIn) -> GenerationJob:
    job = db.get(GenerationJob, payload.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = payload.status
    job.progress_pct = payload.progress_pct
    job.current_step = payload.current_step
    job.error = payload.error
    job.heartbeat_at = utcnow()
    job.result_json = payload.result
    book = db.get(Book, job.book_id)
    chapter = db.get(Chapter, job.chapter_id) if job.chapter_id else None

    if payload.status == JobStatus.RUNNING:
        if chapter:
            chapter.status = ChapterStatus.GENERATING if job.job_type == JobType.GENERATE_CHAPTER else ChapterStatus.VECTORIZING
        db.commit()
        db.refresh(job)
        return job

    if payload.status == JobStatus.FAILED:
        job.error = payload.error or "Slidegen job failed"
        if chapter:
            chapter.status = ChapterStatus.FAILED
            chapter.error = job.error
        if book:
            book.status = BookStatus.FAILED
        db.commit()
        db.refresh(job)
        return job

    if not book:
        job.status = JobStatus.FAILED
        job.error = job.error or f"Book {job.book_id} was not found"
        db.commit()
        db.refresh(job)
        return job

    result = payload.result or {}
    if job.job_type == JobType.TOC:
        apply_toc_result(db, book, job, result.get("chapters") or [], result.get("page_count"))
    elif chapter:
        chapter.embed_url = result.get("embed_url") or chapter.embed_url
        chapter.vector_namespace = result.get("vector_namespace") or f"chapter:{chapter.id}"
        chapter.status = ChapterStatus.READY
        db.flush()
        enqueue_next_chapter(db, book)

    db.commit()
    db.refresh(job)
    return job


def subject_detail_for_user(db: Session, subject: Subject, user: User) -> schemas.SubjectDetail:
    book = (
        db.query(Book)
        .filter(Book.subject_id == subject.id)
        .order_by(Book.created_at.desc())
        .first()
    )
    chapters = book.chapters if book else []
    progress_rows = {
        row.chapter_id: row
        for row in db.query(ChapterProgress).filter(ChapterProgress.student_user_id == user.id).all()
    }
    quiz_counts = dict(
        db.query(Quiz.chapter_id, func.count(Quiz.id))
        .filter(Quiz.student_user_id == user.id)
        .group_by(Quiz.chapter_id)
        .all()
    )

    chapter_out = []
    completed = 0
    for chapter in chapters:
        row = progress_rows.get(chapter.id)
        is_completed = bool(row and row.completed)
        if is_completed:
            completed += 1
        chapter_out.append(
            schemas.ChapterOut(
                id=chapter.id,
                book_id=chapter.book_id,
                title=chapter.title,
                order_index=chapter.order_index,
                page_start=chapter.page_start,
                page_end=chapter.page_end,
                status=chapter.status,
                embed_url=chapter.embed_url if chapter.status == ChapterStatus.READY else None,
                progress=100.0 if is_completed else 0.0,
                quiz_attempts=int(quiz_counts.get(chapter.id, 0)),
                is_completed=is_completed,
            )
        )

    total = len(chapters)
    return schemas.SubjectDetail(
        id=subject.id,
        school_id=subject.school_id,
        name=subject.name,
        description=subject.description,
        grade_level=subject.grade_level,
        is_active=subject.is_active,
        total_chapters=total,
        completed_chapters=completed,
        progress=(completed / total * 100) if total else 0.0,
        book=schemas.BookOut.model_validate(book) if book else None,
        chapters=chapter_out,
    )


def student_dashboard(db: Session, user: User) -> schemas.StudentDashboard:
    enrollments = (
        db.query(ClassEnrollment)
        .filter(ClassEnrollment.student_user_id == user.id, ClassEnrollment.status == EnrollmentStatus.ACTIVE)
        .all()
    )
    subjects = []
    total_chapters = 0
    completed_chapters = 0
    for enrollment in enrollments:
        subject = db.get(Subject, enrollment.subject_id)
        if not subject:
            continue
        detail = subject_detail_for_user(db, subject, user)
        subjects.append(detail)
        total_chapters += detail.total_chapters
        completed_chapters += detail.completed_chapters

    applications = []
    for application in db.query(StudentApplication).filter(StudentApplication.student_user_id == user.id).all():
        school = db.get(School, application.school_id)
        applications.append(
            schemas.ApplicationOut(
                id=application.id,
                school_id=application.school_id,
                school_name=school.name if school else None,
                student_user_id=application.student_user_id,
                grade_level=application.grade_level,
                status=application.status,
                note=application.note,
                created_at=application.created_at,
            )
        )

    quizzes = db.query(Quiz).filter(Quiz.student_user_id == user.id, Quiz.score.is_not(None)).all()
    avg_score = (sum(q.score or 0 for q in quizzes) / len(quizzes)) if quizzes else 0.0
    passed_dates = sorted({q.end_time.date() for q in quizzes if q.passed and q.end_time})
    streak = 0
    if passed_dates:
        current = 1
        streak = 1
        for index in range(1, len(passed_dates)):
            if (passed_dates[index] - passed_dates[index - 1]).days == 1:
                current += 1
                streak = max(streak, current)
            else:
                current = 1

    return schemas.StudentDashboard(
        enrollments=subjects,
        applications=applications,
        stats=schemas.DashboardStats(
            completed_chapters=completed_chapters,
            total_chapters=total_chapters,
            avg_score=avg_score,
            streak=streak,
        ),
    )


def school_dashboard(db: Session, school: School) -> schemas.SchoolDashboard:
    students = (
        db.query(func.count(SchoolMembership.id))
        .filter(
            SchoolMembership.school_id == school.id,
            SchoolMembership.role == MembershipRole.STUDENT,
            SchoolMembership.status == MembershipStatus.ACTIVE,
        )
        .scalar()
        or 0
    )
    teachers = (
        db.query(func.count(SchoolMembership.id))
        .filter(
            SchoolMembership.school_id == school.id,
            SchoolMembership.role == MembershipRole.TEACHER,
            SchoolMembership.status == MembershipStatus.ACTIVE,
        )
        .scalar()
        or 0
    )
    subjects = db.query(func.count(Subject.id)).filter(Subject.school_id == school.id).scalar() or 0
    chapters = (
        db.query(func.count(Chapter.id))
        .join(Book, Chapter.book_id == Book.id)
        .join(Subject, Book.subject_id == Subject.id)
        .filter(Subject.school_id == school.id)
        .scalar()
        or 0
    )
    from .models import ActivityEvent

    events = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.school_id == school.id)
        .order_by(ActivityEvent.created_at.desc())
        .limit(20)
        .all()
    )
    return schemas.SchoolDashboard(
        school=schemas.SchoolOut.model_validate(school),
        total_students=students,
        total_teachers=teachers,
        total_subjects=subjects,
        total_chapters=chapters,
        recent_activity=[schemas.ActivityOut.model_validate(event) for event in events],
    )


def school_performance(db: Session, school: School, membership: SchoolMembership) -> schemas.SchoolPerformance:
    enrollments = db.query(ClassEnrollment).filter(ClassEnrollment.school_id == school.id).all()
    if membership.role == MembershipRole.TEACHER:
        assigned = {
            row.subject_id
            for row in db.query(TeacherSubjectAssignment).filter(
                TeacherSubjectAssignment.school_id == school.id,
                TeacherSubjectAssignment.teacher_user_id == membership.user_id,
            )
        }
        enrollments = [row for row in enrollments if row.subject_id in assigned]

    rows: list[schemas.StudentPerformanceRow] = []
    for enrollment in enrollments:
        student = db.get(User, enrollment.student_user_id)
        subject = db.get(Subject, enrollment.subject_id)
        chapter_ids = [
            chapter.id
            for chapter in (
                db.query(Chapter)
                .join(Book, Chapter.book_id == Book.id)
                .filter(Book.subject_id == enrollment.subject_id)
                .all()
            )
        ]
        progress_rows = (
            db.query(ChapterProgress)
            .filter(
                ChapterProgress.student_user_id == enrollment.student_user_id,
                ChapterProgress.chapter_id.in_(chapter_ids or ["__none__"]),
            )
            .all()
            if chapter_ids
            else []
        )
        completed = sum(1 for item in progress_rows if item.completed)
        time_spent = sum(item.time_spent_seconds for item in progress_rows)
        last_progress = max(progress_rows, key=lambda item: item.updated_at or item.created_at, default=None)
        quizzes = (
            db.query(Quiz)
            .filter(Quiz.student_user_id == enrollment.student_user_id, Quiz.subject_id == enrollment.subject_id)
            .all()
        )
        scored = [item for item in quizzes if item.score is not None]
        attendance_rows = db.query(Attendance).filter(Attendance.enrollment_id == enrollment.id).all()
        present = sum(1 for item in attendance_rows if item.status in {AttendanceStatus.PRESENT, AttendanceStatus.LATE})
        attendance_total = len(attendance_rows)
        last_quiz = max((item.end_time or item.start_time for item in quizzes if item.end_time or item.start_time), default=None)
        last_attendance = max((item.updated_at for item in attendance_rows), default=None)
        last_activity = max(
            [stamp for stamp in [last_progress.updated_at if last_progress else None, last_quiz, last_attendance] if stamp],
            default=None,
        )
        name = None
        if student:
            name = " ".join(part for part in [student.first_name, student.last_name] if part) or student.username
        rows.append(
            schemas.StudentPerformanceRow(
                enrollment_id=enrollment.id,
                student_user_id=enrollment.student_user_id,
                student_name=name,
                student_email=student.email if student else None,
                subject_id=enrollment.subject_id,
                subject_name=subject.name if subject else None,
                chapters_completed=completed,
                total_chapters=len(chapter_ids),
                progress_pct=round((completed / len(chapter_ids) * 100) if chapter_ids else 0, 1),
                avg_score=round(sum(item.score or 0 for item in scored) / len(scored), 1) if scored else 0,
                quiz_attempts=len(quizzes),
                attendance_rate=round(present / attendance_total * 100, 1) if attendance_total else None,
                attendance_present=present,
                attendance_total=attendance_total,
                time_spent_seconds=time_spent,
                last_concept=last_progress.last_concept if last_progress else None,
                last_activity_at=last_activity,
            )
        )

    scored_rows = [row for row in rows if row.quiz_attempts]
    attended = [row.attendance_rate for row in rows if row.attendance_rate is not None]
    return schemas.SchoolPerformance(
        school_id=school.id,
        rows=rows,
        avg_score=round(sum(row.avg_score for row in scored_rows) / len(scored_rows), 1) if scored_rows else 0,
        avg_progress=round(sum(row.progress_pct for row in rows) / len(rows), 1) if rows else 0,
        avg_attendance=round(sum(attended) / len(attended), 1) if attended else None,
    )


def assistant_reply(db: Session, user: User, request: schemas.AssistantRequest) -> schemas.AssistantResponse:
    query = ""
    for message in reversed(request.user_messages or []):
        if message.get("role") == "user" and message.get("content"):
            query = message["content"]
            break
    if not query:
        return schemas.AssistantResponse(ai_response="Ask a question about this chapter.")

    citations: list[dict] = []
    context_bits: list[str] = []
    if request.chapter_id:
        chapter = db.get(Chapter, request.chapter_id)
        if chapter and chapter.vector_namespace:
            try:
                hits = slidegen_client.search(chapter.vector_namespace, query)
            except Exception as exc:
                logger.warning("Slidegen RAG failed: %s", exc)
                hits = []
            for hit in hits:
                citations.append(
                    {
                        "page": hit.get("page"),
                        "paragraph_id": hit.get("paragraph_id"),
                        "excerpt": hit.get("text") or hit.get("excerpt"),
                    }
                )
                if hit.get("text") or hit.get("excerpt"):
                    context_bits.append(hit.get("text") or hit.get("excerpt"))

    if citations:
        lines = ["Here is what the book says, with citations:"]
        for hit in citations:
            cite = f"p. {hit.get('page')}"
            if hit.get("paragraph_id"):
                cite += f", {hit['paragraph_id']}"
            lines.append(f"- ({cite}) {hit.get('excerpt')}")
        return schemas.AssistantResponse(ai_response="\n".join(lines), citations=citations)

    if request.chapter_id:
        chapter = db.get(Chapter, request.chapter_id)
        if chapter and chapter.status != ChapterStatus.READY:
            return schemas.AssistantResponse(
                ai_response="This chapter is still being generated and indexed. Try again when the interactive chapter is ready."
            )
        return schemas.AssistantResponse(
            ai_response="I do not have indexed passages for this chapter yet. Once slidegen finishes vectorizing, I can cite the exact page and paragraph."
        )

    return schemas.AssistantResponse(ai_response="Open a chapter so I can search the book with citations.")
