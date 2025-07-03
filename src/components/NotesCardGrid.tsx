"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText, Sparkles, BookOpen, Brain, Target, Network } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import gemini from "@/gemini";
import NoteViewModal from "./NoteViewModal";
import AIModal from "./AIModal";
import "@/styles/study-plan.css";

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

interface NotesCardGridProps {
  notes: Note[];
  selectedNoteId?: string;
  onNoteSelect: (noteId: string) => void;
  onNoteUpdate: (noteId: string, content: string, title?: string) => void;
  onNoteDelete?: (noteId: string) => void;
}

export default function NotesCardGrid({ 
  notes, 
  selectedNoteId, 
  onNoteSelect, 
  onNoteUpdate,
  onNoteDelete
}: NotesCardGridProps) {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // AI Modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalAction, setAiModalAction] = useState<"summarize" | "quiz" | "studyPlan" | "conceptMap">("summarize");
  const [aiModalNote, setAiModalNote] = useState<Note | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAIAction = async (note: Note, action: "summarize" | "quiz" | "studyPlan" | "conceptMap") => {
    setAiModalNote(note);
    setAiModalAction(action);
    setAiModalOpen(true);
    setAiResult(null);
    setAiLoading(true);
    
    try {
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
      let prompt = "";

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
      const result = response.text();

      if (result) {
        setAiResult(result);
        toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} generated successfully!`);
      }
    } catch (error) {
      toast.error(`Failed to generate ${action}`);
      console.error(`${action} error:`, error);
    } finally {
      setAiLoading(false);
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };



  const getNotePreview = (content: string) => {
    const lines = content.split('\n');
    // Skip the first line if it's the title
    const contentLines = lines.slice(1).filter(line => line.trim().length > 0);
    if (contentLines.length > 0) {
      return contentLines[0];
    }
    return lines[0] || "Empty note";
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-medium">No notes yet</h3>
          <p className="text-muted-foreground">Create your first note to get started</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {notes.map((note) => {
          const isSelected = selectedNoteId === note.id;
          const preview = getNotePreview(note.content);
          
          return (
            <Card 
              key={note.id} 
              className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
                isSelected 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => {
                setSelectedNote(note);
                setViewModalOpen(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      {note.title || "Untitled Note"}
                    </CardTitle>
                    {note.subject && (
                      <Badge variant="secondary" className="mt-1">
                        {note.subject.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <CardDescription className="text-sm line-clamp-3 mb-4">
                  {truncateContent(note.content, 120)}
                </CardDescription>
                
                <div className="flex items-center justify-between mb-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNote(note);
                      setViewModalOpen(true);
                    }}
                    className="text-xs"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    View Note
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAIAction(note, 'summarize');
                    }}
                    disabled={aiLoading && aiModalNote?.id === note.id}
                    className="text-xs h-8"
                  >
                    {aiLoading && aiModalNote?.id === note.id && aiModalAction === 'summarize' ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 mr-1" />
                    )}
                    Summarize
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAIAction(note, 'quiz');
                    }}
                    disabled={aiLoading && aiModalNote?.id === note.id}
                    className="text-xs h-8"
                  >
                    {aiLoading && aiModalNote?.id === note.id && aiModalAction === 'quiz' ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <BookOpen className="w-3 h-3 mr-1" />
                    )}
                    Quiz Me
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAIAction(note, 'studyPlan');
                    }}
                    disabled={aiLoading && aiModalNote?.id === note.id}
                    className="text-xs h-8"
                  >
                    {aiLoading && aiModalNote?.id === note.id && aiModalAction === 'studyPlan' ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Target className="w-3 h-3 mr-1" />
                    )}
                    Study Plan
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAIAction(note, 'conceptMap');
                    }}
                    disabled={aiLoading && aiModalNote?.id === note.id}
                    className="text-xs h-8"
                  >
                    {aiLoading && aiModalNote?.id === note.id && aiModalAction === 'conceptMap' ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Network className="w-3 h-3 mr-1" />
                    )}
                    Concept Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
          {/* Note View Modal */}
    <NoteViewModal
      isOpen={viewModalOpen}
      onClose={() => {
        setViewModalOpen(false);
        setSelectedNote(null);
      }}
      note={selectedNote}
      onNoteUpdate={onNoteUpdate}
      onNoteDelete={onNoteDelete}
    />
      
      {/* AI Modal */}
      <AIModal
        isOpen={aiModalOpen}
        onClose={() => {
          setAiModalOpen(false);
          setAiModalNote(null);
          setAiResult(null);
        }}
        action={aiModalAction}
        noteTitle={aiModalNote?.title || ""}
        noteContent={aiModalNote?.content || ""}
        aiResult={aiResult}
        isLoading={aiLoading}
        onQuizAnswer={(questionIdx, answer) => {
          // Handle quiz answer
        }}
      />
    </>
  );
} 