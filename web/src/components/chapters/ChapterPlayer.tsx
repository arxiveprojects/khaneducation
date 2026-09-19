import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLesson, useSubject } from "@/hooks/useApiQueries";
import { AIAssistant } from "../learning/AIAssistant";
import { QuizAttempts } from "../lessons/QuizAttempts";
import { recordChapterProgress } from "@/services/api";

export const ChapterPlayer = () => {
  const { subjectId, chapterId, lessonId } = useParams();
  const id = chapterId || lessonId;
  const { data: subject, isLoading: subjectLoading, isError: subjectError } = useSubject(subjectId);
  const { data: chapter, isLoading: chapterLoading, isError: chapterError } = useLesson(id);
  const [citation, setCitation] = useState<string | null>(null);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (!id) return undefined;
    const onMessage = (event: MessageEvent) => {
      const data = event.data || {};
      if (data.type === "voice.read") {
        const cite = data.citation
          ? `Page ${data.citation.page}${data.citation.paragraph_id ? `, ${data.citation.paragraph_id}` : ""}`
          : "";
        setCitation(cite);
        if (data.text && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(data.text));
        }
        recordChapterProgress(id, {
          time_spent_seconds: 0,
          last_concept: cite || data.text?.slice(0, 80),
        }).catch(() => undefined);
      }
      if (data.type === "progress") {
        recordChapterProgress(id, {
          time_spent_seconds: 5,
          last_concept: data.last_concept || data.citation?.paragraph_id || "opened chapter",
          completed: Boolean(data.completed),
        }).catch(() => undefined);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id]);

  useEffect(() => {
    return () => {
      if (id) {
        const seconds = Math.round((Date.now() - startedAt.current) / 1000);
        recordChapterProgress(id, { time_spent_seconds: seconds }).catch(() => undefined);
      }
    };
  }, [id]);

  if (subjectLoading || chapterLoading) {
    return (
      <div className="page-shell">
        <Skeleton className="mb-8 h-10 w-48" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (subjectError || chapterError || !subject || !chapter) {
    return (
      <div className="page-shell flex justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Error loading chapter</AlertTitle>
          <AlertDescription>This chapter is not available yet.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Button variant="link" onClick={() => window.history.back()} className="mb-4 px-0">
        ← Back to {subject.name}
      </Button>
      <div className="mb-8">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-muted-foreground">Interactive chapter</p>
        <h1 className="mt-2 font-display text-5xl leading-none">{chapter.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Badge variant="secondary">Grade {subject.grade_level}</Badge>
          <Badge>{chapter.status}</Badge>
          {chapter.page_start ? (
            <span className="text-sm text-muted-foreground">
              Book pp. {chapter.page_start}–{chapter.page_end}
            </span>
          ) : null}
        </div>
        {citation ? <p className="mt-3 text-sm text-primary">Citation: {citation}</p> : null}
      </div>

      <Tabs defaultValue="chapter">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chapter">Interactive chapter</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>
        <TabsContent value="chapter" className="mt-6">
          {chapter.embed_url && chapter.status === "ready" ? (
            <iframe
              title={chapter.title}
              src={chapter.embed_url}
              sandbox="allow-scripts"
              className="min-h-[75vh] w-full rounded-2xl border border-border bg-card shadow-soft"
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Chapter is still generating</CardTitle>
                <CardDescription>
                  Slidegen is building this interactive chapter. Status: {chapter.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                Refresh this page after the job finishes. The host app never loads chapter CSS or JS.
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="quiz" className="mt-6">
          <QuizAttempts lessonId={chapter.id} />
        </TabsContent>
      </Tabs>
      <AIAssistant
        subject_id={subject.id as string}
        subject={subject.name}
        lesson_id={chapter.id}
        lesson={chapter.title}
      />
    </div>
  );
};
