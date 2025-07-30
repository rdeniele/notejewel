"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateQuiz } from "@/actions/study";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HelpCircle, CheckCircle, XCircle, RotateCcw, Sparkles } from "lucide-react";

interface QuizGeneratorProps {
  userId: string;
  subjectId: string;
  noteIds?: string[];
}

interface QuizQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  questions: QuizQuestion[];
}

export default function QuizGenerator({ userId, subjectId, noteIds }: QuizGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    try {
      const generatedQuiz = await generateQuiz(userId, subjectId, noteIds);
      setQuiz(generatedQuiz);
      setCurrentQuestion(0);
      setSelectedAnswers(new Array(generatedQuiz.questions.length).fill(""));
      setShowResults(false);
      toast.success("Quiz generated successfully!");
      
      // Refresh page to update AI generations count
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error("Failed to generate quiz");
      console.error("Quiz generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answer;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(new Array(quiz?.questions.length || 0).fill(""));
    setShowResults(false);
  };

  const getScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  const getQuestionStatus = (questionIndex: number) => {
    if (!selectedAnswers[questionIndex]) return "unanswered";
    const isCorrect = selectedAnswers[questionIndex] === quiz?.questions[questionIndex].correctAnswer;
    return isCorrect ? "correct" : "incorrect";
  };

  if (!quiz) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2 min-h-[44px] px-4 touch-manipulation">
            <HelpCircle className="size-4" />
            Quiz Me
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5" />
              AI Quiz Generator
            </DialogTitle>
            <DialogDescription className="text-sm">
              Generate a quiz based on your notes to test your understanding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-1">
            <p className="text-sm text-muted-foreground">
              Click the button below to generate a 5-question quiz based on your study material.
            </p>
            <Button 
              onClick={handleGenerateQuiz} 
              disabled={isGenerating}
              className="w-full min-h-[48px] text-base touch-manipulation"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="size-4 mr-2 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                "Generate Quiz"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 min-h-[44px] px-4 touch-manipulation">
          <HelpCircle className="size-4" />
          Quiz Me
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5" />
            AI Quiz
          </DialogTitle>
          <DialogDescription className="text-sm">
            Test your knowledge with AI-generated questions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {!showResults ? (
            <div className="h-full overflow-y-auto space-y-4 p-1">
              {/* Progress */}
              <div className="flex items-center justify-between text-sm bg-muted/50 p-3 rounded-lg">
                <span className="font-medium">Question {currentQuestion + 1} of {quiz.questions.length}</span>
                <span className="text-primary font-semibold">{Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%</span>
              </div>

              {/* Question */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg leading-relaxed">
                    {quiz.questions[currentQuestion].question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(quiz.questions[currentQuestion].options).map(([key, value]) => (
                    <Button
                      key={key}
                      variant={selectedAnswers[currentQuestion] === key ? "default" : "outline"}
                      className="w-full justify-start min-h-[52px] p-4 text-left touch-manipulation text-sm sm:text-base"
                      onClick={() => handleAnswerSelect(key)}
                    >
                      <span className="font-semibold mr-3 text-base">{key}.</span>
                      <span className="leading-relaxed">{value}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0}
                  className="min-h-[48px] px-6 touch-manipulation"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={!selectedAnswers[currentQuestion]}
                  className="min-h-[48px] px-6 touch-manipulation"
                >
                  {currentQuestion === quiz.questions.length - 1 ? "See Results" : "Next"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Results Summary - Fixed at top */}
              <Card className="mb-4 flex-shrink-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Quiz Results</CardTitle>
                  <CardDescription>
                    You scored {getScore()}% ({quiz.questions.filter((_, i) => 
                      selectedAnswers[i] === quiz.questions[i].correctAnswer
                    ).length} out of {quiz.questions.length} correct)
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Scrollable Question Review */}
              <div className="flex-1 min-h-0 flex flex-col">
                <h3 className="font-semibold text-sm text-muted-foreground mb-3 flex-shrink-0">Question Review:</h3>
                <div className="flex-1 overflow-y-scroll border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/30 min-h-[300px] max-h-[500px]" style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#cbd5e1 #f1f5f9'
                }}>
                  <div className="p-4 space-y-4">
                    {quiz.questions.map((question, index) => (
                      <Card key={index} className={`border-l-4 bg-white ${
                        getQuestionStatus(index) === "correct" ? "border-l-green-500 shadow-green-100" :
                        getQuestionStatus(index) === "incorrect" ? "border-l-red-500 shadow-red-100" :
                        "border-l-gray-300"
                      }`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-sm font-medium leading-relaxed">
                              Q{index + 1}: {question.question}
                            </CardTitle>
                            {getQuestionStatus(index) === "correct" ? (
                              <div className="flex items-center gap-1 text-green-600 flex-shrink-0">
                                <CheckCircle className="size-4" />
                                <span className="text-xs font-medium">Correct</span>
                              </div>
                            ) : getQuestionStatus(index) === "incorrect" ? (
                              <div className="flex items-center gap-1 text-red-600 flex-shrink-0">
                                <XCircle className="size-4" />
                                <span className="text-xs font-medium">Incorrect</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                                <HelpCircle className="size-4" />
                                <span className="text-xs">Skipped</span>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div>
                              <span className="font-semibold text-gray-700">Your answer: </span>
                              <span className={getQuestionStatus(index) === "correct" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                {selectedAnswers[index] || "Not answered"}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-700">Correct answer: </span>
                              <span className="text-green-600 font-medium">{question.correctAnswer}</span>
                            </div>
                            {question.explanation && (
                              <div className="pt-2 border-t border-gray-100">
                                <span className="font-semibold text-gray-700">Explanation: </span>
                                <p className="text-gray-600 mt-1 leading-relaxed">{question.explanation}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions - Fixed at bottom */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 mt-4 border-t bg-background flex-shrink-0">
                <Button 
                  onClick={handleRetakeQuiz} 
                  variant="outline" 
                  className="gap-2 min-h-[48px] w-full sm:w-auto touch-manipulation"
                >
                  <RotateCcw className="size-4" />
                  Retake Quiz
                </Button>
                <Button 
                  onClick={() => setQuiz(null)} 
                  className="gap-2 min-h-[48px] w-full sm:w-auto touch-manipulation"
                >
                  <Sparkles className="size-4" />
                  New Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 