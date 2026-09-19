import { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import {
  useCreateSchool,
  useCreateSubject,
  useInviteTeacher,
  useReviewApplication,
  useSchoolApplications,
  useSchoolAttendance,
  useSchoolDashboard,
  useSchoolEnrollments,
  useSchoolInvitations,
  useSchoolJobs,
  useSchoolActivity,
  useSchoolSubjects,
  useTeacherInvitations,
  useRespondInvitation,
  useUploadBook,
  useUpdateTeacherProfile,
  useRecordAttendance,
  useSubjectBooks,
  useSchoolPerformance,
} from "@/hooks/useApiQueries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AttendanceStatus } from "@/types/api";

export const SchoolWorkspace = () => {
  const { profile } = useAuthStore();
  const schoolId = profile?.memberships.find((item) => ["owner", "admin", "teacher"].includes(item.role))?.school_id;
  const isOwner = profile?.memberships.some((item) => ["owner", "admin"].includes(item.role));
  const createSchool = useCreateSchool();
  const [schoolName, setSchoolName] = useState("");

  if (!schoolId) {
    return (
      <div className="page-shell max-w-xl">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">School desk</p>
        <h1 className="mt-2 font-display text-5xl">Register your school</h1>
        <p className="mt-3 mb-8 text-muted-foreground">Create a school, then invite teachers and enroll students.</p>
        <div className="space-y-3">
          <Label htmlFor="school-name">School name</Label>
          <Input id="school-name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
          <Button disabled={!schoolName || createSchool.isPending} onClick={() => createSchool.mutate({ name: schoolName })}>
            Create school
          </Button>
        </div>
        <div className="mt-8">
          <TeacherInvites />
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">Faculty desk</p>
        <h1 className="mt-2 font-display text-5xl leading-none">School workspace</h1>
        <p className="mt-3 text-muted-foreground">Manage people, subjects, attendance, and slidegen book jobs.</p>
      </div>
      {profile?.teacher_profile ? <AvailabilityToggle /> : null}
      <TeacherInvites />
      <SchoolPanels schoolId={schoolId} canAdmin={Boolean(isOwner)} />
    </div>
  );
};

const AvailabilityToggle = () => {
  const { profile } = useAuthStore();
  const mutation = useUpdateTeacherProfile();
  const open = profile?.teacher_profile?.availability_open;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teacher availability</CardTitle>
        <CardDescription>Schools can only invite you while this is on.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant={open ? "secondary" : "default"}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ availability_open: !open })}
        >
          {open ? "Available for invitations" : "Not available"}
        </Button>
      </CardContent>
    </Card>
  );
};

const TeacherInvites = () => {
  const { profile } = useAuthStore();
  const { data: invitations } = useTeacherInvitations();
  const respond = useRespondInvitation();
  if (profile?.user.account_type !== "teacher") return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>School invitations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(invitations || []).length === 0 ? <p className="text-sm text-muted-foreground">No invitations yet.</p> : null}
        {(invitations || []).map((invitation) => (
          <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/80 p-3">
            <div>
              <p className="font-medium">{invitation.school_name}</p>
              <p className="text-sm text-muted-foreground">{invitation.status}</p>
            </div>
            {invitation.status === "pending" ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => respond.mutate({ invitationId: invitation.id, accept: true })}>
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => respond.mutate({ invitationId: invitation.id, accept: false })}>
                  Decline
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const SchoolPanels = ({ schoolId, canAdmin }: { schoolId: string; canAdmin: boolean }) => {
  const { data: dashboard } = useSchoolDashboard(schoolId);
  const { data: subjects } = useSchoolSubjects(schoolId);
  const { data: applications } = useSchoolApplications(canAdmin ? schoolId : undefined);
  const { data: invitations } = useSchoolInvitations(canAdmin ? schoolId : undefined);
  const { data: enrollments } = useSchoolEnrollments(schoolId);
  const { data: attendance } = useSchoolAttendance(schoolId);
  const { data: jobs } = useSchoolJobs(schoolId);
  const { data: activityFeed } = useSchoolActivity(schoolId);
  const { data: performance } = useSchoolPerformance(schoolId);
  const createSubject = useCreateSubject(schoolId);
  const invite = useInviteTeacher(schoolId);
  const review = useReviewApplication(schoolId);
  const markAttendance = useRecordAttendance(schoolId);
  const [subjectName, setSubjectName] = useState("");
  const [grade, setGrade] = useState(6);
  const [inviteEmail, setInviteEmail] = useState("");
  const [uploadSubject, setUploadSubject] = useState(subjects?.[0]?.id || "");
  const resolvedSubject = uploadSubject || subjects?.[0]?.id || "";
  const upload = useUploadBook(resolvedSubject);
  const { data: books } = useSubjectBooks(resolvedSubject);
  const [bookTitle, setBookTitle] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const activity = useMemo(
    () => activityFeed || dashboard?.recent_activity || [],
    [activityFeed, dashboard]
  );

  return (
    <Tabs defaultValue="overview">
      <TabsList className="flex h-auto flex-wrap">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="subjects">Subjects</TabsTrigger>
        <TabsTrigger value="people">People</TabsTrigger>
        <TabsTrigger value="attendance">Attendance</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="jobs">Jobs</TabsTrigger>
        <TabsTrigger value="books">Books</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Students" value={dashboard?.total_students ?? enrollments?.length ?? 0} />
        <Stat label="Teachers" value={dashboard?.total_teachers ?? 0} />
        <Stat label="Subjects" value={dashboard?.total_subjects ?? subjects?.length ?? 0} />
        <Stat label="Chapters" value={dashboard?.total_chapters ?? 0} />
        <Card className="col-span-2 md:col-span-4">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>School-wide events, newest first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : null}
            {activity.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm">
                <span>
                  {event.verb} {event.object_type}
                </span>
                <span className="text-muted-foreground">{new Date(event.created_at).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="subjects" className="mt-5 space-y-4">
        {canAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Subject name" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
            <Input type="number" className="w-24" value={grade} onChange={(e) => setGrade(Number(e.target.value))} />
            <Button disabled={!subjectName} onClick={() => createSubject.mutate({ name: subjectName, grade_level: grade, description: "" })}>
              Add
            </Button>
          </div>
        ) : null}
        {(subjects || []).map((subject) => (
          <Card key={subject.id}>
            <CardHeader>
              <CardTitle>{subject.name}</CardTitle>
              <CardDescription>Grade {subject.grade_level}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </TabsContent>
      <TabsContent value="people" className="mt-5 space-y-6">
        {canAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Teacher email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            <Button onClick={() => invite.mutate(inviteEmail)}>Invite teacher</Button>
          </div>
        ) : null}
        {(invitations || []).map((item) => (
          <div key={item.id} className="flex justify-between rounded-xl border border-border/80 p-3">
            <span>{item.teacher_email}</span>
            <Badge>{item.status}</Badge>
          </div>
        ))}
        {(applications || []).map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/80 p-3">
            <div>
              <p>{item.student_email}</p>
              <p className="text-sm text-muted-foreground">Grade {item.grade_level}</p>
            </div>
            {item.status === "pending" ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => review.mutate({ applicationId: item.id, status: "accepted", subjectIds: subjects?.map((s) => s.id!).filter(Boolean) })}>
                  Accept & enroll
                </Button>
                <Button size="sm" variant="outline" onClick={() => review.mutate({ applicationId: item.id, status: "rejected" })}>
                  Reject
                </Button>
              </div>
            ) : (
              <Badge>{item.status}</Badge>
            )}
          </div>
        ))}
      </TabsContent>
      <TabsContent value="attendance" className="mt-5 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s roll</CardTitle>
            <CardDescription>Mark presence for {today}. Records write into the school activity feed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(enrollments || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrollments yet.</p>
            ) : null}
            {(enrollments || []).map((enrollment) => (
              <div key={enrollment.id} className="flex flex-col gap-3 rounded-xl border border-border/80 p-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{enrollment.student_name || enrollment.student_email}</p>
                  <p className="text-sm text-muted-foreground">
                    {enrollment.student_email} · {enrollment.subject_name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant="outline"
                      disabled={markAttendance.isPending}
                      onClick={() => markAttendance.mutate({ enrollmentId: enrollment.id, status, on_date: today })}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(attendance || []).length === 0 ? <p className="text-sm text-muted-foreground">No attendance recorded yet.</p> : null}
            {(attendance || []).map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm">
                <span>
                  {record.student_email} · {record.subject_name}
                </span>
                <span className="text-muted-foreground">
                  {record.on_date} · {record.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="performance" className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Avg progress" value={Math.round(performance?.avg_progress ?? 0)} suffix="%" />
          <Stat label="Avg quiz score" value={Math.round(performance?.avg_score ?? 0)} suffix="%" />
          <Stat label="Avg attendance" value={Math.round(performance?.avg_attendance ?? 0)} suffix="%" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Student performance</CardTitle>
            <CardDescription>Chapter completion, quiz scores, time on page, and attendance for each enrollment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(performance?.rows || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No enrollment records yet.</p>
            ) : null}
            {(performance?.rows || []).map((row) => (
              <div key={row.enrollment_id} className="rounded-xl border border-border/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{row.student_name || row.student_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {row.student_email} · {row.subject_name}
                    </p>
                  </div>
                  <Badge variant="secondary">{row.progress_pct}% complete</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">Chapters</p>
                    <p>{row.chapters_completed}/{row.total_chapters}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">Quiz</p>
                    <p>{row.avg_score}% · {row.quiz_attempts} attempts</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">Attendance</p>
                    <p>{row.attendance_rate == null ? "—" : `${row.attendance_rate}%`}</p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">Time on page</p>
                    <p>{Math.round(row.time_spent_seconds / 60)} min</p>
                  </div>
                </div>
                <Progress value={row.progress_pct} className="mt-3" />
                {row.last_concept ? (
                  <p className="mt-2 text-sm text-muted-foreground">Last concept: {row.last_concept}</p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="jobs" className="mt-5 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Slidegen jobs</CardTitle>
            <CardDescription>Queued and running jobs refresh automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(jobs || []).length === 0 ? <p className="text-sm text-muted-foreground">No generation jobs yet.</p> : null}
            {(jobs || []).map((job) => (
              <div key={job.id} className="rounded-xl border border-border/80 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{job.book_title || job.book_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.job_type} · {job.current_step || "waiting"}
                    </p>
                  </div>
                  <Badge>{job.status}</Badge>
                </div>
                <Progress value={job.progress_pct || 0} className="mt-3" />
                {job.error ? <p className="mt-2 text-sm text-destructive">{job.error}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="books" className="mt-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Subject</Label>
            <select className="mt-1 h-11 w-full rounded-xl border border-input bg-card px-3" value={resolvedSubject} onChange={(e) => setUploadSubject(e.target.value)}>
              {(subjects || []).map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Book title</Label>
            <Input value={bookTitle} onChange={(e) => setBookTitle(e.target.value)} />
          </div>
        </div>
        <Input
          type="file"
          accept=".pdf,.epub,.docx"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file || !resolvedSubject) return;
            upload.mutate({ title: bookTitle || file.name, language: "English", file });
          }}
        />
        <p className="text-sm text-muted-foreground">
          Upload queues slidegen: TOC first, then one interactive chapter at a time.
        </p>
        {(books || []).map((book) => (
          <Card key={book.id}>
            <CardHeader>
              <CardTitle className="text-xl">{book.title}</CardTitle>
              <CardDescription>
                {book.status} · {book.language}
                {book.page_count ? ` · ${book.page_count} pages` : ""}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </TabsContent>
    </Tabs>
  );
};

const Stat = ({ label, value, suffix }: { label: string; value: number; suffix?: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{label}</CardDescription>
      <CardTitle className="font-display text-3xl">
        {value}
        {suffix ? <span className="ml-1 text-lg font-sans text-muted-foreground">{suffix}</span> : null}
      </CardTitle>
    </CardHeader>
  </Card>
);
