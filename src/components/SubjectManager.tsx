"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createSubject, updateSubject, deleteSubject } from "@/actions/subjects";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Calendar, BookOpen } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  examDate: Date | null;
  quizFrequency: number;
  createAt: Date;
  updatedAt: Date;
}

interface SubjectManagerProps {
  userId: string;
  subjects: Subject[];
}

export default function SubjectManager({ userId, subjects }: SubjectManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    examDate: "",
    quizFrequency: 7,
  });
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await createSubject(userId, {
        name: formData.name,
        examDate: formData.examDate ? new Date(formData.examDate) : null,
        quizFrequency: formData.quizFrequency,
      });
      
      toast.success("Subject created successfully!");
      setIsCreateOpen(false);
      setFormData({ name: "", examDate: "", quizFrequency: 7 });
      router.refresh();
    } catch (error) {
      toast.error("Failed to create subject");
      console.error("Subject creation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    
    setIsLoading(true);

    try {
      await updateSubject(editingSubject.id, {
        name: formData.name,
        examDate: formData.examDate ? new Date(formData.examDate) : null,
        quizFrequency: formData.quizFrequency,
      });
      
      toast.success("Subject updated successfully!");
      setEditingSubject(null);
      setFormData({ name: "", examDate: "", quizFrequency: 7 });
      router.refresh();
    } catch (error) {
      toast.error("Failed to update subject");
      console.error("Subject update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject? This will also delete all associated notes.")) {
      return;
    }

    try {
      await deleteSubject(subjectId);
      toast.success("Subject deleted successfully!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete subject");
      console.error("Subject deletion error:", error);
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      examDate: subject.examDate ? subject.examDate.toISOString().split('T')[0] : "",
      quizFrequency: subject.quizFrequency,
    });
  };

  const getDaysUntilExam = (examDate: Date | null) => {
    if (!examDate) return null;
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Subjects</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="size-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                Create a new subject to organize your study materials
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mathematics, Biology"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">Exam Date (Optional)</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={formData.examDate}
                  onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quizFrequency">Quiz Frequency (days)</Label>
                <Input
                  id="quizFrequency"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.quizFrequency}
                  onChange={(e) => setFormData({ ...formData, quizFrequency: parseInt(e.target.value) || 7 })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Subject"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => {
          const daysUntilExam = getDaysUntilExam(subject.examDate);
          return (
            <Card key={subject.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(subject)}
                    >
                      <Edit className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(subject.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  {subject.examDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Exam: {subject.examDate.toLocaleDateString()}
                      </span>
                      {daysUntilExam !== null && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          daysUntilExam <= 3 ? 'bg-red-100 text-red-800' :
                          daysUntilExam <= 7 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {daysUntilExam === 0 ? 'Today' :
                           daysUntilExam === 1 ? 'Tomorrow' :
                           `${daysUntilExam} days`}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-muted-foreground">
                    Quiz every {subject.quizFrequency} days
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update your subject information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Subject Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Mathematics, Biology"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-examDate">Exam Date (Optional)</Label>
              <Input
                id="edit-examDate"
                type="date"
                value={formData.examDate}
                onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quizFrequency">Quiz Frequency (days)</Label>
              <Input
                id="edit-quizFrequency"
                type="number"
                min="1"
                max="30"
                value={formData.quizFrequency}
                onChange={(e) => setFormData({ ...formData, quizFrequency: parseInt(e.target.value) || 7 })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Subject"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 