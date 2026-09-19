import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubjectDetail } from "@/hooks/useApiQueries";
import { Link, useParams } from "react-router-dom";
import { AIAssistant } from "../learning/AIAssistant";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const SubjectDetail = () => {
  const { subjectId } = useParams();
  const { data: subject, isLoading, isError } = useSubjectDetail(subjectId);

  if (isLoading) {
    return (
      <div className="page-shell">
        <Skeleton className="mb-8 h-10 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isError || !subject) {
    return (
      <div className="page-shell flex items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Error Loading Subject</AlertTitle>
          <AlertDescription>
            There was a problem fetching the details for this subject.
            <Button onClick={() => window.history.back()} variant="link" className="mt-2 h-auto p-0">
              Go Back
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Button variant="link" onClick={() => window.history.back()} className="mb-4 px-0">
        ← Back to Dashboard
      </Button>
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">
            {subject.book?.title || "Course folio"}
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none">{subject.name}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{subject.description}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="secondary">Grade {subject.grade_level}</Badge>
          <span>{subject.total_chapters || subject.chapters?.length || 0} Chapters</span>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{subject.progress || 0}%</span>
          </div>
          <Progress value={subject.progress || 0} className="mt-2" />
          <p className="mt-3 text-sm text-muted-foreground">
            {subject.completed_chapters || 0} of {subject.total_chapters || 0} chapters completed
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(subject.chapters || [])
          .slice()
          .sort((a, b) => a.order_index - b.order_index)
          .map((lesson) => (
            <Link to={`/subjects/${subject.id}/chapters/${lesson.id}`} key={lesson.id}>
              <Card variant="interactive" className="h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${
                            lesson.is_completed
                              ? "bg-success text-success-foreground"
                              : lesson.progress > 0
                                ? "bg-warning text-warning-foreground"
                                : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {lesson.is_completed ? "✓" : lesson.order_index}
                        </div>
                        <div>
                          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                            {lesson.status}
                          </p>
                          <h3 className="font-display text-xl">{lesson.title}</h3>
                        </div>
                      </div>
                      <p className="ml-12 mt-3 text-sm text-muted-foreground">
                        Quiz attempts: {lesson.quiz_attempts}
                      </p>
                      <div className="ml-12 mt-3 max-w-xs">
                        <div className="mb-1 flex justify-between text-sm">
                          <span>Score</span>
                          <span>{lesson.progress || 0}%</span>
                        </div>
                        <Progress value={lesson.progress || 0} />
                      </div>
                    </div>
                    <Button size="sm" variant={lesson.is_completed ? "secondary" : "default"}>
                      {lesson.is_completed ? "Review" : lesson.progress > 0 ? "Continue" : "Start"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
      <AIAssistant subject_id={subject.id} subject={subject.name} />
    </div>
  );
};
