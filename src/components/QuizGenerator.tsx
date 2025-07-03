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
          <Button variant="outline" className="gap-2">
            <HelpCircle className="size-4" />
            Quiz Me
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5" />
              AI Quiz Generator
            </DialogTitle>
            <DialogDescription>
              Generate a quiz based on your notes to test your understanding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to generate a 5-question quiz based on your study material.
            </p>
            <Button 
              onClick={handleGenerateQuiz} 
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating Quiz..." : "Generate Quiz"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <HelpCircle className="size-4" />
          Quiz Me
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            AI Quiz
          </DialogTitle>
          <DialogDescription>
            Test your knowledge with AI-generated questions
          </DialogDescription>
        </DialogHeader>

        {!showResults ? (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
              <span>{Math.round(((currentQuestion + 1) / quiz.questions.length) * 100)}%</span>
            </div>

            {/* Question */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {quiz.questions[currentQuestion].question}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(quiz.questions[currentQuestion].options).map(([key, value]) => (
                  <Button
                    key={key}
                    variant={selectedAnswers[currentQuestion] === key ? "default" : "outline"}
                    className="w-full justify-start h-auto p-3 text-left"
                    onClick={() => handleAnswerSelect(key)}
                  >
                    <span className="font-medium mr-2">{key}.</span>
                    {value}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousQuestion}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={!selectedAnswers[currentQuestion]}
              >
                {currentQuestion === quiz.questions.length - 1 ? "See Results" : "Next"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Results Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quiz Results</CardTitle>
                <CardDescription>
                  You scored {getScore()}% ({quiz.questions.filter((_, i) => 
                    selectedAnswers[i] === quiz.questions[i].correctAnswer
                  ).length} out of {quiz.questions.length} correct)
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Question Review */}
            <div className="space-y-4">
              {quiz.questions.map((question, index) => (
                <Card key={index} className={`border-l-4 ${
                  getQuestionStatus(index) === "correct" ? "border-l-green-500" :
                  getQuestionStatus(index) === "incorrect" ? "border-l-red-500" :
                  "border-l-gray-300"
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">
                        Question {index + 1}
                      </CardTitle>
                      {getQuestionStatus(index) === "correct" ? (
                        <CheckCircle className="size-5 text-green-500" />
                      ) : getQuestionStatus(index) === "incorrect" ? (
                        <XCircle className="size-5 text-red-500" />
                      ) : (
                        <HelpCircle className="size-5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm">{question.question}</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <strong>Your answer:</strong> {selectedAnswers[index] || "Not answered"}
                    </div>
                    <div className="text-sm">
                      <strong>Correct answer:</strong> {question.correctAnswer}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Explanation:</strong> {question.explanation}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-2">
              <Button onClick={handleRetakeQuiz} variant="outline" className="gap-2">
                <RotateCcw className="size-4" />
                Retake Quiz
              </Button>
              <Button onClick={() => setQuiz(null)} className="gap-2">
                <Sparkles className="size-4" />
                New Quiz
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 