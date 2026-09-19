from __future__ import annotations

import enum
import uuid
from datetime import date, datetime, timezone
from typing import Any, Optional

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


class AccountType(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    SCHOOL_ADMIN = "school_admin"


class MembershipRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class MembershipStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    LEFT = "left"


class InvitationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class BookStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    TOC_RUNNING = "toc_running"
    TOC_READY = "toc_ready"
    GENERATING = "generating"
    READY = "ready"
    FAILED = "failed"


class ChapterStatus(str, enum.Enum):
    PENDING = "pending"
    QUEUED = "queued"
    GENERATING = "generating"
    VECTORIZING = "vectorizing"
    READY = "ready"
    FAILED = "failed"


class JobType(str, enum.Enum):
    TOC = "toc"
    GENERATE_CHAPTER = "generate_chapter"
    VECTORIZE = "vectorize"


class JobStatus(str, enum.Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class EnrollmentStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    DROPPED = "dropped"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"


class LanguageChoices(str, enum.Enum):
    AR = "Arabic"
    EN = "English"
    PS = "Pashto"
    FA = "Persian"
    UR = "Urdu"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    first_name: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    last_name: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    account_type: Mapped[AccountType] = mapped_column(Enum(AccountType, name="account_type"), default=AccountType.STUDENT)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    student_profile: Mapped[Optional["StudentProfile"]] = relationship(back_populates="user", uselist=False)
    teacher_profile: Mapped[Optional["TeacherProfile"]] = relationship(back_populates="user", uselist=False)
    memberships: Mapped[list["SchoolMembership"]] = relationship(back_populates="user")


class StudentProfile(TimestampMixin, Base):
    __tablename__ = "student_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    current_grade: Mapped[int] = mapped_column(Integer, default=1)
    language: Mapped[str] = mapped_column(String(32), default=LanguageChoices.EN.value)
    date_of_birth: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    parent_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    user: Mapped[User] = relationship(back_populates="student_profile")


class TeacherProfile(TimestampMixin, Base):
    __tablename__ = "teacher_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    availability_open: Mapped[bool] = mapped_column(Boolean, default=False)
    offered_subjects: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)

    user: Mapped[User] = relationship(back_populates="teacher_profile")


class School(TimestampMixin, Base):
    __tablename__ = "schools"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"))

    memberships: Mapped[list["SchoolMembership"]] = relationship(back_populates="school")
    subjects: Mapped[list["Subject"]] = relationship(back_populates="school")


class SchoolMembership(TimestampMixin, Base):
    __tablename__ = "school_memberships"
    __table_args__ = (UniqueConstraint("school_id", "user_id", name="uq_membership_school_user"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    school_id: Mapped[str] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[MembershipRole] = mapped_column(Enum(MembershipRole, name="membership_role"))
    status: Mapped[MembershipStatus] = mapped_column(
        Enum(MembershipStatus, name="membership_status"), default=MembershipStatus.ACTIVE
    )

    school: Mapped[School] = relationship(back_populates="memberships")
    user: Mapped[User] = relationship(back_populates="memberships")


class SchoolInvitation(TimestampMixin, Base):
    __tablename__ = "school_invitations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    school_id: Mapped[str] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), index=True)
    teacher_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    invited_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus, name="invitation_status"), default=InvitationStatus.PENDING
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    school: Mapped[School] = relationship()
    teacher: Mapped[User] = relationship(foreign_keys=[teacher_user_id])


class StudentApplication(TimestampMixin, Base):
    __tablename__ = "student_applications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    school_id: Mapped[str] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), index=True)
    student_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    grade_level: Mapped[int] = mapped_column(Integer)
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus, name="application_status"), default=ApplicationStatus.PENDING
    )
    reviewed_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    school: Mapped[School] = relationship()
    student: Mapped[User] = relationship(foreign_keys=[student_user_id])


class Subject(TimestampMixin, Base):
    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    school_id: Mapped[str] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    grade_level: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    school: Mapped[School] = relationship(back_populates="subjects")
    books: Mapped[list["Book"]] = relationship(back_populates="subject")
    assignments: Mapped[list["TeacherSubjectAssignment"]] = relationship(back_populates="subject")
    enrollments: Mapped[list["ClassEnrollment"]] = relationship(back_populates="subject")


class TeacherSubjectAssignment(TimestampMixin, Base):
    __tablename__ = "teacher_subject_assignments"
    __table_args__ = (UniqueConstraint("subject_id", "teacher_user_id", name="uq_assignment_subject_teacher"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    school_id: Mapped[str] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    teacher_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    subject: Mapped[Subject] = relationship(back_populates="assignments")
    teacher: Mapped[User] = relationship()


class Book(TimestampMixin, Base):
    __tablename__ = "books"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    uploaded_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    language: Mapped[str] = mapped_column(String(32), default=LanguageChoices.EN.value)
    storage_uri: Mapped[str] = mapped_column(String(512))
    original_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    toc_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    status: Mapped[BookStatus] = mapped_column(Enum(BookStatus, name="book_status"), default=BookStatus.UPLOADED)

    subject: Mapped[Subject] = relationship(back_populates="books")
    chapters: Mapped[list["Chapter"]] = relationship(back_populates="book", order_by="Chapter.order_index")
    jobs: Mapped[list["GenerationJob"]] = relationship(back_populates="book")


class Chapter(TimestampMixin, Base):
    __tablename__ = "chapters"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    book_id: Mapped[str] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    page_start: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    page_end: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[ChapterStatus] = mapped_column(Enum(ChapterStatus, name="chapter_status"), default=ChapterStatus.PENDING)
    embed_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    vector_namespace: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    slidegen_job_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    book: Mapped[Book] = relationship(back_populates="chapters")


class GenerationJob(TimestampMixin, Base):
    __tablename__ = "generation_jobs"
    __table_args__ = (Index("ix_jobs_book_status", "book_id", "status"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    book_id: Mapped[str] = mapped_column(ForeignKey("books.id", ondelete="CASCADE"), index=True)
    chapter_id: Mapped[Optional[str]] = mapped_column(ForeignKey("chapters.id", ondelete="SET NULL"), nullable=True)
    job_type: Mapped[JobType] = mapped_column(Enum(JobType, name="job_type"))
    status: Mapped[JobStatus] = mapped_column(Enum(JobStatus, name="job_status"), default=JobStatus.QUEUED)
    progress_pct: Mapped[int] = mapped_column(Integer, default=0)
    current_step: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    heartbeat_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    result_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)

    book: Mapped[Book] = relationship(back_populates="jobs")
    chapter: Mapped[Optional[Chapter]] = relationship()


class ClassEnrollment(TimestampMixin, Base):
    __tablename__ = "class_enrollments"
    __table_args__ = (UniqueConstraint("subject_id", "student_user_id", name="uq_enrollment_subject_student"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    school_id: Mapped[str] = mapped_column(ForeignKey("schools.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    student_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    enrolled_by: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[EnrollmentStatus] = mapped_column(
        Enum(EnrollmentStatus, name="enrollment_status"), default=EnrollmentStatus.ACTIVE
    )

    subject: Mapped[Subject] = relationship(back_populates="enrollments")
    student: Mapped[User] = relationship(foreign_keys=[student_user_id])
    attendance_records: Mapped[list["Attendance"]] = relationship(back_populates="enrollment")


class Attendance(TimestampMixin, Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("enrollment_id", "on_date", name="uq_attendance_enrollment_date"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    enrollment_id: Mapped[str] = mapped_column(ForeignKey("class_enrollments.id", ondelete="CASCADE"), index=True)
    on_date: Mapped[date] = mapped_column(Date)
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus, name="attendance_status"))
    recorded_by: Mapped[str] = mapped_column(ForeignKey("users.id"))
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    enrollment: Mapped[ClassEnrollment] = relationship(back_populates="attendance_records")


class ChapterProgress(TimestampMixin, Base):
    __tablename__ = "chapter_progress"
    __table_args__ = (UniqueConstraint("chapter_id", "student_user_id", name="uq_progress_chapter_student"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    chapter_id: Mapped[str] = mapped_column(ForeignKey("chapters.id", ondelete="CASCADE"), index=True)
    student_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0)
    last_concept: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    chapter: Mapped[Chapter] = relationship()


class Quiz(TimestampMixin, Base):
    __tablename__ = "quizzes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    student_user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[str] = mapped_column(ForeignKey("subjects.id", ondelete="CASCADE"), index=True)
    chapter_id: Mapped[str] = mapped_column(ForeignKey("chapters.id", ondelete="CASCADE"), index=True)
    chapter_title: Mapped[str] = mapped_column(String(255))
    quiz_version: Mapped[int] = mapped_column(Integer, default=1)
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    time_taken_minutes: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ai_feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    questions_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    responses_json: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)


class ActivityEvent(Base):
    __tablename__ = "activity_events"
    __table_args__ = (Index("ix_activity_school_created", "school_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    school_id: Mapped[Optional[str]] = mapped_column(ForeignKey("schools.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    actor_role: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    verb: Mapped[str] = mapped_column(String(64))
    object_type: Mapped[str] = mapped_column(String(64))
    object_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    extra: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
