from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field

from .models import (
    AccountType,
    ApplicationStatus,
    AttendanceStatus,
    BookStatus,
    ChapterStatus,
    EnrollmentStatus,
    InvitationStatus,
    JobStatus,
    JobType,
    LanguageChoices,
    MembershipRole,
    MembershipStatus,
)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    account_type: AccountType = AccountType.STUDENT
    current_grade: Optional[int] = Field(default=1, ge=1, le=12)
    language: Optional[LanguageChoices] = LanguageChoices.EN


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    account_type: AccountType
    is_active: bool = True

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None


class StudentProfileOut(BaseModel):
    user_id: str
    current_grade: int
    language: str

    class Config:
        from_attributes = True


class StudentProfileUpdate(BaseModel):
    current_grade: Optional[int] = Field(default=None, ge=1, le=12)
    language: Optional[LanguageChoices] = None


class TeacherProfileOut(BaseModel):
    user_id: str
    bio: Optional[str] = None
    availability_open: bool
    offered_subjects: Optional[list[str]] = None

    class Config:
        from_attributes = True


class TeacherProfileUpdate(BaseModel):
    bio: Optional[str] = None
    availability_open: Optional[bool] = None
    offered_subjects: Optional[list[str]] = None


class MembershipOut(BaseModel):
    id: str
    school_id: str
    school_name: Optional[str] = None
    role: MembershipRole
    status: MembershipStatus

    class Config:
        from_attributes = True


class MeOut(BaseModel):
    user: UserOut
    student_profile: Optional[StudentProfileOut] = None
    teacher_profile: Optional[TeacherProfileOut] = None
    memberships: list[MembershipOut] = []


class SchoolCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None


class SchoolOut(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvitationCreate(BaseModel):
    email: EmailStr
    message: Optional[str] = None


class InvitationOut(BaseModel):
    id: str
    school_id: str
    school_name: Optional[str] = None
    teacher_user_id: str
    teacher_email: Optional[str] = None
    status: InvitationStatus
    message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationCreate(BaseModel):
    grade_level: int = Field(..., ge=1, le=12)


class ApplicationReview(BaseModel):
    status: ApplicationStatus
    note: Optional[str] = None
    subject_ids: list[str] = []


class ApplicationOut(BaseModel):
    id: str
    school_id: str
    school_name: Optional[str] = None
    student_user_id: str
    student_email: Optional[str] = None
    grade_level: int
    status: ApplicationStatus
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    grade_level: int = Field(..., ge=1, le=12)


class SubjectOut(BaseModel):
    id: str
    school_id: str
    name: str
    description: Optional[str] = None
    grade_level: int
    is_active: bool = True
    total_chapters: int = 0
    completed_chapters: int = 0
    progress: float = 0.0

    class Config:
        from_attributes = True


class AssignTeacherIn(BaseModel):
    teacher_user_id: str


class EnrollStudentIn(BaseModel):
    student_user_id: str


class EnrollmentOut(BaseModel):
    id: str
    school_id: str
    subject_id: str
    student_user_id: str
    status: EnrollmentStatus
    student_email: Optional[str] = None
    student_name: Optional[str] = None
    subject_name: Optional[str] = None

    class Config:
        from_attributes = True


class BookOut(BaseModel):
    id: str
    subject_id: str
    title: str
    language: str
    status: BookStatus
    page_count: Optional[int] = None
    original_filename: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChapterOut(BaseModel):
    id: str
    book_id: str
    title: str
    order_index: int
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    status: ChapterStatus
    embed_url: Optional[str] = None
    progress: float = 0.0
    quiz_attempts: int = 0
    is_completed: bool = False

    class Config:
        from_attributes = True


class SubjectDetail(SubjectOut):
    book: Optional[BookOut] = None
    chapters: list[ChapterOut] = []


class JobOut(BaseModel):
    id: str
    book_id: str
    chapter_id: Optional[str] = None
    job_type: JobType
    status: JobStatus
    progress_pct: int
    current_step: Optional[str] = None
    error: Optional[str] = None
    heartbeat_at: Optional[datetime] = None
    created_at: datetime
    book_title: Optional[str] = None

    class Config:
        from_attributes = True


class SlidegenWebhookIn(BaseModel):
    job_id: str
    status: JobStatus
    progress_pct: int = 0
    current_step: Optional[str] = None
    error: Optional[str] = None
    result: Optional[dict[str, Any]] = None


class AttendanceIn(BaseModel):
    on_date: date
    status: AttendanceStatus
    note: Optional[str] = None


class AttendanceOut(BaseModel):
    id: str
    enrollment_id: str
    on_date: date
    status: AttendanceStatus
    recorded_by: str
    note: Optional[str] = None
    student_email: Optional[str] = None
    subject_name: Optional[str] = None

    class Config:
        from_attributes = True


class ActivityOut(BaseModel):
    id: str
    school_id: Optional[str] = None
    actor_id: str
    actor_role: Optional[str] = None
    verb: str
    object_type: str
    object_id: Optional[str] = None
    extra: Optional[dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    completed_chapters: int
    total_chapters: int
    avg_score: float
    streak: int


class StudentDashboard(BaseModel):
    enrollments: list[SubjectOut]
    applications: list[ApplicationOut] = []
    stats: DashboardStats


class SchoolDashboard(BaseModel):
    school: SchoolOut
    total_students: int
    total_teachers: int
    total_subjects: int
    total_chapters: int
    recent_activity: list[ActivityOut] = []


class StudentPerformanceRow(BaseModel):
    enrollment_id: str
    student_user_id: str
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    subject_id: str
    subject_name: Optional[str] = None
    chapters_completed: int = 0
    total_chapters: int = 0
    progress_pct: float = 0
    avg_score: float = 0
    quiz_attempts: int = 0
    attendance_rate: Optional[float] = None
    attendance_present: int = 0
    attendance_total: int = 0
    time_spent_seconds: int = 0
    last_concept: Optional[str] = None
    last_activity_at: Optional[datetime] = None


class SchoolPerformance(BaseModel):
    school_id: str
    rows: list[StudentPerformanceRow] = []
    avg_score: float = 0
    avg_progress: float = 0
    avg_attendance: Optional[float] = None


class AssistantRequest(BaseModel):
    subject_id: str
    chapter_id: Optional[str] = None
    user_messages: list[dict[str, str]]


class AssistantResponse(BaseModel):
    ai_response: str
    citations: list[dict[str, Any]] = []


class ChapterProgressIn(BaseModel):
    time_spent_seconds: int = 0
    last_concept: Optional[str] = None
    completed: bool = False


class QuizQuestion(BaseModel):
    question_id: str
    question_text: str
    question_type: str
    options: list[str] = []
    correct_answer: Optional[str] = None


class QuizOut(BaseModel):
    id: str
    chapter_id: str
    chapter_title: Optional[str] = None
    quiz_questions: list[QuizQuestion] = []
    created_at: datetime


class QuizResponseIn(BaseModel):
    question_id: str
    student_answer: str


class QuizAttemptOut(BaseModel):
    id: str
    chapter_title: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    score: Optional[float] = 0.0
    passed: bool
    ai_feedback: Optional[str] = None
    quiz_version: int = 0
    responses: list[dict[str, Any]] = []


class QuizSubmissionResponse(BaseModel):
    attempt: QuizAttemptOut
    ai_feedback: str
