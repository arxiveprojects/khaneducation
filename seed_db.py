from datetime import date, datetime, timedelta, timezone

from app.database import SessionLocal, init_db
from app.models import (
    AccountType,
    Attendance,
    AttendanceStatus,
    Book,
    BookStatus,
    Chapter,
    ChapterProgress,
    ChapterStatus,
    ClassEnrollment,
    MembershipRole,
    Quiz,
    School,
    SchoolMembership,
    StudentProfile,
    Subject,
    TeacherProfile,
    TeacherSubjectAssignment,
    User,
)
from app.utils import hash


def seed() -> None:
    init_db()
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "owner@example.com").first():
            _seed_core(db)
            print("Seeded owner@example.com / teacher@example.com / student@example.com with password Abc123()")
        else:
            print("Seed data already present.")
        _seed_learning_records(db)
        db.commit()
        print("Seeded learning records for the performance desk.")
    finally:
        db.close()


def _seed_core(db) -> None:
    owner = User(
        username="schoolowner",
        email="owner@example.com",
        password=hash("Abc123()"),
        first_name="Amina",
        last_name="Karim",
        account_type=AccountType.SCHOOL_ADMIN,
    )
    teacher = User(
        username="teacher",
        email="teacher@example.com",
        password=hash("Abc123()"),
        first_name="Yusuf",
        last_name="Rahimi",
        account_type=AccountType.TEACHER,
    )
    student = User(
        username="student",
        email="student@example.com",
        password=hash("Abc123()"),
        first_name="Laila",
        last_name="Noor",
        account_type=AccountType.STUDENT,
    )
    db.add_all([owner, teacher, student])
    db.flush()
    db.add(TeacherProfile(user_id=teacher.id, availability_open=True, bio="Mathematics teacher"))
    db.add(StudentProfile(user_id=student.id, current_grade=6, language="English"))

    school = School(name="Kabul Open School", slug="kabul-open", description="Demo school", created_by=owner.id)
    db.add(school)
    db.flush()
    db.add_all(
        [
            SchoolMembership(school_id=school.id, user_id=owner.id, role=MembershipRole.OWNER),
            SchoolMembership(school_id=school.id, user_id=teacher.id, role=MembershipRole.TEACHER),
            SchoolMembership(school_id=school.id, user_id=student.id, role=MembershipRole.STUDENT),
        ]
    )

    subject = Subject(school_id=school.id, name="Mathematics", description="Grade 6 mathematics", grade_level=6)
    db.add(subject)
    db.flush()
    db.add(TeacherSubjectAssignment(school_id=school.id, subject_id=subject.id, teacher_user_id=teacher.id))
    db.add(ClassEnrollment(school_id=school.id, subject_id=subject.id, student_user_id=student.id, enrolled_by=owner.id))

    book = Book(
        subject_id=subject.id,
        uploaded_by=teacher.id,
        title="Grade 6 Mathematics",
        language="English",
        storage_uri="local://seed/math.pdf",
        original_filename="math.pdf",
        page_count=30,
        status=BookStatus.READY,
        toc_json=[{"title": "Fractions", "order": 1, "page_start": 1, "page_end": 10}],
    )
    db.add(book)
    db.flush()
    chapter = Chapter(
        book_id=book.id,
        title="Fractions",
        order_index=1,
        page_start=1,
        page_end=10,
        status=ChapterStatus.READY,
        embed_url="http://127.0.0.1:8000/embed/chapters/pending",
        vector_namespace="chapter:seed",
    )
    db.add(chapter)
    db.flush()
    chapter.embed_url = f"http://127.0.0.1:8000/embed/chapters/{chapter.id}"
    chapter.vector_namespace = f"chapter:{chapter.id}"
    db.flush()


def _seed_learning_records(db) -> None:
    student = db.query(User).filter(User.email == "student@example.com").first()
    if not student:
        return
    enrollment = db.query(ClassEnrollment).filter(ClassEnrollment.student_user_id == student.id).first()
    chapter = db.query(Chapter).filter(Chapter.title == "Fractions").first()
    if not enrollment or not chapter:
        return

    progress = (
        db.query(ChapterProgress)
        .filter(ChapterProgress.chapter_id == chapter.id, ChapterProgress.student_user_id == student.id)
        .first()
    )
    if not progress:
        now = datetime.now(timezone.utc)
        db.add(
            ChapterProgress(
                chapter_id=chapter.id,
                student_user_id=student.id,
                time_spent_seconds=18 * 60,
                last_concept="Page 4, p1",
                completed=True,
                completed_at=now,
            )
        )

    quiz = db.query(Quiz).filter(Quiz.student_user_id == student.id, Quiz.chapter_id == chapter.id).first()
    if not quiz:
        start = datetime.now(timezone.utc) - timedelta(minutes=12)
        db.add(
            Quiz(
                student_user_id=student.id,
                subject_id=enrollment.subject_id,
                chapter_id=chapter.id,
                chapter_title=chapter.title,
                quiz_version=1,
                start_time=start,
                end_time=datetime.now(timezone.utc),
                time_taken_minutes=11.0,
                score=82.0,
                passed=True,
                ai_feedback="Strong work. Revisit the visualizations to lock the concept in.",
                questions_json=[
                    {
                        "question_id": "q1",
                        "question_text": "Which pages cover Fractions?",
                        "question_type": "short_answer",
                        "correct_answer": "1",
                    }
                ],
                responses_json=[{"question_id": "q1", "student_answer": "1", "is_correct": True}],
            )
        )

    if not db.query(Attendance).filter(Attendance.enrollment_id == enrollment.id).first():
        teacher = db.query(User).filter(User.email == "teacher@example.com").first()
        recorder = teacher.id if teacher else student.id
        for offset, status in ((2, AttendanceStatus.PRESENT), (1, AttendanceStatus.LATE), (0, AttendanceStatus.PRESENT)):
            db.add(
                Attendance(
                    enrollment_id=enrollment.id,
                    on_date=date.today() - timedelta(days=offset),
                    status=status,
                    recorded_by=recorder,
                )
            )


if __name__ == "__main__":
    seed()
