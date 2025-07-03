"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateStudyPlan } from "@/actions/study";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Clock, Target, BookOpen, Sparkles } from "lucide-react";
import "@/styles/study-plan.css";

interface StudyPlanGeneratorProps {
  userId: string;
  subjects: Array<{
    id: string;
    name: string;
    examDate: Date | null;
    quizFrequency: number;
  }>;
  studyStyle: "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO";
  dailyStudyTime: number;
}

interface StudyPlan {
  htmlTable: string;
  subjectName: string;
  totalDays: number;
  examDate?: Date;
}

export default function StudyPlanGenerator({ 
  userId, 
  subjects, 
  studyStyle, 
  dailyStudyTime 
}: StudyPlanGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const router = useRouter();

  const handleGeneratePlan = async () => {
    if (!selectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    setIsGenerating(true);
    try {
      const htmlTable = await generateStudyPlan(userId, selectedSubject, {
        studyStyle,
        dailyStudyTime,
      });

      const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
      
      setStudyPlan({
        htmlTable,
        subjectName: selectedSubjectData?.name || "Study Plan",
        totalDays: selectedSubjectData?.examDate 
          ? Math.ceil((selectedSubjectData.examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : 14,
        examDate: selectedSubjectData?.examDate || undefined
      });

      toast.success("Study plan generated successfully!");
    } catch (error) {
      toast.error("Failed to generate study plan");
      console.error("Study plan generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getStudyStyleDescription = (style: string) => {
    const descriptions = {
      VISUAL: "Diagrams, charts, and visual aids",
      READING: "Reading and writing activities",
      PRACTICE: "Hands-on practice and exercises",
      TEACHING: "Explaining concepts to others",
      AUDIO: "Listening and verbal activities"
    };
    return descriptions[style as keyof typeof descriptions] || "";
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Target className="size-4" />
          Generate Study Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            AI Study Plan Generator
          </DialogTitle>
          <DialogDescription>
            Generate a personalized study plan based on your learning style and schedule
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Study Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Study Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Style:</strong> {studyStyle} - {getStudyStyleDescription(studyStyle)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Daily Time:</strong> {formatDuration(dailyStudyTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>Subjects:</strong> {subjects.length} active
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Subject Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Subject</label>
            <div className="grid gap-2">
              {subjects.map((subject) => (
                <Button
                  key={subject.id}
                  variant={selectedSubject === subject.id ? "default" : "outline"}
                  className="justify-start h-auto p-3"
                  onClick={() => setSelectedSubject(subject.id)}
                >
                  <div className="text-left">
                    <div className="font-medium">{subject.name}</div>
                    {subject.examDate && (
                      <div className="text-xs text-muted-foreground">
                        Exam: {subject.examDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGeneratePlan} 
            disabled={!selectedSubject || isGenerating}
            className="w-full"
          >
            {isGenerating ? "Generating Plan..." : "Generate Study Plan"}
          </Button>

          {/* Generated Study Plan */}
          {studyPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Study Plan for {studyPlan.subjectName}
                </CardTitle>
                <CardDescription>
                  {studyPlan.totalDays} days • {studyPlan.examDate && `Exam on ${studyPlan.examDate.toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <div 
                    className="study-plan-table"
                    dangerouslySetInnerHTML={{ __html: studyPlan.htmlTable }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 