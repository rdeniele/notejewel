"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, BookOpen, Target, Network, Send, MessageCircle, RefreshCw, RotateCcw, Trophy, Star, PartyPopper, Eye, List } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VisualConceptMap from "./VisualConceptMap";
import "@/styles/study-plan.css";

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: "summarize" | "quiz" | "studyPlan" | "conceptMap";
  noteTitle: string;
  noteContent: string;
  aiResult: string | null;
  isLoading: boolean;
  onQuizAnswer?: (questionIdx: number, answer: string) => void;
}

export default function AIModal({
  isOpen,
  onClose,
  action,
  noteTitle,
  noteContent,
  aiResult,
  isLoading,
  onQuizAnswer,
}: AIModalProps) {
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
  
  // Quiz setup state
  const [showQuizSetup, setShowQuizSetup] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Ref for auto-scrolling
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Add error state for quiz generation
  const [quizError, setQuizError] = useState<string | null>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Reset quiz setup when modal opens
  useEffect(() => {
    if (isOpen && action === "quiz") {
      setShowQuizSetup(true);
      setQuizQuestions([]);
      setCurrentQuestion(0);
      setUserAnswers([]);
      setQuizFinished(false);
      setScore(0);
      setTotalQuestions(0);
    }
  }, [isOpen, action]);

  // Remove quiz parsing from aiResult useEffect (only for non-quiz actions)
  useEffect(() => {
    if (action !== "quiz" && aiResult) {
      if (action === "summarize") {
        // Summarize handled elsewhere
      }
    }
  }, [aiResult, action]);

  // Add initial AI message for summarize action
  useEffect(() => {
    if (action === "summarize" && aiResult && chatMessages.length === 0) {
      setChatMessages([{
        role: 'assistant',
        content: aiResult,
        timestamp: new Date()
      }]);
    }
  }, [aiResult, action, chatMessages.length]);

  function parseQuiz(text: string) {
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

  function handleAnswer(option: string) {
    const newAnswers = [...userAnswers, option];
    setUserAnswers(newAnswers);
    
    // Check if answer is correct
    const currentQ = quizQuestions[currentQuestion];
    if (currentQ.answer && option.includes(currentQ.answer)) {
      setScore(prev => prev + 1);
    }
    
    if (onQuizAnswer) onQuizAnswer(currentQuestion, option);
    
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizFinished(true);
    }
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
      const prompt = `You are creating a quiz based SPECIFICALLY on the note content provided below. The questions must be directly derived from the information in these notes - do not use general knowledge outside of what's written in the notes.

NOTE TITLE: "${noteTitle}"
NOTE CONTENT: "${noteContent}"

Generate exactly ${questionCount} multiple-choice questions at ${difficultyText[difficulty]} that test understanding of the SPECIFIC content in the notes above.

REQUIREMENTS:
- Questions must be based ONLY on information explicitly mentioned in the notes
- Test key concepts, facts, definitions, or examples from the notes
- Include specific details, names, dates, or terminology mentioned in the notes
- For ${difficulty} difficulty: ${difficultyText[difficulty]}
- Generate exactly ${questionCount} questions, no more, no less

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
          noteContent,
          noteTitle,
          action: 'quiz',
          conversationHistory: []
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate questions');
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
      toast.success(`Quiz generated with ${questionCount} ${difficulty} questions!`);
    } catch (error: unknown) {
      const errMsg = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : String(error);
      setQuizError(errMsg || 'Failed to generate quiz questions');
      setShowQuizSetup(true);
    } finally {
      setIsGeneratingNewQuiz(false);
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
      const prompt = `You are creating a NEW set of quiz questions based SPECIFICALLY on the note content provided below. These should be different from any previous questions but still test the same note content. The questions must be directly derived from the information in these notes - do not use general knowledge outside of what's written in the notes.

NOTE TITLE: "${noteTitle}"
NOTE CONTENT: "${noteContent}"

Generate exactly ${questionCount} NEW multiple-choice questions at ${difficultyText[difficulty]} that test understanding of the SPECIFIC content in the notes above.

REQUIREMENTS:
- Questions must be based ONLY on information explicitly mentioned in the notes
- Test different aspects, details, or perspectives from the same note content
- Include specific details, names, dates, or terminology mentioned in the notes
- Create questions that approach the content from different angles than previous questions
- For ${difficulty} difficulty: ${difficultyText[difficulty]}
- Generate exactly ${questionCount} questions, no more, no less

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
          noteContent,
          noteTitle,
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
      toast.success("New quiz questions generated!");
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
        subtitle: "You're a master of this topic! Outstanding work!",
        icon: <PartyPopper className="size-8 text-yellow-500" />,
        color: "text-yellow-500"
      };
    } else if (percentage >= 90) {
      return {
        message: "Excellent! 🌟",
        subtitle: "You have an excellent understanding of this material!",
        icon: <Star className="size-8 text-blue-500" />,
        color: "text-blue-500"
      };
    } else if (percentage >= 80) {
      return {
        message: "Great Job! 👏",
        subtitle: "You're doing really well with this topic!",
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

  async function handleChatSend() {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    setIsChatLoading(true);
    
    try {
      // Call the AI API for chat response
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          noteContent,
          noteTitle,
          action,
          conversationHistory: chatMessages
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error types with user-friendly messages
        if (data.quotaExceeded) {
          toast.error('AI service daily quota exceeded. Please try again tomorrow or consider upgrading to premium.');
        } else if (data.limitReached) {
          toast.error(data.error || 'Daily usage limit reached.');
        } else if (data.configError) {
          toast.error('AI service temporarily unavailable. Please contact support.');
        } else if (data.invalidRequest) {
          toast.error('Invalid request. Please try rephrasing your question.');
        } else {
          toast.error(data.error || 'Failed to get AI response');
        }
        return;
      }
      
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      
      // Handle different types of client-side errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your internet connection and try again.');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsChatLoading(false);
    }
  }

  function renderQuizSetup() {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="size-8 text-primary" />
            <h2 className="text-2xl font-bold">Quiz Setup</h2>
          </div>
          <p className="text-muted-foreground">
            Customize your quiz experience
          </p>
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
                <SelectItem value="3">3 Questions</SelectItem>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="15">15 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
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
            Generating your quiz questions...
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
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function getIcon() {
    switch (action) {
      case "summarize": return <Sparkles className="size-5 text-primary" />;
      case "quiz": return <BookOpen className="size-5 text-primary" />;
      case "studyPlan": return <Target className="size-5 text-primary" />;
      case "conceptMap": return <Network className="size-5 text-primary" />;
      default: return null;
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {getIcon()}
            {action === "summarize" && "Summary"}
            {action === "quiz" && "Quiz Me"}
            {action === "studyPlan" && "Study Plan"}
            {action === "conceptMap" && "Concept Map"}
          </DialogTitle>
          <DialogDescription>
            {noteTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Main content area */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
              <Loader2 className="animate-spin size-8 text-primary" />
              <div>Generating with AI...</div>
            </div>
          ) : action === "summarize" ? (
            /* Chat interface for summarize - full width */
            <div className="flex flex-col h-full">
              <div className="p-4 border-b bg-muted/30 flex-shrink-0">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="size-4" />
                  Summary & Chat
                </h3>
                <p className="text-sm text-muted-foreground">
                  Review the summary and ask follow-up questions
                </p>
              </div>
              
              {/* Chat messages with proper scrolling */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 space-y-4 pb-8">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      <MessageCircle className="size-8 mx-auto mb-2 opacity-50" />
                      <p>Start a conversation about your note</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-3 break-words shadow-sm ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted border'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere leading-relaxed">
                              {message.content}
                            </div>
                            <div className="text-xs opacity-70 mt-2">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {isChatLoading && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-muted rounded-lg p-3 border shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin size-4" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Auto-scroll reference */}
                  <div ref={chatMessagesEndRef} />
                </div>
              </div>
              
              {/* Chat input - ensure it's always visible */}
              <div className="p-4 border-t bg-background flex-shrink-0">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask a question..."
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                    disabled={isChatLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleChatSend}
                    disabled={isChatLoading || !chatInput.trim()}
                    size="sm"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : action === "quiz" ? (
            showQuizSetup ? renderQuizSetup() : renderQuiz()
          ) : action === "studyPlan" ? (
            <div className="w-full overflow-x-auto py-2">
              <div 
                className="study-plan-table"
                dangerouslySetInnerHTML={{ __html: aiResult || '' }}
              />
            </div>
          ) : action === "conceptMap" ? (
            <div className="space-y-6 py-2">
              <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="visual" className="flex items-center gap-2">
                    <Eye className="size-4" />
                    Visual Map
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <List className="size-4" />
                    Text Outline
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="visual" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Interactive Concept Map</CardTitle>
                      <CardDescription>
                        Drag nodes to reorganize • Zoom and pan to explore • Click controls for options
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <VisualConceptMap conceptMapText={aiResult || ""} className="h-[600px]" />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="text" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Concept Map Outline</CardTitle>
                      <CardDescription>
                        Hierarchical text representation of concepts and relationships
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none whitespace-pre-wrap max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/20">
                        {aiResult}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </div>
        
        {/* Footer - only show for non-quiz actions or when quiz is not in progress */}
        {action !== "quiz" || (action === "quiz" && !quizQuestions.length && !showQuizSetup) ? (
          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
} 