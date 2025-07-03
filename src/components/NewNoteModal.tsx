"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createNoteWithContent } from "@/actions/notes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Subject {
  id: string;
  name: string;
}

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  userId: string;
  onNoteCreated: () => void;
}

export default function NewNoteModal({ 
  isOpen, 
  onClose, 
  subjects, 
  userId,
  onNoteCreated 
}: NewNoteModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [noteContent, setNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!noteContent.trim()) {
      toast.error("Please enter note content");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createNoteWithContent({
        title,
        text: noteContent,
        authorId: userId,
        subjectId: selectedSubject,
        sourceType: "MANUAL",
      });
      
      if (result.errorMessage) {
        throw new Error(result.errorMessage);
      }
      
      toast.success("Note created successfully!");
      onNoteCreated();
      onClose();
      
      // Navigate to notes page
      const notesTab = document.querySelector('[data-value="notes"]') as HTMLElement;
      if (notesTab) {
        notesTab.click();
      }
      
      // Reset form
      setSelectedSubject("");
      setTitle("");
      setNoteContent("");
    } catch (error) {
      toast.error("Failed to create note");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Plus className="size-6 text-primary" />
            Create New Note
          </DialogTitle>
          <DialogDescription>
            Add a new note to your study collection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-base font-medium">
                Subject *
              </Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length === 0 ? (
                    <SelectItem value="" disabled>
                      No subjects available. Please create a subject first.
                    </SelectItem>
                  ) : (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {subjects.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You need to create a subject first to organize your notes.
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      onClose();
                      // Switch to study dashboard tab
                      const studyTab = document.querySelector('[data-value="study"]') as HTMLElement;
                      if (studyTab) {
                        studyTab.click();
                      }
                    }}
                    className="w-full"
                  >
                    Go to Study Dashboard to Create Subjects
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Label htmlFor="title" className="text-base font-medium">
                Title *
              </Label>
              <Input
                id="title"
                placeholder="Enter a title for your note"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="noteContent" className="text-base font-medium">
                  Note Content *
                </Label>
                <Textarea
                  id="noteContent"
                  placeholder="Write your note here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {noteContent.length} characters
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 