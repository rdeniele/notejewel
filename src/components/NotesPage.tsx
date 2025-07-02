"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import NotesCardGrid from "./NotesCardGrid";
import NewNoteButton from "./NewNoteButton";
import NewNoteModal from "./NewNoteModal";
import { toast } from "sonner";
import type { AuthUser } from "@/app/page";

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

interface Subject {
  id: string;
  name: string;
}

interface NotesPageProps {
  notes: Note[];
  selectedNoteId?: string;
  selectedNoteText?: string;
  user: AuthUser | null;
  subjects: Subject[];
}

export default function NotesPage({ 
  notes, 
  selectedNoteId, 
  selectedNoteText = "",
  user,
  subjects
}: NotesPageProps) {
  const router = useRouter();

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);

  const handleNoteSelect = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setSelectedNote(note);
      setIsModalOpen(true);
    }
  };

  const handleNewNoteClick = () => {
    setIsNewNoteModalOpen(true);
  };

  const handleNoteCreated = () => {
    // Refresh the page to show the new note
    router.refresh();
  };

  const handleNoteUpdate = async (noteId: string, content: string, title?: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: content, title }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update note');
      }

      toast.success("Note updated successfully!");
      
      // Force a full page reload to show updated content
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update note");
      console.error("Update error:", error);
    }
  };

  const handleNoteDelete = async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete note');
      }

      toast.success("Note deleted successfully!");
      
      // Force a full page reload to show updated content
      window.location.reload();
    } catch (error) {
      toast.error("Failed to delete note");
      console.error("Delete error:", error);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Your Notes</h3>
            <p className="text-sm text-muted-foreground">
              {notes.length} note{notes.length !== 1 ? 's' : ''} • Click "New Note" to create
            </p>
          </div>
                      <NewNoteButton user={user} onClick={handleNewNoteClick} />
        </div>
        
        <NotesCardGrid 
          notes={notes}
          selectedNoteId={selectedNoteId}
          onNoteSelect={handleNoteSelect}
          onNoteUpdate={handleNoteUpdate}
          onNoteDelete={handleNoteDelete}
        />
      </div>

      {/* New Note Modal */}
      <NewNoteModal
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        subjects={subjects}
        userId={user?.id || ""}
        onNoteCreated={handleNoteCreated}
      />

      {/* Note Viewer Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-xl font-semibold">
                  {selectedNote?.title || "Untitled Note"}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  {selectedNote?.subject && (
                    <Badge variant="secondary" className="mr-2">
                      {selectedNote.subject.name}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {selectedNote && formatDistanceToNow(new Date(selectedNote.updatedAt), { addSuffix: true })}
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {selectedNote?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
} 