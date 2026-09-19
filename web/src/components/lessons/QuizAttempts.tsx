import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuizAttempts } from "@/hooks/useApiQueries";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuizAttemptDetail } from "./QuizAttemptDetail";
import { useState } from "react";
import {  QuizAttemptOut } from "@/types/api";

export const QuizAttempts = ({ lessonId }: { lessonId: string }) => {
  const navigate = useNavigate();
  const [selectedAttempt, setSelectedAttempt] = useState<QuizAttemptOut | null>(
    null
  );


  const {
    data: quizAttempts,
    isLoading: isAttemptsLoading,
    isError: isAttemptsError,
  } = useQuizAttempts(lessonId);

  const startQuiz = () => {
    navigate(`/chapters/${lessonId}/quiz/`, { replace: true });
  };

  const handleReviewClick = (attempt: QuizAttemptOut) => {
    setSelectedAttempt(attempt);
  };

  if (isAttemptsLoading ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-16 w-full mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isAttemptsError || !quizAttempts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 p-6 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Loading Lesson</AlertTitle>
          <AlertDescription>
            There was a problem fetching the quiz attempts for this lesson.
            Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      {(quizAttempts || []).some((attempt) => attempt.passed === true) ? (
        <></>
      ) : (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Knowledge Check Quiz</CardTitle>
            <CardDescription>
              Test your understanding of the lesson content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="gradient"
              onClick={startQuiz}
              size="lg"
              className="w-full"
            >
              Start New Quiz
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Your Quiz History</h3>
        </div>
        {isAttemptsLoading ? (
          <p>Loading history...</p>
        ) : isAttemptsError ? (
          <p>Could not load history.</p>
        ) : quizAttempts && quizAttempts.length > 0 ? (
          <div className="space-y-2">
            {quizAttempts.map((attempt) => (
              <Card key={attempt.id} className="shadow-soft">
                <CardContent className="p-4 flex flex-col">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      Quiz Attempt on{" "}
                      {new Date(attempt.start_time).toLocaleString()}
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewClick(attempt)}
                        >
                          Review
                        </Button>
                      </DialogTrigger>
                      {selectedAttempt && (
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Quiz Attempt Details</DialogTitle>
                          </DialogHeader>
                          <QuizAttemptDetail attempt={selectedAttempt} />
                        </DialogContent>
                      )}
                    </Dialog>
                  </div>
                  </CardContent>
                  <div  className="p-4">
                    <p className="text-sm">
                      Quiz Version • {attempt.quiz_version}
                    </p>
                    <p
                      className={`text-sm ${
                        attempt.passed ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                      }`}
                    >
                      {attempt.passed ? "Passed" : "Failed"} • Score:{" "}
                      {attempt.score}%
                    </p>
                    <p className="text-sm mt-2">
                      <span className="font-bold">AI Feedback: </span>
                      {attempt.ai_feedback}
                    </p>
                  </div>
              </Card>
            ))}
          </div>
        ) : (
          <p>You haven't attempted any quizzes for this lesson yet.</p>
        )}
      </div>
    </>
  );
};
