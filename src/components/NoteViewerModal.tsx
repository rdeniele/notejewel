"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, FileText, Sparkles, BookOpen, Target, Network } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import gemini from "@/gemini";
import { useState } from "react";

interface Note {
  id: string;
  title: string;
  content: string;
  subject?: {
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NoteViewerModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onNoteUpdate: (noteId: string, content: string) => void;
}

export default function NoteViewerModal({ 
  note, 
  isOpen, 
  onClose,
  onNoteUpdate 
}: NoteViewerModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [aiAction, setAiAction] = useState<string | null>(null);

  const handleAIAction = async (action: string) => {
    if (!note) return;
    
    setIsLoading(true);
    setAiAction(action);
    
    try {
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
      let prompt = "";
      let result = "";

      switch (action) {
        case 'summarize':
          prompt = `Summarize the following notes in a clear, concise way:\n\n${note.content}`;
          break;
        case 'quiz':
          prompt = `Based on these notes, create 5 multiple-choice questions:\n\n${note.content}\n\nFormat as:\n1. Question?\nA) Option A\nB) Option B\nC) Option C\nD) Option D\nAnswer: A`;
          break;
        case 'studyPlan':
          prompt = `Create a personalized study plan based on the following note content:

Note Title: ${note.title || "Untitled Note"}
Note Content: ${note.content}

Generate a 7-day study plan with specific tasks for each day. Each task should:
1. Be based on the content of this note
2. Take approximately 30-60 minutes
3. Include a mix of review, practice, and deeper understanding
4. Be specific and actionable

Format the response as an HTML table with the following structure:
<table>
<thead>
<tr>
<th>Day</th>
<th>Date</th>
<th>Task Description</th>
<th>Duration</th>
<th>Type</th>
<th>Priority</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>Today + 0 days</td>
<td>Specific task description here</td>
<td>45 min</td>
<td>Review</td>
<td>High</td>
</tr>
...continue for all 7 days
</tbody>
</table>

Task Types to use: Review, Practice, Deep Study, Quiz/Self-Test, Application, Summary
Priority Levels: High, Medium, Low

Make sure to:
- Include realistic, specific task descriptions based on the note content
- Vary the task types appropriately 
- Assign higher priority to foundational concepts early and review sessions later
- Include regular practice and self-assessment
- Make the plan progressive and logical

Only return the HTML table, no additional text or formatting.`;
          break;
        case 'conceptMap':
          prompt = `Create a concept map outline for these notes:\n\n${note.content}\n\nOrganize as:\n• Main Concept 1\n  - Sub-concept 1.1\n  - Sub-concept 1.2\n• Main Concept 2\n  - Sub-concept 2.1`;
          break;
        default:
          return;
      }

      const aiResult = await model.generateContent(prompt);
      const response = await aiResult.response;
      result = response.text();

      if (result) {
        onNoteUpdate(note.id, result);
        toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} generated successfully!`);
      }
    } catch (error) {
      toast.error(`Failed to generate ${action}`);
      console.error(`${action} error:`, error);
    } finally {
      setIsLoading(false);
      setAiAction(null);
    }
  };

  const getNoteTitle = (content: string) => {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine;
    }
    return "Untitled Note";
  };

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {getNoteTitle(note.content)}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {note.subject && (
                  <Badge variant="secondary" className="mr-2">
                    {note.subject.name}
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {note.content}
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h4 className="font-medium text-lg">AI Tools</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => handleAIAction('summarize')}
                disabled={isLoading}
                className="h-12"
              >
                {isLoading && aiAction === 'summarize' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Summarize
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleAIAction('quiz')}
                disabled={isLoading}
                className="h-12"
              >
                {isLoading && aiAction === 'quiz' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <BookOpen className="w-4 h-4 mr-2" />
                )}
                Quiz Me
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleAIAction('studyPlan')}
                disabled={isLoading}
                className="h-12"
              >
                {isLoading && aiAction === 'studyPlan' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                Study Plan
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleAIAction('conceptMap')}
                disabled={isLoading}
                className="h-12"
              >
                {isLoading && aiAction === 'conceptMap' ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Network className="w-4 h-4 mr-2" />
                )}
                Concept Map
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 