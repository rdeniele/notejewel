"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateUserProfile } from "@/actions/users";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookOpen, Clock, Brain, Sparkles } from "lucide-react";

type StudyStyle = "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO";

interface UserProfileSetupModalProps {
  userId: string;
  currentStudyStyle?: StudyStyle;
  currentDailyStudyTime?: number;
  isOpen: boolean;
  onComplete: () => void;
}

export default function UserProfileSetupModal({ 
  userId, 
  currentStudyStyle = "READING", 
  currentDailyStudyTime = 60,
  isOpen,
  onComplete
}: UserProfileSetupModalProps) {
  const [studyStyle, setStudyStyle] = useState<StudyStyle>(currentStudyStyle);
  const [dailyStudyTime, setDailyStudyTime] = useState(currentDailyStudyTime);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const studyStyleDescriptions = {
    VISUAL: "Learn best through diagrams, charts, and visual aids",
    READING: "Prefer reading and writing to absorb information",
    PRACTICE: "Learn by doing - hands-on practice and exercises",
    TEACHING: "Understand concepts by explaining them to others",
    AUDIO: "Learn through listening, podcasts, and verbal explanations"
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateUserProfile(userId, {
        studyStyle,
        dailyStudyTime
      });
      
      toast.success("Profile setup complete! Welcome to NoteJewel!");
      onComplete();
      router.refresh();
    } catch (error) {
      toast.error("Failed to save profile");
      console.error("Profile setup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="size-6 text-primary" />
            Welcome to NoteJewel!
          </DialogTitle>
          <DialogDescription className="text-lg">
            Let's personalize your AI-powered study assistant
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="size-5" />
              Study Profile Setup
            </CardTitle>
            <CardDescription>
              Help us create the perfect study experience for you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studyStyle" className="text-base font-medium">
                    How do you learn best?
                  </Label>
                  <Select value={studyStyle} onValueChange={(value: StudyStyle) => setStudyStyle(value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select your study style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VISUAL">
                        <div className="flex items-center gap-2">
                          <span>👁️ Visual</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="READING">
                        <div className="flex items-center gap-2">
                          <span>📖 Reading</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="PRACTICE">
                        <div className="flex items-center gap-2">
                          <span>🔧 Practice</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="TEACHING">
                        <div className="flex items-center gap-2">
                          <span>🎓 Teaching</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="AUDIO">
                        <div className="flex items-center gap-2">
                          <span>🎧 Audio</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {studyStyleDescriptions[studyStyle]}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyStudyTime" className="text-base font-medium">
                    How much time can you study each day?
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="dailyStudyTime"
                      type="number"
                      min="15"
                      max="480"
                      step="15"
                      value={dailyStudyTime}
                      onChange={(e) => setDailyStudyTime(parseInt(e.target.value) || 60)}
                      placeholder="60"
                      className="h-12"
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We'll use this to create realistic study plans for you
                  </p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Sparkles className="size-4" />
                  What you'll get with NoteJewel:
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    AI-powered study plans tailored to your learning style
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Smart quizzes to test your knowledge
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Note summarization and concept mapping
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Study streak tracking and motivation
                  </li>
                </ul>
              </div>

              <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
                {isLoading ? "Setting up..." : "Start Learning with AI"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
} 