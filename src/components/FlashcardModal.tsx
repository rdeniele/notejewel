"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Brain, RotateCcw, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
  aiResult: string | null;
  isLoading: boolean;
}

interface Flashcard {
  question: string;
  answer: string;
}

export default function FlashcardModal({
  isOpen,
  onClose,
  noteTitle,
  noteContent,
  aiResult,
  isLoading,
}: FlashcardModalProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [cardCount, setCardCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isGeneratingNew, setIsGeneratingNew] = useState(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setShowSetup(true);
      setFlashcards([]);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setFlashcardError(null);
    }
  }, [isOpen]);

  // Parse flashcards from AI result
  React.useEffect(() => {
    if (aiResult && !showSetup) {
      const parsedCards = parseFlashcards(aiResult);
      if (parsedCards.length > 0) {
        setFlashcards(parsedCards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    }
  }, [aiResult, showSetup]);

  function parseFlashcards(text: string): Flashcard[] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const cards: Flashcard[] = [];
    let currentCard: Partial<Flashcard> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a question (starts with Q: or number.)
      if (/^(Q:|Question:|\d+\.)/.test(line)) {
        // Save previous card if exists
        if (currentCard.question && currentCard.answer) {
          cards.push(currentCard as Flashcard);
        }
        
        // Start new card
        currentCard = {
          question: line.replace(/^(Q:|Question:|\d+\.)\s*/, ""),
          answer: ""
        };
      }
      // Check if this is an answer (A: or Answer:)
      else if (/^(A:|Answer:)/.test(line) && currentCard.question) {
        currentCard.answer = line.replace(/^(A:|Answer:)\s*/, "");
      }
      // If we have a question but no answer yet, this might be a continuation of the question
      else if (currentCard.question && !currentCard.answer && !/^(A:|Answer:)/.test(line)) {
        currentCard.question += " " + line;
      }
      // If we have a question and this isn't marked as answer but no answer exists, treat as answer
      else if (currentCard.question && !currentCard.answer && !/^(Q:|Question:|\d+\.)/.test(line)) {
        currentCard.answer = line;
      }
    }
    
    // Don't forget the last card
    if (currentCard.question && currentCard.answer) {
      cards.push(currentCard as Flashcard);
    }
    
    return cards;
  }

  async function generateFlashcards() {
    setShowSetup(false);
    setIsGeneratingNew(true);
    setFlashcardError(null);
    
    try {
      const difficultyText = {
        easy: "easy level with basic recall and simple definitions",
        medium: "medium difficulty with application and understanding questions",
        hard: "challenging difficulty with analysis, synthesis, and critical thinking questions"
      };

      const prompt = `Create exactly ${cardCount} flashcards based SPECIFICALLY on the note content provided below. The flashcards must test understanding of the SPECIFIC content in these notes - do not use general knowledge outside of what's written in the notes.

NOTE TITLE: "${noteTitle}"
NOTE CONTENT: "${noteContent}"

Generate exactly ${cardCount} flashcards at ${difficultyText[difficulty]} that test understanding of the SPECIFIC content in the notes above.

REQUIREMENTS:
- Questions must be based ONLY on information explicitly mentioned in the notes
- Test key concepts, facts, definitions, or examples from the notes
- Include specific details, names, dates, or terminology mentioned in the notes
- For ${difficulty} difficulty: ${difficultyText[difficulty]}
- Generate exactly ${cardCount} flashcards, no more, no less

Format each flashcard as:
Q: [Question based on note content]?
A: [Answer based on note content]

Make sure each question tests something specific from the provided note content and has a clear, concise answer.`;

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          noteContent,
          noteTitle,
          action: 'flashcards',
          conversationHistory: []
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate flashcards');
      
      const newCards = parseFlashcards(data.response);
      if (newCards.length !== cardCount) {
        setFlashcardError(`AI generated ${newCards.length} flashcards, but you requested ${cardCount}. Please try again.`);
        setShowSetup(true);
        return;
      }
      
      setFlashcards(newCards);
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setFlashcardError(null);
      toast.success(`${cardCount} flashcards generated successfully!`);
    } catch (error: unknown) {
      const errMsg = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : String(error);
      setFlashcardError(errMsg || 'Failed to generate flashcards');
      setShowSetup(true);
    } finally {
      setIsGeneratingNew(false);
    }
  }

  function nextCard() {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  }

  function prevCard() {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  }

  function resetCards() {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }

  function renderSetup() {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Brain className="size-8 text-primary" />
            <h2 className="text-2xl font-bold">Flashcard Setup</h2>
          </div>
          <p className="text-muted-foreground">
            Customize your flashcard study experience
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardCount" className="text-base font-medium">
              Number of Flashcards
            </Label>
            <Select value={cardCount.toString()} onValueChange={(value) => setCardCount(parseInt(value))}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select number of flashcards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Flashcards</SelectItem>
                <SelectItem value="10">10 Flashcards</SelectItem>
                <SelectItem value="15">15 Flashcards</SelectItem>
                <SelectItem value="20">20 Flashcards</SelectItem>
                <SelectItem value="30">30 Flashcards</SelectItem>
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
                <SelectItem value="medium">Medium - Understanding</SelectItem>
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
            onClick={generateFlashcards}
            disabled={isGeneratingNew}
            className="flex-1"
          >
            {isGeneratingNew ? (
              <>
                <Loader2 className="animate-spin size-4 mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="size-4 mr-2" />
                Generate Flashcards
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  function renderFlashcards() {
    if (flashcardError) {
      return (
        <div className="text-center space-y-4">
          <div className="text-lg font-medium text-destructive">
            {flashcardError}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowSetup(true)} variant="outline" className="flex-1">
              Try Again
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      );
    }

    if (!flashcards.length) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
          <Loader2 className="animate-spin size-8 text-primary" />
          <div className="text-lg font-medium">Generating Flashcards</div>
          <div className="text-sm text-muted-foreground">
            Creating {cardCount} flashcards from your notes...
          </div>
        </div>
      );
    }

    const currentCard = flashcards[currentCardIndex];

    return (
      <div className="space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Card {currentCardIndex + 1} of {flashcards.length}</span>
          <span>{Math.round(((currentCardIndex + 1) / flashcards.length) * 100)}% complete</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
          />
        </div>

        {/* Flashcard */}
        <div className="flex justify-center">
          <Card 
            className={`w-full max-w-md h-64 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
              isFlipped ? 'bg-primary/5 border-primary' : 'hover:shadow-lg'
            }`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <CardContent className="flex items-center justify-center h-full p-6">
              <div className="text-center space-y-4">
                <div className="text-sm font-medium text-muted-foreground">
                  {isFlipped ? 'Answer' : 'Question'}
                </div>
                <div className="text-lg font-medium leading-relaxed">
                  {isFlipped ? currentCard.answer : currentCard.question}
                </div>
                {!isFlipped && (
                  <div className="text-xs text-muted-foreground">
                    Click to reveal answer
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevCard}
            disabled={currentCardIndex === 0}
          >
            <ChevronLeft className="size-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetCards}
              size="sm"
            >
              <RotateCcw className="size-4 mr-1" />
              Reset
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowSetup(true)}
              size="sm"
            >
              <RefreshCw className="size-4 mr-1" />
              New Set
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={nextCard}
            disabled={currentCardIndex === flashcards.length - 1}
          >
            Next
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>

        {/* Completion Message */}
        {currentCardIndex === flashcards.length - 1 && isFlipped && (
          <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="text-green-700 dark:text-green-400 font-medium">
              🎉 Great job! You've completed all flashcards!
            </div>
            <div className="text-sm text-green-600 dark:text-green-500 mt-1">
              Review again or generate a new set to keep practicing.
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Brain className="size-5 text-primary" />
            Flashcards
          </DialogTitle>
          <DialogDescription>
            {noteTitle}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 min-h-[200px]">
              <Loader2 className="animate-spin size-8 text-primary" />
              <div>Generating flashcards with AI...</div>
            </div>
          ) : showSetup ? (
            renderSetup()
          ) : (
            renderFlashcards()
          )}
        </div>
        
        {/* Footer */}
        {(!isLoading && !showSetup && flashcards.length === 0) && (
          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
