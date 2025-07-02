"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserProfile } from "@/actions/users";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type StudyStyle = "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO";

interface UserProfileSetupProps {
  userId: string;
  currentStudyStyle?: StudyStyle;
  currentDailyStudyTime?: number;
}

export default function UserProfileSetup({ 
  userId, 
  currentStudyStyle = "READING", 
  currentDailyStudyTime = 60 
}: UserProfileSetupProps) {
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
      
      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Study Profile Setup</CardTitle>
        <CardDescription>
          Help us personalize your study experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studyStyle">Study Style</Label>
            <Select value={studyStyle} onValueChange={(value: StudyStyle) => setStudyStyle(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your study style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VISUAL">Visual</SelectItem>
                <SelectItem value="READING">Reading</SelectItem>
                <SelectItem value="PRACTICE">Practice</SelectItem>
                <SelectItem value="TEACHING">Teaching</SelectItem>
                <SelectItem value="AUDIO">Audio</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {studyStyleDescriptions[studyStyle]}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyStudyTime">Daily Study Time (minutes)</Label>
            <Input
              id="dailyStudyTime"
              type="number"
              min="15"
              max="480"
              step="15"
              value={dailyStudyTime}
              onChange={(e) => setDailyStudyTime(parseInt(e.target.value) || 60)}
              placeholder="60"
            />
            <p className="text-sm text-muted-foreground">
              How much time can you dedicate to studying each day?
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Updating..." : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 