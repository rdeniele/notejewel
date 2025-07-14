"use client";

import { useState, useRef } from "react";
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
import { Plus, Upload, FileText, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      toast.error("Please enter note content or upload a PDF");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createNoteWithContent({
        title,
        text: noteContent,
        authorId: userId,
        subjectId: selectedSubject,
        sourceType: uploadedFile ? "PDF" : "MANUAL",
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
      resetForm();
    } catch (error) {
      toast.error("Failed to create note");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedSubject("");
    setTitle("");
    setNoteContent("");
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsPdfUploading(true);
    setUploadedFile(file);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      console.log('Uploading PDF:', file.name, 'Size:', file.size);

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const result = await response.json();
      console.log('Response result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract text from PDF');
      }

      setNoteContent(result.text);
      if (!title.trim()) {
        // Auto-generate title from filename
        const fileName = file.name.replace('.pdf', '');
        setTitle(fileName);
      }
      
      if (result.isTemplate) {
        toast.warning('PDF text extraction was not possible. This may be due to the PDF being image-based or having complex formatting. A template has been provided for you to fill in manually.');
      } else {
        toast.success(`PDF text extracted successfully! ${result.extractedLength} characters extracted.`);
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process PDF');
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsPdfUploading(false);
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setNoteContent("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      onClose();
    }}>
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
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
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
              <Label className="text-base font-medium">
                Note Content *
              </Label>
              
              <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual" className="flex items-center gap-2">
                    <FileText className="size-4" />
                    Type Manually
                  </TabsTrigger>
                  <TabsTrigger value="pdf" className="flex items-center gap-2">
                    <Upload className="size-4" />
                    Upload PDF
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="manual" className="space-y-4 mt-4">
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
                </TabsContent>
                
                <TabsContent value="pdf" className="space-y-4 mt-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    {!uploadedFile ? (
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <Upload className="size-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-4">
                          <p className="text-sm font-medium">Upload a PDF file</p>
                          <p className="text-xs text-muted-foreground">
                            Maximum file size: 10MB. Text will be automatically extracted from text-based PDFs.
                          </p>
                          <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            💡 Tip: For best results, use PDFs with selectable text. Image-based PDFs will provide a template for manual entry.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isPdfUploading}
                          className="gap-2"
                        >
                          {isPdfUploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              Processing PDF...
                            </>
                          ) : (
                            <>
                              <Upload className="size-4" />
                              Choose PDF File
                            </>
                          )}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileText className="size-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{uploadedFile.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeUploadedFile}
                            className="h-8 w-8 p-0"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Extracted Text (Editable)</Label>
                            {noteContent.includes('Text extraction failed') ? (
                              <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                Template provided - please add your content
                              </span>
                            ) : (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                Text successfully extracted
                              </span>
                            )}
                          </div>
                          <Textarea
                            value={noteContent}
                            onChange={(e) => setNoteContent(e.target.value)}
                            className="min-h-[200px] resize-none"
                            placeholder="Extracted text will appear here..."
                          />
                          <p className="text-sm text-muted-foreground">
                            {noteContent.length} characters{noteContent.includes('Text extraction failed') ? ' (template)' : ' extracted'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onClose();
            }}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isPdfUploading}>
              {isLoading ? "Creating..." : "Create Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 