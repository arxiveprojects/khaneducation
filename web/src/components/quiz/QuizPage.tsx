import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Trophy,
  ArrowLeft,
} from "lucide-react";
import { Quiz } from "./Quiz";

export const QuizPage = () => {
  const { lessonId, chapterId } = useParams();
  const quizId = chapterId || lessonId;

  const [quizStarted, setQuizStarted] = useState(false);

  const [startTime, setStartTime] = useState<Date | null>(null);

  const onBack = () => {
    window.history.back();
  };

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (quizStarted) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [quizStarted]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setStartTime(new Date());
  };
  if (quizStarted)
    return (
      <Quiz
        lessonId={quizId || ""}
        quizStarted={quizStarted}
        setQuizStarted={setQuizStarted}
        startTime={startTime}
        setStartTime={setStartTime}
      />
    );
  // Quiz start screen
  if (!quizStarted) {
    return (
      <div className="min-h-screen">
        <div className="py-4">
          <div className="max-w-6xl mx-auto px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="link"
                  onClick={onBack}
                  className="hover:font-bold px-0 py-0"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Lesson</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Trophy className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Ready to Test Your Knowledge?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Take this quiz to assess your understanding of the lesson
              material. You'll need to score 70% or higher to pass.
            </p>
          </div>

          <Card className="shadow-lg max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Knowledge Check Quiz
              </CardTitle>
              <CardDescription>
                Test your understanding of the lesson concepts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Passing Score</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      70% or higher required
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Time Tracking</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Monitor your progress
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-800 dark:text-amber-200">
                  Important Notice
                </AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  Once you start the quiz, leaving this page will automatically
                  submit your answers. Make sure you're ready to complete it in
                  one session.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleStartQuiz}
                size="lg"
                className="w-full bg-gradient-primary text-white font-medium py-6"
              >
                <Brain className="h-5 w-5 mr-2" />
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
};
