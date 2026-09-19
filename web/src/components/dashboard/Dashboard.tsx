import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useStudentDashboard } from "@/hooks/useApiQueries";
import { Link } from "react-router-dom";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useAuthStore } from "@/stores/authStore";

export const Dashboard = () => {
  const { profile } = useAuthStore();
  const { data: dashboardData, isLoading, error } = useStudentDashboard();

  if (isLoading) {
    return (
      <div className="page-shell">
        <Skeleton className="mb-8 h-12 w-64" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell flex items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription className="mt-2">
            There was a problem fetching the dashboard data.
            <Button onClick={() => window.location.reload()} variant="link" className="mt-3 h-auto p-0">
              Refresh the page.
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { enrollments: enrolledSubjects, stats } = dashboardData;
  const completed_lessons = stats.completed_chapters ?? stats.completed_lessons ?? 0;
  const total_lessons = stats.total_chapters ?? stats.total_lessons ?? 0;
  const { avg_score, streak } = stats;
  const firstName = profile?.user.first_name || profile?.user.username || "there";

  return (
    <div className="page-shell">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">Student studio</p>
          <h1 className="mt-2 font-display text-5xl leading-none">Good work, {firstName}.</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Your subjects, cited chapters, and streak — kept on one quiet desk.
          </p>
        </div>
        <Link to="/schools" className="text-sm text-primary underline-offset-4 hover:underline">
          Browse schools
        </Link>
      </div>

      <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Progress" value={`${Math.round((completed_lessons / total_lessons) * 100) || 0}%`} bar={(completed_lessons / total_lessons) * 100 || 0} />
        <StatCard label="Avg Score" value={`${avg_score.toFixed(0)}%`} />
        <StatCard label="Lessons" value={`${completed_lessons}/${total_lessons}`} />
        <StatCard label="Streak" value={`${streak} days`} />
      </div>

      <div className="mb-5 flex items-end justify-between">
        <h2 className="font-display text-3xl">Your Subjects</h2>
        <span className="text-sm text-muted-foreground">{enrolledSubjects.length} enrolled</span>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {enrolledSubjects.map((subject) => (
          <Link to={`/subjects/${subject.id}`} key={subject.id}>
            <Card variant="interactive" className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">Subject</p>
                    <h3 className="mt-1 font-display text-2xl">{subject.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{subject.description}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <Badge variant="secondary">Grade {subject.grade_level}</Badge>
                    </div>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress: {subject.progress || 0}% complete</span>
                      <Button size="sm" variant="outline">
                        Continue Learning
                      </Button>
                    </div>
                    <Progress value={subject.progress} className="mt-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, bar }: { label: string; value: string; bar?: number }) => (
  <Card variant="elevated">
    <CardContent className="p-5">
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {typeof bar === "number" ? <Progress value={bar} className="mt-3 hidden md:block" /> : null}
    </CardContent>
  </Card>
);
