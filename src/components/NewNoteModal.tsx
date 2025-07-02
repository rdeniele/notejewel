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
import { Upload, FileText, Plus, X } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';

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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const router = useRouter();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setUploadedFile(file);
        setFileName(file.name);
        // For now, we'll just show the filename
        // In a real implementation, you'd process the PDF here
        setNoteContent(`PDF uploaded: ${file.name}\n\n[PDF content would be extracted and displayed here]`);
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setFileName("");
    setNoteContent("");
  };

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

    if (!noteContent.trim() && !uploadedFile) {
      toast.error("Please enter note content or upload a PDF");
      return;
    }

    setIsLoading(true);

    let pdfUrl: string | undefined = undefined;
    let noteText = noteContent;

    try {
      // If a PDF is uploaded, upload it to Supabase Storage
      if (uploadedFile) {
        try {
          const fileExt = uploadedFile.name.split('.').pop();
          const filePath = `notes/${userId}/${Date.now()}_${uploadedFile.name}`;
          
          const { data, error } = await supabase.storage.from('storage').upload(filePath, uploadedFile);
          
          if (error) {
            throw new Error(`Upload failed: ${error.message}`);
          }
          
          // Get public URL
          const { data: publicUrlData } = supabase.storage.from('storage').getPublicUrl(filePath);
          pdfUrl = publicUrlData.publicUrl;
          noteText = 'Processing PDF...';
        } catch (uploadError) {
          toast.error(`PDF upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          setIsLoading(false);
          return;
        }
      }

      const result = await createNoteWithContent({
        title,
        text: noteText,
        authorId: userId,
        subjectId: selectedSubject,
        sourceType: uploadedFile ? "PDF" : "MANUAL",
        pdfUrl,
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
      setUploadedFile(null);
      setFileName("");
    } catch (error) {
      toast.error("Failed to create note");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
              <Label className="text-base font-medium">Note Content</Label>
              
              {/* File Upload Section */}
              <Card className="border-dashed border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="size-5" />
                    Upload PDF (Optional)
                  </CardTitle>
                  <CardDescription>
                    Upload a PDF file to extract text and create a note
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!uploadedFile ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <Label
                          htmlFor="pdf-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PDF files only</p>
                          </div>
                          <Input
                            id="pdf-upload"
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4" />
                        <span className="text-sm font-medium">{fileName}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="h-8 w-8 p-0"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Text Input Section */}
              <div className="space-y-2">
                <Label htmlFor="noteContent" className="text-base font-medium">
                  Note Text *
                </Label>
                <Textarea
                  id="noteContent"
                  placeholder="Write your note here... or upload a PDF above"
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