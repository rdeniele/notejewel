"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, BookOpen, RefreshCw, RotateCcw, Trophy, Star, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { logStudyActivity } from "@/actions/study";
import { useRouter } from "next/navigation";

interface SubjectQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  subjectId: string;
  subjectName: string;
  subjectNotes: Array<{
    id: string;
    title: string;
    text: string;
  }>;
}

export default function SubjectQuizModal({
  isOpen,
  onClose,
  userId,
  subjectId,
  subjectName,
  subjectNotes
}: SubjectQuizModalProps) {
  const router = useRouter();
  
  // Quiz setup state
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  
  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    question: string;
    options: string[];
    answer: string;
  }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isGeneratingNewQuiz, setIsGeneratingNewQuiz] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Reset quiz setup when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowQuizSetup(true);
      setQuizQuestions([]);
      setCurrentQuestion(0);
      setUserAnswers([]);
      setQuizFinished(false);
      setScore(0);
      setTotalQuestions(0);
      setQuizError(null);
    }
  }, [isOpen]);

  function parseQuiz(text: string) {
    if (!text || text.trim().length === 0) {
      return [];
    }
    
    // More robust parser that handles different formats
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const questions: Array<{question: string, options: string[], answer: string}> = [];
    let currentQuestion: {question: string, options: string[], answer: string} | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a new question (starts with number)
      if (/^\d+\./.test(line)) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.options.length > 0) {
          questions.push(currentQuestion);
        }
        
        // Start new question
        currentQuestion = {
          question: line.replace(/^\d+\.\s*/, ""),
          options: [],
          answer: ""
        };
      }
      // Check if this is an option (A), B), C), D))
      else if (/^[A-D]\)/.test(line) && currentQuestion) {
        currentQuestion.options.push(line);
      }
      // Check if this is an answer line
      else if (/^Answer:/i.test(line) && currentQuestion) {
        currentQuestion.answer = line.replace(/^Answer:\s*/i, "");
      }
      // If we have a current question but no options yet, this might be a continuation of the question
      else if (currentQuestion && currentQuestion.options.length === 0 && !/^Answer:/i.test(line)) {
        currentQuestion.question += " " + line;
      }
    }
    
    // Don't forget the last question
    if (currentQuestion && currentQuestion.options.length > 0) {
      questions.push(currentQuestion);
    }
    
    return questions;
  }

  function parseQuizAlternative(text: string) {
    // Try to find questions using different patterns
    const questionPatterns = [
      /(\d+\.\s*[^A-D]+?)(?=\d+\.|$)/gs, // Questions ending with next number or end
      /(Question\s*\d+[^A-D]+?)(?=Question\s*\d+|$)/gs, // Questions starting with "Question"
      /([^A-D]+?\?)(?=\d+\.|Question|$)/gs // Questions ending with question mark
    ];
    
    const questions: Array<{question: string, options: string[], answer: string}> = [];
    
    for (const pattern of questionPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        for (let i = 0; i < Math.min(matches.length, questionCount); i++) {
          const match = matches[i].trim();
          
          // Try to extract options and answer from the text following this question
          const questionEndIndex = text.indexOf(match) + match.length;
          const remainingText = text.substring(questionEndIndex);
          
          // Look for options A), B), C), D)
          const optionMatches = remainingText.match(/[A-D]\)[^A-D]*?(?=[A-D]\)|Answer:|$)/gs);
          
          if (optionMatches && optionMatches.length >= 4) {
            const options = optionMatches.slice(0, 4);
            
            // Look for answer
            const answerMatch = remainingText.match(/Answer:\s*([A-D])/i);
            const answer = answerMatch ? answerMatch[1] : "A";
            
            questions.push({
              question: match.replace(/^\d+\.\s*/, "").trim(),
              options: options.map(opt => opt.trim()),
              answer: answer
            });
          }
        }
        
        if (questions.length > 0) {
          return questions;
        }
      }
    }
    
    return [];
  }

  async function startQuiz() {
    setShowQuizSetup(false);
    setIsGeneratingNewQuiz(true);
    setQuizError(null);
    
    try {
      const difficultyText = {
        easy: "easy level with basic recall questions",
        medium: "medium difficulty with application questions", 
        hard: "challenging difficulty with analysis and synthesis questions"
      };
      
      // Combine all notes content for the subject
      const allNotesContent = subjectNotes.map(note => 
        `Note: ${note.title}\n${note.text}`
      ).join('\n\n');
      
      const prompt = `You are creating a quiz based SPECIFICALLY on the notes provided below from the subject "${subjectName}". The questions must be directly derived from the information in these notes - do not use general knowledge outside of what's written in the notes.

Generate exactly ${questionCount} multiple-choice questions at ${difficultyText[difficulty]} that test understanding of the SPECIFIC content in the notes below.

REQUIREMENTS:
- Questions must be based ONLY on information explicitly mentioned in the notes
- Test key concepts, facts, definitions, or examples from the notes
- Include specific details, names, dates, or terminology mentioned in the notes
- For ${difficulty} difficulty: ${difficultyText[difficulty]}
- Generate exactly ${questionCount} questions, no more, no less

NOTES CONTENT:
${allNotesContent}

Use this EXACT format for each question:

1. [Question text based on note content]?
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]
Answer: [A, B, C, or D]

Remember: Generate exactly ${questionCount} questions in the format shown above. Each question must have exactly 4 options (A, B, C, D) and test something specific from the provided notes.`;
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          noteContent: allNotesContent,
          noteTitle: `${subjectName} - Subject Quiz`,
          action: 'quiz',
          conversationHistory: []
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to generate questions');
      
      if (!data.response || data.response.trim().length === 0) {
        setQuizError("AI returned an empty response. Please try again.");
        return;
      }
      
      // Check if AI is refusing to generate questions due to content mismatch
      const responseLower = data.response.toLowerCase();
      if (responseLower.includes("impossible") || 
          responseLower.includes("cannot") || 
          responseLower.includes("not appropriate") ||
          responseLower.includes("not math") ||
          responseLower.includes("not suitable")) {
        setQuizError(`The AI cannot generate ${subjectName} questions from the provided content. The notes in this subject may not contain appropriate ${subjectName} material. Please add more relevant notes to this subject or try a different subject.`);
        return;
      }
      
      const newQuestions = parseQuiz(data.response);
      
      // If parsing failed, try alternative parsing methods
      if (newQuestions.length === 0) {
        // Try to extract questions using different patterns
        const alternativeQuestions = parseQuizAlternative(data.response);
        
        if (alternativeQuestions.length > 0) {
          setQuizQuestions(alternativeQuestions);
          setCurrentQuestion(0);
          setUserAnswers([]);
          setQuizFinished(false);
          setScore(0);
          setTotalQuestions(alternativeQuestions.length);
          setQuizError(null);
          toast.success(`Subject quiz generated with ${alternativeQuestions.length} questions!`);
          return;
        }
      }
      
      if (newQuestions.length !== questionCount) {
        setQuizError(`AI generated ${newQuestions.length} questions, but you requested ${questionCount}. Please try again.`);
        return;
      }
      
      setQuizQuestions(newQuestions);
      setCurrentQuestion(0);
      setUserAnswers([]);
      setQuizFinished(false);
      setScore(0);
      setTotalQuestions(newQuestions.length);
      setQuizError(null);
      
      toast.success(`Subject quiz generated with ${questionCount} ${difficulty} questions!`);
    } catch (error: unknown) {
      const errMsg = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : String(error);
      setQuizError(errMsg || 'Failed to generate quiz questions');
      setShowQuizSetup(true);
    } finally {
      setIsGeneratingNewQuiz(false);
    }
  }

  function handleAnswer(option: string) {
    const newAnswers = [...userAnswers, option];
    setUserAnswers(newAnswers);
    
    // Check if answer is correct
    const currentQ = quizQuestions[currentQuestion];
    if (currentQ.answer && option.includes(currentQ.answer)) {
      setScore(prev => prev + 1);
    }
    
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizFinished(true);
      // Log the quiz completion activity
      logStudyActivity(userId, "QUIZ_TAKEN", subjectId);
      // Refresh the page to update study suggestions
      router.refresh();
    }
  }

  function retryQuiz() {
    setCurrentQuestion(0);
    setUserAnswers([]);
    setQuizFinished(false);
    setScore(0);
    setQuizError(null);
  }

  async function generateNewQuizSet() {
    setIsGeneratingNewQuiz(true);
    setQuizError(null);
    
    try {
      const difficultyText = {
        easy: "easy level with basic recall questions",
        medium: "medium difficulty with application questions", 
        hard: "challenging difficulty with analysis and synthesis questions"
      };
      
      // Combine all notes content for the subject
      const allNotesContent = subjectNotes.map(note => 
        `Note: ${note.title}\n${note.text}`
      ).join('\n\n');
      
      const prompt = `You are creating a NEW set of quiz questions based SPECIFICALLY on the notes provided below from the subject "${subjectName}". These should be different from any previous questions but still test the same note content. The questions must be directly derived from the information in these notes - do not use general knowledge outside of what's written in the notes.

Generate exactly ${questionCount} NEW multiple-choice questions at ${difficultyText[difficulty]} that test understanding of the SPECIFIC content in the notes below.

REQUIREMENTS:
- Questions must be based ONLY on information explicitly mentioned in the notes
- Test different aspects, details, or perspectives from the same note content
- Include specific details, names, dates, or terminology mentioned in the notes
- Create questions that approach the content from different angles than previous questions
- For ${difficulty} difficulty: ${difficultyText[difficulty]}
- Generate exactly ${questionCount} questions, no more, no less

NOTES CONTENT:
${allNotesContent}

Format each question as:
1. [Question text based on note content]?
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [A, B, C, or D]

Make sure each question has exactly 4 options (A, B, C, D) and tests something specific from the provided note content.`;
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          noteContent: allNotesContent,
          noteTitle: `${subjectName} - Subject Quiz`,
          action: 'quiz',
          conversationHistory: []
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to generate new questions');
      
      const newQuestions = parseQuiz(data.response);
      
      if (newQuestions.length !== questionCount) {
        setQuizError(`AI generated ${newQuestions.length} questions, but you requested ${questionCount}. Please try again.`);
        return;
      }
      
      setQuizQuestions(newQuestions);
      setCurrentQuestion(0);
      setUserAnswers([]);
      setQuizFinished(false);
      setScore(0);
      setTotalQuestions(newQuestions.length);
      setQuizError(null);
      
      toast.success("New subject quiz questions generated!");
    } catch (error: unknown) {
      const errMsg = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : String(error);
      setQuizError(errMsg || 'Failed to generate new questions');
    } finally {
      setIsGeneratingNewQuiz(false);
    }
  }

  function getScoreMessage(percentage: number) {
    if (percentage === 100) {
      return {
        message: "Perfect Score! 🎉",
        subtitle: "You're a master of this subject! Outstanding work!",
        icon: <PartyPopper className="size-8 text-yellow-500" />,
        color: "text-yellow-500"
      };
    } else if (percentage >= 90) {
      return {
        message: "Excellent! 🌟",
        subtitle: "You have an excellent understanding of this subject!",
        icon: <Star className="size-8 text-blue-500" />,
        color: "text-blue-500"
      };
    } else if (percentage >= 80) {
      return {
        message: "Great Job! 👏",
        subtitle: "You're doing really well with this subject!",
        icon: <Trophy className="size-8 text-green-500" />,
        color: "text-green-500"
      };
    } else if (percentage >= 70) {
      return {
        message: "Good Work! 👍",
        subtitle: "You have a solid understanding, keep it up!",
        icon: <Trophy className="size-8 text-green-400" />,
        color: "text-green-400"
      };
    } else if (percentage >= 60) {
      return {
        message: "Not Bad! 💪",
        subtitle: "You're on the right track, a bit more practice will help!",
        icon: <Trophy className="size-8 text-orange-500" />,
        color: "text-orange-500"
      };
    } else {
      return {
        message: "Keep Practicing! 📚",
        subtitle: "Don't worry, learning takes time. Review the material and try again!",
        icon: <BookOpen className="size-8 text-gray-400" />,
        color: "text-gray-400"
      };
    }
  }

  function renderQuizSetup() {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="size-8 text-primary" />
            <h2 className="text-2xl font-bold">Subject Quiz Setup</h2>
          </div>
          <p className="text-muted-foreground">
            Test your knowledge of <strong>{subjectName}</strong>
          </p>
          <div className="text-sm text-muted-foreground">
            Based on {subjectNotes.length} note{subjectNotes.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionCount" className="text-base font-medium">
              Number of Questions
            </Label>
            <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(parseInt(value))}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select number of questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
                <SelectItem value="50">50 Questions</SelectItem>
                <SelectItem value="100">100 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty" className="text-base font-medium">
              Difficulty Level
            </Label>
            <Select value={difficulty} onValueChange={(value: "easy" | "medium" | "hard") => setDifficulty(value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy - Basic Recall</SelectItem>
                <SelectItem value="medium">Medium - Application</SelectItem>
                <SelectItem value="hard">Hard - Analysis & Synthesis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={startQuiz}
            disabled={isGeneratingNewQuiz}
            className="flex-1"
          >
            {isGeneratingNewQuiz ? (
              <>
                <Loader2 className="animate-spin size-4 mr-2" />
                Generating Quiz...
              </>
            ) : (
              <>
                <BookOpen className="size-4 mr-2" />
                Start Quiz
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  function renderQuiz() {
    if (quizError) {
      return (
        <div className="text-center space-y-4">
          <div className="text-lg font-medium text-destructive">
            {quizError}
          </div>
          <div className="flex gap-3">
            <Button onClick={startQuiz} variant="outline" className="flex-1">
              Retry
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      );
    }
    
    if (!quizQuestions.length) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
          <Loader2 className="animate-spin size-8 text-primary" />
          <div className="text-lg font-medium">LOADING</div>
          <div className="text-sm text-muted-foreground">
            Generating your subject quiz questions...
          </div>
        </div>
      );
    }
    
    if (quizFinished) {
      const percentage = Math.round((score / totalQuestions) * 100);
      const scoreInfo = getScoreMessage(percentage);
      
      return (
        <div className="space-y-6">
          {/* Score Display */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              {scoreInfo.icon}
              <h2 className="text-2xl font-bold">{scoreInfo.message}</h2>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">
                {score}/{totalQuestions}
              </div>
              <div className="text-lg text-muted-foreground">
                {percentage}%
              </div>
              <div className="text-base text-muted-foreground max-w-md mx-auto">
                {scoreInfo.subtitle}
              </div>
            </div>
          </div>

          {/* Question Review */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Question Review:</h3>
            {quizQuestions.map((q, idx) => {
              const userAnswer = userAnswers[idx];
              const isCorrect = q.answer && userAnswer && userAnswer.includes(q.answer);
              
              return (
                <div key={idx} className={`border rounded-lg p-4 ${isCorrect ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
                  <div className="font-medium mb-2 text-foreground">Q{idx + 1}: {q.question}</div>
                  <div className="space-y-1 text-sm text-foreground">
                    <div>Your answer: <span className="font-mono">{userAnswer || 'No answer'}</span></div>
                    {q.answer && (
                      <div>Correct answer: <span className="font-mono">{q.answer}</span></div>
                    )}
                    <div className={`font-medium ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={retryQuiz}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="size-4 mr-2" />
              Retry Same Questions
            </Button>
            <Button 
              onClick={generateNewQuizSet} 
              disabled={isGeneratingNewQuiz}
              className="flex-1"
            >
              {isGeneratingNewQuiz ? (
                <>
                  <Loader2 className="animate-spin size-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4 mr-2" />
                  New Questions
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }
    
    const q = quizQuestions[currentQuestion];
    
    if (!q) {
      return (
        <div className="text-center space-y-4">
          <div className="text-lg font-medium text-muted-foreground">
            Error: No question found for index {currentQuestion}
          </div>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestion + 1} of {totalQuestions}</span>
            <span>{Math.round(((currentQuestion + 1) / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div className="text-lg font-medium leading-relaxed">
            {q.question}
          </div>
          
          {/* Answer Options */}
          <div className="space-y-3">
            {q.options.map((opt: string, idx: number) => (
              <Button 
                key={idx} 
                variant="outline" 
                onClick={() => handleAnswer(opt)}
                className="w-full justify-start h-auto p-4 text-left hover:bg-primary/5 hover:border-primary/50 transition-colors"
              >
                <span className="font-mono mr-3 text-muted-foreground">
                  {String.fromCharCode(65 + idx)})
                </span>
                {opt}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="size-5 text-primary" />
            Subject Quiz - {subjectName}
          </DialogTitle>
          <DialogDescription>
            Test your knowledge across all notes in this subject
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-2">
          {showQuizSetup ? renderQuizSetup() : renderQuiz()}
        </div>
      </DialogContent>
    </Dialog>
  );
} 