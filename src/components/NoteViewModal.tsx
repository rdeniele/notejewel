"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, BookOpen, X, Edit, Trash2, Save, Check } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  subject?: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NoteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onNoteUpdate?: (noteId: string, content: string, title: string) => void;
  onNoteDelete?: (noteId: string) => void;
}

export default function NoteViewModal({ 
  isOpen, 
  onClose, 
  note, 
  onNoteUpdate, 
  onNoteDelete 
}: NoteViewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset edit state when note changes
  useEffect(() => {
    if (note) {
      setEditedTitle(note.title);
      setEditedContent(note.content);
      setIsEditing(false);
    }
  }, [note]);

  if (!note) return null;

  const handleSave = async () => {
    if (!onNoteUpdate) return;
    
    if (!editedTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    
    setIsSaving(true);
    try {
      await onNoteUpdate(note.id, editedContent, editedTitle);
      setIsEditing(false);
      toast.success("Note updated successfully!");
    } catch (error) {
      toast.error("Failed to update note");
      console.error("Update error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onNoteDelete) return;
    
    if (!confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await onNoteDelete(note.id);
      onClose();
      toast.success("Note deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-b border-border focus:border-primary outline-none w-full"
                  placeholder="Enter note title..."
                />
                <DialogDescription className="text-sm text-muted-foreground">
                  Note details and metadata
                </DialogDescription>
              </div>
            ) : (
              <>
                <DialogTitle className="text-2xl font-bold">{note.title}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Note details and metadata
                </DialogDescription>
              </>
            )}
          </div>
        </DialogHeader>

        {/* Action buttons moved below header with proper spacing */}
        <div className="flex items-center justify-end gap-2 pb-4 border-b">
          {isEditing ? (
            <>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="h-8 px-3"
              >
                {isSaving ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3 h-3 mr-1" />
                )}
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedTitle(note.title);
                  setEditedContent(note.content);
                }}
                disabled={isSaving}
                className="h-8 px-3"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="h-8 px-3"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 px-3"
              >
                {isDeleting ? (
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 mr-1" />
                )}
                Delete
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4" />
            <span>{note.subject?.name || 'No Subject'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Note Content</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="min-h-[300px] resize-none font-sans text-sm leading-relaxed"
                    placeholder="Enter your note content..."
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{editedContent.length} characters</span>
                    <span>Press Ctrl+S to save</span>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {note.content}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
            <Badge variant="secondary">Note ID: {note.id.slice(0, 8)}...</Badge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 