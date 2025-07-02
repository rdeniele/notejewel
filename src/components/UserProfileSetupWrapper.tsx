"use client";

import { useState, useEffect } from "react";
import UserProfileSetupModal from "./UserProfileSetupModal";

interface UserProfileSetupWrapperProps {
  userId: string;
  currentStudyStyle?: "VISUAL" | "READING" | "PRACTICE" | "TEACHING" | "AUDIO";
  currentDailyStudyTime?: number;
  needsSetup: boolean;
}

export default function UserProfileSetupWrapper({
  userId,
  currentStudyStyle = "READING",
  currentDailyStudyTime = 60,
  needsSetup
}: UserProfileSetupWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (needsSetup) {
      setIsOpen(true);
    }
  }, [needsSetup]);

  const handleComplete = () => {
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <UserProfileSetupModal
      userId={userId}
      currentStudyStyle={currentStudyStyle}
      currentDailyStudyTime={currentDailyStudyTime}
      isOpen={isOpen}
      onComplete={handleComplete}
    />
  );
} 