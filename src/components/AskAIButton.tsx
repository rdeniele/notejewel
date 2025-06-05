"use client";

import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Fragment, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "./ui/textarea";
import { ArrowUpIcon, Sparkles } from "lucide-react";
import { askAIAboutNotesAction } from "@/actions/notes";
import "@/styles/ai-response.css";

type Props = {
  user: User | null;
};

function AskAIButton({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [responses, setResponses] = useState<string[]>([]);

  const handleOnOpenChange = (isOpen: boolean) => {
    if (!user) {
      router.push("/login");
    } else {
      if (isOpen) {
        setQuestionText("");
        setQuestions([]);
        setResponses([]);
      }
      setOpen(isOpen);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleClickInput = () => {
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (!questionText.trim()) return;

    const newQuestions = [...questions, questionText];
    setQuestions(newQuestions);
    setQuestionText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setTimeout(scrollToBottom, 100);

    startTransition(async () => {
      try {
        const response = await askAIAboutNotesAction(newQuestions, responses);
        setResponses((prev) => [...prev, response]);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("AI request failed:", error);
        setResponses((prev) => [...prev, "Sorry, there was an error processing your request."]);
      }
    });
  };

  const scrollToBottom = () => {
    contentRef.current?.scrollTo({
      top: contentRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="size-4" />
          Ask AI
        </Button>
      </DialogTrigger>
      <DialogContent
        className="custom-scrollbar flex h-[85vh] max-w-4xl flex-col overflow-y-auto"
        ref={contentRef}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Ask questions about your notes and get instant AI-powered insights
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col gap-8">
          {questions.map((question, index) => (
            <Fragment key={index}>
              <div className="flex flex-col gap-2">
                <p className="bg-muted text-muted-foreground ml-auto max-w-[60%] rounded-lg px-4 py-2 text-sm">
                  {question}
                </p>
                {responses[index] && (
                  <div className="bot-response text-muted-foreground max-w-[80%] rounded-lg bg-primary/5 p-4 text-sm">
                    <div dangerouslySetInnerHTML={{ __html: responses[index] }} />
                  </div>
                )}
              </div>
            </Fragment>
          ))}
          {isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="size-2 animate-bounce rounded-full bg-primary" />
              <div className="size-2 animate-bounce rounded-full bg-primary [animation-delay:0.2s]" />
              <div className="size-2 animate-bounce rounded-full bg-primary [animation-delay:0.4s]" />
            </div>
          )}
        </div>

        <div
          className="mt-auto flex cursor-text flex-col rounded-lg border bg-card p-4"
          onClick={handleClickInput}
        >
          <Textarea
            ref={textareaRef}
            placeholder="Ask me anything about your notes..."
            className="placeholder:text-muted-foreground resize-none rounded-none border-none bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{
              minHeight: "0",
              lineHeight: "normal",
            }}
            rows={1}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
          <Button 
            className="ml-auto size-8 rounded-full bg-primary hover:bg-primary/90" 
            onClick={handleSubmit}
          >
            <ArrowUpIcon className="size-4 text-primary-foreground" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AskAIButton;